import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, ShieldCheck, Search, Filter } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

interface User {
  id: number;
  nome: string;
  identificador: string;
  cargo: string;
  status: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ nome: '', identificador: '', senha: '', cargo: 'Medico' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/users', newUser);
      setShowModal(false);
      setNewUser({ nome: '', identificador: '', senha: '', cargo: 'Medico' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Deseja realmente excluir este usuário?')) {
      try {
        await axios.delete(`http://localhost:3001/api/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert('Erro ao excluir usuário');
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.identificador.includes(searchTerm)
  );

  return (
    <DashboardLayout title="Gestão de Usuários">
      <div className="flex flex-col gap-6">
        {/* Barra de Ações */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou CPF..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
            </button>
          </div>
          
          <button 
            onClick={() => setShowModal(true)}
            className="hospital-btn-primary flex items-center gap-2 py-2.5"
          >
            <UserPlus className="w-4 h-4" />
            Novo Profissional
          </button>
        </div>

        {/* Tabela de Usuários */}
        <div className="hospital-card overflow-hidden !p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profissional</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo / Perfil</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-hospital-navy/5 flex items-center justify-center text-hospital-navy font-bold text-xs">
                        {u.nome.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-700">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{u.identificador}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {u.cargo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-teal-600 font-bold text-xs uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                      Ativo
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={u.identificador === '000.000.000-00'}
                      className="text-slate-400 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 disabled:opacity-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">Nenhum profissional encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-hospital-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-300 overflow-hidden">
            <div className="bg-hospital-navy p-6 text-white flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-hospital-teal" />
              <div>
                <h3 className="font-bold text-lg">Cadastrar Novo Profissional</h3>
                <p className="text-navy-200 text-xs uppercase font-bold tracking-widest mt-0.5 opacity-70">Controle de Identidade de Saúde</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/20"
                    value={newUser.nome}
                    onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador (CPF/CRM...)</label>
                  <input 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/20"
                    value={newUser.identificador}
                    onChange={(e) => setNewUser({...newUser, identificador: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil de Acesso</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/20"
                    value={newUser.cargo}
                    onChange={(e) => setNewUser({...newUser, cargo: e.target.value})}
                  >
                    <option value="Medico">Médico</option>
                    <option value="Enfermeiro">Enfermeiro</option>
                    <option value="Tecnico">Técnico de Enfermagem</option>
                    <option value="Recepcao">Recepcionista</option>
                    <option value="TI">Analista de TI</option>
                  </select>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha Provisória</label>
                  <input 
                    type="password"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hospital-navy/20"
                    value={newUser.senha}
                    onChange={(e) => setNewUser({...newUser, senha: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-hospital-navy hover:bg-navy-800 transition-all shadow-lg shadow-hospital-navy/20"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsersPage;
