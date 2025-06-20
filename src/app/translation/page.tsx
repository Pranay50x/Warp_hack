'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Languages, FileText, Download, Play, Pause, RotateCcw } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            PDF Translation Service
          </h1>
          <p className="text-lg text-gray-600">
            Translate educational PDFs to regional Indian languages using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="mr-2" />
                Upload PDF
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                </button>
                {selectedFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>

            {/* Language Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Languages className="mr-2" />
                Target Language
              </h2>
              
              <select
                value={selectedLanguage}
                onChange={handleLanguageSelect}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a language</option>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.script})
                  </option>
                ))}
              </select>
              
              {selectedLanguage && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Translation Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="mr-2" />
                Translation Controls
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={startTranslation}
                  disabled={!selectedFile || !selectedLanguage || isTranslating}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Play className="mr-2" size={20} />
                  {isTranslating ? 'Translating...' : 'Start Translation'}
                </button>
                
                {isTranslating && (
                  <button
                    onClick={stopTranslation}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Pause className="mr-2" size={20} />
                    Stop Translation
                  </button>
                )}
                
                <button
                  onClick={resetTranslation}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center"
                >
                  <RotateCcw className="mr-2" size={20} />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="space-y-6">
            {/* Progress Display */}
            {progress && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="mr-2">{getStatusIcon(progress.status)}</span>
                  Translation Progress
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${getStatusColor(progress.status)}`}>
                      {progress.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progress.progress * 100)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress * 100}%` }}
                    ></div>
                  </div>
                  
                  {progress.current_page && progress.total_pages && (
                    <p className="text-sm text-gray-600">
                      Page {progress.current_page} of {progress.total_pages}
                    </p>
                  )}
                  
                  {progress.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm">{progress.error}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Preview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Text */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Original Text</h3>
                  <div className="bg-gray-50 p-3 rounded-lg h-64 overflow-y-auto text-sm">
                    {progress?.original_text || 'No text to display'}
                  </div>
                </div>
                
                {/* Translated Text */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Translated Text</h3>
                  <div className="bg-blue-50 p-3 rounded-lg h-64 overflow-y-auto text-sm">
                    {progress?.translated_text || 'Translation will appear here'}
                  </div>
                </div>
              </div>
            </div>

            {/* Translation History */}
            {translationHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Translation History</h2>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {translationHistory.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <span>{getStatusIcon(item.status)}</span>
                      <span className={`text-sm ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      {item.progress && (
                        <span className="text-xs text-gray-500">
                          {Math.round(item.progress * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 