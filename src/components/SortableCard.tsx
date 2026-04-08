import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';

interface SortableCardProps {
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

export default function SortableCard(props: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card {...props} />
    </div>
  );
}
