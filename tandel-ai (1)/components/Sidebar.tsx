
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, UserProfile } from '../types';

// --- Search Modal Component ---
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onShare: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, sessions, onSelectSession, onShare, onRename, onDelete, onPin }) => {
  const [query, setQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(s => {
    if (!query) return true;
    const q = query.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q);
  }).slice(0, 8);

  const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <span className="text-gray-200">{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span className="text-gray-200">
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <span key={i} className="text-white font-bold underline decoration-red-500 decoration-2 underline-offset-2">{part}</span> 
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" style={{ pointerEvents: 'auto' }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-[#1e1e1e] hacker:bg-[--hacker-sidebar] w-full max-w-2xl rounded-xl shadow-2xl border border-gray-800 hacker:border-[--hacker-border] overflow-hidden relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-gray-800 hacker:border-[--hacker-border]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 hacker:text-green-400 mr-3">
             <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white hacker:text-green-400 placeholder-gray-500 hacker:placeholder-green-600 text-lg hacker:font-mono"
            placeholder="Search chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-xs text-gray-400 hacker:text-green-400 hover:text-white hacker:hover:text-green-300 transition-colors bg-gray-800 hacker:bg-green-500/10 px-2 py-1 rounded ml-2 border border-gray-700 hacker:border-[--hacker-border]">ESC</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2 min-h-[300px]">
          {filteredSessions.length > 0 ? (
            <>
               <div className="px-4 py-2 text-xs font-medium text-gray-500 hacker:text-green-600 uppercase tracking-wider hacker:font-mono">
                  {query ? 'Search Results' : 'Recent'}
               </div>
               {filteredSessions.map(session => (
                <div
                  key={session.id}
                  className="relative group w-full px-4 py-3 flex items-start gap-4 hover:bg-[#2a2a2a] hacker:hover:bg-green-500/10 transition-colors border-l-2 border-transparent hover:border-blue-500 hacker:hover:border-green-500 cursor-pointer"
                  onClick={() => { onSelectSession(session.id); onClose(); }}
                >
                  <div className="mt-1 text-gray-400 hacker:text-green-500 group-hover:text-white hacker:group-hover:text-green-400 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base truncate text-white hacker:text-green-400 flex items-center gap-2 hacker:font-mono">
                       <HighlightText text={session.title} highlight={query} />
                       {session.pinned && <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500"><path d="M16 5h.99L17 3H7v2h1v7l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2V5z"></path></svg>}
                    </div>
                    <div className="text-gray-500 hacker:text-green-600 text-sm truncate mt-0.5">
                       <HighlightText text={session.preview} highlight={query} />
                    </div>
                  </div>
                  
                  {/* Kebab Menu Button */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={`p-1.5 rounded-md hover:bg-gray-700 hacker:hover:bg-green-500/20 text-gray-400 hacker:text-green-400 hover:text-white hacker:hover:text-green-300 transition-colors ${activeMenuId === session.id ? 'opacity-100 bg-gray-700 hacker:bg-green-500/20 text-white hacker:text-green-300' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === session.id ? null : session.id);
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === session.id && (
                      <div ref={menuRef} className="absolute right-0 top-full mt-1 w-56 bg-[#2f2f2f] hacker:bg-[--hacker-sidebar] rounded-xl shadow-xl border border-gray-700 hacker:border-[--hacker-border] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => { onShare(session.id); setActiveMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hacker:text-green-400 hover:bg-[#3f3f3f] hacker:hover:bg-green-500/10 flex items-center gap-3 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                          Share conversation
                        </button>
                        <button 
                          onClick={() => { onPin(session.id); setActiveMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hacker:text-green-400 hover:bg-[#3f3f3f] hacker:hover:bg-green-500/10 flex items-center gap-3 transition-colors"
                        >
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                           {session.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button 
                          onClick={() => { onRename(session.id); setActiveMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hacker:text-green-400 hover:bg-[#3f3f3f] hacker:hover:bg-green-500/10 flex items-center gap-3 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          Rename
                        </button>
                        <button 
                          onClick={() => { onDelete(session.id); setActiveMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hacker:text-red-400 hover:bg-[#3f3f3f] hacker:hover:bg-red-500/10 flex items-center gap-3 transition-colors border-t border-gray-700 hacker:border-[--hacker-border]"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-4 py-12 text-center">
               <div className="text-gray-500 hacker:text-green-600 text-sm mb-2 hacker:font-mono">No chats found matching "{query}"</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  user: UserProfile | null;
  onSignOut: () => void;
  onSignIn: () => void;
  onShare: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession,
  isOpen,
  toggleSidebar,
  user,
  onSignOut,
  onSignIn,
  onShare,
  onDeleteSession,
  onPin,
  onRename
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  return (
    <>
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        sessions={sessions} 
        onSelectSession={onSelectSession}
        onShare={onShare}
        onDelete={onDeleteSession}
        onRename={onRename}
        onPin={onPin}
      />

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-[260px] bg-[#f9f9f9] dark:bg-[#171717] hacker:bg-[--hacker-sidebar] flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          border-r border-gray-200 dark:border-white/5 hacker:border-[--hacker-border]
        `}
      >
        {/* Header */}
        <div className="p-3 flex-none">
          <div className="flex justify-between items-center mb-4 px-2 md:hidden">
             <span className="font-semibold text-gray-700 dark:text-gray-200 hacker:text-green-400 hacker:font-mono">Menu</span>
             <button onClick={toggleSidebar} className="text-gray-500 hacker:text-green-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#212121] hacker:hover:bg-green-500/10 transition-colors text-sm text-gray-700 dark:text-gray-100 hacker:text-green-400 text-left group"
          >
            <div className="p-1 bg-transparent rounded-full border border-gray-300 dark:border-white/20 hacker:border-green-500/20 group-hover:border-gray-400 dark:group-hover:border-white/40 hacker:group-hover:border-green-500/40 transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>
            <span className="font-medium">New chat</span>
            <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 flex flex-col gap-1">
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#212121] hacker:hover:bg-green-500/10 text-sm text-gray-700 dark:text-gray-200 hacker:text-green-400 transition-colors w-full text-left"
            >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M9 3H11V17H9V3Z" fill="currentColor"/>
                    <path d="M3 9H17V11H3V9Z" fill="currentColor"/>
                </svg>
                Search chats
            </button>
        </nav>

        {/* Recent Chats List */}
        <div className="flex-1 overflow-y-auto px-3 py-4" ref={sidebarMenuRef}>
          <div className="text-xs font-semibold text-gray-500 hacker:text-green-600 mb-3 px-3 hacker:font-mono">Recent conversations</div>
          <div className="space-y-0.5">
            {sessions.map(session => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm relative
                    ${currentSessionId === session.id 
                      ? 'bg-gray-200 dark:bg-[#212121] hacker:bg-green-500/10 text-gray-900 dark:text-white hacker:text-green-400' 
                      : 'text-gray-700 dark:text-gray-300 hacker:text-green-500 hover:bg-gray-100 dark:hover:bg-[#212121] hacker:hover:bg-green-500/5'
                    }`}
                >
                  <span className="truncate relative z-10 flex-1 pr-6">{session.title}</span>
                </button>
                
                {/* Kebab Menu Trigger */}
                <button 
                   className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 hacker:hover:bg-green-500/20 text-gray-500 dark:text-gray-400 hacker:text-green-400 transition-opacity ${activeMenuId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     setActiveMenuId(activeMenuId === session.id ? null : session.id);
                   }}
                >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                </button>

                {/* Sidebar Dropdown Menu */}
                {activeMenuId === session.id && (
                   <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#2f2f2f] hacker:bg-[--hacker-sidebar] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hacker:border-[--hacker-border] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onShare(session.id); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hacker:text-green-400 hover:bg-gray-100 dark:hover:bg-[#3f3f3f] hacker:hover:bg-green-500/10 flex items-center gap-2 transition-colors"
                      >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                         Share
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPin(session.id); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hacker:text-green-400 hover:bg-gray-100 dark:hover:bg-[#3f3f3f] hacker:hover:bg-green-500/10 flex items-center gap-2 transition-colors"
                      >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                         {session.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRename(session.id); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hacker:text-green-400 hover:bg-gray-100 dark:hover:bg-[#3f3f3f] hacker:hover:bg-green-500/10 flex items-center gap-2 transition-colors"
                      >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                         Rename
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); setActiveMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hacker:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3f3f3f] hacker:hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-gray-200 dark:border-gray-700 hacker:border-[--hacker-border]"
                      >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                      </button>
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-white/10 relative">
          {user ? (
            <div className="relative">
              {showUserMenu && (
                 <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[#2f2f2f] hacker:bg-[--hacker-sidebar] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hacker:border-[--hacker-border] overflow-hidden py-1 z-50">
                    <button onClick={onSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hacker:text-red-400 hover:bg-gray-100 dark:hover:bg-white/5 hacker:hover:bg-red-500/10 transition-colors flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Log out
                    </button>
                 </div>
              )}
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#212121] hacker:hover:bg-green-500/10 cursor-pointer transition-colors"
              >
                {user.photoURL ? (
                   <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                   <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-medium">
                     {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                   </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white hacker:text-green-400 truncate">{user.displayName || 'User'}</span>
                  <span className="text-xs text-gray-500 hacker:text-green-600 truncate">{user.email}</span>
                </div>
              </div>
            </div>
          ) : (
             <div 
                onClick={onSignIn}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#212121] hacker:hover:bg-green-500/10 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-xs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white hacker:text-green-400">Log in / Sign up</span>
                </div>
              </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
