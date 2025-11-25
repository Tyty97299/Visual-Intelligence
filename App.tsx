import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { GalleryView } from './components/GalleryView';
import { PhotoDetail } from './components/PhotoDetail';
import { Photo, ViewState } from './types';
import { analyzeImage, askAboutImage } from './services/geminiService';
import { Camera, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CAMERA);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handleCapture = (imageData: string) => {
    const newPhoto: Photo = {
      id: uuidv4(),
      originalUrl: imageData,
      timestamp: Date.now(),
      chatHistory: [],
      suggestions: [],
      isLoadingSuggestions: true
    };
    
    // Add to gallery
    setPhotos(prev => [newPhoto, ...prev]);
    
    // Open immediately
    setSelectedPhoto(newPhoto);
    setView(ViewState.DETAIL);

    // Trigger background analysis
    performAnalysis(newPhoto);
  };

  const performAnalysis = async (photo: Photo) => {
      try {
          const result = await analyzeImage(photo.originalUrl);
          
          setPhotos(prev => prev.map(p => 
              p.id === photo.id 
                  ? { ...p, suggestions: result.suggestions, smartCard: result.smartCard, isLoadingSuggestions: false } 
                  : p
          ));
          
          // If this is still the selected photo, update local state
          setSelectedPhoto(prev => 
              prev && prev.id === photo.id 
                  ? { ...prev, suggestions: result.suggestions, smartCard: result.smartCard, isLoadingSuggestions: false } 
                  : prev
          );
      } catch (e) {
          console.error("Error analyzing image", e);
          const fallback = ["Identify this object", "What functions does this have?", "Is this dangerous?"];
          setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, suggestions: fallback, isLoadingSuggestions: false } : p));
          setSelectedPhoto(prev => prev && prev.id === photo.id ? { ...prev, suggestions: fallback, isLoadingSuggestions: false } : prev);
      }
  };

  const handleAsk = async (photo: Photo, question: string) => {
    // 1. Add user message
    const updatedPhoto = {
        ...photo,
        chatHistory: [...photo.chatHistory, { role: 'user' as const, text: question }]
    };
    
    updatePhotoState(updatedPhoto);

    try {
        // 2. Get AI Response
        const result = await askAboutImage(photo.originalUrl, question);
        
        const answeredPhoto = {
            ...updatedPhoto,
            chatHistory: [
                ...updatedPhoto.chatHistory,
                { role: 'model' as const, text: result.text, links: result.links }
            ]
        };

        updatePhotoState(answeredPhoto);

    } catch (error) {
        console.error("Ask failed", error);
        const errorPhoto = {
            ...updatedPhoto,
            chatHistory: [
                ...updatedPhoto.chatHistory,
                { role: 'model' as const, text: "Connection error. Please retry." }
            ]
        };
        updatePhotoState(errorPhoto);
    }
  };

  const updatePhotoState = (updatedPhoto: Photo) => {
      setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
      if (selectedPhoto?.id === updatedPhoto.id) {
          setSelectedPhoto(updatedPhoto);
      }
  };

  const handleClearHistory = () => {
    if (confirm("Clear all history?")) {
      setPhotos([]);
      setView(ViewState.CAMERA);
    }
  };

  const openDetail = (photo: Photo) => {
    setSelectedPhoto(photo);
    setView(ViewState.DETAIL);
  };

  const closeDetail = () => {
    setSelectedPhoto(null);
    setView(ViewState.GALLERY);
  };

  return (
    <div className="h-[100dvh] w-full bg-black text-white overflow-hidden flex flex-col font-sans">
      
      {/* Main Content Area - Padded bottom to avoid overlap with fixed nav */}
      <div className={`relative w-full ${view !== ViewState.DETAIL ? 'h-[calc(100dvh-6rem)] pb-0' : 'h-full'}`}>
        {view === ViewState.CAMERA && (
          <CameraView onCapture={handleCapture} />
        )}
        
        {view === ViewState.GALLERY && (
           <>
              <div className="absolute top-0 w-full z-10 p-5 bg-black/95 border-b border-zinc-800 flex justify-between items-center shadow-md">
                  <h1 className="text-sm font-bold tracking-widest text-white uppercase">History</h1>
              </div>
              <GalleryView photos={photos} onSelect={openDetail} onClearHistory={handleClearHistory} />
           </>
        )}

        {view === ViewState.DETAIL && selectedPhoto && (
            <PhotoDetail 
                photo={selectedPhoto} 
                onClose={closeDetail} 
                onAsk={handleAsk}
            />
        )}
      </div>

      {/* Fixed Sticky Bottom Nav */}
      {view !== ViewState.DETAIL && (
        <div className="fixed bottom-0 left-0 w-full h-24 bg-black border-t border-zinc-800 flex justify-around items-start pt-4 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setView(ViewState.CAMERA)}
            className={`flex flex-col items-center gap-2 p-2 transition-all duration-300 cursor-pointer ${view === ViewState.CAMERA ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Camera size={26} strokeWidth={view === ViewState.CAMERA ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Scanner</span>
          </button>

          <button 
             onClick={() => setView(ViewState.GALLERY)}
             className={`flex flex-col items-center gap-2 p-2 transition-all duration-300 cursor-pointer ${view === ViewState.GALLERY ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <History size={26} strokeWidth={view === ViewState.GALLERY ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-widest uppercase">History</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;