"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    // ...existing code...
<div className={className}>
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
      h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
      p: ({ children }) => <p className="mb-2">{children}</p>,
      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
      li: ({ children }) => <li className="mb-1">{children}</li>,
      code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>,
      pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto mb-2">{children}</pre>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2">{children}</blockquote>,
    }}
  >
    {content}
  </ReactMarkdown>
</div>
// ...existing code...
  );
}