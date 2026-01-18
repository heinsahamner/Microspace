import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Subject, Group, Profile, Role } from '../types';
import { Icons, availableIcons } from '../components/Icons';

type AdminView = 'dashboard' | 'users' | 'groups' | 'subjects';

export const AdminPanel: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  
  const [stats, setStats] = useState({ users: 0, groups: 0, files: 0, storage: '0' });
  const [users, setUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  useEffect(() => {
    if (profile?.role === 'admin') {
        loadData();
    } else {
        setLoading(false);
    }
  }, [profile, currentView]);

  const loadData = async () => {
      setLoading(true);
      try {
          if (currentView === 'dashboard') {
              const s = await Service.getAdminStats();
              setStats(s);
          } else if (currentView === 'users') {
              const u = await Service.getAllUsers();
              setUsers(u);
          } else if (currentView === 'groups') {
              const g = await Service.getGroups();
              setGroups(g);
          } else if (currentView === 'subjects') {
              const s = await Service.getAllSubjects();
              const g = await Service.getGroups();
              setSubjects(s);
              setGroups(g);
          }
      } catch (error) {
          console.error("Admin Load Error:", error);
      } finally {
          setLoading(false);
      }
  };

  if (profile?.role !== 'admin') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
              <div className="max-w-md w-full bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 p-8 text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icons.Shield className="w-10 h-10" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Restrito</h1>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                      Esta área é exclusiva para administradores do sistema. Se você deveria ter acesso, tente recarregar suas permissões.
                  </p>
                  <div className="space-y-3">
                      <button 
                        onClick={() => navigate('/claim-admin')} 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                          Resgatar Acesso Admin
                      </button>
                      <button 
                        onClick={() => navigate('/')} 
                        className="w-full text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold py-2 text-sm"
                      >
                          Voltar ao Início
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const handleUpdateUserRole = async (userId: string, newRole: Role) => {
      if (userId === user?.id && newRole !== 'admin') {
          if(!window.confirm("ATENÇÃO: Você está prestes a remover seus próprios privilégios de Admin. Continuar?")) return;
      }
      await Service.updateUserRole(userId, newRole);
      if (userId === user?.id) {
          await refreshProfile();
          if (newRole !== 'admin') navigate('/');
      } else {
          loadData();
      }
  };

  const deleteGroup = async (id: string) => {
      if(window.confirm("ATENÇÃO CRÍTICA: Apagar uma turma excluirá TODAS as matérias e arquivos associados a ela. Confirmar?")) {
          await Service.deleteGroup(id);
          loadData();
      }
  };

  const deleteSubject = async (id: string) => {
      if(window.confirm("Apagar esta matéria excluirá todos os arquivos vinculados.")) {
          await Service.deleteSubject(id);
          loadData();
      }
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: AdminView, icon: any, label: string }) => (
      <button 
        onClick={() => setCurrentView(view)} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            currentView === view 
            ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-lg' 
            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
        }`}
      >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col md:flex-row font-inter">
        
        <aside className="w-full md:w-72 bg-white dark:bg-[#121212] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 h-auto md:h-screen sticky top-0 z-40">
            <div className="p-6 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 bg-[#7900c5] rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <Icons.Shield className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-none">Admin</h1>
                    <span className="text-[10px] text-gray-400 font-mono tracking-widest">PAINEL V5.0</span>
                </div>
            </div>
            
            <div className="p-4 space-y-1 overflow-x-auto flex md:flex-col flex-row">
                <SidebarItem view="dashboard" icon={Icons.Home} label="Visão Geral" />
                <SidebarItem view="users" icon={Icons.Users} label="Usuários" />
                <SidebarItem view="groups" icon={Icons.Backpack} label="Turmas" />
                <SidebarItem view="subjects" icon={Icons.BookOpen} label="Matérias" />
            </div>

            <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800 hidden md:block">
                <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {profile.username[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile.username}</p>
                        <p className="text-xs text-green-500 font-mono">● Online</p>
                    </div>
                </div>
                <button onClick={() => navigate('/')} className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-bold transition-colors">
                    <Icons.LogOut className="w-4 h-4" />
                    <span>Sair do Painel</span>
                </button>
            </div>
        </aside>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto h-[calc(100vh-80px)] md:h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {currentView === 'dashboard' && 'Dashboard'}
                            {currentView === 'users' && 'Gerenciar Usuários'}
                            {currentView === 'groups' && 'Gerenciar Turmas'}
                            {currentView === 'subjects' && 'Gerenciar Matérias'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Bem-vindo de volta, administrador.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {currentView === 'users' && (
                             <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Buscar..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none w-64"
                                />
                                <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                             </div>
                        )}
                        {(currentView === 'groups' || currentView === 'subjects') && (
                            <button 
                                onClick={() => { 
                                    const defaultItem = currentView === 'groups' 
                                        ? { name: '', academic_year: new Date().getFullYear() }
                                        : { name: '', color_hex: '#7900c5', icon_name: 'book', group_id: groups[0]?.id || '' };
                                    setEditingItem(defaultItem); 
                                    setModalMode('create'); 
                                    setIsModalOpen(true); 
                                }} 
                                className="bg-[#7900c5] hover:bg-[#60009e] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all"
                            >
                                <Icons.Plus className="w-5 h-5" />
                                <span>Adicionar Novo</span>
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#7900c5] rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 font-medium">Carregando dados...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentView === 'dashboard' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Usuários Totais', val: stats.users, icon: Icons.Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                    { label: 'Turmas Ativas', val: stats.groups, icon: Icons.Backpack, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                                    { label: 'Arquivos Publicados', val: stats.files, icon: Icons.FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                                    { label: 'Armazenamento', val: stats.storage, icon: Icons.Download, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white dark:bg-[#181818] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.val}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentView === 'users' && (
                            <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#202020] border-b border-gray-100 dark:border-gray-800">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Turma</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                                            {u.username[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{u.username}</p>
                                                            <p className="text-xs text-gray-400">{u.id.substring(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {u.group?.name || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                     <select 
                                                        value={u.role}
                                                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value as Role)}
                                                        className={`text-xs font-bold py-1.5 px-3 rounded-lg border-0 cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-black ${
                                                            u.role === 'admin' ? 'bg-red-100 text-red-700 focus:ring-red-500' :
                                                            u.role === 'teacher' ? 'bg-orange-100 text-orange-700 focus:ring-orange-500' :
                                                            'bg-blue-100 text-blue-700 focus:ring-blue-500'
                                                        }`}
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
                        )}

                        {currentView === 'groups' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groups.map(g => (
                                    <div key={g.id} className="bg-white dark:bg-[#181818] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                                                <Icons.Users className="w-6 h-6" />
                                            </div>
                                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingItem(g); setModalMode('edit'); setIsModalOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Icons.Edit className="w-4 h-4" /></button>
                                                <button onClick={() => deleteGroup(g.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{g.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4">Ano Letivo: {g.academic_year}</p>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                                            <div className="bg-indigo-500 h-full w-2/3"></div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        )}
                        
                        {currentView === 'subjects' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {subjects.map(s => (
                                    <div key={s.id} className="bg-white dark:bg-[#181818] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white shadow-md" style={{background: s.color_hex}}>
                                                <Icons.Dynamic name={s.icon_name} className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{s.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{groups.find(g => g.id === s.group_id)?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => { setEditingItem(s); setModalMode('edit'); setIsModalOpen(true); }} className="text-gray-400 hover:text-[#7900c5]"><Icons.Edit className="w-4 h-4" /></button>
                                             <button onClick={() => deleteSubject(s.id)} className="text-gray-400 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                )}
            </div>
        </main>

        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white dark:bg-[#181818] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-xl text-gray-900 dark:text-white">{modalMode === 'create' ? 'Adicionar Novo' : 'Editar Item'}</h3>
                         <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (currentView === 'groups') {
                             if (modalMode === 'create') await Service.createGroup(editingItem.name, editingItem.academic_year);
                             else await Service.updateGroup(editingItem.id, { name: editingItem.name, academic_year: editingItem.academic_year });
                        } else {
                             if (modalMode === 'create') await Service.createSubject(editingItem.name, editingItem.color_hex, editingItem.icon_name, editingItem.group_id);
                             else await Service.updateSubject(editingItem.id, { name: editingItem.name, color_hex: editingItem.color_hex, icon_name: editingItem.icon_name });
                        }
                        setIsModalOpen(false);
                        loadData();
                    }} className="space-y-4">
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome</label>
                            <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7900c5]" required />
                        </div>

                        {currentView === 'groups' && (
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ano Letivo</label>
                                <input type="number" value={editingItem.academic_year} onChange={e => setEditingItem({...editingItem, academic_year: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7900c5]" required />
                            </div>
                        )}

                        {currentView === 'subjects' && (
                            <>
                                {modalMode === 'create' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Turma</label>
                                        <select value={editingItem.group_id} onChange={e => setEditingItem({...editingItem, group_id: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7900c5]" required>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ícone</label>
                                        <select value={editingItem.icon_name} onChange={e => setEditingItem({...editingItem, icon_name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7900c5]">
                                            {availableIcons.map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cor</label>
                                        <div className="flex items-center space-x-2">
                                            <input type="color" value={editingItem.color_hex} onChange={e => setEditingItem({...editingItem, color_hex: e.target.value})} className="w-12 h-12 p-1 rounded-lg border-none bg-transparent cursor-pointer" />
                                            <span className="text-xs text-gray-500 font-mono">{editingItem.color_hex}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-[#7900c5] hover:bg-[#60009e] text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition-all">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};