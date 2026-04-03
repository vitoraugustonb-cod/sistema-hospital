import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, LayoutDashboard, LogOut, 
  UserRound, ClipboardList, Bed, 
  Stethoscope, Thermometer, Database, FlaskConical, History as HistoryIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

import axios from 'axios';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemsByRole: Record<string, Array<{ label: string, path: string, icon: any }>> = {
    'TI': [
      { label: 'Gestão Usuários', path: '/admin', icon: Users },
      { label: 'Auditoria Logs', path: '/admin/logs', icon: Database },
      { label: 'Configurações', path: '/admin/settings', icon: LayoutDashboard },
    ],
    'Recepcao': [
      { label: 'Mapa de Leitos', path: '/recepcao', icon: Bed },
      { label: 'Gestão Pacientes', path: '/recepcao/pacientes', icon: UserRound },
    ],
    'Medico': [
      { label: 'Censo Clínico', path: '/medico', icon: Stethoscope },
      { label: 'Minhas Pendências', path: '/medico/pendencias', icon: ClipboardList },
      { label: 'Exames', path: '/medico/exames', icon: FlaskConical },
      { label: 'Histórico de Altas', path: '/medico/historico', icon: HistoryIcon },
    ],
    'Enfermeiro': [
      { label: 'Censo Enfermagem', path: '/enfermeiro', icon: ClipboardList },
      { label: 'Gestão de Unidade', path: '/enfermeiro/unidade', icon: LayoutDashboard },
      { label: 'Solicitações Exames', path: '/enfermeiro/exames', icon: FlaskConical },
    ],
    'Tecnico': [
      { label: 'Atividades', path: '/tecnico', icon: Thermometer },
      { label: 'Coleta de Exames', path: '/tecnico/exames', icon: FlaskConical },
    ]
  };

  const items = navItemsByRole[user?.cargo || ''] || [];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex flex-col gap-2">
        <h2 className="text-hospital-navy font-bold text-lg leading-tight">SISTEMA<br/>HOSPITAL</h2>
        <div className="h-1 w-8 bg-hospital-teal rounded-full"></div>
      </div>

      <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-hospital-navy/5 text-hospital-navy' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-hospital-navy'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <div className="bg-hospital-slate rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-hospital-navy uppercase tracking-wider">{user?.cargo}</p>
          <p className="text-sm font-medium text-slate-700 truncate">{user?.nome}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
