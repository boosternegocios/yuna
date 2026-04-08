import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, ArrowLeft, X, Trash2 } from 'lucide-react';
import SortableCard from '../components/SortableCard';
import Card from '../components/Card';
import CardDrawer from '../components/CardDrawer';
import Layout from '../components/Layout';
import DroppableColumn from '../components/DroppableColumn';

interface CardData {
  id: number;
  title: string;
  description?: string;
  scheduledDate?: string;
  postType: string;
  flagStatus: string;
  position: number;
  columnId: number;
  attachments?: any[];
}

interface Column {
  id: number;
  name: string;
  position: number;
  cards: CardData[];
}

interface Board {
  id: number;
  title: string;
  columns: Column[];
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export default function BoardView() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  // Column State
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [editColumnName, setEditColumnName] = useState('');

  // Card State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCardDrawerOpen, setIsCardDrawerOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null);
  
  // New Card Form State
  const [cardTitle, setCardTitle] = useState('');
  const [cardDate, setCardDate] = useState('');
  const [cardType, setCardType] = useState('Static');
  const [cardFlag, setCardFlag] = useState('Green');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBoard();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Sort columns by position, and cards by position
        data.columns.sort((a: Column, b: Column) => a.position - b.position);
        data.columns.forEach((col: Column) => {
          col.cards.sort((a: CardData, b: CardData) => a.position - b.position);
        });
        setBoard(data);
      }
    } catch (error) {
      console.error('Failed to fetch board', error);
    } finally {
      setLoading(false);
    }
  };

  const createColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;
    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardId: board.id,
          name: newColumnName,
          position: board.columns.length,
        }),
      });
      if (response.ok) {
        const newColumn = await response.json();
        newColumn.cards = [];
        setBoard({ ...board, columns: [...board.columns, newColumn] });
        setNewColumnName('');
        setIsAddColumnOpen(false);
      }
    } catch (error) {
      console.error('Failed to create column', error);
    }
  };

  const updateColumn = async (columnId: number) => {
    if (!board) return;
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editColumnName }),
      });
      if (response.ok) {
        const updatedColumn = await response.json();
        const newColumns = board.columns.map(col => 
          col.id === columnId ? { ...col, name: updatedColumn.name } : col
        );
        setBoard({ ...board, columns: newColumns });
        setEditingColumnId(null);
      }
    } catch (error) {
      console.error('Failed to update column', error);
    }
  };

  const deleteColumn = async (columnId: number) => {
    if (!board || !confirm('Excluir esta coluna e todos os seus cartões?')) return;
    try {
      const response = await fetch(`/api/columns/${columnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setBoard({
          ...board,
          columns: board.columns.filter(col => col.id !== columnId),
        });
      }
    } catch (error) {
      console.error('Failed to delete column', error);
    }
  };

  // Card Functions

  const openCreateCardModal = (columnId: number) => {
    setTargetColumnId(columnId);
    setEditingCard(null);
    setCardTitle('');
    setCardDate('');
    setCardType('Static');
    setCardFlag('Green');
    setIsCardModalOpen(true);
  };

  const createCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || targetColumnId === null) return;

    try {
      const targetColumn = board.columns.find(c => c.id === targetColumnId);
      const position = targetColumn ? targetColumn.cards.length : 0;

      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          columnId: targetColumnId,
          title: cardTitle,
          scheduledDate: cardDate || undefined,
          postType: cardType,
          flagStatus: cardFlag,
          position,
        }),
      });

      if (response.ok) {
        const newCard = await response.json();
        const newColumns = board.columns.map(col => {
          if (col.id === targetColumnId) {
            return { ...col, cards: [...col.cards, newCard] };
          }
          return col;
        });
        setBoard({ ...board, columns: newColumns });
        setIsCardModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create card', error);
    }
  };

  const openCardDrawer = (card: CardData) => {
    setEditingCard(card);
    setIsCardDrawerOpen(true);
  };

  const handleCardUpdate = async (updatedCard: Partial<CardData>) => {
    if (!board || !editingCard) return;

    try {
      const response = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedCard),
      });

      if (response.ok) {
        const savedCard = await response.json();
        
        const newColumns = board.columns.map(col => {
          if (col.id === savedCard.columnId) {
             return {
               ...col,
               cards: col.cards.map(c => c.id === savedCard.id ? savedCard : c)
             };
          }
          return col;
        });

        setBoard({ ...board, columns: newColumns });
      }
    } catch (error) {
      console.error('Failed to update card', error);
    }
  };

  const deleteCard = async (cardId: number) => {
    if (!board) return;

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const newColumns = board.columns.map(col => ({
          ...col,
          cards: col.cards.filter(c => c.id !== cardId)
        }));
        setBoard({ ...board, columns: newColumns });
      }
    } catch (error) {
      console.error('Failed to delete card', error);
    }
  };

  const handleDeleteFromList = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;
    await deleteCard(cardId);
  };

  // Drag and Drop Handlers

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cardId = active.id as number;
    // Find the card
    for (const col of board?.columns || []) {
      const card = col.cards.find(c => c.id === cardId);
      if (card) {
        setActiveCard(card);
        return;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const findContainer = (id: string | number) => {
      if (board?.columns.find(col => col.id === id)) {
        return id as number;
      }
      return board?.columns.find(col => col.cards.some(c => c.id === id))?.id;
    };

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setBoard((prev) => {
      if (!prev) return null;
      const activeItems = prev.columns.find(c => c.id === activeContainer)?.cards || [];
      const overItems = prev.columns.find(c => c.id === overContainer)?.cards || [];

      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      const overIndex = overItems.findIndex((item) => item.id === overId);

      let newIndex;
      if (overItems.some(item => item.id === overId)) {
        newIndex = overIndex >= 0 ? overIndex : overItems.length;
      } else {
        newIndex = overItems.length;
      }

      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === activeContainer) {
            return {
              ...col,
              cards: [
                ...prev.columns
                  .find((c) => c.id === activeContainer)!
                  .cards.filter((item) => item.id !== activeId),
              ],
            };
          } else if (col.id === overContainer) {
            const newCards = [
              ...prev.columns.find((c) => c.id === overContainer)!.cards,
            ];
            // Check if card already exists (it shouldn't if we filtered correctly above, but safety first)
            if (!newCards.find(c => c.id === activeId)) {
                const itemToMove = activeItems[activeIndex];
                // Insert at newIndex
                if (itemToMove) {
                    newCards.splice(newIndex, 0, { ...itemToMove, columnId: overContainer as number });
                }
            }
            return {
              ...col,
              cards: newCards,
            };
          }
          return col;
        }),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as number;
    const overId = over ? over.id : null;

    if (!overId || !activeCard) {
        setActiveCard(null);
        return;
    }

    const findContainer = (id: string | number) => {
        if (board?.columns.find(col => col.id === id)) {
            return id as number;
        }
        return board?.columns.find(col => col.cards.some(c => c.id === id))?.id;
    };

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (activeContainer && overContainer) {
        const activeColumn = board!.columns.find(c => c.id === activeContainer)!;
        const overColumn = board!.columns.find(c => c.id === overContainer)!;
        
        const activeIndex = activeColumn.cards.findIndex(c => c.id === activeId);
        const overIndex = overColumn.cards.findIndex(c => c.id === overId);

        let newCards = activeColumn.cards;
        let finalIndex = overIndex;

        if (activeContainer === overContainer) {
            if (activeIndex !== overIndex && overIndex !== -1) {
                newCards = arrayMove(activeColumn.cards, activeIndex, overIndex);
                finalIndex = overIndex;
                
                // Update local state
                const newColumns = board!.columns.map(col => 
                    col.id === activeContainer ? { ...col, cards: newCards } : col
                );
                setBoard({ ...board!, columns: newColumns });
            } else if (overIndex === -1) {
                finalIndex = activeColumn.cards.length;
            } else {
                finalIndex = activeIndex;
            }
        } else {
            // This case shouldn't happen because handleDragOver already moved the item
            // to the overContainer, so activeContainer should equal overContainer.
            // But just in case:
            finalIndex = overIndex !== -1 ? overIndex : overColumn.cards.length;
        }

        const finalCardIndex = newCards.findIndex(c => c.id === activeId);
        const actualFinalIndex = finalCardIndex !== -1 ? finalCardIndex : finalIndex;

        if (activeCard.columnId !== overContainer || activeIndex !== overIndex) {
            try {
                await fetch(`/api/cards/${activeId}/move`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        newColumnId: overContainer,
                        newPosition: actualFinalIndex,
                    }),
                });
            } catch (error) {
                console.error("Failed to move card", error);
            }
        }
    }

    setActiveCard(null);
  };

  if (loading) return <div className="text-center py-10">Carregando quadro...</div>;
  if (!board) return <div className="text-center py-10">Quadro não encontrado</div>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Layout fullWidth>
        <div className="flex flex-col h-[calc(100vh-73px)] bg-slate-50 font-sans">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10 sticky top-0">
            <div className="flex items-center space-x-4">
              <Link to="/" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{board.title}</h1>
            </div>
            <button
              onClick={() => setIsAddColumnOpen(true)}
              className="flex items-center px-4 py-2 bg-yuna-purple text-white rounded-xl hover:bg-yuna-purple/90 transition-all shadow-lg shadow-yuna-purple/20 font-medium text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Coluna
            </button>
          </header>

          {/* Board Content */}
          <main className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="h-full p-8 flex items-start space-x-6">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="w-80 flex-shrink-0 bg-slate-100/50 rounded-2xl flex flex-col max-h-full border border-slate-200/60"
              >
                {/* Column Header */}
                <div className="p-4 flex justify-between items-center border-b border-slate-200/60">
                  {editingColumnId === column.id ? (
                    <div className="flex items-center w-full space-x-2">
                        <input
                            type="text"
                            value={editColumnName}
                            onChange={(e) => setEditColumnName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            autoFocus
                            onBlur={() => updateColumn(column.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') updateColumn(column.id);
                                if (e.key === 'Escape') setEditingColumnId(null);
                            }}
                        />
                    </div>
                  ) : (
                    <h3 
                        className="font-semibold text-slate-700 cursor-pointer flex-1 text-sm uppercase tracking-wide"
                        onClick={() => {
                            setEditingColumnId(column.id);
                            setEditColumnName(column.name);
                        }}
                    >
                        {column.name}
                    </h3>
                  )}
                  <div className="flex items-center">
                    <span className="text-xs text-slate-500 mr-2 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                        {column.cards.length}
                    </span>
                    <button 
                        onClick={() => deleteColumn(column.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cards List */}
                <DroppableColumn id={column.id} items={column.cards.map(c => c.id)}>
                    {column.cards.length > 0 ? (
                      column.cards.map((card) => (
                        <SortableCard
                          key={card.id}
                          {...card}
                          hasDescription={!!card.description && card.description.replace(/<[^>]*>/g, '').trim().length > 0}
                          attachmentsCount={card.attachments?.length || 0}
                          coverImage={card.attachments?.find(a => a.mimeType?.startsWith('image/'))?.url}
                          onClick={() => openCardDrawer(card)}
                          onDelete={(e) => handleDeleteFromList(e, card.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center text-slate-400 text-sm py-8 italic border-2 border-dashed border-slate-200 rounded-xl m-1">
                        Nenhum cartão ainda
                      </div>
                    )}
                </DroppableColumn>

                {/* Column Footer */}
                <div className="p-3 border-t border-slate-200/60">
                  <button
                    onClick={() => openCreateCardModal(column.id)}
                    className="flex items-center justify-center w-full py-2.5 text-slate-500 hover:text-slate-700 hover:bg-white rounded-xl transition-all text-sm font-medium border border-transparent hover:border-slate-200 hover:shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Cartão
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeCard ? (
            <Card
              {...activeCard}
              hasDescription={!!activeCard.description && activeCard.description.replace(/<[^>]*>/g, '').trim().length > 0}
              attachmentsCount={activeCard.attachments?.length || 0}
              coverImage={activeCard.attachments?.find(a => a.mimeType?.startsWith('image/'))?.url}
              onClick={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>

        {/* Add Column Modal */}
        {isAddColumnOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Adicionar Nova Coluna</h3>
                    <form onSubmit={createColumn}>
                        <input
                            type="text"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            placeholder="Nome da Coluna"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white"
                            autoFocus
                            required
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsAddColumnOpen(false)}
                                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 font-medium"
                            >
                                Adicionar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Create Card Modal */}
        {isCardModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Criar Novo Cartão</h3>
                <button
                  onClick={() => setIsCardModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={createCard} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Título</label>
                  <input
                    type="text"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-lg font-medium"
                    placeholder="Digite o título do cartão"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data</label>
                        <input
                            type="date"
                            value={cardDate}
                            onChange={(e) => setCardDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipo</label>
                        <select
                            value={cardType}
                            onChange={(e) => setCardType(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-sm appearance-none"
                        >
                            <option value="Static">Estático</option>
                            <option value="Reels">Reels</option>
                            <option value="Carousel">Carrossel</option>
                            <option value="Story">Story</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</label>
                    <div className="flex space-x-3">
                        {['Green', 'Yellow', 'Red'].map(status => (
                            <label key={status} className={`flex-1 flex items-center justify-center cursor-pointer p-3 rounded-xl border transition-all duration-200 ${
                                cardFlag === status 
                                ? status === 'Green' 
                                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                                    : status === 'Yellow'
                                    ? 'bg-yellow-50 border-yellow-500 ring-1 ring-yellow-500'
                                    : 'bg-red-50 border-red-500 ring-1 ring-red-500'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}>
                                <input
                                    type="radio"
                                    name="cardFlag"
                                    value={status}
                                    checked={cardFlag === status}
                                    onChange={(e) => setCardFlag(e.target.value)}
                                    className="sr-only"
                                />
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                    status === 'Green' ? 'bg-emerald-500' :
                                    status === 'Yellow' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`} />
                                <span className={`text-sm font-medium ${
                                    cardFlag === status ? 'text-slate-900' : 'text-slate-600'
                                }`}>{
                                    status === 'Green' ? 'Postado' :
                                    status === 'Yellow' ? 'Aguardando' :
                                    'Atrasado'
                                }</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 font-medium"
                  >
                    Criar Cartão
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

          <CardDrawer
            isOpen={isCardDrawerOpen}
            onClose={() => setIsCardDrawerOpen(false)}
            card={editingCard}
            onSave={handleCardUpdate}
            onDelete={deleteCard}
          />
        </div>
      </Layout>
    </DndContext>
  );
}
