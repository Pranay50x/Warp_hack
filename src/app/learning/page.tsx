"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Bot, Moon, Sun, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/file-upload';
import { Message } from '@/components/message';
import { QuizInterface } from '@/components/quiz-interface';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'Hello! I\'m your AI Learning Assistant. Upload a PDF document to get started, and I\'ll help you understand, learn, and test your knowledge on the content. I can explain concepts, generate study questions, create quizzes, find additional resources, and provide motivation!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

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
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Backend connection successful:', result);
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      toast.error('Cannot connect to learning backend. Please make sure the API server is running on port 8000.');
      return false;
    }
  };

  useEffect(() => {
    // Test backend connection on component mount
    testBackendConnection();
  }, []);

  const handleFileUpload = async (file: File) => {
    console.log('Starting file upload...', file.name);
    
    // Test backend connection first
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('chunk_size', '500');
    formData.append('overlap', '50');

    try {
      console.log('Uploading to:', `${API_BASE_URL}/ingest_pdf`);
      
      const response = await fetch(`${API_BASE_URL}/ingest_pdf`, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.status === 'success') {
        setUploadedFiles(prev => [...prev, result.pdf]);
        addMessage({
          type: 'assistant',
          content: `Perfect! I've successfully processed "${result.pdf}" and created ${result.chunks} knowledge chunks from it. Now I can help you understand the content, generate study questions, create quizzes, and much more. What would you like to explore first?`,
        });
        toast.success(`PDF processed successfully! ${result.chunks} chunks created.`);
      } else {
        addMessage({
          type: 'assistant',
          content: `I encountered an error while processing your PDF: ${result.message}. Please try uploading the file again or check if it's a valid PDF document.`,
        });
        toast.error(`Failed to process PDF: ${result.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to the learning backend. Please ensure the API server is running on port 8000.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      addMessage({
        type: 'assistant',
        content: `I'm having trouble connecting to my processing system: ${errorMessage}. Please make sure the backend server is running and try again.`,
      });
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const determineIntent = (userInput: string): { agent: string; confidence: number } => {
    const input = userInput.toLowerCase();
    
    // Quiz-related keywords
    if (input.includes('quiz') || input.includes('test') || input.includes('mcq') || 
        input.includes('multiple choice') || input.includes('exam')) {
      return { agent: 'quiz_agent', confidence: 0.9 };
    }
    
    // Question generation keywords
    if (input.includes('question') || input.includes('study guide') || 
        input.includes('what should i know') || input.includes('important points')) {
      return { agent: 'question_agent', confidence: 0.8 };
    }
    
    // Resource finding keywords
    if (input.includes('resource') || input.includes('additional') || input.includes('more info') ||
        input.includes('external') || input.includes('reference') || input.includes('link')) {
      return { agent: 'resource_curator', confidence: 0.8 };
    }
    
    // Motivation keywords
    if (input.includes('motivat') || input.includes('encourage') || input.includes('help me study') ||
        input.includes('struggling') || input.includes('difficult')) {
      return { agent: 'motivation_agent', confidence: 0.7 };
    }
    
    // Default to concept exploration for explanations and understanding
    return { agent: 'concept_explorer', confidence: 0.6 };
  };

  const callAgent = async (userInput: string) => {
    const intent = determineIntent(userInput);
    const agent = intent.agent;

    // Check if PDF is required for certain agents
    if (!uploadedFiles.length && agent !== 'resource_curator' && agent !== 'motivation_agent') {
      addMessage({
        type: 'assistant',
        content: 'I\'d love to help you with that! However, I need you to upload a PDF document first so I can provide accurate information based on your specific content. Please upload a PDF and then ask me again.',
      });
      toast.error('Please upload a PDF first!');
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = '';
      let payload: any = {};
      let processingMessage = '';

      switch (agent) {
        case 'concept_explorer':
          endpoint = '/concept_explorer';
          payload = { query: userInput, top_k: 8 };
          processingMessage = 'Let me analyze the content and break down this concept for you...';
          break;
        case 'question_agent':
          endpoint = '/question_agent';
          payload = { topic: userInput, num_questions: 5, top_k: 8 };
          processingMessage = 'I\'m generating important study questions based on your document...';
          break;
        case 'quiz_agent':
          endpoint = '/quiz_agent';
          payload = { topic: userInput, num_questions: 3, top_k: 8 };
          processingMessage = 'Creating an interactive quiz for you...';
          break;
        case 'motivation_agent':
          endpoint = '/motivation_agent';
          payload = { user_id: 'user1', quiz_score: null, engagement_data: null };
          processingMessage = 'Let me provide some encouragement and study tips...';
          break;
        case 'resource_curator':
          endpoint = '/resource_curator';
          payload = { topic: userInput, num_resources: 5 };
          processingMessage = 'Searching for additional learning resources...';
          break;
      }

      // Add a processing message
      addMessage({
        type: 'assistant',
        content: processingMessage,
      });

      console.log('Calling endpoint:', `${API_BASE_URL}${endpoint}`);
      console.log('With payload:', payload);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Agent response:', result);

      // Remove the processing message
      setMessages(prev => prev.slice(0, -1));

      if (result.status === 'success') {
        if (agent === 'quiz_agent') {
          setCurrentQuiz(result);
          addMessage({
            type: 'assistant',
            content: `Great! I've created a quiz on "${result.topic}" with ${result.total_questions} questions. Take your time answering each question - I'll provide detailed feedback once you submit your answers.`,
            data: result,
          });
        } else {
          addMessage({
            type: 'assistant',
            content: formatAgentResponse(agent, result, userInput),
            data: result,
          });
        }
        toast.success('Response generated successfully!');
      } else {
        addMessage({
          type: 'assistant',
          content: `I encountered an issue while processing your request: ${result.message}. Please try rephrasing your question or check if your PDF was uploaded correctly.`,
        });
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Agent call error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to the learning backend. Please ensure the API server is running.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Remove the processing message
      setMessages(prev => prev.slice(0, -1));
      addMessage({
        type: 'assistant',
        content: `I'm having trouble processing your request right now: ${errorMessage}. Please check your connection and try again.`,
      });
      toast.error(`Failed to get response: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ...rest of your existing code remains the same...
const formatAgentResponse = (agent: string, result: any, userInput: string): string => {
  switch (agent) {
    case 'concept_explorer':
      return `## Understanding: ${result.topic || userInput}\n\n${result.breakdown}\n\n**Key Areas to Focus On:**\n${result.subtopics ? result.subtopics.map((topic: any) => `• ${topic.name || topic}`).join('\n') : 'No subtopics identified'}\n\nFeel free to ask me to dive deeper into any of these areas or ask for study questions!`;
    
    case 'question_agent':
      return `## Study Questions for "${result.topic || userInput}"\n\nHere are some important questions to help you master this topic:\n\n${result.questions ? result.questions.map((q: any, i: number) => `${i + 1}. ${q.question || q}`).join('\n\n') : 'No questions generated'}\n\nTry answering these questions, and if you'd like, I can create a quiz to test your knowledge!`;
    
    case 'motivation_agent':
      const motivationMessage = result.motivation_message || result.message || 'Keep up the great work!';
      const recommendations = result.recommendations || [];
      return `## 💪 Study Motivation\n\n${motivationMessage}\n\n**Here are some personalized recommendations:**\n${recommendations.map((rec: string) => `• ${rec}`).join('\n')}\n\nRemember, every expert was once a beginner. You've got this! 🌟`;
    
    case 'resource_curator':
      const strategy = result.search_strategy || 'general';
      const contextSummary = result.context_summary || `Found ${result.resources?.length || 0} learning resources`;
      const topic = result.topic || userInput;
      
      let resourceText = `## 🔗 Additional Learning Resources\n\n${contextSummary}\n\n`;
      
      if (strategy === 'pdf_contextual') {
        resourceText += `**Based on your PDF content, I recommend:**\n\n`;
        
        if (result.pdf_based_search_terms && result.pdf_based_search_terms.length > 0) {
          resourceText += `*Search strategy: ${result.pdf_based_search_terms.join(', ')}*\n\n`;
        }
      } else {
        resourceText += `**General learning resources for "${topic}":**\n\n`;
      }
      
      if (!result.resources || result.resources.length === 0) {
        resourceText += "No resources found. Please try a different topic or check your internet connection.";
        return resourceText;
      }
      
      resourceText += result.resources.map((resource: any, i: number) => {
        let resourceEntry = `**${i + 1}. ${resource.title || 'Resource'}** (${resource.type || 'resource'})\n`;
        resourceEntry += `${resource.description || 'No description available'}\n`;
        
        // Add PDF relevance explanation if available
        if (resource.pdf_relevance || resource.why_helpful) {
          resourceEntry += `*💡 Why this helps: ${resource.pdf_relevance || resource.why_helpful}*\n`;
        }
        
        resourceEntry += `[📖 Visit Resource](${resource.url || '#'})`;
        return resourceEntry;
      }).join('\n\n');
      
      // Add identified subtopics if available
      if (result.identified_subtopics && result.identified_subtopics.length > 0) {
        resourceText += `\n\n**Related topics to explore:** ${result.identified_subtopics.join(', ')}`;
      }
      
      return resourceText;
    
    default:
      return JSON.stringify(result, null, 2);
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    addMessage({
      type: 'user',
      content: input,
    });

    callAgent(input);
    setInput('');
  };

  const handleQuizSubmit = async (quizId: string, answers: string[]) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/quiz_submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        const scorePercentage = Math.round((result.correct_answers / result.total_questions) * 100);
        let encouragement = '';
        
        if (scorePercentage >= 90) encouragement = 'Outstanding work! 🎉';
        else if (scorePercentage >= 80) encouragement = 'Great job! 👏';
        else if (scorePercentage >= 70) encouragement = 'Good effort! 👍';
        else encouragement = 'Keep practicing! 💪';

        addMessage({
          type: 'assistant',
          content: `## 📊 Quiz Results - ${encouragement}\n\n**Your Score: ${result.correct_answers}/${result.total_questions}** (${scorePercentage}%)\n\n**Performance Level: ${result.performance}**\n\n### Detailed Review:\n\n${result.detailed_results.map((detail: any, i: number) => 
            `**Question ${i + 1}:** ${detail.is_correct ? '✅ Correct!' : '❌ Incorrect'}\n• Your answer: **${detail.user_answer}**\n• Correct answer: **${detail.correct_answer}**${detail.explanation ? `\n• *${detail.explanation}*` : ''}`
          ).join('\n\n')}\n\n${scorePercentage < 80 ? 'Would you like me to explain any of these concepts in more detail?' : 'Excellent work! Ready for another quiz or want to explore a different topic?'}`,
          data: result,
        });
        
        setCurrentQuiz(null);
        toast.success(`Quiz completed! Score: ${result.correct_answers}/${result.total_questions}`);
      } else {
        toast.error(`Quiz submission failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      toast.error('Failed to submit quiz answers.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-80 md:flex-col border-r bg-muted/30">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Learning Assistant</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-6 space-y-6">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          
          {uploadedFiles.length > 0 && (
            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <h3 className="text-sm font-medium mb-3 flex items-center text-green-800 dark:text-green-200">
                <FileText className="h-4 w-4 mr-2" />
                Ready to Learn
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    📄 {file}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Your documents are processed and ready for learning!
              </p>
            </Card>
          )}

          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">💡 What I can help with:</h3>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Explain complex concepts</li>
              <li>• Generate study questions</li>
              <li>• Create interactive quizzes</li>
              <li>• Find additional resources</li>
              <li>• Provide study motivation</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header for mobile */}
        <div className="md:hidden p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Learning Assistant</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            
            {currentQuiz && (
              <QuizInterface 
                quiz={currentQuiz} 
                onSubmit={handleQuizSubmit} 
                isLoading={isLoading}
              />
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center space-x-3 text-muted-foreground py-8">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Mobile file upload */}
        <div className="md:hidden p-4 border-t space-y-4">
          <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  📄 {file}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t bg-background/95 backdrop-blur">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={uploadedFiles.length > 0 ? "Ask me anything about your document..." : "Upload a PDF first, then ask me anything!"}
                  disabled={isLoading}
                  className="pr-12 py-3 text-base"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="px-6 py-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}