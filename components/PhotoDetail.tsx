import React, { useState, useEffect, useRef } from 'react';
import { Photo } from '../types';
import { X, Send, Sparkles, ChevronRight, Globe, Cpu } from 'lucide-react';

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
  onAsk: (photo: Photo, question: string) => Promise<void>;
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({ photo, onClose, onAsk }) => {
  const [inputValue, setInputValue] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [photo.chatHistory]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isAsking) return;
    
    setIsAsking(true);
    setInputValue('');
    await onAsk(photo, text);
    setIsAsking(false);
  };

  const hasChat = photo.chatHistory.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-[100dvh] font-sans">
      
      {/* Top Bar - Ultra High Z-Index to ensure clickability regardless of overlap */}
      <div className="absolute top-0 left-0 w-full z-[60] flex justify-between items-center p-4 pointer-events-auto">
        <button 
            onClick={onClose} 
            className="group p-3 rounded-full bg-black/80 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-cyan-500/50 transition-all shadow-lg cursor-pointer active:scale-95"
            aria-label="Close"
        >
          <X size={24} className="group-hover:text-cyan-400 transition-colors" />
        </button>
        {photo.isLoadingSuggestions && (
          <div className="flex items-center gap-2 px-4 py-2 bg-black/90 border border-cyan-500/40 backdrop-blur rounded-full shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Cpu size={14} className="text-cyan-400 animate-spin-slow" />
            <span className="text-[10px] text-cyan-200 font-bold uppercase tracking-wider">Analyzing</span>
          </div>
        )}
      </div>

      {/* Main Image Area */}
      <div className={`absolute inset-0 z-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${hasChat ? 'h-[35%] opacity-40' : 'h-full opacity-100'}`}>
        <img 
          src={photo.originalUrl} 
          alt="Subject" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </div>

      {/* Interaction Layer */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
        
        {/* Chat Area (Expanded) */}
        {hasChat && (
             <div 
                ref={scrollRef}
                className="w-full h-[65%] pointer-events-auto bg-black border-t border-cyan-500/20 rounded-t-3xl overflow-y-auto z-20"
            >
                <div className="p-4 space-y-4 pb-20 max-w-3xl mx-auto">
                    {photo.chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-zinc-800 text-white rounded-br-sm border border-zinc-700' 
                                    : 'bg-cyan-950/30 border border-cyan-500/30 text-cyan-50 rounded-bl-sm'
                            }`}>
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                            
                            {/* Sources */}
                            {msg.role === 'model' && msg.links && msg.links.length > 0 && (
                                <div className="mt-2 ml-1 flex flex-wrap gap-2">
                                    {msg.links.map((link, i) => (
                                        <a 
                                            key={i} 
                                            href={link.uri}
                                            target="_blank"
                                            rel="noopener noreferrer" 
                                            className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded px-2.5 py-1.5 hover:border-cyan-500 transition-colors cursor-pointer"
                                        >
                                            <Globe size={10} className="text-cyan-400" />
                                            <span className="text-[10px] text-zinc-300 truncate max-w-[120px]">{link.title}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {isAsking && (
                        <div className="flex items-center gap-1 pl-2 pt-2">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Smart Card (Initial View) - Only shown if it is a recognized entity */}
        {!hasChat && !photo.isLoadingSuggestions && photo.smartCard && (
             <div className="w-full px-4 mb-4 pointer-events-auto z-20">
                 <div className="max-w-xl mx-auto bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-slide-up ring-1 ring-white/10">
                    <div className="p-5 border-b border-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-white tracking-wide">{photo.smartCard.title}</h2>
                            <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20 uppercase">Identified</span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">{photo.smartCard.description}</p>
                    </div>
                    {photo.smartCard.facts.length > 0 && (
                        <div className="grid grid-cols-2 gap-px bg-white/10">
                            {photo.smartCard.facts.map((fact, idx) => (
                                <div key={idx} className="bg-zinc-900/90 p-3 flex flex-col gap-0.5">
                                    <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-wider">{fact.label}</span>
                                    <span className="text-xs text-zinc-200 font-medium">{fact.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
             </div>
        )}

        {/* Suggestions & Input */}
        {!hasChat && !isAsking && (
             <div className="w-full px-4 pb-6 pointer-events-auto z-20">
                <div className="flex flex-col gap-2 items-center w-full max-w-xl mx-auto">
                    {photo.isLoadingSuggestions ? (
                        <div className="w-full bg-zinc-900/80 backdrop-blur rounded-xl p-4 border border-white/5">
                            <div className="h-4 w-1/2 bg-white/10 rounded mb-3 animate-pulse"/>
                            <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse"/>
                        </div>
                    ) : (
                        photo.suggestions?.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(suggestion)}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-left p-4 rounded-lg shadow-lg flex items-center justify-between group transition-all cursor-pointer active:scale-[0.99]"
                            >
                                <span className="text-sm text-zinc-100 font-medium group-hover:text-white transition-colors">{suggestion}</span>
                                <ChevronRight size={16} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Input Field (Always visible but styled differently) */}
        <div className={`w-full bg-black border-t border-zinc-800 p-4 pt-3 pb-6 pointer-events-auto z-30 ${!hasChat && 'rounded-t-3xl border-t-cyan-500/20'}`}>
            <div className="relative flex items-center gap-2 max-w-3xl mx-auto">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                    placeholder={photo.isLoadingSuggestions ? "System Initializing..." : "Ask anything..."}
                    disabled={isAsking}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder-zinc-500 text-sm shadow-inner"
                />
                <button
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || isAsking}
                    className="absolute right-2 p-2 bg-cyan-600 text-white rounded-full hover:bg-cyan-500 disabled:opacity-50 disabled:bg-zinc-700 transition-all shadow-md cursor-pointer"
                >
                    {isAsking ? <Sparkles size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};