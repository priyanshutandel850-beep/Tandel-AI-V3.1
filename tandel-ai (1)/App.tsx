
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import CameraModal from './components/CameraModal';
import AuthModal from './components/AuthModal';
import ShareModal from './components/ShareModal';
import { Message, Role, Attachment, ChatSession, UserProfile } from './types';
import { streamGeminiResponse, generateTitle } from './services/geminiService';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'hacker'>('dark');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Sessions from LocalStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('tandel_sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // Save Sessions to LocalStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('tandel_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Load Messages for current session
  const isLoadingSession = useRef(false);
  
  useEffect(() => {
    // Don't reload messages if we're in the middle of sending a message
    if (isLoadingSession.current) {
      isLoadingSession.current = false;
      return;
    }
    
    if (currentSessionId) {
      const savedMessages = localStorage.getItem(`tandel_msg_${currentSessionId}`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          setMessages([]);
        }
      } else {
        // Only clear messages if we're switching to a different session
        // Don't clear if this is a new session being created
        if (messages.length === 0) {
          setMessages([]);
        }
      }
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  // Save Messages to LocalStorage
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`tandel_msg_${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  // Theme toggle
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'hacker');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'hacker') {
      document.documentElement.classList.add('hacker');
    }
  }, [theme]);

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'hacker';
      return 'light';
    });
  };

  // Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const createNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    localStorage.removeItem(`tandel_msg_${id}`);
    if (currentSessionId === id) {
      createNewChat();
    }
  };

  const handlePinSession = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, pinned: !s.pinned } : s
    ));
  };

  const handleRenameSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    
    const newTitle = window.prompt("Enter new chat name:", session.title);
    if (newTitle && newTitle.trim()) {
      setSessions(prev => prev.map(s => 
        s.id === id ? { ...s, title: newTitle.trim() } : s
      ));
    }
  };

  const handleCameraCapture = async (file: File) => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    
    const attachment: Attachment = {
      file,
      previewUrl: URL.createObjectURL(file),
      base64,
      mimeType: file.type
    };
    
    handleSendMessage("", [attachment]);
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    // Check if this is image output (show prompt + image, don't send to AI)
    const isImageOutput = text.startsWith('[IMAGE_OUTPUT]');
    const actualText = isImageOutput ? text.replace('[IMAGE_OUTPUT]', '') : text;
    
    // If it's image output, show user's prompt and the generated image
    if (isImageOutput) {
      // Show user's prompt
      const userMsgId = uuidv4();
      const userMessage: Message = {
        id: userMsgId,
        role: Role.USER,
        text: actualText,
        attachments: [],
        timestamp: Date.now()
      };
      
      // Show generated image as AI response
      const outputMsgId = uuidv4();
      const imageOutputMessage: Message = {
        id: outputMsgId,
        role: Role.MODEL,
        text: '', // No text, just image
        attachments: attachments,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage, imageOutputMessage]);
      return; // Don't send to AI
    }
    
    // Normal message flow
    const userMsgId = uuidv4();
    const newUserMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text: actualText,
      attachments: attachments,
      timestamp: Date.now()
    };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    setIsLoading(true);

    // Create session if new
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      isLoadingSession.current = true; // Prevent useEffect from clearing messages
      setCurrentSessionId(sessionId);
      const title = await generateTitle(text || "New Image Chat");
      
      const newSession: ChatSession = {
        id: sessionId!,
        title,
        preview: text.slice(0, 30) + "...",
        updatedAt: Date.now(),
        pinned: false
      };
      
      setSessions(prev => [newSession, ...prev]);
      
      // Immediately save new session msg to LS
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      localStorage.setItem(`tandel_msg_${sessionId}`, JSON.stringify([lastMessage]));
    }

    const botMsgId = uuidv4();
    const initialBotMessage: Message = {
      id: botMsgId,
      role: Role.MODEL,
      text: '',
      isStreaming: true,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, initialBotMessage]);

    try {
      const history = updatedMessages.map(m => ({
        role: m.role === Role.USER ? 'user' : 'model',
        parts: [{ text: m.text }] 
      }));

      await streamGeminiResponse(
        actualText, 
        attachments, 
        history, 
        (chunkText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: chunkText } : msg
          ));
        }
      );
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: "**Error:** Failed to generate response. Please try again." } : msg
      ));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  const openLogin = () => {
    setAuthView('login');
    setIsAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthView('signup');
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
     await signOut(auth);
  };

  const handleShare = (sessionId?: string) => {
    setShareUrl(window.location.href);
    setIsShareModalOpen(true);
  };

  // Sort sessions: Pinned first, then by date descending
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] hacker:bg-[--hacker-bg]" style={{ height: '100dvh' }}>
      <Sidebar 
        sessions={sortedSessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewChat}
        onSelectSession={handleSelectSession}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        onSignIn={openLogin}
        onSignOut={handleSignOut}
        onShare={handleShare}
        onDeleteSession={handleDeleteSession}
        onPin={handlePinSession}
        onRename={handleRenameSession}
      />

      <main className="flex-1 flex flex-col h-full relative bg-white dark:bg-[#212121] hacker:bg-[--hacker-bg] transition-colors overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 flex-shrink-0 z-10 border-b border-gray-200 dark:border-white/5 hacker:border-[--hacker-border]">
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-500 active:text-gray-700 dark:text-gray-400 dark:active:text-gray-200 hacker:text-green-400 hacker:active:text-green-300 rounded-lg active:bg-gray-100 dark:active:bg-white/5 hacker:active:bg-green-500/10 transition-colors touch-manipulation"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg active:bg-gray-100 dark:active:bg-[#2f2f2f] hacker:active:bg-green-500/10 transition-colors text-gray-700 dark:text-gray-200 hacker:text-green-400 font-medium text-base sm:text-lg touch-manipulation">
              <span className="hacker:font-mono">Tandel AI</span> <span className="opacity-50">2.5</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
             {/* Share Button */}
             <button 
               onClick={() => handleShare(currentSessionId || undefined)}
               className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hacker:text-green-400 hacker:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] hacker:hover:bg-green-500/10 rounded-lg transition-colors"
               title="Share chat"
             >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                 <polyline points="16 6 12 2 8 6"></polyline>
                 <line x1="12" y1="2" x2="12" y2="15"></line>
               </svg>
             </button>

             <button 
              onClick={cycleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hacker:text-green-400 hacker:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] hacker:hover:bg-green-500/10 rounded-lg transition-colors"
              title={`Theme: ${theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Hacker'}`}
            >
              {theme === 'light' ? (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : theme === 'dark' ? (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              )}
            </button>

             {!user && (
               <>
                <button 
                  onClick={openLogin}
                  className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hacker:text-green-400 hover:bg-gray-100 dark:hover:bg-[#2f2f2f] hacker:hover:bg-green-500/10 rounded-lg transition-colors"
                >
                    Log in
                </button>
                <button 
                  onClick={openSignup}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white hacker:bg-green-500 text-white dark:text-black hacker:text-black rounded-lg hover:opacity-90 transition-opacity"
                >
                    Sign up
                </button>
               </>
             )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth overscroll-contain pb-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 text-center">
              <div className="mb-8 p-4 bg-white dark:bg-white/5 hacker:bg-green-500/10 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/5 hacker:ring-green-500/20">
                 <span className="text-4xl hacker:text-green-400">◎</span>
              </div>
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white hacker:text-green-400 mb-8 hacker:font-mono">What can I help with?</h2>
              
              {/* Suggestion Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full px-4 sm:px-0">
                  {['Summarize a complex document', 'Generate creative story ideas', 'Explain complex code', 'Draft a professional email'].map((suggestion, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleSendMessage(suggestion, [])}
                        className="p-2.5 sm:p-3 text-left text-sm text-gray-600 dark:text-gray-300 hacker:text-green-400 border border-gray-200 dark:border-white/10 hacker:border-green-500/20 rounded-lg sm:rounded-xl active:bg-gray-50 dark:active:bg-white/5 hacker:active:bg-green-500/10 transition-colors touch-manipulation"
                      >
                          {suggestion}
                      </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col pb-4 pt-4">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== Role.MODEL && (
                <div className="w-full max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 hacker:text-green-400">
                       <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 hacker:border-green-500/20 flex items-center justify-center bg-white dark:bg-transparent hacker:bg-transparent">
                           <span className="text-sm animate-spin">◎</span>
                       </div>
                       <span className="text-sm hacker:font-mono terminal-cursor">Tandel AI is thinking</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area Container */}
        <div className="flex-shrink-0 sticky bottom-0 bg-white dark:bg-[#212121] hacker:bg-[--hacker-bg] z-20">
           <InputArea 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            onOpenCamera={() => setIsCameraOpen(true)}
           />
        </div>
      </main>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCameraCapture} 
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authView}
      />

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        url={shareUrl} 
      />
    </div>
  );
};

export default App;
