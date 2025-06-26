from flask_cors import CORS
from flask import Flask, request, jsonify
import os
import re
import PyPDF2
import time
import tempfile
from concurrent.futures import ProcessPoolExecutor, as_completed
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

keyword_regex = None

def init_worker(keywords, exact):
    global keyword_regex
    if exact:
        pattern = '|'.join(rf'\b{re.escape(kw)}\b' for kw in keywords)
    else:
        pattern = '|'.join(re.escape(kw) for kw in keywords)
    keyword_regex = re.compile(pattern, re.IGNORECASE)

# 🧠 Text chunk processor
def search_text_lines(file_path, start_line, end_line):
    global keyword_regex
    results = []
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        for current_line, line in enumerate(f, start=1):
            if current_line < start_line:
                continue
            if current_line > end_line:
                break
            matches = keyword_regex.findall(line)
            if matches:
                results.append({
                    "file": os.path.basename(file_path),
                    "location": f"Line {current_line}",
                    "keywords": list(set(matches)),
                    "content": line.strip()
                })
    return results

# 📊 Create line-based chunks
def create_text_chunks(file_path, num_chunks):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        total_lines = sum(1 for _ in f)
    chunk_size = max(1, total_lines // num_chunks)
    chunks = []
    for i in range(0, total_lines, chunk_size):
        chunks.append((file_path, i + 1, min(i + chunk_size, total_lines)))
    return chunks

# 🧠 PDF chunk processor
def search_pdf_pages(file_path, page_range):
    global keyword_regex
    results = []
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in page_range:
            if page_num >= len(reader.pages):
                continue
            text = reader.pages[page_num].extract_text() or ""
            for line_number, line in enumerate(text.split('\n'), start=1):
                matches = keyword_regex.findall(line)
                if matches:
                    results.append({
                        "file": os.path.basename(file_path),
                        "location": f"Page {page_num + 1}, Line {line_number}",
                        "keywords": list(set(matches)),
                        "content": line.strip()
                    })
    return results

# 📊 Create PDF page-based chunks
def create_pdf_chunks(file_path, num_chunks):
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        total_pages = len(reader.pages)
    chunk_size = max(1, total_pages // num_chunks)
    return [(file_path, list(range(i, min(i + chunk_size, total_pages))))
            for i in range(0, total_pages, chunk_size)]

# 🧠 Fallback full file
def search_in_file(file_path):
    if file_path.lower().endswith('.pdf'):
        return search_pdf_pages(file_path, range(0, 1000000))
    else:
        return search_text_lines(file_path, 1, 1000000)

@app.route('/api/search', methods=['POST'])
def search():
    keywords = request.form.get("keywords", "")
    exact = request.form.get("exactMatch", "false").lower() == "true"
    files = request.files.getlist("files")

    try:
        num_workers = int(request.form.get("numWorkers", str(os.cpu_count() or 4)))
    except ValueError:
        num_workers = os.cpu_count() or 4

    if not files:
        return jsonify({"error": "No files uploaded."}), 400

    keyword_list = [kw.strip() for kw in keywords.split(',') if kw.strip()]

    with tempfile.TemporaryDirectory() as tmpdir:
        saved_paths = []
        for file in files:
            filename = secure_filename(file.filename)
            full_path = os.path.join(tmpdir, filename)
            file.save(full_path)
            saved_paths.append(full_path)

        # Sequential for comparison
        seq_start = time.time()
        sequential_results = []
        for f in saved_paths:
            init_worker(keyword_list, exact)
            sequential_results.extend(search_in_file(f))
        seq_end = time.time()

        # Parallel execution
        par_start = time.time()
        parallel_results = []
        with ProcessPoolExecutor(
            max_workers=num_workers,
            initializer=init_worker,
            initargs=(keyword_list, exact)
        ) as executor:
            futures = []
            for f in saved_paths:
                if f.lower().endswith('.pdf'):
                    chunks = create_pdf_chunks(f, num_workers)
                    for chunk in chunks:
                        futures.append(executor.submit(search_pdf_pages, *chunk))
                else:
                    chunks = create_text_chunks(f, num_workers)
                    for chunk in chunks:
                        futures.append(executor.submit(search_text_lines, *chunk))

            for future in as_completed(futures):
                parallel_results.extend(future.result())
        par_end = time.time()

        timing = {
            "sequential": round(seq_end - seq_start, 4),
            "parallel": round(par_end - par_start, 4)
        }

        return jsonify({
            "results": parallel_results,
            "timing": timing
        })

if __name__ == '__main__':
    app.run(debug=False, threaded=False)