import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface DroppableColumnProps {
  id: number;
  children: React.ReactNode;
  items: number[];
}

export default function DroppableColumn({ id, children, items }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[100px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      <SortableContext items={items} strategy={verticalListSortingStrategy} id={id.toString()}>
        {children}
      </SortableContext>
    </div>
  );
}
