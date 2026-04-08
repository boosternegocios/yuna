import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Film, Calendar as CalendarIcon, Search, Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

interface Board {
  id: number;
  title: string;
  createdAt: string;
}

const CARD_STYLES = [
  {
    iconBg: "from-indigo-500 to-yuna-purple",
    badgeBg: "bg-green-100 text-green-700",
    badgeDot: "bg-green-500",
    badgeText: "ESTÁVEL",
    textColor: "text-yuna-purple",
    progressBg: "bg-yuna-purple",
    buttonBg: "bg-gray-50 text-yuna-purple group-hover:bg-yuna-purple group-hover:text-white",
    health: "95%",
    campaigns: "12",
    category: "Tecnologia & SaaS"
  },
  {
    iconBg: "from-pink-500 to-yuna-pink",
    badgeBg: "bg-pink-100 text-yuna-pink",
    badgeDot: "bg-yuna-pink animate-ping",
    badgeText: "ALERTA",
    textColor: "text-yuna-pink",
    progressBg: "bg-yuna-pink",
    buttonBg: "bg-yuna-pink/10 text-yuna-pink group-hover:bg-yuna-pink group-hover:text-white",
    health: "42%",
    campaigns: "04",
    category: "E-commerce de Luxo"
  },
  {
    iconBg: "from-blue-500 to-yuna-blue",
    badgeBg: "bg-blue-100 text-yuna-blue",
    badgeDot: "bg-yuna-blue",
    badgeText: "EM CRESCIMENTO",
    textColor: "text-yuna-blue",
    progressBg: "bg-yuna-blue",
    buttonBg: "bg-gray-50 text-yuna-blue group-hover:bg-yuna-blue group-hover:text-white",
    health: "78%",
    campaigns: "08",
    category: "Desenvolvimento"
  },
  {
    iconBg: "from-purple-400 to-yuna-purple",
    badgeBg: "bg-green-100 text-green-700",
    badgeDot: "bg-green-500",
    badgeText: "EXCELENTE",
    textColor: "text-yuna-purple",
    progressBg: "bg-yuna-purple",
    buttonBg: "bg-gray-50 text-yuna-purple group-hover:bg-yuna-purple group-hover:text-white",
    health: "92%",
    campaigns: "15",
    category: "Consultoria Jurídica"
  }
];

export default function Clients() {
  const { token } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="mb-10 bg-alert-bg p-8 rounded-[2.5rem] alert-container-border shadow-xl" data-purpose="urgent-alerts">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-extrabold text-yuna-dark tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 bg-yuna-pink text-white rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              Atenção Crítica Necessária
            </h2>
            <p className="text-gray-600 font-medium ml-13">Identificamos problemas que requerem sua supervisão imediata.</p>
          </div>
          <span className="bg-yuna-pink text-white text-xs px-4 py-2 rounded-full uppercase font-black animate-pulse shadow-lg">Prioridade Máxima</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-l-4 border-yuna-pink p-6 rounded-2xl card-shadow flex items-start gap-4 transition-all hover:translate-y-[-4px]">
            <div className="p-3 bg-pink-50 rounded-xl text-yuna-pink">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-yuna-dark text-lg">Posts expirando hoje</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">8 posts da "Fênix" precisam de aprovação em menos de 2 horas.</p>
            </div>
          </div>
          <div className="bg-white border-l-4 border-yuna-blue p-6 rounded-2xl card-shadow flex items-start gap-4 transition-all hover:translate-y-[-4px]">
            <div className="p-3 bg-blue-50 rounded-xl text-yuna-blue">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-yuna-dark text-lg">Conteúdo atrasado</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">Arquivos de vídeo para o "Zenith" estão 24h fora do prazo.</p>
            </div>
          </div>
          <div className="bg-white border-l-4 border-yuna-purple p-6 rounded-2xl card-shadow flex items-start gap-4 transition-all hover:translate-y-[-4px]">
            <div className="p-3 bg-indigo-50 rounded-xl text-yuna-purple">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-yuna-dark text-lg">Planejamento Pendente</h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">3 clientes não possuem posts agendados para a próxima semana.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-yuna-dark">Clientes Ativos</h1>
          <p className="text-gray-500 font-medium">Gerencie o desempenho e a saúde de todas as contas.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yuna-purple focus:border-yuna-purple w-64 outline-none" 
              placeholder="Buscar cliente..." 
              type="text"
            />
          </div>
          <button className="bg-yuna-purple text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all">
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-500">Carregando clientes...</div>
        ) : boards.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500">
            Você ainda não tem clientes/quadros. Crie um para começar!
          </div>
        ) : (
          boards.map((board, index) => {
            const style = CARD_STYLES[index % CARD_STYLES.length];
            const initial = board.title.charAt(0).toUpperCase();

            return (
              <div key={board.id} className={`bg-white p-6 rounded-[2rem] card-shadow border border-gray-50 flex flex-col group hover:border-${style.textColor.split('-')[1]}/30 transition-all`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.iconBg} flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                    {initial}
                  </div>
                  <div className={`${style.badgeBg} text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 ${style.badgeDot} rounded-full`}></span> {style.badgeText}
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-yuna-dark mb-1 truncate" title={board.title}>{board.title}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 truncate">{style.category}</p>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-500 uppercase">Campanhas Ativas</span>
                    <span className={`text-lg font-black ${style.textColor}`}>{style.campaigns}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase">Saúde da Conta</span>
                      <span className={`text-xs font-bold ${style.textColor}`}>{style.health}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${style.progressBg}`} style={{ width: style.health }}></div>
                    </div>
                  </div>
                </div>
                <Link to={`/boards/${board.id}`} className={`mt-auto w-full py-3 ${style.buttonBg} font-bold rounded-xl transition-all text-sm text-center block`}>
                  Acessar Painel
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-yuna-purple text-white p-5 rounded-2xl shadow-2xl hover:scale-110 transition-all active:scale-95 group flex items-center gap-3">
          <Plus className="w-8 h-8 font-bold" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-extrabold whitespace-nowrap">NOVO PROJETO</span>
        </button>
      </div>
    </Layout>
  );
}
