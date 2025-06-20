'use client';

import React, { useState, useRef } from 'react';
import { Upload, Languages, FileText, Download, Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
import Navigation from '../../components/Navigation';

interface Language {
  name: string;
  code: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { name: "English", code: "en-IN" },
  { name: "Hindi", code: "hi-IN" },
  { name: "Bengali", code: "bn-IN" },
  { name: "Telugu", code: "te-IN" },
  { name: "Marathi", code: "mr-IN" },
  { name: "Tamil", code: "ta-IN" },
  { name: "Gujarati", code: "gu-IN" },
  { name: "Kannada", code: "kn-IN" },
  { name: "Malayalam", code: "ml-IN" },
  { name: "Punjabi", code: "pa-IN" },
  { name: "Odia", code: "od-IN" },
  { name: "Assamese", code: "as-IN" },
  { name: "Bodo", code: "brx-IN" },
  { name: "Dogri", code: "doi-IN" },
  { name: "Konkani", code: "kok-IN" },
  { name: "Kashmiri", code: "ks-IN" },
  { name: "Maithili", code: "mai-IN" },
  { name: "Manipuri", code: "mni-IN" },
  { name: "Nepali", code: "ne-IN" },
  { name: "Sanskrit", code: "sa-IN" },
  { name: "Santali", code: "sat-IN" },
  { name: "Sindhi", code: "sd-IN" },
  { name: "Urdu", code: "ur-IN" },
];

interface TranslationResult {
  source_language: string;
  target_language: string;
  original_char_count: number;
  translated_char_count: number;
  translated_text: string;
}

export default function TranslationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string>('en-IN');
  const [targetLanguage, setTargetLanguage] = useState<string>('hi-IN');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleTranslate = async () => {
    if (!selectedFile || !sourceLanguage || !targetLanguage) {
      setError('Please select a file, source language, and target language');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('source_language', sourceLanguage);
    formData.append('target_language', targetLanguage);

    try {
      const response = await fetch('http://127.0.0.1:8000/translate-pdf/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Translation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsTranslating(false);
    }
  };

  const resetTranslation = () => {
    setSelectedFile(null);
    setSourceLanguage('en-IN');
    setTargetLanguage('hi-IN');
    setIsTranslating(false);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-teal-200 drop-shadow">PDF Translation Service</h1>
            <p className="text-lg text-gray-300">Translate educational PDFs to regional Indian languages using AI</p>
          </div>

          <div className="space-y-8">
            {/* Controls Section */}
            <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a] space-y-8">
              {/* File Upload */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-teal-200"><Upload className="mr-2" /> 1. Upload PDF</h2>
                <div className="border-2 border-dashed border-teal-400/40 rounded-lg p-6 bg-[#181C2A] text-center hover:border-teal-300 transition-all">
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />
                  <label htmlFor="pdf-upload" className="cursor-pointer text-teal-300 hover:underline font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                  </label>
                  {selectedFile && (
                    <p className="text-sm text-gray-400 mt-2">
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-200"><Languages className="mr-2" /> 2. Select Languages</h2>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {/* Source Language */}
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-1 text-gray-200">From</label>
                    <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className="w-full p-3 border border-[#2c2f4a] rounded-lg focus:ring-2 focus:ring-teal-400 bg-[#181C2A] text-gray-100">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={`src-${lang.code}`} value={lang.code} className="bg-[#23263A]">{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-6">
                     <ArrowRight size={24} className="text-teal-300 hidden md:block" />
                  </div>
                  {/* Target Language */}
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-1 text-gray-200">To</label>
                    <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full p-3 border border-[#2c2f4a] rounded-lg focus:ring-2 focus:ring-teal-400 bg-[#181C2A] text-gray-100">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={`tgt-${lang.code}`} value={lang.code} className="bg-[#23263A]">{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Translation Controls */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-200"><Play className="mr-2" /> 3. Translate</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={handleTranslate}
                    disabled={!selectedFile || !sourceLanguage || !targetLanguage || isTranslating}
                    className="w-full bg-gradient-to-r from-teal-400 via-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                  >
                    {isTranslating ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2" size={20} /> Start Translation
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetTranslation}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-800 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:scale-105 flex items-center justify-center transition-all duration-200"
                  >
                    <RotateCcw className="mr-2" size={20} /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Result Section */}
            {(isTranslating || result || error) && (
              <div className="bg-[#23263A] rounded-2xl shadow-xl p-8 border border-[#2c2f4a] mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-lime-200">Result</h2>
                {isTranslating && <p className="text-lg text-gray-300">Translation in progress, please wait...</p>}
                {error && <div className="p-4 bg-red-900/30 border border-red-400 rounded-lg text-red-300">{error}</div>}
                {result && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className="bg-[#181C2A] p-4 rounded-lg border border-[#2c2f4a]">
                        <p className="text-sm text-gray-400">Source</p>
                        <p className="text-lg font-semibold text-teal-200">{result.source_language}</p>
                      </div>
                      <div className="bg-[#181C2A] p-4 rounded-lg border border-[#2c2f4a]">
                        <p className="text-sm text-gray-400">Original Characters</p>
                        <p className="text-lg font-semibold">{result.original_char_count}</p>
                      </div>
                      <div className="bg-[#181C2A] p-4 rounded-lg border border-[#2c2f4a]">
                        <p className="text-sm text-gray-400">Translated Characters</p>
                        <p className="text-lg font-semibold">{result.translated_char_count}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-200 mb-2">Translated Text</h3>
                      <div className="bg-[#181C2A] p-4 rounded-lg h-64 overflow-y-auto text-lg text-gray-100 border border-[#2c2f4a] whitespace-pre-wrap">
                        {result.translated_text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 