import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Search, MapPin, Fingerprint, Phone, Users, ArrowRight, BedDouble, AlertCircle } from 'lucide-react';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import DashboardLayout from '../components/DashboardLayout';

interface Patient {
  id: number;
  nome: string;
  cpf: string;
  idade: number;
  telefone: string;
  status: string;
  solicitacao_internacao: number;
  sexo: string;
  rg: string;
  mae: string;
  pai: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  data_internacao: string;
}

const ReceptionPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '', idade: '', rg: '', cpf: '', sexo: 'Masculino',
    mae: '', pai: '', email: '', telefone: '',
    cep: '', endereco: '', numero: '', complemento: '',
    bairro: '', cidade: '', uf: ''
  });

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/pacientes');
      setPatients(response.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes');
    }
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCancelSolicitacao = async (e: React.MouseEvent, patientId: number) => {
    e.stopPropagation();
    try {
      await axios.post(`http://localhost:3001/api/pacientes/${patientId}/cancelar-solicitacao`);
      fetchPatients();
    } catch (error) {
      alert('Erro ao atualizar solicitação');
    }
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: response.data.logradouro,
            bairro: response.data.bairro,
            cidade: response.data.localidade,
            uf: response.data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpfValidator.isValid(formData.cpf)) {
      alert('CPF Inválido! Por favor, verifique os dados.');
      return;
    }

    try {
      await axios.post('http://localhost:3001/api/pacientes', formData);
      setShowModal(false);
      setFormData({
        nome: '', idade: '', rg: '', cpf: '', sexo: 'Masculino',
        mae: '', pai: '', email: '', telefone: '',
        cep: '', endereco: '', numero: '', complemento: '',
        bairro: '', cidade: '', uf: ''
      });
      fetchPatients();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao cadastrar paciente');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.cpf.includes(searchTerm)
  );

  return (
    <DashboardLayout title="Gestão de Pacientes">
      <div className="flex flex-col gap-6">
        {/* Header de Ações */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="hospital-btn-primary flex items-center gap-2 py-2.5 shadow-lg shadow-hospital-navy/10"
          >
            <UserPlus className="w-4 h-4" />
            Admitir Novo Paciente
          </button>
        </div>

        {/* Lista de Pacientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((p) => (
            <div key={p.id} className={`hospital-card hover:border-hospital-navy/20 transition-all group cursor-pointer relative overflow-hidden ${p.solicitacao_internacao === 1 ? 'ring-2 ring-amber-500 bg-amber-50/30' : ''}`} onClick={() => handleViewDetails(p)}>
              {p.solicitacao_internacao === 1 && (
                <div className="absolute top-0 left-0 w-full bg-amber-500 py-1 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                   <BedDouble className="w-3 h-3 text-white" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Internação Solicitada pelo Médico</span>
                </div>
              )}
              
              <div className={`absolute top-0 right-0 p-3 ${p.solicitacao_internacao === 1 ? 'mt-6' : ''}`}>
                 <span className="px-2 py-1 rounded-md bg-teal-50 text-teal-600 text-[10px] font-bold uppercase border border-teal-100">
                   {p.status}
                 </span>
              </div>
              
              <div className={`flex items-center gap-4 mb-4 ${p.solicitacao_internacao === 1 ? 'mt-8' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-hospital-navy font-bold text-lg border border-slate-100 group-hover:bg-hospital-navy group-hover:text-white transition-all">
                  {p.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight group-hover:text-hospital-navy transition-colors">{p.nome}</h3>
                  <p className="text-xs text-slate-500 font-medium">{p.idade} anos • {p.cpf}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {p.telefone || '(00) 00000-0000'}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                {p.solicitacao_internacao === 1 && (
                  <button 
                    onClick={(e) => handleCancelSolicitacao(e, p.id)}
                    className="text-amber-600 hover:text-amber-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Ignorar Alerta
                  </button>
                )}
                <button className="text-hospital-navy font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all ml-auto">
                  Ver Ficha Completa
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">Nenhum paciente encontrado na base de dados.</p>
          </div>
        )}

        {/* Modal de Detalhes da Ficha */}
        {showDetailsModal && selectedPatient && (
          <div className="fixed inset-0 bg-hospital-navy/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
              <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-hospital-teal/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                 <div className="relative z-10 flex justify-between items-start">
                    <div className="flex gap-6 items-center">
                       <div className="w-20 h-20 rounded-3xl bg-hospital-teal flex items-center justify-center text-3xl font-black shadow-xl shadow-hospital-teal/20">
                          {selectedPatient.nome.charAt(0)}
                       </div>
                       <div>
                          <h2 className="text-3xl font-black tracking-tight">{selectedPatient.nome}</h2>
                          <p className="text-hospital-teal font-bold uppercase tracking-[0.3em] text-[10px] mt-1">Prontuário Administrativo #{selectedPatient.id}</p>
                          <div className="flex gap-3 mt-4">
                             <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase border border-white/10">CPF: {selectedPatient.cpf}</span>
                             <span className="px-3 py-1 bg-hospital-teal/20 text-hospital-teal rounded-full text-[10px] font-bold uppercase border border-hospital-teal/20">{selectedPatient.status}</span>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setShowDetailsModal(false)} className="bg-white/10 hover:bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all">×</button>
                 </div>
              </div>

              <div className="p-10 grid grid-cols-2 gap-10 bg-slate-50/50">
                 <div className="space-y-6">
                    <div>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Fingerprint className="w-3 h-3" /> Dados Pessoais
                       </h4>
                       <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-400 font-bold">Idade</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.idade} anos</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-400 font-bold">Gênero</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.sexo}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                             <span className="text-xs text-slate-400 font-bold">RG</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.rg || 'Não informado'}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-xs text-slate-400 font-bold">Contato</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.telefone || 'Sem telefone'}</span>
                          </div>
                       </div>
                    </div>

                    <div>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Users className="w-3 h-3" /> Filiação
                       </h4>
                       <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex flex-col gap-1">
                             <span className="text-[9px] text-slate-400 font-bold uppercase">Mãe</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.mae || 'Não informado'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[9px] text-slate-400 font-bold uppercase">Pai</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.pai || 'Não informado'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Localização
                       </h4>
                       <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                          <div className="flex flex-col gap-1">
                             <span className="text-[9px] text-slate-400 font-bold uppercase">Endereço</span>
                             <span className="text-xs text-slate-700 font-black leading-relaxed">
                                {selectedPatient.endereco}, {selectedPatient.numero}
                                {selectedPatient.complemento && ` - ${selectedPatient.complemento}`}
                             </span>
                          </div>
                          <div className="flex justify-between border-t border-slate-50 pt-2">
                             <span className="text-xs text-slate-400 font-bold">Bairro</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.bairro}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-xs text-slate-400 font-bold">Cidade/UF</span>
                             <span className="text-xs text-slate-700 font-black">{selectedPatient.cidade} - {selectedPatient.uf}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-xs text-slate-400 font-bold">CEP</span>
                             <span className="text-xs text-hospital-navy font-black">{selectedPatient.cep}</span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-hospital-navy rounded-3xl p-6 text-white shadow-lg shadow-hospital-navy/20 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                       <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50 mb-4">Registro de Sistema</h4>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                             <ArrowRight className="w-5 h-5 text-hospital-teal" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold opacity-60">Data de Admissão</p>
                             <p className="text-sm font-black">{new Date(selectedPatient.data_internacao).toLocaleDateString('pt-BR')} às {new Date(selectedPatient.data_internacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
                 <button 
                    onClick={() => setShowDetailsModal(false)}
                    className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                 >
                    Fechar Ficha Administrativa
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Admissão */}
        {showModal && (
          <div className="fixed inset-0 bg-hospital-navy/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white/20">
              <div className="bg-gradient-to-r from-hospital-navy to-navy-800 p-8 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                    <UserPlus className="w-6 h-6 text-hospital-teal" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl tracking-tight">Admissão de Paciente</h3>
                    <div className="flex items-center gap-2 opacity-80">
                      <span className="w-2 h-2 rounded-full bg-hospital-teal animate-pulse"></span>
                      <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Fluxo de Registro Hospitalar v2.0</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-2xl font-light"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 overflow-y-auto flex flex-col gap-10 custom-scrollbar">
                <div className="relative group">
                  <div className="flex items-center gap-3 text-hospital-navy mb-6">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-hospital-navy group-hover:text-white transition-all">
                      <Fingerprint className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest">Dados de Identificação Básica</h4>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo do Paciente</label>
                      <input 
                        required 
                        placeholder="Ex: João da Silva Sauro"
                        className="hospital-input-v2" 
                        value={formData.nome} 
                        onChange={e => setFormData({...formData, nome: e.target.value})} 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">CPF (Documento)</label>
                      <input 
                        required 
                        placeholder="000.000.000-00" 
                        className="hospital-input-v2" 
                        value={formData.cpf} 
                        onChange={e => setFormData({...formData, cpf: e.target.value})} 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">RG / Identidade</label>
                      <input 
                        placeholder="00.000.000-0"
                        className="hospital-input-v2" 
                        value={formData.rg} 
                        onChange={e => setFormData({...formData, rg: e.target.value})} 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Idade</label>
                      <input 
                        type="number" 
                        placeholder="00"
                        className="hospital-input-v2" 
                        value={formData.idade} 
                        onChange={e => setFormData({...formData, idade: e.target.value})} 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Gênero</label>
                      <select 
                        className="hospital-input-v2 appearance-none" 
                        value={formData.sexo} 
                        onChange={e => setFormData({...formData, sexo: e.target.value})}
                      >
                        <option>Masculino</option>
                        <option>Feminino</option>
                        <option>Outro</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Telefone Principal</label>
                      <input 
                        placeholder="(00) 00000-0000" 
                        className="hospital-input-v2" 
                        value={formData.telefone} 
                        onChange={e => setFormData({...formData, telefone: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 mt-4 shrink-0 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-5 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border-2 border-transparent hover:border-slate-100"
                  >
                    Cancelar Admissão
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-5 px-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white bg-hospital-navy hover:bg-navy-800 transition-all shadow-2xl shadow-hospital-navy/30 flex items-center justify-center gap-3 group"
                  >
                    Confirmar Registro
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          .hospital-input-v2 {
            @apply w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-hospital-navy/5 focus:border-hospital-navy/30 transition-all focus:bg-white text-slate-700 font-semibold placeholder:text-slate-300 placeholder:font-normal;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            @apply bg-slate-200 rounded-full hover:bg-slate-300 transition-colors;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionPatientsPage;
