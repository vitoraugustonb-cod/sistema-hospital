import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { LayoutDashboard, Lock, Globe, Bell, Save, CheckCircle2 } from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    notificacao_sinais: 'true',
    notificacao_evolucao: 'true',
    viacep_status: 'true',
    icp_brasil_status: 'false',
    timeout_inatividade: '15'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Erro ao buscar configurações');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post('http://localhost:3001/api/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Configurações do Sistema">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-hospital-navy border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurações do Sistema">
      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <h2 className="text-hospital-navy font-black text-lg uppercase tracking-tight">Painel de Controle TI</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie os parâmetros globais do HIS</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
              saveSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-hospital-navy text-white shadow-hospital-navy/20 hover:scale-105 active:scale-95'
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Segurança */}
          <div className="hospital-card flex flex-col gap-6">
            <div className="flex items-center gap-3 text-hospital-navy mb-2">
              <Lock className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-widest">Segurança & Acesso</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-black text-slate-700">JWT Token Secret</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Criptografia: RS256</p>
                </div>
                <span className="text-xs font-mono text-hospital-teal font-bold bg-white px-3 py-1 rounded-lg border border-slate-100">hospital_secret_key_2026</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-sm font-black text-slate-700">Bloqueio Automático</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Tempo de Inatividade</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.timeout_inatividade}
                    onChange={(e) => setSettings({...settings, timeout_inatividade: e.target.value})}
                    className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-hospital-navy outline-none focus:border-hospital-navy"
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Minutos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrações */}
          <div className="hospital-card flex flex-col gap-6">
            <div className="flex items-center gap-3 text-hospital-navy mb-2">
              <Globe className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-widest">Integrações API</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.viacep_status === 'true' ? 'bg-teal-50 border-teal-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <p className="text-sm font-black text-slate-700">ViaCEP Service</p>
                  <p className={`text-[10px] font-black uppercase tracking-tighter ${settings.viacep_status === 'true' ? 'text-teal-600' : 'text-slate-400'}`}>
                    {settings.viacep_status === 'true' ? 'Operacional / Ativo' : 'Desativado'}
                  </p>
                </div>
                <button 
                  onClick={() => handleToggle('viacep_status')}
                  className={`w-12 h-6 rounded-full relative transition-all ${settings.viacep_status === 'true' ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.viacep_status === 'true' ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.icp_brasil_status === 'true' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                  <p className="text-sm font-black text-slate-700">ICP-Brasil Signer</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Assinatura Digital Médica</p>
                </div>
                <button 
                  onClick={() => handleToggle('icp_brasil_status')}
                  className={`w-12 h-6 rounded-full relative transition-all ${settings.icp_brasil_status === 'true' ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.icp_brasil_status === 'true' ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* Notificações */}
          <div className="hospital-card flex flex-col gap-6">
            <div className="flex items-center gap-3 text-hospital-navy mb-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-widest">Notificações Críticas</h3>
            </div>
            
            <div className="flex flex-col gap-4">
               <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.notificacao_sinais === 'true' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Alerta Sinais Vitais</span>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Notificar médicos em caso de instabilidade</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('notificacao_sinais')}
                    className={`w-12 h-6 rounded-full relative transition-all ${settings.notificacao_sinais === 'true' ? 'bg-red-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notificacao_sinais === 'true' ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>

               <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.notificacao_evolucao === 'true' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Pendência Evolução</span>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Alerta de atraso em registros médicos</p>
                  </div>
                  <button 
                    onClick={() => handleToggle('notificacao_evolucao')}
                    className={`w-12 h-6 rounded-full relative transition-all ${settings.notificacao_evolucao === 'true' ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notificacao_evolucao === 'true' ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;
