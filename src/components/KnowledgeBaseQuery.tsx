"use client";
import { useState } from "react";
import { Search, Database, BookOpen, ExternalLink } from "lucide-react";

interface KnowledgeBaseQueryProps {
  onSelectContent?: (content: string) => void;
  userId: string;
}

export default function KnowledgeBaseQuery({ onSelectContent, userId }: KnowledgeBaseQueryProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topK, setTopK] = useState(5);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(
        `https://b62hc50k-8000.inc1.devtunnels.ms/query-knowledge-base/?query=${encodeURIComponent(query)}&top_k=${topK}&user_id=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to query knowledge base");
      }

      const data = await response.json();
      if (data.status === "success" && data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error querying knowledge base");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectContent = (content: string) => {
    if (onSelectContent) {
      onSelectContent(content);
    }
  };

  return (
    <div className="bg-[#181C2A] rounded-lg border border-[#2c2f4a] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database size={20} className="text-teal-400" />
        <h3 className="text-lg font-medium text-gray-200">Search Knowledge Base</h3>
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for topics, concepts, or keywords..."
              className="w-full pl-10 pr-4 py-2 bg-[#23263A] border border-[#2c2f4a] rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
          </div>
          <select
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="px-3 py-2 bg-[#23263A] border border-[#2c2f4a] rounded-lg text-gray-100 focus:ring-2 focus:ring-teal-400"
          >
            <option value={3}>3 results</option>
            <option value={5}>5 results</option>
            <option value={10}>10 results</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 border border-red-500/20 rounded-lg bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BookOpen size={14} />
              <span>Found {results.length} related documents</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-[#23263A] border border-[#2c2f4a] rounded-lg hover:border-teal-400/40 transition-colors cursor-pointer group"
                  onClick={() => handleSelectContent(result)}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-300 line-clamp-3 group-hover:text-teal-300 transition-colors">
                      {result}
                    </p>
                    <ExternalLink size={14} className="text-gray-500 group-hover:text-teal-400 transition-colors flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && query && !error && (
          <div className="text-center py-8">
            <BookOpen size={32} className="text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">No related content found for "{query}"</p>
            <p className="text-sm text-gray-500 mt-1">
              Try different keywords or add more documents to the knowledge base
            </p>
          </div>
        )}

        {/* Help Text */}
        {!query && !loading && results.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">
              Search the knowledge base to find related content from your documents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
