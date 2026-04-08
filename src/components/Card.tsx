import React from 'react';
import { Calendar, Trash2, AlignLeft, Paperclip } from 'lucide-react';
import { cn } from '../lib/utils';

interface CardProps {
  id: number;
  title: string;
  scheduledDate?: string;
  postType: string;
  flagStatus: string;
  hasDescription?: boolean;
  attachmentsCount?: number;
  coverImage?: string;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Green':
      return 'Postado';
    case 'Yellow':
      return 'Aguardando';
    case 'Red':
      return 'Atrasado';
    default:
      return 'Sem Status';
  }
};

const getBadgeStyles = (status: string) => {
  switch (status) {
    case 'Green':
      return 'bg-emerald-100 text-emerald-700';
    case 'Yellow':
      return 'bg-yellow-100 text-yellow-700';
    case 'Red':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export default function Card({
  title,
  scheduledDate,
  postType,
  flagStatus,
  hasDescription,
  attachmentsCount = 0,
  coverImage,
  onClick,
  onDelete,
}: CardProps) {
  const isOverdue = flagStatus === 'Red';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm mb-3 hover:shadow-md transition-all duration-200 group relative cursor-pointer border border-slate-100 overflow-hidden"
    >
      {coverImage && (
        <div className="w-full h-32 overflow-hidden border-b border-slate-100">
          <img 
            src={coverImage} 
            alt="Capa do post" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug pr-6">{title}</h4>
          <div className="hidden group-hover:flex space-x-1 absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100 p-0.5">
            <button 
              onClick={onDelete} 
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {(hasDescription || attachmentsCount > 0) && (
          <div className="flex items-center gap-3 mb-3">
            {hasDescription && (
              <div className="text-slate-400" title="Tem descrição">
                <AlignLeft className="w-3.5 h-3.5" />
              </div>
            )}
            {attachmentsCount > 0 && (
              <div className="flex items-center text-slate-400" title={`${attachmentsCount} anexos`}>
                <Paperclip className="w-3.5 h-3.5 mr-1" />
                <span className="text-xs font-medium">{attachmentsCount}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TIPO</span>
            <span className="text-xs font-semibold text-slate-700">{postType}</span>
          </div>
          
          {scheduledDate && (
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATA</span>
              <span className={cn("text-xs font-bold flex items-center gap-1", isOverdue ? 'text-red-500' : 'text-slate-700')}>
                <Calendar className="w-3 h-3" />
                {new Date(scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
          <span className="text-xs font-bold text-yuna-purple">Instagram</span>
          <span className={cn("text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider", getBadgeStyles(flagStatus))}>
            {getStatusLabel(flagStatus)}
          </span>
        </div>
      </div>
    </div>
  );
}
