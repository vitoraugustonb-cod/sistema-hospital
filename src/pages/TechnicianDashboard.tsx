import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, Clock, Thermometer, Activity, 
  Droplets, Heart, AlertCircle, Send 
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface Aprazamento {
  id: number;
  item: string;
  dosagem: string;
  via: string;
  horario_planejado: string;
  status: string;
}

const TechnicianDashboard: React.FC = () => {
  const [aprazamentos, setAprazamentos] = useState<Aprazamento[]>([]);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitals, setVitals] = useState({ temp: '', pa: '', sat: '', glic: '' });

  const fetchAprazamentos = async () => {
    try {
      // Para o protótipo, buscamos todos os aprazamentos pendentes
      const response = await axios.get('http://localhost:3001/api/pacientes/1/aprazamentos');
      setAprazamentos(response.data.filter((a: any) => a.status === 'pendente'));
    } catch (error) {
      console.error('Erro ao buscar tarefas');
    }
  };

  useEffect(() => {
    fetchAprazamentos();
  }, []);

  const handleCheck = async (id: number) => {
    try {
      await axios.post(`http://localhost:3001/api/aprazamentos/${id}/checar`);
      fetchAprazamentos();
    } catch (error) {
      alert('Erro ao checar medicação');
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/pacientes/1/sinais', vitals);
      setShowVitalsModal(false);
      setVitals({ temp: '', pa: '', sat: '', glic: '' });
      alert('Sinais vitais registrados com sucesso!');
    } catch (error) {
      alert('Erro ao salvar sinais vitais');
    }
  };

  return (
    <DashboardLayout title="Execução de Cuidados (Beira-leito)">
      <div className="flex flex-col gap-8">
        
        {/* Paciente Atual em Atendimento [REQ-23] */}
        <div className="hospital-card bg-hospital-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold">101</div>
            <div>
              <h3 className="text-xl font-bold leading-tight">João Paulo da Silva</h3>
              <p className="text-sm opacity-70 font-medium">Masculino • 42 anos • Estável</p>
            </div>
          </div>
          <button 
            onClick={() => setShowVitalsModal(true)}
            className="bg-hospital-teal hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-900/20"
          >
            <Thermometer className="w-5 h-5" />
            Registrar Sinais
          </button>
        </div>

        {/* Lista de Atividades do Plantão [REQ-23, REQ-25] */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tarefas Pendentes para o Horário
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aprazamentos.map((a) => (
              <div key={a.id} className="hospital-card flex items-center justify-between group hover:border-hospital-teal/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-hospital-navy border border-slate-100 font-bold">
                    {a.horario_planejado}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{a.item}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.dosagem} • {a.via}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCheck(a.id)}
                  className="bg-slate-50 hover:bg-teal-500 hover:text-white p-3 rounded-xl transition-all text-teal-600 border border-slate-100"
                >
                  <CheckCircle2 className="w-6 h-6" />
                </button>
              </div>
            ))}
            
            {aprazamentos.length === 0 && (
              <div className="col-span-2 p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto mb-3 opacity-30" />
                <p className="text-slate-400 font-medium text-sm">Todas as atividades deste horário foram concluídas.</p>
              </div>
            )}
          </div>
        </div>

        {/* Guia de Segurança do Paciente [REQ-20] */}
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
           <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
           <div>
             <h4 className="font-bold text-amber-800 text-sm mb-1 uppercase tracking-wider">Protocolo de Checagem Beira-leito</h4>
             <p className="text-xs text-amber-700 leading-relaxed">
               Sempre confirme o nome do paciente na pulseira antes de administrar qualquer medicação. Em caso de recusa ou intercorrência, informe imediatamente a enfermeira supervisora.
             </p>
           </div>
        </div>
      </div>

      {/* Modal de Sinais Vitais [REQ-24, REQ-27] */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-hospital-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in duration-300 overflow-hidden">
            <div className="bg-hospital-teal p-6 text-white flex items-center gap-3">
              <Activity className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">Registro de Sinais Vitais</h3>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Entrada de Dados Fisiológicos</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveVitals} className="p-8 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <Thermometer className="w-3 h-3" /> Temp. (°C)
                  </label>
                  <input 
                    type="number" step="0.1" required className="hospital-input-large" placeholder="36.5"
                    value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <Heart className="w-3 h-3" /> P.A. (mmHg)
                  </label>
                  <input 
                    required className="hospital-input-large" placeholder="120/80"
                    value={vitals.pa} onChange={e => setVitals({...vitals, pa: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <Droplets className="w-3 h-3" /> Saturação (%)
                  </label>
                  <input 
                    type="number" required className="hospital-input-large" placeholder="98"
                    value={vitals.sat} onChange={e => setVitals({...vitals, sat: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <Activity className="w-3 h-3" /> Glicemia (mg/dL)
                  </label>
                  <input 
                    type="number" className="hospital-input-large" placeholder="90"
                    value={vitals.glic} onChange={e => setVitals({...vitals, glic: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 font-bold text-white bg-hospital-teal hover:bg-teal-600 rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .hospital-input-large {
          @apply w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-hospital-teal/10 transition-all focus:bg-white text-hospital-navy font-bold text-center;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default TechnicianDashboard;
