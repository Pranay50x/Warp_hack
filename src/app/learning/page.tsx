"use client";

import React, { useState, useRef, useEffect, useReducer } from 'react';
import { Send, Upload, Bot, Moon, Sun, FileText, Loader2, Video, Brain, Map, Download, Sparkles, X, PanelRightOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { QuizInterface } from '@/components/quiz-interface';
import { MarkdownContent } from '@/components/markdown-content';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

interface UploadedFile {
  id: string;
  name: string;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://b62hc50k-5000.inc1.devtunnels.ms/';
const SOCKET_URL = "https://b62hc50k-5000.inc1.devtunnels.ms/";

type ChatMode = 'explain' | 'video' | 'mindmap';

interface CurrentTask {
  name: string;
  status: 'active' | 'completed';
  startTime: Date;
}

// --- State Management with useReducer ---

interface AppState {
  messages: ChatMessage[];
  isLoading: boolean;
  uploadedFiles: string[];
  currentQuiz: any | null;
  currentTask: CurrentTask | null;
  fileUploads: UploadedFile[];
}

type AppAction =
  | { type: 'ADD_MESSAGE'; payload: Omit<ChatMessage, 'id' | 'timestamp'> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_UPLOADED_FILE'; payload: string }
  | { type: 'SET_CURRENT_QUIZ'; payload: any | null }
  | { type: 'SET_CURRENT_TASK'; payload: CurrentTask | null }
  | { type: 'AGENT_RESPONSE_SUCCESS'; payload: { newMessage: Omit<ChatMessage, 'id' | 'timestamp'>; quizData: any | null } }
  | { type: 'ADD_FILE_UPLOAD'; payload: UploadedFile }
  | { type: 'UPDATE_FILE_UPLOAD'; payload: { id: string; status: 'uploading' | 'success' | 'error'; message?: string } };

const initialState: AppState = {
  messages: [
    {
      id: '1',
      type: 'system',
      content: "Hello! I'm your AI Learning Assistant. You can ask me general questions, or upload a PDF to dive deep into a specific topic.",
      timestamp: new Date(),
    }
  ],
  isLoading: false,
  uploadedFiles: [],
  currentQuiz: null,
  currentTask: null,
  fileUploads: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          { ...action.payload, id: Date.now().toString(), timestamp: new Date() },
        ],
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_UPLOADED_FILE':
      return { ...state, uploadedFiles: [...state.uploadedFiles, action.payload] };
    case 'SET_CURRENT_QUIZ':
      return { ...state, currentQuiz: action.payload };
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload };
    case 'AGENT_RESPONSE_SUCCESS':
      return {
        ...state,
        messages: [
          ...state.messages,
          { ...action.payload.newMessage, id: Date.now().toString(), timestamp: new Date() },
        ],
        currentQuiz: action.payload.quizData !== null ? action.payload.quizData : state.currentQuiz,
        isLoading: false,
        currentTask: null,
      };
    case 'ADD_FILE_UPLOAD':
      return {
        ...state,
        fileUploads: [...state.fileUploads, action.payload],
      };
    case 'UPDATE_FILE_UPLOAD':
      return {
        ...state,
        fileUploads: state.fileUploads.map(f =>
          f.id === action.payload.id
            ? { ...f, status: action.payload.status, message: action.payload.message }
            : f
        ),
      };
    default:
      return state;
  }
};

const getUserId = () => {
  // This function will be replaced by getSanitizedUserId
  let userId = localStorage.getItem('learning_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('learning_user_id', userId);
  }
  return userId;
};

const getSanitizedUserId = (email: string | null | undefined): string => {
  if (!email) {
    // Fallback to the old method if no email is available
    let userId = localStorage.getItem('learning_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('learning_user_id', userId);
    }
    return userId;
  }
  
  // Sanitize email for ChromaDB: replace @ with _at_ and . with _dot_
  return email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
};

// --- Main Component ---
export default function Home() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { messages, isLoading, uploadedFiles, currentQuiz, currentTask, fileUploads } = state;

  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('explain');
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const currentUserId = getSanitizedUserId(session?.user?.email);
  const router = useRouter();
  
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTask]);

  // Global paste event listener for PDF files
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.type === 'application/pdf') {
            e.preventDefault();
            handleFileUpload(file);
            toast.success('PDF file detected from clipboard and uploaded!');
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };
  
    useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => toast.success('Connected to learning service.'));
    newSocket.on('disconnect', () => toast.error('Disconnected from learning service.'));

    newSocket.on('tool_start', (data) => {
      const agentName = data?.[0]?.name || 'Agent';
      dispatch({ type: 'SET_CURRENT_TASK', payload: {
        name: `${agentName} is working...`,
        status: 'active',
        startTime: new Date()
      }});
    });

    newSocket.on('agent_response', (response) => {
      const agentData = Array.isArray(response) ? response[0] : response;
      console.log(agentData);
      let newMessage: Omit<ChatMessage, 'id' | 'timestamp'>;
      let quizDataForState: any = null;

      if (!agentData || !agentData.message) {
        toast.error('Received an invalid response from the agent.');
        newMessage = {
          type: 'assistant',
          content: `I received a response I couldn't understand. Please try again.`,
        };
      } else {
        const { message, attachments } = agentData;

        // Handle Mindmap attachments
        if (attachments && attachments.type === 'mindmap' && attachments.data) {
          try {
            const mindmapJson = JSON.parse(attachments.data);
            newMessage = {
              type: 'assistant',
              content: `${message}\n\n<MINDMAP_BUTTON />`, // Simple placeholder
              data: {
                ...attachments,
                mindmapData: mindmapJson // Store the parsed JSON
              }
            };
          } catch (e) {
            console.error("Failed to parse mindmap data", e);
            newMessage = {
              type: 'assistant',
              content: `${message}\n\n(There was an error displaying the mindmap button.)`,
            };
          }
        }
        // Handle MP4 video attachments
        else if (attachments && (attachments.type === 'video/mp4' || attachments.type === 'mp4') && attachments.url) {
          newMessage = {
            type: 'assistant',
            content: `${message}\n\n<VIDEO_PLAYER url="${attachments.url}" />`,
            data: { videoUrl: attachments.url }
          };
        }
        // Handle JSON quiz data
        else if (attachments && attachments.type === 'application/json' && attachments.data) {
            if (message && message.toLowerCase().includes('quiz')) {
              const quizData = attachments.data;
              const topicMatch = message.match(/on (.*?):/);
              const topic = topicMatch ? topicMatch[1] : 'the selected topic';
              
              quizDataForState = {
                quiz_id: Date.now().toString(),
                topic: topic,
                questions: quizData.map((q: any) => ({
                  ...q,
                  options: q.options.map((opt: any) => (typeof opt === 'string' ? opt : opt.option)),
                })),
                total_questions: quizData.length,
              };
      
              newMessage = {
                type: 'assistant',
                content: `📝 **Quiz Ready!**\n\nI've created a quiz on **"${topic}"** with **${quizDataForState.total_questions} questions**.\n\nGood luck! 🍀`,
                data: quizDataForState,
              };
            } else {
              // Handle other JSON data if necessary
              newMessage = { type: 'assistant', content: message, data: attachments.data };
            }
        } else {
          newMessage = { type: 'assistant', content: agentData.message };
        }
      }
      
      dispatch({ type: 'AGENT_RESPONSE_SUCCESS', payload: { newMessage, quizData: quizDataForState }});
      toast.success('Response received!');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add file to state as uploading
    dispatch({ type: 'ADD_FILE_UPLOAD', payload: {
      id: fileId,
      name: file.name,
      status: 'uploading'
    }});

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', session?.user?.email || 'anonymous');
      formData.append('file_type', 'pdf');
      formData.append('subject', 'Learning Material');
      formData.append('description', 'Uploaded via Learning Assistant');

      const response = await fetch('https://b62hc50k-3003.inc1.devtunnels.ms/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      dispatch({ type: 'UPDATE_FILE_UPLOAD', payload: {
        id: fileId,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? result.message : result.detail || 'Upload failed'
      }});

      if (response.ok) {
        dispatch({ type: 'ADD_UPLOADED_FILE', payload: file.name });
        addMessage({ type: 'assistant', content: `✅ **"${file.name}"** has been uploaded successfully! What would you like to explore first?` });
        toast.success(`Successfully uploaded ${file.name}`);
      } else {
        addMessage({ type: 'assistant', content: `⚠️ **Upload Error**: ${result.detail || 'Upload failed'}` });
        toast.error(`Failed to upload ${file.name}: ${result.detail || 'Upload failed'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      dispatch({ type: 'UPDATE_FILE_UPLOAD', payload: {
        id: fileId,
        status: 'error',
        message: errorMessage
      }});
      addMessage({ type: 'assistant', content: `⚠️ **Upload Error**: ${errorMessage}` });
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && file.type === 'application/pdf') {
          e.preventDefault();
          handleFileUpload(file);
          toast.success('PDF file detected from clipboard and uploaded!');
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !socket) return;
    
    let messageToSend = input;
    if (chatMode === 'video') messageToSend = `${input} generate video`;
    if (chatMode === 'mindmap') messageToSend = `${input} generate mindmap`;
    
    addMessage({ type: 'user', content: input });
    socket.emit('user_message', { id: currentUserId, message: messageToSend });
    setInput('');
  };

  const handleQuizSubmit = (quizId: string, answers: string[]) => {
    if (!socket) return toast.error("Not connected.");
    dispatch({ type: 'SET_LOADING', payload: true });
    socket.emit('quiz_submit', { quiz_id: quizId, answers, user_id: currentUserId });
  };
  
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <main className="flex-1 flex flex-col transition-all duration-300">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold">Learning Assistant</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}>
               <PanelRightOpen className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
            {messages.map((message) => <ChatMessageBubble key={message.id} message={message} />)}
            {currentTask && <ThinkingIndicator task={currentTask} />}
            {currentQuiz && <QuizInterface quiz={currentQuiz} onSubmit={handleQuizSubmit} isLoading={isLoading} />}
          </div>
        </ScrollArea>

        <footer className="p-4 bg-background/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <div className="absolute top-[-50px] left-0 right-0 flex justify-center">
                <ChatModeSelector selectedMode={chatMode} onModeChange={setChatMode} />
            </div>
            <div className="relative flex items-center p-2 border rounded-lg bg-background shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                {fileUploads.some(f => f.status === 'uploading') ? (
                  <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-500" />
                )}
              </Button>
              {fileUploads.some(f => f.status === 'uploading') && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
              <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} accept=".pdf" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... (Ctrl+V to paste PDF)"
                className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
                onPaste={handlePaste}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="rounded-full w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white" onClick={handleSubmit}>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="text-xs text-center text-gray-500 pt-2">
                Ready to learn from: {uploadedFiles.map((file, i) => <Badge key={i} variant="secondary" className="mx-1">{file}</Badge>)}
              </div>
            )}
            {fileUploads.length > 0 && (
              <div className="text-xs text-center text-gray-500 pt-2">
                Recent uploads: {fileUploads.map((file, i) => (
                  <Badge key={i} variant={file.status === 'success' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="mx-1">
                    {file.name} ({file.status})
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {isRightSidebarOpen && (
           <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 flex flex-col"
            >
             <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setRightSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
             </div>
             <div className="flex-1 p-4 text-center text-gray-500">
                <p>Future content will appear here.</p>
             </div>
           </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Child Components ---

const ChatMessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const router = useRouter();

  const handleMindmapView = (mindmapData: any) => {
    try {
      localStorage.setItem('latestMindmap', JSON.stringify(mindmapData));
      router.push('/mindmap/view');
    } catch (error) {
      console.error("Failed to save mindmap to local storage", error);
      toast.error("Could not open mindmap view.");
    }
  };

  const renderContent = () => {
    // Check for mindmap placeholder and if data exists
    if (message.content.includes('<MINDMAP_BUTTON />') && message.data?.mindmapData) {
      const parts = message.content.split('<MINDMAP_BUTTON />');
      return (
        <>
          <MarkdownContent content={parts[0]} />
          <MindmapButton onClick={() => handleMindmapView(message.data.mindmapData)} />
          {parts[1] && <MarkdownContent content={parts[1]} />}
        </>
      );
    }

    // Check for video placeholder
    if (message.content.includes('<VIDEO_PLAYER url=')) {
        const videoRegex = /<VIDEO_PLAYER url="([^"]+)" \/>/g;
        const parts = message.content.split(videoRegex);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return <VideoPlayer key={index} url={part} />;
            }
            return <MarkdownContent key={index} content={part} />;
        });
    }
    
    // Default rendering
    return <MarkdownContent content={message.content} />;
  };

  if (isSystem) {
    return (
      <div className="text-center text-sm text-gray-500 my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {message.content}
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] p-3 rounded-2xl ${isUser ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800'}`}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderContent()}
        </div>
      </div>
       {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold">U</span>
        </div>
      )}
    </div>
  );
};

const ThinkingIndicator = ({ task }: { task: CurrentTask }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
      <Bot className="h-4 w-4 text-white" />
    </div>
    <div className="max-w-[80%] p-3 rounded-2xl bg-white dark:bg-gray-800 flex items-center space-x-2">
       <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
       <p className="text-sm text-gray-500 italic">{task.name}</p>
    </div>
  </div>
);

const ChatModeSelector = ({ selectedMode, onModeChange }: { selectedMode: ChatMode; onModeChange: (mode: ChatMode) => void; }) => {
  const modes = [
    { id: 'explain' as ChatMode, icon: Brain, label: 'Explain' },
    { id: 'video' as ChatMode, icon: Video, label: 'Video' },
    { id: 'mindmap' as ChatMode, icon: Map, label: 'Mind Map' },
  ];
  return (
    <Card className="p-1 flex space-x-1 rounded-lg shadow-md bg-background/80 backdrop-blur-md">
      {modes.map(mode => (
        <Button
          key={mode.id}
          variant={selectedMode === mode.id ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onModeChange(mode.id)}
          className="flex items-center space-x-2"
        >
          <mode.icon className={`h-4 w-4 ${selectedMode === mode.id ? 'text-blue-500' : 'text-gray-500'}`} />
          <span>{mode.label}</span>
        </Button>
      ))}
    </Card>
  );
};

const VideoPlayer = ({ url }: { url: string }) => (
  <div className="my-2 rounded-lg overflow-hidden border dark:border-gray-700">
    <video src={url} controls className="w-full" />
    <div className="p-2 bg-gray-50 dark:bg-gray-800/50">
       <Button variant="ghost" size="sm" asChild>
          <a href={url} download target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download Video</span>
          </a>
       </Button>
    </div>
  </div>
);

const MindmapButton = ({ onClick }: { onClick: () => void }) => (
  <div className="my-2">
    <Button onClick={onClick} className="bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-semibold flex items-center space-x-2 shadow-lg">
      <Brain className="h-5 w-5" />
      <span>View Interactive Mind Map</span>
    </Button>
  </div>
);