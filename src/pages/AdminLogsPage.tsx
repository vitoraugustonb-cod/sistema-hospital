import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Database, ShieldCheck, Clock, User, LogIn, LogOut, Search } from 'lucide-react';

interface Log {
  id: number;
  user_nome: string;
  user_cargo: string;
  acao: 'Login' | 'Logout';
  data_hora: string;
}

const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Erro ao buscar logs de auditoria');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (cargo: string) => {
    switch (cargo) {
      case 'Medico': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Enfermeiro': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'TI': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <DashboardLayout title="Auditoria de Logs">
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header de Auditoria */}
        <div className="bg-hospital-navy p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-hospital-navy/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Database className="w-32 h-32" />
           </div>
           <div className="relative z-10">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                 <ShieldCheck className="w-8 h-8 text-hospital-teal" />
                 Controle de Acessos & Auditoria
              </h2>
              <p className="text-hospital-navy-light font-bold text-xs uppercase tracking-[0.2em] mt-2">Monitoramento de sessões em tempo real</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total de Eventos</p>
              <p className="text-2xl font-black">{logs.length}</p>
           </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="flex-1 bg-slate-50 px-4 py-2 rounded-2xl flex items-center gap-3 border border-slate-100 focus-within:border-hospital-navy transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filtrar por nome do profissional ou cargo..."
                className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={() => setSearchTerm('')} className="text-xs font-black text-slate-400 uppercase hover:text-hospital-navy transition-all px-4">Limpar Filtros</button>
        </div>

        {/* Tabela de Logs */}
        <div className="hospital-card !p-0 overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hora/Minuto</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   <tr>
                     <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="w-8 h-8 border-4 border-hospital-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xs font-black text-slate-400 uppercase">Consultando banco de dados...</p>
                     </td>
                   </tr>
                 ) : filteredLogs.map((log) => (
                   <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${getRoleColor(log.user_cargo)}`}>
                               {log.user_nome.charAt(0)}
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-700">{log.user_nome}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase">{log.user_cargo}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`flex items-center gap-2 w-fit px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                            log.acao === 'Login' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                         }`}>
                            {log.acao === 'Login' ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                            {log.acao}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            {new Date(log.data_hora).toLocaleDateString('pt-BR')}
                         </p>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <p className="text-sm font-black text-hospital-navy">
                            {new Date(log.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         </p>
                      </td>
                   </tr>
                 ))}
                 
                 {!isLoading && filteredLogs.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-8 py-20 text-center">
                        <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase">Nenhum registro de acesso encontrado</p>
                     </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminLogsPage;
