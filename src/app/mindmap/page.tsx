"use client";
import { useState, ChangeEvent } from "react";
import { Upload, Brain, Search, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const QUERY_SUGGESTIONS = [
  { value: "all", label: "Complete Document", description: "Generate comprehensive mindmap of entire document" },
  { value: "physics", label: "Physics", description: "Focus on physics concepts and principles" },
  { value: "chemistry", label: "Chemistry", description: "Focus on chemical reactions and properties" },
  { value: "biology", label: "Biology", description: "Focus on biological concepts and processes" },
  { value: "mathematics", label: "Mathematics", description: "Focus on mathematical concepts and formulas" },
  { value: "experiments", label: "Experiments", description: "Focus on experimental procedures and methods" },
  { value: "definitions", label: "Definitions", description: "Focus on key definitions and terminology" },
  { value: "formulas", label: "Formulas", description: "Focus on mathematical formulas and equations" },
  { value: "examples", label: "Examples", description: "Focus on practical examples and applications" },
  { value: "theories", label: "Theories", description: "Focus on theoretical concepts and frameworks" },
];

export default function MindmapUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("all");
  const [customQuery, setCustomQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const getFinalQuery = () => (query === "custom" ? customQuery : query);

  const handleUpload = async () => {
    if (!file) return setError("Please select a PDF file");
    const finalQuery = getFinalQuery();
    if (!finalQuery.trim()) return setError("Please enter a query or select a focus area");

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", finalQuery);

    try {
      const res = await fetch("http://localhost:8000/generate-mindmap/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate mindmap");
      }
      const data = await res.json();
      const mindmapData = typeof data.mindmap === "string" ? JSON.parse(data.mindmap) : data.mindmap;
      localStorage.setItem("latestMindmap", JSON.stringify(mindmapData));
      router.push("/mindmap/view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating mindmap");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-gray-100 via-white to-gray-200 text-gray-900">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="absolute top-6 left-6 text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      {/* Card */}
      <div className="w-full max-w-3xl rounded-xl bg-white border border-gray-300 shadow-xl p-8 space-y-10">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-serif font-bold mb-2">Mindmap Generator</h1>
          <p className="text-gray-600">
            Upload your PDF and choose a focus area to create an intelligent mindmap.
          </p>
        </header>

        {/* File Upload */}
        <section>
          <label className="block text-lg font-medium mb-2 flex items-center gap-2">
            <Upload size={20} /> Upload PDF Document
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center hover:border-gray-400 transition-all">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:underline">
              {file ? file.name : "Click to select a PDF file"}
            </label>
            {file && (
              <p className="text-sm text-gray-500 mt-2">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </section>

        {/* Query Selection */}
        <section>
          <label className="block text-lg font-medium mb-2 flex items-center gap-2">
            <Search size={20} /> Focus Area
          </label>
          <select
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCustomQuery("");
              setError("");
            }}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {QUERY_SUGGESTIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
            <option value="custom">Custom Query</option>
          </select>
          {query === "custom" ? (
            <input
              type="text"
              placeholder="Enter your custom focus area..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full mt-4 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              {QUERY_SUGGESTIONS.find((q) => q.value === query)?.description}
            </p>
          )}
        </section>

        {/* Submit Button */}
        <section>
          <label className="block text-lg font-medium mb-2 flex items-center gap-2">
            <FileText size={20} /> Generate Mindmap
          </label>
          <button
            onClick={handleUpload}
            disabled={loading || !file || !getFinalQuery()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Brain size={20} />
                Generate Mindmap
              </span>
            )}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-600 border border-red-200 rounded-md p-3 bg-red-50">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
