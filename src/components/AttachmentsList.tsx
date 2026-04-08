import React from 'react';
import { X, File, Film, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  url: string;
}

interface AttachmentsListProps {
  attachments: Attachment[];
  onRemove: (id: number) => void;
  onReorder: (newAttachments: Attachment[]) => void;
}

function SortableAttachment({ attachment, onRemove }: { attachment: Attachment; onRemove: (id: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: attachment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isImage = attachment.mimeType.startsWith('image/');
  const isVideo = attachment.mimeType.startsWith('video/');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center aspect-square shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10 transition-opacity hover:bg-black/60"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(attachment.id);
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 backdrop-blur-sm text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Content */}
      {isImage ? (
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      ) : isVideo ? (
        <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors p-4 text-center w-full">
          <div className="p-3 bg-white rounded-full shadow-sm mb-2">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium truncate w-full px-2">{attachment.originalName}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors p-4 text-center w-full">
          <div className="p-3 bg-white rounded-full shadow-sm mb-2">
            <File className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium truncate w-full px-2">{attachment.originalName}</span>
        </div>
      )}
    </div>
  );
}

export default function AttachmentsList({ attachments, onRemove, onReorder }: AttachmentsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = attachments.findIndex((item) => item.id === active.id);
      const newIndex = attachments.findIndex((item) => item.id === over.id);
      
      onReorder(arrayMove(attachments, oldIndex, newIndex));
    }
  };

  if (attachments.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={attachments.map(a => a.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {attachments.map((attachment) => (
            <SortableAttachment
              key={attachment.id}
              attachment={attachment}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
