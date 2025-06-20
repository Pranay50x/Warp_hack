'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Languages, FileText, Download, Play, Pause, RotateCcw } from 'lucide-react';
import Navigation from "../../components/Navigation";

interface TranslationProgress {
  status: string;
  progress: number;
  current_page?: number;
  total_pages?: number;
  translated_text?: string;
  original_text?: string;
  error?: string;
}

interface Language {
  name: string;
  code: string;
  script: string;
  description: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { name: "Hindi", code: "hi", script: "Devanagari", description: "Official language of India" },
  { name: "Bengali", code: "bn", script: "Bengali", description: "Spoken in West Bengal and Bangladesh" },
  { name: "Telugu", code: "te", script: "Telugu", description: "Spoken in Andhra Pradesh and Telangana" },
  { name: "Marathi", code: "mr", script: "Devanagari", description: "Spoken in Maharashtra" },
  { name: "Tamil", code: "ta", script: "Tamil", description: "Spoken in Tamil Nadu" },
  { name: "Gujarati", code: "gu", script: "Gujarati", description: "Spoken in Gujarat" },
  { name: "Kannada", code: "kn", script: "Kannada", description: "Spoken in Karnataka" },
  { name: "Malayalam", code: "ml", script: "Malayalam", description: "Spoken in Kerala" },
  { name: "Punjabi", code: "pa", script: "Gurmukhi", description: "Spoken in Punjab" },
  { name: "Odia", code: "or", script: "Odia", description: "Spoken in Odisha" },
  { name: "Assamese", code: "as", script: "Assamese", description: "Spoken in Assam" },
  { name: "Sanskrit", code: "sa", script: "Devanagari", description: "Classical language of India" }
];

export default function TranslationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [translationHistory, setTranslationHistory] = useState<TranslationProgress[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket connection for live updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8001/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data: TranslationProgress = JSON.parse(event.data);
        setProgress(data);
        
        if (data.status === 'completed' || data.status === 'error') {
          setIsTranslating(false);
        }
        
        // Add to history
        setTranslationHistory(prev => [...prev, data]);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setWebsocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleLanguageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8001/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.status === 'success') {
        return result.file_path;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
      return null;
    }
  };

  const startTranslation = async () => {
    if (!selectedFile || !selectedLanguage) {
      alert('Please select a file and target language');
      return;
    }

    setIsTranslating(true);
    setProgress(null);
    setTranslationHistory([]);

    try {
      // Upload file first
      const filePath = await uploadFile();
      if (!filePath) return;

      // Start translation
      const response = await fetch('http://localhost:8001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_path: filePath,
          target_language: selectedLanguage,
          source_language: 'English'
        }),
      });

      const result = await response.json();
      if (result.status === 'error') {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Failed to start translation');
      setIsTranslating(false);
    }
  };

  const stopTranslation = () => {
    setIsTranslating(false);
    // TODO: Implement stop translation API call
  };

  const resetTranslation = () => {
    setSelectedFile(null);
    setSelectedLanguage('');
    setIsTranslating(false);
    setProgress(null);
    setTranslationHistory([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'extracting': return 'text-blue-600';
      case 'translating': return 'text-yellow-600';
      case 'quality_checking': return 'text-purple-600';
      case 'saving': return 'text-green-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'extracting': return '📄';
      case 'translating': return '🔄';
      case 'quality_checking': return '✅';
      case 'saving': return '💾';
      case 'completed': return '🎉';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-teal-200 drop-shadow">PDF Translation Service</h1>
            <p className="text-lg text-gray-300">Translate educational PDFs to regional Indian languages using AI</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Panel - Controls */}
            <div className="space-y-8">
              {/* File Upload */}
              <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a]">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-teal-200">
                  <Upload className="mr-2" /> Upload PDF
                </h2>
                <div className="border-2 border-dashed border-teal-400/40 rounded-lg p-6 bg-[#181C2A] text-center hover:border-teal-300 transition-all">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-300 hover:underline font-medium"
                  >
                    {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                  </button>
                  {selectedFile && (
                    <p className="text-sm text-gray-400 mt-2">
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              {/* Language Selection */}
              <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a]">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-200">
                  <Languages className="mr-2" /> Target Language
                </h2>
                <select
                  value={selectedLanguage}
                  onChange={handleLanguageSelect}
                  className="w-full p-3 border border-[#2c2f4a] rounded-lg focus:ring-2 focus:ring-teal-400 bg-[#181C2A] text-gray-100"
                >
                  <option value="">Select a language</option>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#23263A]">
                      {lang.name} ({lang.script})
                    </option>
                  ))}
                </select>
                {selectedLanguage && (
                  <div className="mt-3 p-3 bg-[#181C2A] rounded-lg">
                    <p className="text-sm text-teal-200">
                      {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Translation Controls */}
              <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a]">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-200">
                  <FileText className="mr-2" /> Translation Controls
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={startTranslation}
                    disabled={!selectedFile || !selectedLanguage || isTranslating}
                    className="w-full bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                  >
                    <Play className="mr-2" size={20} />
                    {isTranslating ? 'Translating...' : 'Start Translation'}
                  </button>
                  {isTranslating && (
                    <button
                      onClick={stopTranslation}
                      className="w-full bg-gradient-to-r from-red-400 to-red-600 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:scale-105 flex items-center justify-center transition-all duration-200"
                    >
                      <Pause className="mr-2" size={20} />
                      Stop Translation
                    </button>
                  )}
                  <button
                    onClick={resetTranslation}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-800 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:scale-105 flex items-center justify-center transition-all duration-200"
                  >
                    <RotateCcw className="mr-2" size={20} />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="space-y-8">
              {/* Progress Display */}
              {progress && (
                <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a]">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-lime-200">
                    <span className="mr-2">{getStatusIcon(progress.status)}</span>
                    Translation Progress
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${getStatusColor(progress.status)}`}>{progress.status.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-sm text-gray-400">{Math.round(progress.progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress * 100}%` }}
                      ></div>
                    </div>
                    {progress.current_page && progress.total_pages && (
                      <p className="text-sm text-gray-400">
                        Page {progress.current_page} of {progress.total_pages}
                      </p>
                    )}
                    {progress.error && (
                      <div className="p-3 bg-red-900/30 border border-red-400 rounded-lg">
                        <p className="text-red-300 text-sm">{progress.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Live Preview */}
              <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a]">
                <h2 className="text-xl font-semibold mb-4 text-blue-200">Live Preview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Text */}
                  <div>
                    <h3 className="font-medium text-teal-200 mb-2">Original Text</h3>
                    <div className="bg-[#181C2A] p-3 rounded-lg h-64 overflow-y-auto text-sm text-gray-100 border border-[#2c2f4a]">
                      {progress?.original_text || 'No text to display'}
                    </div>
                  </div>
                  {/* Translated Text */}
                  <div>
                    <h3 className="font-medium text-purple-200 mb-2">Translated Text</h3>
                    <div className="bg-[#181C2A] p-3 rounded-lg h-64 overflow-y-auto text-sm text-gray-100 border border-[#2c2f4a]">
                      {progress?.translated_text || 'Translation will appear here'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 