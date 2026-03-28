import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Stethoscope, ClipboardList, Bed, Laptop, Contact } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type UserRole = 'TI' | 'Medico' | 'Enfermeiro' | 'Tecnico' | 'Recepcao';

const LoginPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>('Medico');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: 'Medico', label: 'Médico', icon: Stethoscope },
    { id: 'Enfermeiro', label: 'Enfermeiro', icon: ClipboardList },
    { id: 'Tecnico', label: 'Técnico', icon: Contact },
    { id: 'Recepcao', label: 'Recepção', icon: Bed },
    { id: 'TI', label: 'T.I.', icon: Laptop },
  ];

  // Limpa os campos ao trocar de perfil [CORREÇÃO]
  useEffect(() => {
    setIdentificador('');
    setSenha('');
    setError(null);
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(identificador, senha);
      
      const userStr = localStorage.getItem('hospital_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Verifica se o cargo do usuário no banco coincide com o selecionado na tela
        if (user.cargo !== role) {
          throw new Error('ESTE USUÁRIO NÃO PERTENCE AO PERFIL SELECIONADO');
        }

        const routes: Record<string, string> = {
          'TI': '/admin',
          'Medico': '/medico',
          'Enfermeiro': '/enfermeiro',
          'Tecnico': '/tecnico',
          'Recepcao': '/recepcao'
        };
        navigate(routes[user.cargo] || '/login');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    if (role === 'Medico') return 'CRM / CPF';
    if (role === 'Enfermeiro' || role === 'Tecnico') return 'COREN / CPF';
    if (role === 'TI') return 'Identificador TI';
    return 'CPF';
  };

  const activeIndex = roles.findIndex(r => r.id === role);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4 font-sans">
      <div className="w-full max-w-md flex flex-col items-center gap-6 p-10 rounded-[2.5rem] bg-slate-800 border border-slate-700 shadow-2xl shadow-slate-900/40 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-hospital-navy/20 p-5 rounded-3xl shadow-inner">
          <Shield className="w-12 h-12 text-hospital-teal" />
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">SISTEMA HOSPITAL</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Ala de Internação Integrada</p>
        </div>

        {/* Seletor de Perfil Animado */}
        <div className="w-full bg-slate-700/50 p-1.5 rounded-2xl flex gap-1 relative overflow-hidden border border-slate-600">
          <div 
            className="absolute top-1.5 bottom-1.5 left-1.5 bg-slate-600 rounded-xl shadow-md transition-all duration-500 ease-in-out"
            style={{ 
              width: `calc((100% - 12px) / 5)`,
              transform: `translateX(calc(${activeIndex} * (100% + 1px)))`
            }}
          />

          {roles.map((item) => {
            const Icon = item.icon;
            const isActive = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id as UserRole)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 relative z-10 ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'scale-100'} transition-transform`} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black animate-in shake duration-500 uppercase tracking-tight">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificador {role}</label>
               <span className="text-[9px] font-bold text-hospital-teal bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">Obrigatório</span>
            </div>
            <input 
              type="text" 
              required
              autoFocus
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-4 focus:ring-hospital-teal/10 transition-all bg-slate-700/50 focus:bg-slate-700 text-sm font-medium text-white placeholder:text-slate-500"
              placeholder={getPlaceholder()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <input 
              type="password" 
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-4 focus:ring-hospital-teal/10 transition-all bg-slate-700/50 focus:bg-slate-700 text-sm font-medium text-white placeholder:text-slate-500"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="hospital-btn-secondary w-full py-4 mt-2 shadow-xl shadow-hospital-teal/10 flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest bg-hospital-teal text-slate-900 hover:bg-hospital-teal/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
            ) : (
              <>
                Acessar Portal
                <Shield className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span>Privacidade</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <span>Suporte Técnico</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <span>v2.0.26</span>
          </div>
          <div className="w-12 h-1 bg-hospital-teal/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
