import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Subject, Group, Profile, Role } from '../types';
import { Icons, availableIcons } from '../components/Icons';

type AdminView = 'dashboard' | 'users' | 'groups' | 'subjects';

export const AdminPanel: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  
  const [stats, setStats] = useState({ users: 0, groups: 0, files: 0, storage: '0' });
  const [users, setUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  useEffect(() => {
    if (profile?.role !== 'admin') {
        navigate('/');
        return;
    }
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
      const s = await Service.getAdminStats();
      setStats(s);
  };

  const loadUsers = async () => {
      const u = await Service.getAllUsers();
      setUsers(u);
  };

  const loadGroups = async () => {
      const g = await Service.getGroups();
      setGroups(g);
  };

  const loadSubjects = async () => {
      const s = await Service.getAllSubjects();
      setSubjects(s);
      const g = await Service.getGroups();
      setGroups(g);
  };

  const handleViewChange = (view: AdminView) => {
      setCurrentView(view);
      setSearchTerm('');
      if (view === 'users') loadUsers();
      if (view === 'groups') loadGroups();
      if (view === 'subjects') loadSubjects();
      if (view === 'dashboard') loadDashboardData();
  };

  const handleUpdateUserRole = async (userId: string, newRole: Role) => {
      if (userId === user?.id && newRole !== 'admin') {
          if(!window.confirm("ATENÇÃO: Você está removendo seus próprios privilégios de Admin. Você perderá acesso a esta tela imediatamente. Continuar?")) return;
      }
      await Service.updateUserRole(userId, newRole);
      loadUsers();
  };

  const deleteGroup = async (id: string) => {
      if(window.confirm("ATENÇÃO: Apagar uma turma excluirá TODAS as matérias e arquivos associados a ela. Esta ação é irreversível.")) {
          await Service.deleteGroup(id);
          loadGroups();
      }
  };

  const deleteSubject = async (id: string) => {
      if(window.confirm("Apagar esta matéria excluirá todos os arquivos vinculados.")) {
          await Service.deleteSubject(id);
          loadSubjects();
      }
  };

  const renderSidebar = () => (
      <div className="w-full md:w-64 bg-white dark:bg-[#121212] border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex flex-row md:flex-col shrink-0 overflow-x-auto md:overflow-visible">
          <div className="p-6 hidden md:block">
              <div className="flex items-center space-x-2 text-[#7900c5]">
                  <Icons.Shield className="w-8 h-8" />
                  <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Admin</span>
              </div>
          </div>
          
          <div className="flex-1 px-4 py-2 md:py-0 space-x-2 md:space-x-0 md:space-y-1 flex md:flex-col">
              <button onClick={() => handleViewChange('dashboard')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentView === 'dashboard' ? 'bg-[#7900c5] text-white shadow-lg shadow-purple-200 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Icons.Home className="w-5 h-5" />
                  <span>Visão Geral</span>
              </button>
              <button onClick={() => handleViewChange('users')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentView === 'users' ? 'bg-[#7900c5] text-white shadow-lg shadow-purple-200 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Icons.Users className="w-5 h-5" />
                  <span>Usuários</span>
              </button>
              <button onClick={() => handleViewChange('groups')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentView === 'groups' ? 'bg-[#7900c5] text-white shadow-lg shadow-purple-200 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Icons.Backpack className="w-5 h-5" />
                  <span>Turmas</span>
              </button>
              <button onClick={() => handleViewChange('subjects')} className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentView === 'subjects' ? 'bg-[#7900c5] text-white shadow-lg shadow-purple-200 dark:shadow-none' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <Icons.BookOpen className="w-5 h-5" />
                  <span>Matérias</span>
              </button>
          </div>

          <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800 hidden md:block">
              <button onClick={() => navigate('/')} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors w-full">
                  <Icons.LogOut className="w-5 h-5" />
                  <span>Sair do Admin</span>
              </button>
          </div>
      </div>
  );

  const renderDashboard = () => (
      <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-xs font-bold uppercase">Usuários</span>
                      <Icons.Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users}</span>
              </div>
              <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-xs font-bold uppercase">Turmas</span>
                      <Icons.Backpack className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.groups}</span>
              </div>
              <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-xs font-bold uppercase">Arquivos</span>
                      <Icons.FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.files}</span>
              </div>
              <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 text-xs font-bold uppercase">Armazenamento</span>
                      <Icons.Download className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.storage}</span>
              </div>
          </div>
      </div>
  );

  const renderUsers = () => {
      const filtered = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
      return (
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h2>
              <div className="relative w-full md:w-64">
                  <input 
                    type="text" 
                    placeholder="Buscar usuário..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                  />
                  <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
                          <tr>
                              <th className="px-6 py-4">Usuário</th>
                              <th className="px-6 py-4">Turma</th>
                              <th className="px-6 py-4">Cargo</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filtered.map(u => (
                              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">{u.username[0]}</div>
                                          <div>
                                              <p className="font-bold text-gray-900 dark:text-white">{u.username}</p>
                                              <p className="text-xs text-gray-400">ID: {u.id.substring(0,8)}...</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                      {u.group?.name || 'Sem turma'}
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                          u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                          u.role === 'teacher' ? 'bg-orange-100 text-orange-700' :
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                          {u.role}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <select 
                                        value={u.role}
                                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value as Role)}
                                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs py-1 px-2 focus:ring-2 focus:ring-[#7900c5] outline-none"
                                      >
                                          <option value="student">Estudante</option>
                                          <option value="teacher">Professor</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  )};

  const renderGroups = () => {
    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'create') await Service.createGroup(editingItem.name, editingItem.academic_year);
        else await Service.updateGroup(editingItem.id, { name: editingItem.name, academic_year: editingItem.academic_year });
        setIsModalOpen(false); loadGroups();
    };

    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Turmas & Anos</h2>
              <button onClick={() => { setEditingItem({ name: '', academic_year: new Date().getFullYear() }); setModalMode('create'); setIsModalOpen(true); }} className="bg-[#7900c5] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#6a00ac]">
                  <Icons.Plus className="w-4 h-4" /> Nova Turma
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => (
                  <div key={g.id} className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative group">
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingItem(g); setModalMode('edit'); setIsModalOpen(true); }} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:text-[#7900c5]"><Icons.Edit className="w-4 h-4" /></button>
                          <button onClick={() => deleteGroup(g.id)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 mb-4">
                          <Icons.Users className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{g.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Ano Letivo: {g.academic_year}</p>
                      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                          <span>ID: {g.id.substring(0,6)}...</span>
                      </div>
                  </div>
              ))}
          </div>

          {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-2xl p-6">
                      <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">{modalMode === 'create' ? 'Nova Turma' : 'Editar Turma'}</h3>
                      <form onSubmit={handleGroupSubmit} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Nome</label>
                              <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Ano Letivo</label>
                              <input type="number" value={editingItem.academic_year} onChange={e => setEditingItem({...editingItem, academic_year: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required />
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                              <button type="submit" className="bg-[#7900c5] text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  )};

  const renderSubjects = () => {
    const handleSubjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'create') await Service.createSubject(editingItem.name, editingItem.color_hex, editingItem.icon_name, editingItem.group_id);
        else await Service.updateSubject(editingItem.id, { name: editingItem.name, color_hex: editingItem.color_hex, icon_name: editingItem.icon_name });
        setIsModalOpen(false); loadSubjects();
    };

    const filtered = selectedGroupFilter === 'all' ? subjects : subjects.filter(s => s.group_id === selectedGroupFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Matérias</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <select value={selectedGroupFilter} onChange={e => setSelectedGroupFilter(e.target.value)} className="flex-1 md:w-48 p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#121212] text-sm">
                        <option value="all">Todas as turmas</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button onClick={() => { setEditingItem({ name: '', color_hex: '#7900c5', icon_name: 'book', group_id: groups[0]?.id || '' }); setModalMode('create'); setIsModalOpen(true); }} className="bg-[#7900c5] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap">
                        <Icons.Plus className="w-4 h-4" /> Adicionar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {filtered.map(s => (
                    <div key={s.id} className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{background: s.color_hex}}>
                                <Icons.Dynamic name={s.icon_name} className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 dark:text-white truncate">{s.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{groups.find(g => g.id === s.group_id)?.name}</p>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingItem(s); setModalMode('edit'); setIsModalOpen(true); }} className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-gray-500"><Icons.Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteSubject(s.id)} className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-red-500"><Icons.Trash className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-2xl p-6">
                      <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">{modalMode === 'create' ? 'Nova Matéria' : 'Editar Matéria'}</h3>
                      <form onSubmit={handleSubjectSubmit} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Nome</label>
                              <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required />
                          </div>
                          {modalMode === 'create' && (
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Turma</label>
                                  <select value={editingItem.group_id} onChange={e => setEditingItem({...editingItem, group_id: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required>
                                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                  </select>
                              </div>
                          )}
                          <div className="flex gap-4">
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Ícone</label>
                                  <select value={editingItem.icon_name} onChange={e => setEditingItem({...editingItem, icon_name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                                      {availableIcons.map(i => <option key={i} value={i}>{i}</option>)}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Cor</label>
                                  <input type="color" value={editingItem.color_hex} onChange={e => setEditingItem({...editingItem, color_hex: e.target.value})} className="w-full h-10 p-1 rounded-lg border dark:bg-gray-800 dark:border-gray-700" />
                              </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                              <button type="submit" className="bg-[#7900c5] text-white px-6 py-2 rounded-lg font-bold">Salvar</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col md:flex-row font-inter">
        {renderSidebar()}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto h-screen">
            <div className="max-w-6xl mx-auto">
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'users' && renderUsers()}
                {currentView === 'groups' && renderGroups()}
                {currentView === 'subjects' && renderSubjects()}
            </div>
        </main>
    </div>
  );
};