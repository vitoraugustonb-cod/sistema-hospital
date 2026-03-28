import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ClipboardList, History as HistoryIcon, Pill, HeartPulse, 
  ChevronLeft, Send, CheckCircle2, AlertCircle, Plus, Microscope, Activity, Thermometer, Droplets, Clock, Info,
  LogOut, FileText, X, ShieldCheck, Lock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ReferenceArea
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';

interface Evolution {
  id: number;
  medico_nome: string;
  texto: string;
  data_hora: string;
  tipo_registro: 'evolucao';
  assinado_digitalmente?: number;
}

interface Exam {
  id: number;
  medico_nome: string;
  tipo: string;
  resultado: string;
  status: string;
  data_solicitacao: string;
  tipo_registro: 'exame';
}

interface Prescription {
  id: number;
  item: string;
  dosagem: string;
  via: string;
  intervalo: string;
  tipo: string;
  data_hora: string;
  medico_nome: string;
  assinado_digitalmente?: number;
}

interface Patient {
  id: number;
  nome: string;
  idade: number;
  sexo: string;
  status: string;
  data_internacao: string;
  data_alta?: string;
  sumario_alta?: string;
}

interface VitalSigns {
  id: number;
  temp: number;
  pa_sistolica: number;
  pa_diastolica: number;
  fc: number;
  fr: number;
  sato2: number;
  observacoes: string;
  data_hora: string;
}

const MedicalPepPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'evolucao' | 'prescricao' | 'sinais'>('evolucao');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '12h' | '24h'>('12h');
  
  const [settings, setSettings] = useState<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'evolucao' | 'prescricao', data: any} | null>(null);

  const [newEvolution, setNewEvolution] = useState('');
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [isDischarging, setIsDischarging] = useState(false);

  const [newVital, setNewVital] = useState({
    temp: 36.7, pa_sistolica: 129, pa_diastolica: 86, fc: 81, fr: 16, sato2: 92, observacoes: ''
  });

  const [newPresc, setNewPresc] = useState({
    item: '', dosagem: '', via: 'Oral', intervalo: '8h/8h', tipo: 'medicamento', doses_totais: 3, duracao_dias: 1
  });

  const fetchData = async () => {
    try {
      const [evResp, prResp, pacResp, exResp, vitResp, setResp] = await Promise.all([
        axios.get(`http://localhost:3001/api/pacientes/${id}/evolucoes`),
        axios.get(`http://localhost:3001/api/pacientes/${id}/prescricoes`),
        axios.get(`http://localhost:3001/api/pacientes/historico`),
        axios.get(`http://localhost:3001/api/pacientes/${id}/exames`),
        axios.get(`http://localhost:3001/api/pacientes/${id}/sinais`),
        axios.get(`http://localhost:3001/api/settings`)
      ]);

      const internadosResp = await axios.get(`http://localhost:3001/api/pacientes`);
      const allPatients = [...internadosResp.data, ...pacResp.data];
      const currentPatient = allPatients.find((p: any) => p.id === Number(id));
      setPatient(currentPatient);
      
      setEvolutions(evResp.data.map((ev: any) => ({ ...ev, tipo_registro: 'evolucao' })));
      setPrescriptions(prResp.data);
      setExams(exResp.data.map((ex: any) => ({ ...ex, tipo_registro: 'exame' })));
      setVitalSigns(vitResp.data);
      setSettings(setResp.data);
      
    } catch (error) {
      console.error('Erro ao buscar dados do PEP');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleProcessAction = async (type: 'evolucao' | 'prescricao', data: any, signed: boolean = false) => {
    try {
      const url = type === 'evolucao' 
        ? `http://localhost:3001/api/pacientes/${id}/evolucoes`
        : `http://localhost:3001/api/pacientes/${id}/prescricoes`;
      
      await axios.post(url, { ...data, assinado_digitalmente: signed });
      
      if (type === 'evolucao') setNewEvolution('');
      if (type === 'prescricao') setNewPresc({ item: '', dosagem: '', via: 'Oral', intervalo: '8h/8h', tipo: 'medicamento', doses_totais: 3, duracao_dias: 1 });
      
      fetchData();
      setPin('');
      setShowPinModal(false);
      setPendingAction(null);
    } catch (error) {
      alert('Erro ao salvar registro');
    }
  };

  const handleVerifyPin = () => {
    if (pin === '1234') { // PIN Simulado para teste
      if (pendingAction) {
        handleProcessAction(pendingAction.type, pendingAction.data, true);
      }
    } else {
      alert('PIN do Certificado Digital Inválido! Tente "1234" para testar.');
    }
  };

  const handleAddEvolution = async () => {
    if (!newEvolution.trim()) return;
    const data = { texto: newEvolution };
    
    if (settings?.icp_brasil_status === 'true') {
      setPendingAction({ type: 'evolucao', data });
      setShowPinModal(true);
    } else {
      handleProcessAction('evolucao', data, false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = newPresc;
    
    if (settings?.icp_brasil_status === 'true') {
      setPendingAction({ type: 'prescricao', data });
      setShowPinModal(true);
    } else {
      handleProcessAction('prescricao', data, false);
    }
  };

  const handleDischarge = async () => {
    if (!dischargeSummary.trim()) {
      alert('Por favor, preencha o sumário de alta.');
      return;
    }

    setIsDischarging(true);
    try {
      await axios.post(`http://localhost:3001/api/pacientes/${id}/alta`, { sumario: dischargeSummary });
      alert('Alta realizada com sucesso!');
      setShowDischargeModal(false);
      navigate('/medico');
    } catch (error) {
      alert('Erro ao realizar alta médica.');
    } finally {
      setIsDischarging(false);
    }
  };

  const timeline = useMemo(() => {
    return [...evolutions, ...exams.filter(ex => ex.status === 'Concluído' && ex.resultado)]
      .sort((a, b) => {
        const dateA = new Date(a.tipo_registro === 'evolucao' ? a.data_hora : a.data_solicitacao).getTime();
        const dateB = new Date(b.tipo_registro === 'evolucao' ? b.data_hora : b.data_solicitacao).getTime();
        return dateB - dateA;
      });
  }, [evolutions, exams]);

  const chartData = useMemo(() => {
    return [...vitalSigns].reverse().map(v => ({
      hora: new Date(v.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      temp: v.temp,
      fc: v.fc,
      sato2: v.sato2,
      pas: v.pa_sistolica,
      pad: v.pa_diastolica,
      timestamp: new Date(v.data_hora).getTime()
    }));
  }, [vitalSigns]);

  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3001/api/pacientes/${id}/sinais`, newVital);
      setNewVital({...newVital, observacoes: ''});
      fetchData();
    } catch (error) { alert('Erro ao salvar sinais vitais'); }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl text-white min-w-[180px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
            <Clock className="w-3 h-3" /> {label}
          </p>
          <div className="flex flex-col gap-2.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-bold uppercase" style={{ color: entry.color }}>{entry.name}</span>
                <span className="text-sm font-black tracking-tight">{entry.value}{entry.name === 'TEMP' ? '°C' : entry.name === 'SaO2' ? '%' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout title="Prontuário Eletrônico do Paciente">
      <div className="flex flex-col gap-6">
        {/* Header Clínico */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/medico')} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${patient?.status === 'alta' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-hospital-navy shadow-hospital-navy/20'}`}>
              {patient?.nome.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-hospital-navy">{patient?.nome || 'Carregando...'}</h2>
                {patient?.status === 'alta' && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                    Paciente com Alta Médica
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500">
                {patient?.idade} anos • {patient?.sexo} • Internação: {patient ? new Date(patient.data_internacao).toLocaleDateString('pt-BR') : '...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {patient?.status === 'internado' && (
              <button 
                onClick={() => setShowDischargeModal(true)}
                className="px-6 py-2.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Dar Alta Médica
              </button>
            )}
            <div className="bg-slate-50 text-slate-500 px-4 py-2 rounded-lg border border-slate-100 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <AlertCircle className="w-4 h-4" /> Sem Alergias Relatadas
            </div>
          </div>
        </div>

        {patient?.status === 'alta' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <h4 className="text-emerald-700 font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Sumário de Alta Médica
            </h4>
            <p className="text-sm text-emerald-800 font-medium leading-relaxed">
              {patient.sumario_alta}
            </p>
            <p className="mt-4 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              Alta realizada em: {new Date(patient.data_alta!).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { id: 'evolucao', label: 'Linha do Tempo', icon: ClipboardList },
            { id: 'prescricao', label: 'Prescrição', icon: Pill },
            { id: 'sinais', label: 'Sinais Vitais', icon: HeartPulse }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-hospital-navy shadow-sm' : 'text-slate-500 hover:text-hospital-navy'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 gap-6">
          
          {activeTab === 'evolucao' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4">
                {patient?.status === 'internado' && (
                  <div className="hospital-card p-6">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nova Evolução Diária</h4>
                       {settings?.icp_brasil_status === 'true' && (
                         <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                            <ShieldCheck className="w-3.5 h-3.5" /> Assinatura Digital Requerida
                         </span>
                       )}
                    </div>
                    <textarea 
                      className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/10"
                      placeholder="Relate o estado atual do paciente..."
                      value={newEvolution}
                      onChange={(e) => setNewEvolution(e.target.value)}
                    />
                    <div className="flex justify-end mt-4">
                      <button onClick={handleAddEvolution} className="hospital-btn-primary flex items-center gap-2">
                        <Send className="w-4 h-4" /> Salvar e Assinar
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  {timeline.map((item) => (
                    <div key={`${item.tipo_registro}-${item.id}`} className={`hospital-card border-l-4 ${item.tipo_registro === 'evolucao' ? 'border-l-hospital-navy' : 'border-l-purple-500 bg-purple-50/20'}`}>
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">{item.tipo_registro === 'evolucao' ? `Dr(a). ${item.medico_nome}` : `Exame: ${item.tipo}`}</span>
                          {item.tipo_registro === 'evolucao' && item.assinado_digitalmente === 1 && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">
                               <ShieldCheck className="w-3 h-3" /> Doc. Assinado Digitalmente
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(item.tipo_registro === 'evolucao' ? item.data_hora : item.data_solicitacao).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-sm text-slate-600">{item.tipo_registro === 'evolucao' ? item.texto : item.resultado}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hospital-card bg-hospital-navy text-white h-fit">
                <h4 className="font-bold text-sm mb-2 uppercase opacity-80">Orientações</h4>
                <p className="text-sm opacity-90">{patient?.status === 'alta' ? 'Paciente recebeu alta clínica.' : 'Paciente estável. Monitorar saturação.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'sinais' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-700">
              {/* ... (Conteúdo de Sinais Vitais - Mantido igual) ... */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="hospital-card min-h-[500px] flex flex-col">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-lg font-black text-hospital-navy tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Tendências Clínicas Multiparamétricas
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitoramento Dinâmico em Tempo Real</p>
                    </div>
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                      {['1h', '6h', '12h', '24h'].map(range => (
                        <button key={range} onClick={() => setTimeRange(range as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeRange === range ? 'bg-white text-hospital-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{range}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="hora" fontSize={10} fontWeight="black" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis fontSize={10} fontWeight="black" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} domain={[30, 200]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '5 5' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '30px' }} />
                        <ReferenceArea y1={37.5} y2={42} fill="#fee2e2" fillOpacity={0.3} />
                        <ReferenceArea y1={30} y2={35} fill="#fee2e2" fillOpacity={0.3} />
                        <ReferenceLine y={37.5} stroke="#ef4444" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="temp" name="TEMP" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="sato2" name="SaO2" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="fc" name="FC" stroke="#1e293b" strokeWidth={4} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="pas" name="PAS" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="pad" name="PAD" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                {patient?.status === 'internado' && (
                  <div className="hospital-card border-2 border-hospital-navy/5 bg-slate-50/30 flex flex-col gap-8">
                    <div><h3 className="text-sm font-black text-hospital-navy uppercase tracking-widest mb-1">Monitoramento Atual</h3></div>
                    <form onSubmit={handleAddVital} className="flex flex-col gap-4">
                      <textarea className="w-full h-24 bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-600 focus:ring-4 focus:ring-hospital-navy/5 focus:border-hospital-navy/20 outline-none transition-all placeholder:text-slate-300" placeholder="Observações..." value={newVital.observacoes} onChange={(e) => setNewVital({...newVital, observacoes: e.target.value})} />
                      <button type="submit" className="bg-hospital-navy text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-hospital-navy/20">SALVAR AFERIÇÃO</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'prescricao' && (
            <div className="flex flex-col gap-6">
               {patient?.status === 'internado' && (
                 <div className="hospital-card">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold">Nova Prescrição</h3>
                       {settings?.icp_brasil_status === 'true' && (
                         <span className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                            <ShieldCheck className="w-3.5 h-3.5" /> Assinatura Requerida
                         </span>
                       )}
                    </div>
                    <form onSubmit={handleAddPrescription} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input className="hospital-input-v3" placeholder="Medicamento" value={newPresc.item} onChange={e => setNewPresc({...newPresc, item: e.target.value})} />
                      <select className="hospital-input-v3" value={newPresc.via} onChange={e => setNewPresc({...newPresc, via: e.target.value})}><option>Oral</option><option>Endovenosa</option></select>
                      <select className="hospital-input-v3" value={newPresc.intervalo} onChange={e => setNewPresc({...newPresc, intervalo: e.target.value})}><option>8h/8h</option><option>12h/12h</option></select>
                      <button type="submit" className="hospital-btn-primary">Prescrever</button>
                    </form>
                 </div>
               )}
               <div className="hospital-card !p-0 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Item</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">Assinatura</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Via</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Intervalo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map(pr => (
                        <tr key={pr.id} className="border-b border-slate-50">
                          <td className="px-6 py-4 text-sm font-bold">{pr.item}</td>
                          <td className="px-6 py-4 text-center">
                             {pr.assinado_digitalmente === 1 ? (
                               <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 mx-auto w-fit">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span className="text-[8px] font-black uppercase tracking-tighter">ICP-BRASIL</span>
                               </div>
                             ) : <span className="text-[10px] text-slate-300 font-bold uppercase">Simples</span>}
                          </td>
                          <td className="px-6 py-4 text-sm">{pr.via}</td>
                          <td className="px-6 py-4 text-sm font-bold">{pr.intervalo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE ASSINATURA DIGITAL (PIN) */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-indigo-600 p-8 text-white text-center relative">
              <button onClick={() => setShowPinModal(false)} className="absolute top-6 right-6 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Assinatura Digital</h3>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">ICP-Brasil Security Module</p>
            </div>
            
            <div className="p-8 flex flex-col gap-6">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed">
                  Para assinar este documento clínico, insira o seu **PIN de Segurança**.
                </p>
                <input 
                  type="password"
                  className="w-full text-center text-3xl tracking-[0.5em] font-black py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all"
                  maxLength={4}
                  placeholder="****"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleVerifyPin}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.95] transition-all"
                >
                  AUTENTICAR E ASSINAR
                </button>
                <button 
                  onClick={() => setShowPinModal(false)}
                  className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest"
                >
                  CANCELAR OPERAÇÃO
                </button>
              </div>
              
              <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-2 opacity-40">
                 <ShieldCheck className="w-3.5 h-3.5" />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em]">Criptografia de Nível Militar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALTA MÉDICA (Resto do componente mantido) */}
      {showDischargeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-hospital-navy p-8 text-white relative">
              <button onClick={() => setShowDischargeModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
              <LogOut className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-2xl font-black tracking-tight">Finalizar Alta Médica</h3>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <textarea className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-600 outline-none" placeholder="Orientações de alta..." value={dischargeSummary} onChange={(e) => setDischargeSummary(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setShowDischargeModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">Cancelar</button>
                <button onClick={handleDischarge} disabled={isDischarging} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg">{isDischarging ? 'PROCESSANDO...' : 'CONFIRMAR ALTA CLÍNICA'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hospital-input-v3 {
          @apply w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-hospital-navy/5 focus:border-hospital-navy/20 transition-all focus:bg-white text-slate-700 font-bold placeholder:text-slate-300;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default MedicalPepPage;
