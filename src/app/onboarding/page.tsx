"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";
import { Upload, FileText, BookOpen, GraduationCap, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  subject?: string;
  description?: string;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}

const fileTypes = [
  { value: 'syllabus', label: 'Course Syllabus', icon: <GraduationCap size={20} /> },
  { value: 'textbook', label: 'Textbook', icon: <BookOpen size={20} /> },
  { value: 'previous_questions', label: 'Previous Year Questions', icon: <FileText size={20} /> },
  { value: 'notes', label: 'Class Notes', icon: <FileText size={20} /> },
  { value: 'slides', label: 'Presentation Slides', icon: <FileText size={20} /> },
  { value: 'other', label: 'Other Material', icon: <FileText size={20} /> },
];

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Engineering', 'Medicine', 'Business', 'Economics', 'Literature',
  'History', 'Geography', 'Psychology', 'Sociology', 'Philosophy',
  'Art', 'Music', 'Sports', 'Other'
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `file-${Date.now()}-${i}`;

      // Add file to state as uploading
      setUploadedFiles(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          type: selectedFileType,
          subject: selectedSubject,
          description: description,
          status: 'uploading'
        }
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', session?.user?.email || 'anonymous');
        formData.append('file_type', selectedFileType);
        if (selectedSubject) formData.append('subject', selectedSubject);
        if (description) formData.append('description', description);

        const response = await fetch('http://localhost:8002/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  status: response.ok ? 'success' : 'error',
                  message: response.ok ? result.message : result.detail || 'Upload failed'
                }
              : f
          )
        );
      } catch (error) {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'error', message: 'Network error' }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    // Optionally reset form fields here
    setSelectedFileType('');
    setSelectedSubject('');
    setDescription('');
  };

  const handleContinue = () => {
    if (uploadedFiles.some(f => f.status === 'success')) {
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen w-full bg-gradient-to-br from-[#181C2A] via-[#23263A] to-[#23263A] text-gray-100 px-4 md:px-8 pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-teal-200">
              Welcome to WarpAI!
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Let's personalize your learning experience by uploading your study materials.
              This helps our AI understand your course content and provide better assistance.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                currentStep >= 2 ? 'bg-teal-500' : 'bg-gray-600'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-600 text-gray-400'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Step 1: File Type Selection */}
          {currentStep === 1 && (
            <div className="bg-[#23263A] rounded-2xl p-8 border border-[#2c2f4a]">
              <h2 className="text-2xl font-bold mb-6 text-center">What type of material are you uploading?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fileTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedFileType(type.value);
                      setCurrentStep(2);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[#2c2f4a] hover:border-teal-400 hover:bg-[#2c2f4a] transition-all duration-200 text-left"
                  >
                    <div className="text-teal-400">{type.icon}</div>
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {currentStep === 2 && (
            <div className="bg-[#23263A] rounded-2xl p-8 border border-[#2c2f4a]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Upload Your {fileTypes.find(t => t.value === selectedFileType)?.label}</h2>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  ← Back
                </button>
              </div>

              {/* Subject and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject (Optional)</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#2c2f4a] border border-[#3c3f5a] text-white focus:border-teal-400 focus:outline-none"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the material"
                    className="w-full p-3 rounded-lg bg-[#2c2f4a] border border-[#3c3f5a] text-white focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-[#3c3f5a] rounded-xl p-8 text-center hover:border-teal-400 transition-colors">
                <Upload size={48} className="mx-auto mb-4 text-teal-400" />
                <h3 className="text-xl font-semibold mb-2">Upload your files</h3>
                <p className="text-gray-400 mb-4">
                  Supported formats: PDF, TXT, DOC, DOCX, PPT, PPTX
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isUploading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-500 text-white hover:bg-teal-600 cursor-pointer'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Choose Files'}
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#2c2f4a] border border-[#3c3f5a]"
                      >
                        <div className="flex items-center gap-3">
                          {file.status === 'uploading' && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-400"></div>
                          )}
                          {file.status === 'success' && (
                            <CheckCircle size={20} className="text-green-400" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle size={20} className="text-red-400" />
                          )}
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {file.status === 'uploading' && 'Uploading...'}
                          {file.status === 'success' && 'Success'}
                          {file.status === 'error' && file.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-lg border border-[#3c3f5a] text-gray-300 hover:bg-[#2c2f4a] transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!uploadedFiles.some(f => f.status === 'success')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    uploadedFiles.some(f => f.status === 'success')
                      ? 'bg-teal-500 text-white hover:bg-teal-600'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 
