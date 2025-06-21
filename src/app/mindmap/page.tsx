"use client";
import { useState, ChangeEvent, useEffect } from "react";
import { Upload, Brain, Search, FileText, Database, Plus, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";
import KnowledgeBaseQuery from "../../components/KnowledgeBaseQuery";
import UserDocuments from "../../components/UserDocuments";

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
  const [useChroma, setUseChroma] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"generate" | "add-to-kb">("generate");
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showUserDocuments, setShowUserDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [userId, setUserId] = useState("default_user");
  const router = useRouter();

  useEffect(() => {
    const savedUserId = localStorage.getItem("mindmap_user_id");
    if (savedUserId) {
      setUserId(savedUserId);
    } else {
      const newUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
      setUserId(newUserId);
      localStorage.setItem("mindmap_user_id", newUserId);
    }
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
      setSuccess("");
      setSelectedDocument(null);
    }
  };

  const getFinalQuery = () => (query === "custom" ? customQuery : query);

  const handleGenerateMindmap = async () => {
    if (!file && !selectedDocument) {
      return setError("Please select a PDF file or choose a document from your knowledge base");
    }
    
    const finalQuery = getFinalQuery();
    if (!finalQuery.trim()) return setError("Please enter a query or select a focus area");

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    
    if (file) {
      formData.append("file", file);
    }
    
    formData.append("query", finalQuery);
    formData.append("use_chroma", useChroma.toString());
    formData.append("user_id", userId);
    
    if (selectedDocument) {
      formData.append("selected_document", selectedDocument);
    }

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
      setSuccess(`Mindmap generated successfully! ${useChroma ? "Enhanced with your knowledge base." : ""}`);
      setTimeout(() => {
        router.push("/mindmap/view");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating mindmap");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToKnowledgeBase = async () => {
    if (!file) return setError("Please select a PDF file");

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    try {
      const res = await fetch("http://localhost:8000/add-to-knowledge-base/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add document to knowledge base");
      }
      const data = await res.json();
      setSuccess(`Successfully added ${file.name} to your knowledge base!`);
      setFile(null);
      if (showUserDocuments) {
        setShowUserDocuments(false);
        setTimeout(() => setShowUserDocuments(true), 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding to knowledge base");
    } finally {
      setLoading(false);
    }
  };

  const handleKnowledgeBaseSelect = (content: string) => {
    setCustomQuery(content.substring(0, 100) + "...");
    setQuery("custom");
    setActiveTab("generate");
  };

  const handleUserDocumentSelect = (filename: string) => {
    setSelectedDocument(filename);
    setCustomQuery("");
    setQuery("all");
    setActiveTab("generate");
    setFile(null);
    setSuccess(`Selected document: ${filename}. You can now choose a focus area and generate a mindmap using this document.`);
  };

  const handleUserDocumentDelete = (filename: string) => {
    setSuccess(`Document ${filename} deleted from your knowledge base`);
    if (selectedDocument === filename) {
      setSelectedDocument(null);
      setCustomQuery("");
    }
  };

  return (
    <>
      <Navigation />
      <main className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 pt-8">
        <div className="w-full max-w-5xl rounded-2xl bg-[#23263A] border border-[#2c2f4a] shadow-xl p-8 space-y-8">
          <header className="text-center">
            <h1 className="text-4xl font-extrabold mb-2 text-teal-200 drop-shadow">Enhanced Mindmap Generator</h1>
            <p className="text-gray-300">
              Upload your PDF and leverage your personal knowledge base for intelligent mindmap generation.
            </p>
          </header>

          <section>
            <button
              onClick={() => setShowUserDocuments(!showUserDocuments)}
              className="w-full flex items-center justify-between p-4 bg-[#181C2A] border border-[#2c2f4a] rounded-lg hover:border-teal-400/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-teal-400" />
                <span className="text-gray-200 font-medium">Your Documents</span>
                {selectedDocument && (
                  <span className="text-xs text-teal-400 bg-teal-400/10 px-2 py-1 rounded">
                    Using: {selectedDocument}
                  </span>
                )}
              </div>
              {showUserDocuments ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {showUserDocuments && (
              <div className="mt-4">
                <UserDocuments 
                  userId={userId}
                  onSelectDocument={handleUserDocumentSelect}
                  onDeleteDocument={handleUserDocumentDelete}
                />
              </div>
            )}
          </section>

          <section>
            <button
              onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
              className="w-full flex items-center justify-between p-4 bg-[#181C2A] border border-[#2c2f4a] rounded-lg hover:border-teal-400/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database size={20} className="text-teal-400" />
                <span className="text-gray-200 font-medium">Explore Knowledge Base</span>
              </div>
              {showKnowledgeBase ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
            {showKnowledgeBase && (
              <div className="mt-4">
                <KnowledgeBaseQuery onSelectContent={handleKnowledgeBaseSelect} />
              </div>
            )}
          </section>

          <div className="flex space-x-1 bg-[#181C2A] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("generate")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "generate"
                  ? "bg-teal-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Brain size={16} className="inline mr-2" />
              Generate Mindmap
            </button>
            <button
              onClick={() => setActiveTab("add-to-kb")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "add-to-kb"
                  ? "bg-teal-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Database size={16} className="inline mr-2" />
              Add to Knowledge Base
            </button>
          </div>

          <section>
            <label className="block text-lg font-medium mb-2 flex items-center gap-2">
              <Upload size={20} /> {selectedDocument ? "Selected Document" : "Upload PDF Document"}
            </label>
            
            {selectedDocument ? (
              <div className="border-2 border-teal-400/40 rounded-lg p-6 bg-[#181C2A] text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText size={20} className="text-teal-400" />
                  <span className="text-teal-300 font-medium">{selectedDocument}</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Using document from your knowledge base
                </p>
                <button
                  onClick={() => {
                    setSelectedDocument(null);
                    setCustomQuery("");
                    setFile(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Change Document
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-teal-400/40 rounded-lg p-6 bg-[#181C2A] text-center hover:border-teal-300 transition-all">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer text-teal-300 hover:underline">
                  {file ? file.name : "Click to select a PDF file"}
                </label>
                {file && (
                  <p className="text-sm text-gray-400 mt-2">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            )}
          </section>

          {activeTab === "generate" && (
            <>
              <section>
                <label className="block text-lg font-medium mb-2 flex items-center gap-2">
                  <Search size={20} /> Focus Area
                </label>
                {selectedDocument && (
                  <div className="mb-3 p-3 bg-teal-400/10 border border-teal-400/20 rounded-lg">
                    <p className="text-sm text-teal-300">
                      <strong>Using document:</strong> {selectedDocument}
                    </p>
                    <p className="text-xs text-teal-400 mt-1">
                      Choose a focus area to generate a mindmap from this document
                    </p>
                  </div>
                )}
                <select
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCustomQuery("");
                    setError("");
                  }}
                  className="w-full p-3 border border-[#2c2f4a] rounded-md focus:ring-2 focus:ring-teal-400 bg-[#181C2A] text-gray-100"
                >
                  {QUERY_SUGGESTIONS.map((q) => (
                    <option key={q.value} value={q.value} className="bg-[#23263A]">
                      {q.label}
                    </option>
                  ))}
                  <option value="custom" className="bg-[#23263A]">Custom Query</option>
                </select>
                {query === "custom" ? (
                  <input
                    type="text"
                    placeholder="Enter your custom focus area..."
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    className="w-full mt-4 p-3 border border-[#2c2f4a] rounded-md focus:ring-2 focus:ring-teal-400 bg-[#181C2A] text-gray-100"
                  />
                ) : (
                  <p className="text-sm text-gray-400 mt-2">
                    {QUERY_SUGGESTIONS.find((q) => q.value === query)?.description}
                  </p>
                )}
              </section>

              <section>
                <label className="block text-lg font-medium mb-2 flex items-center gap-2">
                  <Database size={20} /> Knowledge Base Integration
                </label>
                <div className="bg-[#181C2A] p-4 rounded-lg border border-[#2c2f4a]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-chroma"
                        checked={useChroma}
                        onChange={(e) => setUseChroma(e.target.checked)}
                        className="w-4 h-4 text-teal-500 bg-[#23263A] border-[#2c2f4a] rounded focus:ring-teal-400"
                      />
                      <label htmlFor="use-chroma" className="text-gray-200 font-medium">
                        Use Personal Knowledge Base
                      </label>
                    </div>
                    <span className="text-xs text-teal-400 bg-teal-400/10 px-2 py-1 rounded">
                      {useChroma ? "Enhanced" : "Basic"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {useChroma 
                      ? "Your mindmap will include related content from your previously uploaded documents, providing more comprehensive and personalized results."
                      : "Generate mindmap using only the uploaded document content."
                    }
                  </p>
                </div>
              </section>

              <section>
                <label className="block text-lg font-medium mb-2 flex items-center gap-2">
                  <FileText size={20} /> Generate Mindmap
                </label>
                <button
                  onClick={handleGenerateMindmap}
                  disabled={loading || (!file && !selectedDocument) || !getFinalQuery()}
                  className="w-full bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Brain size={20} />
                      Generate Enhanced Mindmap
                    </span>
                  )}
                </button>
              </section>
            </>
          )}

          {activeTab === "add-to-kb" && (
            <>
              <section>
                <div className="bg-[#181C2A] p-4 rounded-lg border border-[#2c2f4a]">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={20} className="text-teal-400" />
                    <h3 className="text-lg font-medium text-gray-200">Add to Your Knowledge Base</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Add your document to your personal knowledge base so you can leverage it for future mindmap generation. 
                    Your documents are stored privately and can be used to enhance your mindmaps.
                  </p>
                  <div className="bg-teal-400/10 border border-teal-400/20 rounded-lg p-3">
                    <p className="text-sm text-teal-300">
                      <strong>Benefits:</strong> Build a personal knowledge base, get more relevant mindmaps, 
                      and improve the quality of generated content using your own documents.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <button
                  onClick={handleAddToKnowledgeBase}
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Adding to Knowledge Base...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Plus size={20} />
                      Add to Your Knowledge Base
                    </span>
                  )}
                </button>
              </section>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 border border-red-500/20 rounded-lg bg-red-500/10">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 p-4 border border-green-500/20 rounded-lg bg-green-500/10">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
