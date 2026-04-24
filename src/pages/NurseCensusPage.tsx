import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, Clock, AlertCircle, ArrowRight, User, Stethoscope, Inbox } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface Patient {
  id: number;
  nome: string;
  idade: number;
  status: string;
}

const NurseCensusPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/pacientes');
        setPatients(response.data);
      } catch (error) {
        console.error('Erro ao buscar pacientes');
      }
    };
    fetchPatients();
  }, []);

  return (
    <DashboardLayout title="Censo de Enfermagem">
      <div className="flex flex-col gap-8">
        
        {/* Painel de Avisos */}
        <div className="bg-gradient-to-r from-hospital-navy to-navy-800 p-8 rounded-[2rem] text-white flex justify-between items-center shadow-2xl shadow-hospital-navy/20">
           <div>
              <h2 className="text-2xl font-black tracking-tight">
                {patients.length > 0 
                  ? `${patients.length} ${patients.length === 1 ? 'paciente internado' : 'pacientes internados'}` 
                  : 'Nenhum paciente no plantão'}
              </h2>
              <p className="opacity-70 text-xs font-bold uppercase tracking-widest mt-1">
                {patients.length > 0 
                  ? 'Aguardando revisão de aprazamento e cuidados clínicos' 
                  : 'Admita um paciente na recepção para iniciar o censo'}
              </p>
           </div>
           <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <Stethoscope className="w-8 h-8 text-hospital-teal" />
           </div>
        </div>

        {/* Lista de Pacientes para Aprazamento */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Pendências Clínicas por Paciente</h3>

          <div className="grid grid-cols-1 gap-4">
            {patients.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-hospital-navy/20 transition-all flex items-center justify-between group shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-hospital-navy font-black text-xl border border-slate-100 group-hover:bg-hospital-navy group-hover:text-white transition-all">
                    {p.nome.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg tracking-tight group-hover:text-hospital-navy transition-colors">{p.nome}</h4>
                    <div className="flex gap-3 mt-1">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.idade} anos</span>
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 rounded-md">Estável</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prescrição Médica</span>
                    <div className="flex items-center gap-1.5 text-xs font-black text-hospital-navy bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <ClipboardList className="w-3.5 h-3.5" />
                      Ativa
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/enfermeiro/aprazamento/${p.id}`)}
                    className="flex items-center gap-3 bg-hospital-navy hover:bg-navy-800 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg shadow-hospital-navy/20"
                  >
                    Abrir Aprazamento
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {patients.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center text-slate-300 gap-4 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <Inbox className="w-12 h-12 opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest text-center">
                  O censo está vazio.<br/>
                  <span className="text-[10px] font-bold opacity-60">Aguardando admissão de novos pacientes pela recepção.</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NurseCensusPage;
