import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2, X, AlertCircle, Clock, Calendar, CheckCircle, FileText, BarChart2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';

interface Board {
  id: number;
  title: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (location.hash === '#quadros') {
      const element = document.getElementById('quadros');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location, loading]);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Failed to fetch boards', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newBoardTitle }),
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setBoards([data, ...boards]);
        setNewBoardTitle('');
        setIsCreateModalOpen(false);
      } else {
        setError(data.details || data.error || 'Falha ao criar quadro');
      }
    } catch (error) {
      console.error('Failed to create board', error);
      setError('Erro de conexão ao criar quadro');
    } finally {
      setCreateLoading(false);
    }
  };

  const updateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBoard) return;
    setError(null);

    try {
      const response = await fetch(`/api/boards/${currentBoard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editBoardTitle }),
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (response.ok) {
        const updatedBoard = await response.json();
        setBoards(boards.map((b) => (b.id === updatedBoard.id ? updatedBoard : b)));
        setIsEditModalOpen(false);
        setCurrentBoard(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Falha ao atualizar quadro');
      }
    } catch (error) {
      console.error('Failed to update board', error);
      setError('Erro de conexão ao atualizar quadro');
    }
  };

  const deleteBoard = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este quadro?')) return;
    setError(null);

    try {
      const response = await fetch(`/api/boards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (response.ok) {
        setBoards(boards.filter((b) => b.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Falha ao excluir quadro');
      }
    } catch (error) {
      console.error('Failed to delete board', error);
      alert('Erro de conexão ao excluir quadro');
    }
  };

  const openEditModal = (board: Board) => {
    setCurrentBoard(board);
    setEditBoardTitle(board.title);
    setIsEditModalOpen(true);
  };

  return (
    <Layout>
      <section className="mb-10 bg-alert-bg p-6 rounded-[2rem] alert-container-border shadow-inner" data-purpose="urgent-alerts">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-yuna-dark tracking-tight flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 bg-yuna-pink text-white rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </span>
            Atenção Crítica Necessária
            <span className="bg-yuna-pink text-white text-[11px] px-3 py-1 rounded-full uppercase font-bold animate-pulse">Ação Requerida</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-yuna-pink/10 p-5 rounded-2xl card-shadow flex items-start gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-pink-50 rounded-xl text-yuna-pink">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-yuna-dark text-lg">Posts expirando hoje</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">8 posts da "Marca X" precisam de aprovação em menos de 2 horas.</p>
            </div>
          </div>
          <div className="bg-white border-2 border-yuna-blue/10 p-5 rounded-2xl card-shadow flex items-start gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-blue-50 rounded-xl text-yuna-blue">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-yuna-dark text-lg">Conteúdo atrasado</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">Arquivos de vídeo para o "Cliente Z" estão 24h fora do prazo.</p>
            </div>
          </div>
          <div className="bg-white border-2 border-yuna-purple/10 p-5 rounded-2xl card-shadow flex items-start gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-indigo-50 rounded-xl text-yuna-purple">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-yuna-dark text-lg">Planejamento Pendente</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">3 clientes não possuem posts agendados para a próxima semana.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8" data-purpose="metric-cards">
        <div className="bg-yuna-purple p-6 rounded-2xl text-white card-shadow relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Clientes Ativos</p>
            <h3 className="text-4xl font-black mt-2">24</h3>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl font-black opacity-10 group-hover:scale-110 transition-transform">C</span>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-50 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Planejados</p>
            <h3 className="text-4xl font-black mt-2 text-yuna-purple">142</h3>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl font-black text-gray-100 group-hover:scale-110 transition-transform">P</span>
        </div>
        <div className="gradient-pink p-6 rounded-2xl text-white card-shadow relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-90">Em Atraso</p>
            <h3 className="text-4xl font-black mt-2">12</h3>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl font-black opacity-20 group-hover:scale-110 transition-transform">A</span>
        </div>
        <div className="bg-yuna-blue p-6 rounded-2xl text-white card-shadow relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Publicados</p>
            <h3 className="text-4xl font-black mt-2">865</h3>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl font-black opacity-10 group-hover:scale-110 transition-transform">S</span>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-gray-50 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total do Mês</p>
            <h3 className="text-4xl font-black mt-2 text-yuna-dark">1.019</h3>
          </div>
          <span className="absolute -right-2 -bottom-2 text-6xl font-black text-gray-100 group-hover:scale-110 transition-transform">M</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-3xl card-shadow h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-yuna-dark">Volume de Demanda por Cliente</h3>
              <select className="text-sm font-bold border-none bg-gray-50 rounded-lg focus:ring-yuna-purple">
                <option>Últimos 30 Dias</option>
                <option>Últimos 7 Dias</option>
              </select>
            </div>
            <div className="flex-grow flex items-end gap-3 px-2" data-purpose="bar-chart-visualization">
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-purple opacity-20 h-32 rounded-t-lg group-hover:opacity-100 transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Fênix</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-purple opacity-40 h-48 rounded-t-lg group-hover:opacity-100 transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Zenith</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-pink h-64 rounded-t-lg transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Astra</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-purple opacity-30 h-40 rounded-t-lg group-hover:opacity-100 transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Lumina</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-blue opacity-50 h-56 rounded-t-lg group-hover:opacity-100 transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Vortex</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-purple opacity-20 h-24 rounded-t-lg group-hover:opacity-100 transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Sol</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-yuna-purple h-full rounded-t-lg transition-all cursor-pointer"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Terra</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl card-shadow">
            <h3 className="text-xl font-extrabold text-yuna-dark mb-6">Status do Fluxo de Trabalho</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-3 h-12 bg-yuna-purple rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Em Redação</p>
                  <p className="text-xl font-black">42%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-3 h-12 bg-yuna-pink rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Em Revisão</p>
                  <p className="text-xl font-black">28%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-3 h-12 bg-yuna-blue rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Agendados</p>
                  <p className="text-xl font-black">30%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl card-shadow h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-yuna-dark">Próximos Agendamentos</h3>
              <button className="text-yuna-purple text-sm font-bold hover:underline">Ver Calendário</button>
            </div>
            <div className="space-y-4 flex-grow overflow-y-auto pr-2" data-purpose="schedule-list">
              <div className="p-4 border border-gray-100 rounded-2xl hover:border-yuna-purple transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold py-1 px-2 rounded bg-indigo-50 text-yuna-purple uppercase">Hoje • 14:00</span>
                  <span className="w-2 h-2 rounded-full bg-yuna-pink"></span>
                </div>
                <p className="font-bold text-yuna-dark group-hover:text-yuna-purple transition-colors">Lançamento Campanha Primavera</p>
                <p className="text-xs text-gray-500 mt-1">Cliente: Fênix • Instagram/Facebook</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl hover:border-yuna-purple transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold py-1 px-2 rounded bg-indigo-50 text-yuna-purple uppercase">Hoje • 18:30</span>
                  <span className="w-2 h-2 rounded-full bg-yuna-blue"></span>
                </div>
                <p className="font-bold text-yuna-dark group-hover:text-yuna-purple transition-colors">Reel de Recursos do Produto</p>
                <p className="text-xs text-gray-500 mt-1">Cliente: Astra • TikTok</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl hover:border-yuna-purple transition-all group cursor-pointer opacity-70">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold py-1 px-2 rounded bg-gray-100 text-gray-500 uppercase">Amanhã • 09:00</span>
                </div>
                <p className="font-bold text-yuna-dark group-hover:text-yuna-purple transition-colors">Resumo de Destaques Semanal</p>
                <p className="text-xs text-gray-500 mt-1">Cliente: Zenith • X / Twitter</p>
              </div>
              <div className="mt-8 p-6 gradient-pink rounded-2xl text-white relative overflow-hidden" data-purpose="calendar-milestone">
                <div className="relative z-10">
                  <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Marco Importante</h4>
                  <p className="text-lg font-black leading-tight">Revisão de Estratégia de Marca Q1</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-bold">28 de Março, 2024</span>
                  </div>
                </div>
                <span className="absolute -right-4 -top-4 text-7xl font-black opacity-10">28</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Seus Quadros Section */}
      <section id="quadros" className="bg-white p-6 rounded-3xl card-shadow scroll-mt-24">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-yuna-dark">Seus Quadros de Trabalho</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-yuna-purple text-white rounded-xl hover:bg-opacity-90 transition-colors font-bold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Quadro
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">Carregando quadros...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500">Você ainda não tem quadros. Crie um para começar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                to={`/boards/${board.id}`}
                key={board.id}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-yuna-purple hover:shadow-md transition-all group block"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-yuna-dark truncate pr-4 group-hover:text-yuna-purple transition-colors">
                    {board.title}
                  </h3>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openEditModal(board);
                      }}
                      className="text-gray-400 hover:text-yuna-purple"
                      title="Renomear"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        deleteBoard(board.id);
                      }}
                      className="text-gray-400 hover:text-yuna-pink"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-semibold">
                  Criado em: {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-yuna-purple text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 group flex items-center gap-2"
        >
          <Plus className="h-8 w-8" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap group-hover:pr-2">Novo Quadro</span>
        </button>
      </div>

      {/* Create Board Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 card-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-yuna-dark">Criar Novo Quadro</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-yuna-pink transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-pink-50 text-yuna-pink rounded-xl text-sm font-bold">
                {error}
              </div>
            )}
            <form onSubmit={createBoard}>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Título do Quadro"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-yuna-purple focus:border-transparent font-semibold"
                autoFocus
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 bg-yuna-purple text-white rounded-xl hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors"
                >
                  {createLoading ? 'Criando...' : 'Criar Quadro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 card-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-yuna-dark">Renomear Quadro</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-yuna-pink transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={updateBoard}>
              <input
                type="text"
                value={editBoardTitle}
                onChange={(e) => setEditBoardTitle(e.target.value)}
                placeholder="Título do Quadro"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-yuna-purple focus:border-transparent font-semibold"
                autoFocus
                required
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-yuna-purple text-white rounded-xl hover:bg-opacity-90 font-bold transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
