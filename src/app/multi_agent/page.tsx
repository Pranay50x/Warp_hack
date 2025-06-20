"use client";
import React, { useState } from "react";
import Navigation from "../../components/Navigation";
import { BookOpen, Brain, FileText, Map } from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8000";

const TASKS = [
  { value: "general", label: "General Q&A", icon: <BookOpen size={20} className="text-teal-300" /> },
  { value: "breakdown", label: "Breakdown", icon: <FileText size={20} className="text-purple-300" /> },
  { value: "quiz", label: "Quiz", icon: <Brain size={20} className="text-orange-300" /> },
  { value: "mindmap", label: "Mindmap", icon: <Map size={20} className="text-blue-300" /> },
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
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-[#23263A] rounded-2xl shadow-xl p-10 border border-[#2c2f4a]">
          <h1 className="text-3xl font-extrabold mb-6 text-teal-200 drop-shadow text-center">Multi-Agent PDF QA</h1>
          {!uploaded && (
            <div className="mb-8 p-6 border-2 border-dashed border-teal-400/40 rounded-xl bg-[#181C2A]">
              <label className="block font-semibold mb-2 text-teal-200">Upload PDF File:</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setPdfFile(e.target.files?.[0] || null)}
                className="mb-2 text-gray-100"
              />
              <button
                onClick={handleIngest}
                className="bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all duration-200"
                disabled={!pdfFile}
              >
                Ingest PDF
              </button>
              {uploadStatus && <div className="mt-2 text-sm text-gray-300">{uploadStatus}</div>}
            </div>
          )}
          {uploaded && (
            <div className="mb-8 p-6 border-2 border-dashed border-blue-400/40 rounded-xl bg-[#181C2A]">
              <label className="block font-semibold mb-2 text-blue-200">Agent Query:</label>
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                <select
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  className="border border-[#2c2f4a] rounded p-2 bg-[#23263A] text-gray-100"
                >
                  {TASKS.map(t => (
                    <option key={t.value} value={t.value} className="bg-[#23263A]">{t.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 border border-[#2c2f4a] rounded p-2 bg-[#181C2A] text-gray-100"
                  placeholder="Ask a question, request a quiz, etc."
                  onKeyDown={e => { if (e.key === "Enter") handleQuery(); }}
                />
                <button
                  onClick={handleQuery}
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Ask Agent"}
                </button>
              </div>
            </div>
          )}
          {result && (
            <div className="mt-8 p-6 border border-[#2c2f4a] rounded-xl bg-[#23263A]">
              <h2 className="text-lg font-semibold mb-2 text-teal-200">Agent Response</h2>
              <div className="mb-2 whitespace-pre-line text-gray-100">
                {result.text}
              </div>
              {result.media && Array.isArray(result.media) && result.media.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1 text-blue-200">Structured Output:</h3>
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
                          <div className="text-green-400 mt-1">Correct answer: {q.answer}</div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <pre className="bg-[#181C2A] p-2 rounded text-sm overflow-x-auto text-gray-200">{JSON.stringify(result.media, null, 2)}</pre>
                  )}
                </div>
              )}
              {result.success === false && (
                <div className="text-red-400 mt-2">Could not parse structured output.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
} 