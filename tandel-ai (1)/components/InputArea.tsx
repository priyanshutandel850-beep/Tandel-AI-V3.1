import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import { generateImage } from '../services/imageService';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onOpenCamera: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading, onOpenCamera }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenMode, setImageGenMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Handle outside click for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        newAttachments.push({
          file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          base64,
          mimeType: file.type
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      setIsMenuOpen(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (isLoading) return;
    
    // If image generation mode is active and we have text
    if (imageGenMode && text.trim()) {
      await handleGenerateImage();
      return;
    }
    
    // Normal send
    if (text.trim() || attachments.length > 0) {
      onSendMessage(text, attachments);
      setText('');
      setAttachments([]);
      setImageGenMode(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleImageGenMode = () => {
    setImageGenMode(!imageGenMode);
    if (!imageGenMode) {
      // Focus on textarea when activating image gen mode
      textareaRef.current?.focus();
    }
  };

  const handleGenerateImage = async () => {
    if (!text.trim() || isGeneratingImage || isLoading) return;
    
    const promptText = text.trim();
    setIsGeneratingImage(true);
    
    try {
      const result = await generateImage(promptText);
      
      if (result.success && result.url) {
        // Fetch the image and convert to File
        const response = await fetch(result.url);
        const blob = await response.blob();
        const file = new File([blob], 'generated-image.jpg', { type: 'image/jpeg' });
        
        // Create attachment
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const attachment: Attachment = {
          file,
          previewUrl: URL.createObjectURL(file),
          base64,
          mimeType: 'image/jpeg'
        };
        
        // Send with special marker to show only image output, no AI processing
        onSendMessage(`[IMAGE_OUTPUT]${promptText}`, [attachment]);
        setText('');
        setAttachments([]);
        setImageGenMode(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      } else {
        alert('Failed to generate image. Please try again.');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-1.5 sm:px-4 pb-4 sm:pb-4 input-container overflow-hidden" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      {/* RGB Border Container */}
      <div className="relative rounded-[24px] sm:rounded-[28px] p-[2px] bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-gradient-rotate overflow-hidden">
        <div className="relative flex flex-col w-full bg-[#f4f4f4] dark:bg-[#2f2f2f] hacker:bg-[--hacker-input] rounded-[22px] sm:rounded-[26px] p-1.5 sm:p-2">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-3 px-3 pt-2 pb-1 overflow-x-auto">
            {attachments.map((att, index) => (
              <div key={index} className="relative group flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hacker:border-green-500/20 bg-white dark:bg-gray-800 hacker:bg-green-500/5">
                {att.previewUrl ? (
                   <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 uppercase">{att.file.name.split('.').pop()}</div>
                )}
                <button 
                  onClick={() => removeAttachment(index)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Controls Row */}
        <div className="flex items-end gap-0.5 sm:gap-2 px-0.5 sm:px-2 overflow-hidden">
            
            {/* Attach Button */}
            <div className="pb-1.5 flex-shrink-0">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 sm:p-2 text-gray-500 dark:text-gray-400 hacker:text-green-400 active:text-gray-900 dark:active:text-gray-100 hacker:active:text-green-300 active:bg-gray-200 dark:active:bg-gray-700/50 hacker:active:bg-green-500/10 rounded-full transition-all touch-manipulation"
                    title="Add attachment"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                         <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                         <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            {/* Generate Image Button - Next to + button */}
            <div className="pb-1.5 flex-shrink-0">
                <button
                    onClick={toggleImageGenMode}
                    disabled={isGeneratingImage || isLoading}
                    className={`p-1 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation ${
                    imageGenMode
                        ? 'bg-purple-100 dark:bg-purple-900/30 hacker:bg-green-500/20 text-purple-600 dark:text-purple-400 hacker:text-green-400 ring-2 ring-purple-500 dark:ring-purple-400 hacker:ring-green-500' 
                        : isGeneratingImage || isLoading
                        ? 'text-gray-400 dark:text-gray-600 hacker:text-green-800 cursor-not-allowed'
                        : 'text-purple-600 dark:text-purple-400 hacker:text-green-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hacker:hover:bg-green-500/10'
                    }`}
                    title={imageGenMode ? "Image generation mode active - Type prompt and send" : "Click to activate image generation mode"}
                >
                    {isGeneratingImage ? (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    )}
                </button>
            </div>

            {/* Attachment Menu */}
            <div className="relative pb-1.5" ref={menuRef}>

                {isMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#2f2f2f] hacker:bg-[--hacker-sidebar] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 hacker:border-[--hacker-border] overflow-hidden z-50 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button 
                        onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 hacker:hover:bg-green-500/10 flex items-center gap-3 text-gray-700 dark:text-gray-200 hacker:text-green-400 transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 15H14V17H6V15Z" fill="currentColor"/><path d="M10 3V13M10 3L7 6M10 3L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Upload file
                        </button>
                        <button 
                        onClick={() => { imageInputRef.current?.click(); setIsMenuOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 hacker:hover:bg-green-500/10 flex items-center gap-3 text-gray-700 dark:text-gray-200 hacker:text-green-400 transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="7" cy="9" r="1.5" fill="currentColor"/><path d="M11 10L14 7L17 12H9L11 10Z" fill="currentColor"/></svg>
                            Upload image
                        </button>
                        <button 
                        onClick={() => { setIsMenuOpen(false); onOpenCamera(); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 hacker:hover:bg-green-500/10 flex items-center gap-3 text-gray-700 dark:text-gray-200 hacker:text-green-400 transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 7H16V15H4V7Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7L8.5 5H11.5L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                            Capture photo
                        </button>
                    </div>
                )}
            </div>

            {/* Text Area */}
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={imageGenMode ? "Describe the image you want to generate..." : "Message Tandel AI..."}
                rows={1}
                className="flex-1 min-w-0 max-h-[200px] py-3 sm:py-3.5 px-1 bg-transparent border-0 focus:ring-0 resize-none outline-none text-gray-900 dark:text-white hacker:text-green-400 placeholder-gray-500 dark:placeholder-gray-400 hacker:placeholder-green-600 text-base hacker:font-mono touch-manipulation"
            />

            {/* Voice Input Button */}
            <div className="pb-1.5 flex-shrink-0">
                <button
                    onClick={toggleVoiceInput}
                    disabled={isLoading || isGeneratingImage}
                    className={`p-1 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 touch-manipulation ${
                    isListening
                        ? 'bg-red-100 dark:bg-red-900/30 hacker:bg-red-500/20 text-red-600 dark:text-red-400 hacker:text-red-400 ring-2 ring-red-500 animate-pulse' 
                        : isLoading || isGeneratingImage
                        ? 'text-gray-400 dark:text-gray-600 hacker:text-green-800 cursor-not-allowed'
                        : 'text-blue-600 dark:text-blue-400 hacker:text-green-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 hacker:hover:bg-green-500/10'
                    }`}
                    title={isListening ? "Listening... Click to stop" : "Click to speak"}
                >
                    {isListening ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="2"></rect>
                            <rect x="14" y="4" width="4" height="16" rx="2"></rect>
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    )}
                </button>
            </div>

            {/* Send Button */}
            <div className="pb-1.5 flex-shrink-0">
                {(text.trim() || attachments.length > 0) && !isLoading ? (
                  <div className="relative rounded-full p-[2px] bg-gradient-to-r from-red-500 via-green-500 to-blue-500 animate-gradient-rotate">
                    <button
                        onClick={handleSend}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gray-900 dark:bg-white hacker:bg-green-500 text-white dark:text-black hacker:text-black hover:opacity-90 transition-all duration-200"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                    </button>
                  </div>
                ) : (
                  <button
                      onClick={handleSend}
                      disabled={true}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-gray-300 dark:bg-[#424242] hacker:bg-green-900/30 text-white dark:text-[#2f2f2f] hacker:text-green-800 cursor-not-allowed transition-all duration-200"
                  >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5"></line>
                          <polyline points="5 12 12 5 19 12"></polyline>
                      </svg>
                  </button>
                )}
            </div>
        </div>

        {/* Hidden Inputs */}
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
        <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
        </div>
      </div>
      
      <div className="text-center mt-2 sm:mt-3 mb-1">
        {imageGenMode ? (
          <p className="text-xs text-purple-600 dark:text-purple-400 hacker:text-green-400 hacker:font-mono font-medium">
            🎨 Image Generation Mode Active - Type your prompt and press send
          </p>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 hacker:text-green-600 hacker:font-mono">
            Tandel AI can make mistakes. Check important info.
          </p>
        )}
      </div>
    </div>
  );
};

export default InputArea;