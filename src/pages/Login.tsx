import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no login');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout 
      title="Bem-vindo de volta!" 
      subtitle="Insira suas credenciais para acessar seu painel."
    >
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B38FB] focus:border-transparent text-slate-800 placeholder-slate-400 transition-all font-medium"
            required
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha</label>
            <a href="#" className="text-[10px] font-bold text-[#FF52A3] hover:underline">Esqueceu?</a>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B38FB] focus:border-transparent text-slate-800 placeholder-slate-400 transition-all font-medium"
            required
          />
        </div>

        <div className="flex items-center pt-1 pb-2">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 text-[#6B38FB] bg-white border-slate-300 rounded focus:ring-[#6B38FB] focus:ring-2"
          />
          <label htmlFor="remember" className="ml-2 text-xs font-medium text-slate-500">
            Manter conectado
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-[#6B38FB] text-white font-bold py-3.5 rounded-xl hover:bg-[#5A2DE0] transition-colors shadow-lg shadow-[#6B38FB]/20"
        >
          Acessar Painel
        </button>
      </form>
    </AuthLayout>
  );
}
