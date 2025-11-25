import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Role } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.text && message.text.trim()) {
      navigator.clipboard.writeText(message.text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  };

  const handleCopyCode = (e: React.MouseEvent, code: string, lang: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(lang);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(err => {
      console.error('Failed to copy code:', err);
    });
  };

  const handleDownloadImage = (e: React.MouseEvent, imageUrl: string, index: number) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full py-2 sm:py-3 md:py-4 ${isUser ? '' : ''}`}>
      <div className={`max-w-3xl mx-auto px-3 sm:px-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        
        <div className={`relative group max-w-[90%] sm:max-w-[85%] md:max-w-[75%] ${isUser ? 'bg-[#f4f4f4] dark:bg-[#2f2f2f] hacker:bg-[--hacker-input] hacker:border hacker:border-[--hacker-border] text-gray-900 dark:text-gray-100 hacker:text-green-400 rounded-[20px] sm:rounded-[26px] px-3 sm:px-5 py-2 sm:py-2.5' : 'text-gray-900 dark:text-gray-100 hacker:text-green-400 px-1'}`}>
          
          {/* Copy Button - Only show if there's text */}
          {message.text && message.text.trim().length > 0 && (
            <button
              onClick={handleCopyMessage}
              className={`absolute ${isUser ? 'top-2 right-2' : 'top-10 right-1'} p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 hacker:bg-green-500/20 hover:bg-gray-300 dark:hover:bg-gray-600 hacker:hover:bg-green-500/30 text-gray-600 dark:text-gray-300 hacker:text-green-400 transition-all opacity-0 group-hover:opacity-100 z-10`}
              title="Copy message"
            >
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          )}
          
          {/* Model Icon for AI messages */}
          {!isUser && (
             <div className="mb-3 w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 hacker:border-green-500/20 flex items-center justify-center bg-white dark:bg-transparent hacker:bg-transparent text-gray-900 dark:text-white hacker:text-green-400 shadow-sm">
                <span className="font-semibold text-sm">◎</span>
             </div>
          )}

          <div className={`prose dark:prose-invert max-w-none prose-p:leading-7 prose-pre:p-0 prose-pre:bg-transparent ${isUser ? 'text-base' : 'text-base'}`}>
             {/* Attachments Rendering */}
             {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-2">
                {message.attachments.map((att, i) => (
                  <div key={i} className="relative group/image rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 hacker:border-green-500/20 max-w-full sm:max-w-[400px]">
                    <img src={att.previewUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[300px] sm:max-h-[400px]" />
                    
                    {/* Download Button - Shows on hover */}
                    <button
                      onClick={(e) => handleDownloadImage(e, att.previewUrl, i)}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-all opacity-0 group-hover/image:opacity-100"
                      title="Download image"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUser ? (
              <div className="whitespace-pre-wrap break-words hacker:font-mono">{message.text}</div>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    return !inline && match ? (
                      <div className="rounded-lg overflow-hidden my-4 border border-gray-200 dark:border-white/10 hacker:border-green-500/20 bg-[#0d0d0d] hacker:bg-black">
                        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 hacker:text-green-500 bg-white/5 hacker:bg-green-500/5 border-b border-white/5 hacker:border-green-500/10">
                          <span className="font-mono">{match[1]}</span>
                          <button 
                            onClick={(e) => handleCopyCode(e, codeString, match[1])}
                            className="hover:text-white hacker:hover:text-green-300 transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 hacker:hover:bg-green-500/20"
                          >
                            {copiedCode === match[1] ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '1rem', borderRadius: 0, background: 'transparent' }}
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={`${className} bg-gray-100 dark:bg-[#2f2f2f] hacker:bg-green-500/10 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200 hacker:text-green-400`} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;