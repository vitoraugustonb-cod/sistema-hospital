import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bed, Info, CheckCircle2, AlertCircle, Clock, Construction, UserPlus, LogOut } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface Paciente {
  id: number;
  nome: string;
  cpf: string;
}

interface Leito {
  id: number;
  numero: string;
  ala: string;
  status: 'vago' | 'ocupado' | 'limpeza' | 'manutencao';
  paciente_id?: number;
  paciente_nome?: string;
}

const ReceptionBedsPage: React.FC = () => {
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeito, setSelectedLeito] = useState<Leito | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>("");

  const fetchLeitos = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/leitos');
      setLeitos(response.data);
    } catch (error) {
      console.error('Erro ao buscar leitos', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPacientes = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pacientes');
      setPacientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes', error);
    }
  };

  useEffect(() => {
    fetchLeitos();
    fetchPacientes();
    const interval = setInterval(fetchLeitos, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInternar = async () => {
    if (!selectedLeito || !selectedPacienteId) return;

    try {
      await axios.post(`http://localhost:3001/api/leitos/${selectedLeito.id}/internar`, {
        paciente_id: selectedPacienteId
      });
      setShowModal(false);
      setSelectedPacienteId("");
      fetchLeitos();
      alert('Paciente internado com sucesso!');
    } catch (error) {
      alert('Erro ao internar paciente');
    }
  };

  const handleLiberar = async (leitoId: number) => {
    if (!window.confirm('Deseja realmente liberar este leito?')) return;

    try {
      await axios.post(`http://localhost:3001/api/leitos/${leitoId}/liberar`);
      fetchLeitos();
      alert('Leito liberado com sucesso!');
    } catch (error) {
      alert('Erro ao liberar leito');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'vago': 
        return { label: 'Vago', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: CheckCircle2 };
      case 'ocupado': 
        return { label: 'Ocupado', color: 'text-hospital-navy', bg: 'bg-hospital-navy/5', border: 'border-hospital-navy/10', icon: Bed };
      case 'limpeza': 
        return { label: 'Limpeza', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock };
      case 'manutencao': 
        return { label: 'Manutenção', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: Construction };
      default: 
        return { label: 'N/A', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', icon: Info };
    }
  };

  return (
    <DashboardLayout title="Censo Hospitalar (Mapa de Leitos)">
      <div className="flex flex-col gap-8">
        {/* Resumo Estatístico */}
        <div className="grid grid-cols-4 gap-4">
          <div className="hospital-card flex flex-col gap-1 border-l-4 border-l-teal-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Leitos Vagos</span>
            <span className="text-2xl font-bold text-teal-600">{leitos.filter(l => l.status === 'vago').length}</span>
          </div>
          <div className="hospital-card flex flex-col gap-1 border-l-4 border-l-hospital-navy">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ocupação Atual</span>
            <span className="text-2xl font-bold text-hospital-navy">{leitos.filter(l => l.status === 'ocupado').length}</span>
          </div>
          <div className="hospital-card flex flex-col gap-1 border-l-4 border-l-amber-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Em Higienização</span>
            <span className="text-2xl font-bold text-amber-600">{leitos.filter(l => l.status === 'limpeza').length}</span>
          </div>
          <div className="hospital-card flex flex-col gap-1 border-l-4 border-l-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Geral</span>
            <span className="text-2xl font-bold text-slate-700">{leitos.length}</span>
          </div>
        </div>

        {/* Grade de Leitos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {leitos.map((leito) => {
            const config = getStatusConfig(leito.status);
            return (
              <div 
                key={leito.id} 
                className={`bg-white rounded-2xl border ${config.border} p-5 shadow-sm hover:shadow-md transition-all group relative`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${config.bg}`}>
                    <config.icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${config.bg} ${config.color} border ${config.border}`}>
                    {config.label}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Leito {leito.numero}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4">{leito.ala}</p>
                  
                  {leito.status === 'ocupado' ? (
                    <div className="bg-hospital-navy/5 rounded-lg p-3 border border-hospital-navy/10 animate-in fade-in slide-in-from-top-1">
                      <p className="text-[10px] font-bold text-hospital-navy uppercase tracking-wider mb-1">Paciente Internado</p>
                      <p className="text-sm font-bold text-slate-700 truncate">{leito.paciente_nome}</p>
                    </div>
                  ) : leito.status === 'vago' ? (
                    <button 
                      onClick={() => { setSelectedLeito(leito); setShowModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold border border-teal-100 hover:bg-teal-600 hover:text-white transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      Internar Paciente
                    </button>
                  ) : (
                    <div className="h-[52px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Indisponível</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {leito.status === 'ocupado' ? 'Em atendimento' : 'Livre'}
                  </span>
                  
                  {leito.status === 'ocupado' && (
                    <button 
                      onClick={() => handleLiberar(leito.id)}
                      className="text-red-400 hover:text-red-600 transition-all p-1"
                      title="Dar Alta / Liberar Leito"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de Internação */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-hospital-navy">Internar Paciente</h3>
                  <p className="text-sm text-slate-500 font-medium">Selecione o paciente para o leito {selectedLeito?.numero}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <AlertCircle className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</label>
                  <select 
                    value={selectedPacienteId}
                    onChange={(e) => setSelectedPacienteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/20 transition-all"
                  >
                    <option value="">Selecione um paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} (CPF: {p.cpf})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleInternar}
                  disabled={!selectedPacienteId}
                  className="flex-1 px-4 py-3 text-sm font-bold bg-hospital-navy text-white rounded-xl shadow-lg shadow-hospital-navy/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  Confirmar Internação
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-navy"></div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReceptionBedsPage;
