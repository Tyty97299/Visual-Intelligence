import React from 'react';
import { Photo } from '../types';
import { Trash2, History } from 'lucide-react';

interface GalleryViewProps {
  photos: Photo[];
  onSelect: (photo: Photo) => void;
  onClearHistory: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ photos, onSelect, onClearHistory }) => {
  if (photos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center font-sans">
        <div className="bg-zinc-900/50 p-6 rounded-full mb-4">
             <History size={32} />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No History</h3>
        <p className="text-xs text-zinc-500">Scanned items will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24 pt-20 px-4 font-sans">
      <div className="flex justify-between items-end mb-4 pb-2 max-w-7xl mx-auto w-full">
        <span className="text-xs text-zinc-500 font-medium">{photos.length} ITEMS</span>
        <button 
          onClick={onClearHistory}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Clear All</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-w-7xl mx-auto">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            onClick={() => onSelect(photo)}
            className="aspect-[4/5] relative bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group border border-zinc-800 hover:border-cyan-500/50 transition-all"
          >
            <img 
              src={photo.originalUrl} 
              alt="History Item" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-80" />
            
            {/* Overlay UI */}
            <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end">
                {photo.smartCard && (
                    <span className="text-xs font-bold text-white mb-0.5 truncate">{photo.smartCard.title}</span>
                )}
                <span className="text-[10px] text-zinc-400">
                  {new Date(photo.timestamp).toLocaleDateString()}
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};