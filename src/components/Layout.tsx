import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

export default function Layout({ children, fullWidth = false }: { children: React.ReactNode, fullWidth?: boolean }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-yuna-bg font-sans text-gray-800 flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-end gap-1 cursor-pointer" data-purpose="yuna-logo">
            <span className="text-3xl font-extrabold tracking-tighter text-yuna-purple leading-none">yuna</span>
            <div className="w-2 h-2 bg-yuna-pink mb-1 rounded-full"></div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-semibold transition-colors ${location.pathname === '/' ? 'text-yuna-purple border-b-2 border-yuna-purple pb-1' : 'text-gray-500 hover:text-yuna-purple'}`}>Painel</Link>
            <a className="text-sm font-semibold text-gray-500 hover:text-yuna-purple transition-colors" href="#">Calendário</a>
            <Link to="/clientes" className={`text-sm font-semibold transition-colors ${location.pathname === '/clientes' ? 'text-yuna-purple border-b-2 border-yuna-purple pb-1' : 'text-gray-500 hover:text-yuna-purple'}`}>Clientes</Link>
            <a className="text-sm font-semibold text-gray-500 hover:text-yuna-purple transition-colors" href="#">Relatórios</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-yuna-purple relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-yuna-pink rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-100" data-purpose="user-profile">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name || 'Usuário'}</p>
              <p className="text-xs font-semibold text-yuna-pink uppercase tracking-wider">Líder Criativa</p>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-yuna-blue flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden cursor-pointer">
                <img alt="Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJiTNZZc3JJnTEmubmhB81ZxLP8KTaWCXjz3Fr6_OTOKLq2iKEHz0kMvqvM70563-joz32oxN8flcRf07k41BCWpqvUVMSrKnXpdtM3vswcupT7hpBzbbY66d0Tgnzmxk8sKrpw62ypubYtPrQaPunn5NKB87vex4UrSPl71Cs_Dl2N9vPmo7Nc2kgpoNj2sUq6OdPfmdqLS6QlYCXuOcfTtkuP-DpV7cbv8-BQxv5tO8onAupcK5tm_DwxuomMXMKIgvbwjkrDrGA" />
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block border border-gray-100">
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className={`flex-1 ${fullWidth ? '' : 'p-6 max-w-[1600px] mx-auto w-full'}`}>
        {children}
      </main>
    </div>
  );
}
