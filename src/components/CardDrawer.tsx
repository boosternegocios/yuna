import React, { useEffect, useState, useRef } from 'react';
import { X, Trash2, Calendar, Save, CheckCircle, AlertCircle } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import FileUploader from './FileUploader';
import AttachmentsList from './AttachmentsList';
import { useAuth } from '../context/AuthContext';

interface CardData {
  id: number;
  title: string;
  description?: string;
  scheduledDate?: string;
  postType: string;
  flagStatus: string;
  columnId: number;
}

interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  url: string;
  position: number;
}

interface CardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardData | null;
  onSave: (card: Partial<CardData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function CardDrawer({
  isOpen,
  onClose,
  card,
  onSave,
  onDelete,
}: CardDrawerProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [postType, setPostType] = useState('Static');
  const [flagStatus, setFlagStatus] = useState('Green');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle');
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setScheduledDate(
        card.scheduledDate
          ? new Date(card.scheduledDate).toISOString().split('T')[0]
          : ''
      );
      setPostType(card.postType);
      setFlagStatus(card.flagStatus);
      setSaveStatus('idle');
      fetchAttachments(card.id);
    }
  }, [card]);

  const fetchAttachments = async (cardId: number) => {
    try {
      const response = await fetch(`/api/${cardId}/attachments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Failed to fetch attachments', error);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!card) return;
    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`/api/${card.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const newAttachments = await response.json();
        setAttachments(prev => [...prev, ...newAttachments]);
        // Trigger board refresh
        onSave({ id: card.id });
      }
    } catch (error) {
      console.error('Failed to upload files', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!confirm('Excluir anexo?')) return;
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        // Trigger board refresh
        onSave({ id: card!.id });
      }
    } catch (error) {
      console.error('Failed to delete attachment', error);
    }
  };

  const handleReorderAttachments = async (newAttachments: Attachment[]) => {
    setAttachments(newAttachments); // Optimistic update
    
    if (!card) return;

    try {
      await fetch(`/api/${card.id}/attachments/reorder`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ attachmentIds: newAttachments.map(a => a.id) }),
      });
      // Trigger board refresh
      onSave({ id: card.id });
    } catch (error) {
      console.error('Failed to reorder attachments', error);
    }
  };

  // Auto-save logic for description
  useEffect(() => {
    if (!card || !isOpen) return;

    // Don't auto-save if content matches initial card content (avoid initial save)
    if (description === (card.description || '')) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave({
          id: card.id,
          description,
        });
        setSaveStatus('saved');
        
        // Reset to idle after showing saved for a bit
        setTimeout(() => {
            setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save failed', error);
        setSaveStatus('error');
      }
    }, 3000); // 3 seconds delay

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [description, card, isOpen, onSave]);

  if (!isOpen || !card) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    try {
      await onSave({
        id: card.id,
        title,
        description,
        scheduledDate: scheduledDate || undefined,
        postType,
        flagStatus,
        columnId: card.columnId,
      });
      setSaveStatus('saved');
      onClose();
    } catch (error) {
      console.error('Failed to save card', error);
      setSaveStatus('error');
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      await onDelete(card.id);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto border-l border-slate-100">
        <div className="p-8 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col gap-2 w-full pr-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-2xl font-bold text-slate-900 focus:ring-0 placeholder:text-slate-300"
                  placeholder="Título do Cartão"
                  required
                />
                <div className="flex items-center gap-3 h-5">
                    {saveStatus === 'saving' && (
                        <span className="text-xs text-slate-500 animate-pulse font-medium">Salvando alterações...</span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="text-xs text-emerald-600 flex items-center font-medium">
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Salvo
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-xs text-red-600 flex items-center font-medium">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Erro ao salvar
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-all duration-200"
                title="Excluir Cartão"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-8">
            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Data Agendada
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-slate-700"
                  />
                  <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Post Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tipo de Post
                </label>
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium text-slate-700 appearance-none"
                >
                  <option value="Static">Post Estático</option>
                  <option value="Reels">Reels</option>
                  <option value="Carousel">Carrossel</option>
                  <option value="Story">Story</option>
                </select>
              </div>

              {/* Flag Status */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Status
                </label>
                <div className="flex space-x-3">
                  {['Green', 'Yellow', 'Red'].map((status) => (
                    <label
                      key={status}
                      className={`flex-1 flex items-center justify-center cursor-pointer p-3 rounded-xl border transition-all duration-200 ${
                        flagStatus === status
                          ? status === 'Green' 
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                            : status === 'Yellow'
                            ? 'bg-yellow-50 border-yellow-500 ring-1 ring-yellow-500'
                            : 'bg-red-50 border-red-500 ring-1 ring-red-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="flagStatus"
                        value={status}
                        checked={flagStatus === status}
                        onChange={(e) => setFlagStatus(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${
                          status === 'Green'
                            ? 'bg-emerald-500'
                            : status === 'Yellow'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className={`text-sm font-medium ${
                        flagStatus === status ? 'text-slate-900' : 'text-slate-600'
                      }`}>{
                        status === 'Green' ? 'Postado' :
                        status === 'Yellow' ? 'Aguardando' :
                        'Atrasado'
                      }</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Descrição
              </label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Anexos
              </label>
              <FileUploader onUpload={handleUpload} isUploading={isUploading} />
              <div className="mt-4">
                <AttachmentsList 
                    attachments={attachments} 
                    onRemove={handleRemoveAttachment}
                    onReorder={handleReorderAttachments}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white pb-2">
              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="flex items-center px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
