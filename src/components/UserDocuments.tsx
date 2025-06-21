"use client";
import { useState, useEffect } from "react";
import { FileText, Trash2, Eye, Upload, RefreshCw } from "lucide-react";

interface Document {
  filename: string;
  page: number;
  section: string;
  source: string;
}

interface UserDocumentsProps {
  userId: string;
  onSelectDocument?: (filename: string) => void;
  onDeleteDocument?: (filename: string) => void;
}

export default function UserDocuments({ userId, onSelectDocument, onDeleteDocument }: UserDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUserDocuments = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`http://localhost:8000/user-documents/?user_id=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user documents");
      }
      
      const data = await response.json();
      if (data.status === "success") {
        // Filter for unique documents based on filename
        const uniqueDocuments = data.documents.filter(
          (doc: Document, index: number, self: Document[]) =>
            index === self.findIndex((d) => d.filename === doc.filename)
        );
        setDocuments(uniqueDocuments || []);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}" from your knowledge base?`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://localhost:8000/delete-document/?filename=${encodeURIComponent(filename)}&user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      const data = await response.json();
      setSuccess(data.message || "Document deleted successfully");
      
      // Refresh the document list
      await fetchUserDocuments();
      
      // Notify parent component
      if (onDeleteDocument) {
        onDeleteDocument(filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting document");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDocuments();
  }, [userId]);

  return (
    <div className="bg-[#181C2A] rounded-lg border border-[#2c2f4a] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-teal-400" />
          <h3 className="text-lg font-medium text-gray-200">Your Documents</h3>
        </div>
        <button
          onClick={fetchUserDocuments}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-teal-400 transition-colors disabled:opacity-50"
          title="Refresh documents"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 border border-red-500/20 rounded-lg bg-red-500/10">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 border border-green-500/20 rounded-lg bg-green-500/10">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Documents List */}
      {loading && documents.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-400">Loading your documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <Upload size={32} className="text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">No documents uploaded yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload PDFs to build your personal knowledge base
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#23263A] border border-[#2c2f4a] rounded-lg hover:border-teal-400/40 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText size={16} className="text-teal-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.section} • Page {doc.page}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {onSelectDocument && (
                  <button
                    onClick={() => onSelectDocument(doc.filename)}
                    className="p-1 text-gray-400 hover:text-teal-400 transition-colors"
                    title="Use this document"
                  >
                    <Eye size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteDocument(doc.filename)}
                  disabled={loading}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {documents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2c2f4a]">
          <p className="text-sm text-gray-400">
            {documents.length} document{documents.length !== 1 ? 's' : ''} in your knowledge base
          </p>
        </div>
      )}
    </div>
  );
} 
