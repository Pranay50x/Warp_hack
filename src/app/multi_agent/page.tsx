"use client";
import React, { useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000";

const TASKS = [
  { value: "general", label: "General Q&A" },
  { value: "breakdown", label: "Breakdown" },
  { value: "quiz", label: "Quiz" },
  { value: "mindmap", label: "Mindmap" },
];

export default function MultiAgentPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [task, setTask] = useState("general");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  // PDF ingestion (by file upload)
  const handleIngest = async () => {
    if (!pdfFile) return;
    setUploadStatus("Uploading and processing...");
    setResult(null);
    setUploaded(false);
    try {
      const formData = new FormData();
      formData.append("pdf_file", pdfFile);
      const res = await fetch(`${BACKEND_URL}/ingest_pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setUploadStatus(`Ingested ${data.pdf} with ${data.chunks} chunks.`);
        setUploaded(true);
      } else {
        setUploadStatus(`Error: ${data.message}`);
      }
    } catch (e) {
      setUploadStatus("Error uploading PDF.");
    }
  };

  // Agent query
  const handleQuery = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/rag_agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, task }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ text: "Error communicating with backend." });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Multi-Agent PDF QA</h1>
      {!uploaded && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <label className="block font-semibold mb-2">Upload PDF File:</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setPdfFile(e.target.files?.[0] || null)}
            className="mb-2"
          />
          <button
            onClick={handleIngest}
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={!pdfFile}
          >
            Ingest PDF
          </button>
          {uploadStatus && <div className="mt-2 text-sm">{uploadStatus}</div>}
        </div>
      )}
      {uploaded && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <label className="block font-semibold mb-2">Agent Query:</label>
          <div className="flex gap-2 mb-2">
            <select
              value={task}
              onChange={e => setTask(e.target.value)}
              className="border rounded p-2"
            >
              {TASKS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 border rounded p-2"
              placeholder="Ask a question, request a quiz, etc."
              onKeyDown={e => { if (e.key === "Enter") handleQuery(); }}
            />
            <button
              onClick={handleQuery}
              className="bg-green-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Loading..." : "Ask Agent"}
            </button>
          </div>
        </div>
      )}
      {result && (
        <div className="mt-8 p-4 border rounded bg-white">
          <h2 className="text-lg font-semibold mb-2">Agent Response</h2>
          <div className="mb-2 whitespace-pre-line text-gray-800">
            {result.text}
          </div>
          {result.media && Array.isArray(result.media) && result.media.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Structured Output:</h3>
              {task === "quiz" ? (
                <ol className="list-decimal ml-6">
                  {result.media.map((q: any, idx: number) => (
                    <li key={idx} className="mb-3">
                      <div className="font-medium">{q.question}</div>
                      <ul className="list-disc ml-6">
                        {q.options.map((opt: string, i: number) => (
                          <li key={i}>{String.fromCharCode(65 + i)}. {opt}</li>
                        ))}
                      </ul>
                      <div className="text-green-700 mt-1">Correct answer: {q.answer}</div>
                    </li>
                  ))}
                </ol>
              ) : (
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{JSON.stringify(result.media, null, 2)}</pre>
              )}
            </div>
          )}
          {result.success === false && (
            <div className="text-red-600 mt-2">Could not parse structured output.</div>
          )}
        </div>
      )}
    </div>
  );
} 