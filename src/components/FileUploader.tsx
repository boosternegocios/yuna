import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading?: boolean;
}

export default function FileUploader({ onUpload, isUploading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await onUpload(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await onUpload(files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer group",
        isDragging 
          ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" 
          : "border-slate-200 hover:border-emerald-500/50 hover:bg-slate-50/50",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,video/*"
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center space-y-3">
        {isUploading ? (
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        ) : (
          <div className="p-3 bg-slate-50 rounded-full group-hover:bg-emerald-50 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        )}
        <div className="text-sm text-slate-600 font-medium">
          {isUploading ? (
            <span>Enviando arquivos...</span>
          ) : (
            <>
              <span className="text-emerald-600 hover:underline">Clique para enviar</span> ou arraste e solte
            </>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Imagens e vídeos de até 50MB
        </p>
      </div>
    </div>
  );
}
