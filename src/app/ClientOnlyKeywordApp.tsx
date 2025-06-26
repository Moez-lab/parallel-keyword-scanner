'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function KeywordSearchApp() {
  const [keywords, setKeywords] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [numWorkers, setNumWorkers] = useState(4);
  const [maxCores, setMaxCores] = useState(4);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [timing, setTiming] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('webkitdirectory', '');
      fileInputRef.current.setAttribute('directory', '');
    }
    setMaxCores(navigator.hardwareConcurrency || 4);
  }, []);

  const handleDirectorySelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async () => {
    if (!files.length) {
      setError('Please select a folder first.');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    setError('');
    setResults([]);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('keywords', keywords);
      formData.append('exactMatch', exactMatch.toString());
      formData.append('numWorkers', numWorkers.toString());

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:5000/api/search');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setLoading(false);
        setUploadProgress(100);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setResults(data.results);
          setTiming(data.timing);
        } else {
          const err = JSON.parse(xhr.responseText);
          setError(err.error || 'Unknown error occurred');
        }
      };

      xhr.onerror = () => {
        setLoading(false);
        setError('Network error occurred');
      };

      xhr.send(formData);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const handleNumWorkersChange = (e) => {
    const value = parseInt(e.target.value);
    setNumWorkers(isNaN(value) ? '' : value);
  };

  const speedupData = timing ? [
    { name: 'Sequential', time: timing.sequential },
    { name: 'Parallel', time: timing.parallel }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-cyan-400">Parallel Keyword Scanner</h1>
          <p className="text-gray-400 text-lg">Search text and PDF files with blazing fast parallel processing</p>
        </div>

        <Card className="bg-gray-800/60 border border-cyan-900 shadow-lg">
          <CardContent className="space-y-6 p-6">
            <Input
              placeholder="🔍 Enter keywords (comma separated)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="text-white placeholder-gray-400"
            />
            <div>
              <label className="block text-sm text-gray-300 mb-2">📁 Select Directory</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDirectorySelect}
                className="block w-full text-sm text-white bg-gray-700 file:bg-cyan-700 file:text-white file:border-none file:px-4 file:py-2 file:mr-4"
                multiple
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">🔒 Exact Match</label>
              <Switch checked={exactMatch} onCheckedChange={setExactMatch} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">🧠 Number of Workers</label>
              <Input
                type="number"
                value={isNaN(numWorkers) ? '' : numWorkers}
                onChange={handleNumWorkersChange}
                className="text-white bg-gray-700"
                min={1}
                max={maxCores}
              />
              <p className="text-xs text-gray-400 mt-1">🖥️ Max available on your device: {maxCores}</p>
            </div>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2" onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="animate-spin" size={20} /> Searching...</> : '⚡ Start Search'}
            </Button>
            {loading && (
              <div className="mt-4 w-full space-y-2">
                <div className="text-sm text-gray-300">⏳ Uploading: {uploadProgress}%</div>
                <div className="w-full h-2 bg-gray-700 rounded">
                  <div className="h-full bg-cyan-500 rounded" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            {error && <p className="text-red-500 text-sm mt-2">❌ {error}</p>}
          </CardContent>
        </Card>

        {timing && (
          <div className="bg-gray-800/70 border border-gray-700 rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-semibold text-cyan-300 mb-4">📈 Speedup Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={speedupData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Line type="monotone" dataKey="time" stroke="#06b6d4" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-400 mt-2">⚙️ Speedup: {(timing.sequential / timing.parallel).toFixed(2)}x faster</p>
            <p className="text-sm text-gray-400 mt-1">🕐 Sequential Time: {timing.sequential}s</p>
            <p className="text-sm text-gray-400">🚀 Parallel Time: {timing.parallel}s</p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <h2 className="text-3xl font-semibold text-cyan-300 mb-6">🧾 Search Results</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {results.map((result, index) => (
                <Card key={index} className="bg-gray-800/70 border border-gray-700">
                  <CardContent className="text-sm p-5 space-y-2">
                    <p><span className="font-semibold text-cyan-300">📄 File:</span> <span className="text-gray-200">{result.file}</span></p>
                    <p><span className="font-semibold text-pink-400">📍 Location:</span> <span className="text-gray-200">{result.location}</span></p>
                    <p><span className="font-semibold text-purple-400">🔎 Matched:</span> <span className="text-gray-200">{result.keywords.join(', ')}</span></p>
                    <Textarea className="bg-gray-900 text-gray-200 mt-2" value={result.content} readOnly />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
