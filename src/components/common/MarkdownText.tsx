import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * MarkdownText - Renders text with Markdown support
 * 
 * Supports:
 * - Headings: # H1, ## H2, ### H3
 * - Bold: **bold** or __bold__
 * - Italic: *italic* or _italic_
 * - Lists: - item or * item
 * - Line breaks: Double space at end of line or blank line
 * - Links: [text](url)
 * - Code: `code`
 */
export function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  if (!children || children.trim() === '') {
    return null;
  }

  return (
    <div className={className}>
      <ReactMarkdown
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold text-[#535146] mb-2 mt-3 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-[#535146] mb-2 mt-3 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-[#535146] mb-2 mt-2 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-[#535146] mb-1 mt-2 first:mt-0">
            {children}
          </h4>
        ),
        
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">
            {children}
          </p>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="ml-0">
            {children}
          </li>
        ),
        
        // Emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-[#535146]">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c96442] underline hover:text-[#a84f35] transition-colors"
          >
            {children}
          </a>
        ),
        
        // Code
        code: ({ children }) => (
          <code className="bg-[#f4f4f5] px-1.5 py-0.5 rounded text-sm font-mono text-[#535146]">
            {children}
          </code>
        ),
        
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-[#e4e4e7] pl-4 italic text-[#83827d] my-2">
            {children}
          </blockquote>
        ),
        
        // Line break
        br: () => <br />,
      }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
