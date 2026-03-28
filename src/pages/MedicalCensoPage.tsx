import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Stethoscope, AlertTriangle, Clock, ArrowRight, Activity, Calendar, BedDouble } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface Patient {
  id: number;
  nome: string;
  idade: number;
  cpf: string;
  status: string;
  data_internacao: string;
}

const MedicalCensoPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pacientes');
      setPatients(response.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const calculateDays = (date: string) => {
    const start = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 dia' : `${diffDays} dias`;
  };

  return (
    <DashboardLayout title="Painel de Gestão (Censo Clínico)">
      <div className="flex flex-col gap-8">
        
        {/* Resumo de Alertas Médicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
            <div className="bg-slate-200 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alertas Críticos</p>
              <h4 className="text-xl font-bold text-slate-600 leading-tight">Nenhum</h4>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center gap-4">
            <div className="bg-slate-200 p-3 rounded-xl">
              <BedDouble className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Leitos Ocupados</p>
              <h4 className="text-xl font-bold text-slate-600 leading-tight">
                {patients.length} leito(s)
              </h4>
            </div>
          </div>

          <div className="bg-hospital-navy/5 border border-hospital-navy/10 p-5 rounded-2xl flex items-center gap-4">
            <div className="bg-hospital-navy p-3 rounded-xl shadow-lg shadow-hospital-navy/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-hospital-navy uppercase tracking-widest">Total de Pacientes</p>
              <h4 className="text-xl font-bold text-hospital-navy leading-tight">{patients.length} Paciente(s)</h4>
            </div>
          </div>
        </div>

        {/* Lista de Pacientes */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lista de Acompanhamento Clínico
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {patients.map((p) => (
              <div key={p.id} className="hospital-card hover:border-hospital-navy/20 transition-all flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/medico/paciente/${p.id}`)}>
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-hospital-navy group-hover:bg-hospital-navy group-hover:text-white transition-all">
                    <span className="text-[10px] font-bold uppercase tracking-tighter">ID</span>
                    <span className="text-lg font-bold">{p.id}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-slate-800 text-lg tracking-tight group-hover:text-hospital-navy transition-colors">{p.nome}</h4>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {p.idade} anos
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Internado há {calculateDays(p.data_internacao)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        Aguardando Evolução
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/medico/paciente/${p.id}`); }}
                    className="p-4 bg-slate-50 hover:bg-hospital-navy text-slate-400 hover:text-white rounded-2xl transition-all border border-slate-100"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {patients.length === 0 && !isLoading && (
              <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Você não possui pacientes sob sua responsabilidade no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MedicalCensoPage;
