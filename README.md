# 🔍 Parallel Keyword Scanner

A blazing fast keyword scanner for TXT and PDF files using Python Flask and parallel multiprocessing. Easily upload an entire folder, choose the number of CPU cores, and visualize performance improvement using a sleek React-based frontend.

## 🚀 Features

- ✅ Supports `.txt` and `.pdf` files
- ⚙️ Adjustable number of worker processes
- 📊 Parallel vs Sequential performance comparison
- 🧠 Smart file splitting (pages for PDFs, lines for TXT)
- 🖼️ Modern React UI with file upload & progress
- 🧾 Detailed matched results with keyword highlights

---

## 📦 Tech Stack

- **Backend:** Flask + multiprocessing
- **Frontend:** React + Tailwind CSS (with shadcn/ui)
- **Visualization:** Recharts
- **Other:** PyPDF2, Flask-CORS

---

## 🛠️ Installation

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
``` 
## Frontend (Next.js)
``` bash
cd frontend
npm install
npm run dev
```
## 📂 Upload Format

- Upload entire folder containing .txt or .pdf files
- Keywords should be comma-separated (e.g. apple, banana)
- Choose exact match (e.g. only whole words)

##📡 API (Optional Direct Call)

POST /api/search

## Form Data:

- **keywords:** string — comma-separated keywords
- **exactMatch:** true or false
- **numWorkers:** int — number of CPU cores
- **files:** multiple file uploads

## 📸 Screenshots
Search Interface	Speed Comparison

## 📃 License
MIT License. Feel free to fork, extend, and contribute!

## 💡 Author  
Made with 💻 by [Mueez Zakir](https://github.com/Moez-lab) — [LinkedIn](https://www.linkedin.com/in/moezzakir/)

