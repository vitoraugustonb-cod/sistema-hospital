import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Pill, ChevronLeft, CheckSquare, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface Prescription {
  id: number;
  item: string;
  dosagem: string;
  via: string;
  intervalo: string;
  tipo: string;
  doses_totais: number;
  doses_restantes: number;
  status: string;
}

const NurseAprazamentoPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPresc, setSelectedPresc] = useState<Prescription | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [newHorario, setNewHorario] = useState('06:00');

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/pacientes/${id}/prescricoes`);
      // Ordenar: ativos primeiro, finalizados por último
      const sorted = response.data.sort((a: any, b: any) => {
        if (a.status === 'finalizado' && b.status !== 'finalizado') return 1;
        if (a.status !== 'finalizado' && b.status === 'finalizado') return -1;
        return 0;
      });
      setPrescriptions(sorted);
    } catch (error) {
      console.error('Erro ao buscar prescrições');
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [id]);

  const handleAddHorario = () => {
    if (!horarios.includes(newHorario)) {
      setHorarios([...horarios, newHorario].sort());
    }
  };

  const handleRemoveHorario = (h: string) => {
    setHorarios(horarios.filter(item => item !== h));
  };

  const handleSaveAprazamento = async () => {
    if (!selectedPresc || selectedPresc.status === 'finalizado') return;
    if (horarios.length === 0) {
      alert('Por favor, inclua ao menos um horário na lista antes de finalizar.');
      return;
    }
    
    try {
      // O servidor agora cuida de inserir os horários E descontar a quantidade correta de doses
      await axios.post('http://localhost:3001/api/aprazamentos', {
        prescricao_id: selectedPresc.id,
        paciente_id: id,
        horarios: horarios
      });
      
      alert(`Aprazamento concluído! ${horarios.length} dose(s) foram descontadas do total.`);
      setSelectedPresc(null);
      setHorarios([]);
      fetchPrescriptions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao processar aprazamento');
    }
  };

  return (
    <DashboardLayout title="Aprazamento de Prescrição">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/enfermeiro')} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-hospital-navy uppercase tracking-widest text-sm">Distribuição Técnica de Horários</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Lista de Prescrições do Médico */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Prescrições Médicas do Paciente</h3>
            {prescriptions.map((p) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPresc(p)}
                className={`hospital-card cursor-pointer transition-all border-2 relative overflow-hidden ${
                  p.status === 'finalizado' ? 'opacity-60 bg-slate-50 grayscale' :
                  selectedPresc?.id === p.id ? 'border-hospital-navy bg-hospital-navy/5 shadow-lg' : 'border-transparent hover:border-slate-200'
                }`}
              >
                {p.status === 'finalizado' && (
                  <div className="absolute top-2 right-2 bg-slate-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Finalizado</div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.item}</p>
                    <p className="text-xs text-slate-500 font-medium">{p.dosagem} • {p.via} • {p.intervalo}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-hospital-navy uppercase tracking-widest">Doses</span>
                    <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md">
                      {p.doses_restantes} / {p.doses_totais}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Painel de Aprazamento */}
          <div className="flex flex-col gap-6">
            <div className="hospital-card bg-white min-h-[400px] flex flex-col">
              {!selectedPresc ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                  <Clock className="w-16 h-16" />
                  <p className="text-sm font-medium text-center">Selecione uma prescrição à esquerda <br/> para gerenciar as doses e horários</p>
                </div>
              ) : selectedPresc.status === 'finalizado' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-emerald-500 gap-4">
                  <CheckSquare className="w-16 h-16" />
                  <p className="font-bold uppercase tracking-widest text-sm">Medicação Finalizada</p>
                  <p className="text-xs text-slate-400 text-center">Todas as doses prescritas foram <br/> administradas/aprazadas com sucesso.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Item em Execução</h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-hospital-navy">{selectedPresc.item}</p>
                        <p className="text-xs text-slate-500">Doses restantes: {selectedPresc.doses_restantes}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-hospital-teal flex items-center justify-center font-black text-hospital-teal text-xs">
                        {Math.round((selectedPresc.doses_restantes / selectedPresc.doses_totais) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Planejar Próximos Horários (Opcional)</h4>
                    <div className="flex gap-3 items-end mb-6">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Horário</label>
                        <input 
                          type="time" 
                          className="hospital-input"
                          value={newHorario}
                          onChange={(e) => setNewHorario(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handleAddHorario}
                        className="hospital-btn-secondary h-[42px] px-6 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Incluir
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {horarios.map((h) => (
                        <div key={h} className="bg-hospital-navy/5 border border-hospital-navy/10 px-3 py-2.5 rounded-xl flex items-center justify-between group">
                          <span className="text-sm font-bold text-hospital-navy">{h}</span>
                          <button onClick={() => handleRemoveHorario(h)} className="text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50">
                    <button 
                      onClick={handleSaveAprazamento}
                      className="w-full hospital-btn-primary py-4 shadow-xl shadow-hospital-navy/20 flex flex-col items-center justify-center gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        <span className="font-black uppercase tracking-[0.1em]">Finalizar Aprazamento Técnico</span>
                      </div>
                      <span className="text-[9px] opacity-70">ISSO IRÁ DESCONTAR 1 DOSE DO TOTAL</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
               <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
               <p className="text-xs text-amber-700 leading-relaxed">
                 <b>Regra de Dose:</b> Cada vez que você finaliza o aprazamento técnico, o sistema desconta uma unidade do estoque prescrito pelo médico.
               </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hospital-input {
          @apply w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/10 transition-all focus:bg-white text-slate-700 font-medium;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default NurseAprazamentoPage;
