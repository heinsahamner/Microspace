import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Subject, Group, Profile, Role, Feedback } from '../types';
import { Icons, availableIcons } from '../components/Icons';

type AdminView = 'dashboard' | 'users' | 'groups' | 'subjects' | 'feedbacks';

const THEME_COLORS = [
  '#7900c5', '#6366f1', '#3b82f6', '#06b6d4', 
  '#10b981', '#84cc16', '#f59e0b', '#f97316', 
  '#ef4444', '#db2777', '#64748b', '#18181b'
];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color: 'red' | 'blue' | 'green' | 'orange' | 'gray' | 'purple' }> = ({ children, color }) => {
  const styles = {
    red: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30",
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30",
    green: "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/30",
    orange: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30",
    gray: "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    purple: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-900/30",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[color]}`}>
      {children}
    </span>
  );
};

const ActionButton = ({ onClick, icon: Icon, variant = 'default', title, className }: any) => {
    const styles = variant === 'danger' 
        ? "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
        : variant === 'gold'
        ? "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
        : "text-gray-400 hover:text-[#7900c5] hover:bg-purple-50 dark:hover:bg-purple-900/20";
    
    return (
        <button onClick={onClick} className={`p-2 rounded-lg transition-all duration-200 ${styles} ${className}`} title={title}>
            <Icon className="w-4 h-4" />
        </button>
    );
};

export const AdminPanel: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  
  const [stats, setStats] = useState({ users: 0, groups: 0, files: 0, storage: '0' });
  const [users, setUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'members' | 'titles'>('create');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [originalSubjectName, setOriginalSubjectName] = useState('');
  
  const [userReps, setUserReps] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.role !== 'admin') {
        navigate('/');
        return;
    }
    loadData();
  }, [profile, currentView]);

  const loadData = async () => {
      const promises: Promise<any>[] = [Service.getGroups(), Service.getAllUsers()];
      
      let statsIndex = -1;
      let subjectsIndex = -1;
      let feedbacksIndex = -1;

      if (currentView === 'dashboard') {
          promises.push(Service.getAdminStats());
          statsIndex = promises.length - 1;
      }
      if (currentView === 'subjects' || currentView === 'users' || modalMode === 'titles') {
          promises.push(Service.getAllSubjects());
          subjectsIndex = promises.length - 1;
      }
      if (currentView === 'feedbacks') {
          promises.push(Service.getFeedbacks());
          feedbacksIndex = promises.length - 1;
      }

      const results = await Promise.all(promises); 
      
      setGroups(results[0] as Group[]);
      setUsers(results[1] as Profile[]);
      
      if (currentView === 'dashboard' && statsIndex !== -1) setStats(results[statsIndex] as any);
      if ((currentView === 'subjects' || currentView === 'users' || modalMode === 'titles') && subjectsIndex !== -1) setSubjects(results[subjectsIndex] as Subject[]);
      if (currentView === 'feedbacks' && feedbacksIndex !== -1) setFeedbacks(results[feedbacksIndex] as Feedback[]);
  };

  const handleUserUpdate = async (userId: string, field: 'role' | 'group_id', value: string) => {
      if (userId === user?.id && field === 'role' && value !== 'admin') {
          if(!window.confirm("Você está prestes a remover seus próprios privilégios de administrador. Continuar?")) return;
      }
      if (field === 'role') await Service.updateUserRole(userId, value as Role);
      else await Service.updateUserGroup(userId, value);
      loadData();
  };

  const handleDelete = async (type: 'user' | 'group' | 'subject', id: string) => {
      const messages = {
          user: "Tem certeza? Isso banirá o usuário e apagará seus dados.",
          group: "Cuidado! Apagar uma turma remove todas as matérias e arquivos vinculados.",
          subject: "Apagar esta matéria removerá todos os arquivos associados."
      };
      if(!window.confirm(messages[type])) return;

      if(type === 'user') await Service.deleteUser(id);
      if(type === 'group') await Service.deleteGroup(id);
      if(type === 'subject') await Service.deleteSubject(id);
      loadData();
  };

  const handleResolveFeedback = async (id: string) => {
      await Service.resolveFeedback(id);
      loadData();
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: AdminView, label: string, icon: any }) => (
      <button 
        onClick={() => setCurrentView(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all mb-1 ${
            currentView === id 
            ? 'bg-[#7900c5] text-white shadow-lg shadow-purple-500/20' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
      </button>
  );

  const renderDashboard = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Painel de Controle</h2>
              <p className="text-gray-500 dark:text-gray-400">Visão geral do sistema e métricas.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                  { label: 'Usuários Totais', val: stats.users, icon: Icons.Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Turmas Ativas', val: stats.groups, icon: Icons.Backpack, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  { label: 'Materiais', val: stats.files, icon: Icons.FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                  { label: 'Armazenamento', val: stats.storage, icon: Icons.Download, color: 'text-green-500', bg: 'bg-green-500/10' }
              ].map((s, idx) => (
                  <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{s.val}</h3>
                          </div>
                          <div className={`p-3 rounded-xl ${s.bg}`}>
                              <s.icon className={`w-6 h-6 ${s.color}`} />
                          </div>
                      </div>
                  </Card>
              ))}
          </div>

          <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Atividade Recente do Sistema</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.slice(0, 5).map(u => (
                      <div key={u.id} className="p-4 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-bold text-gray-900 dark:text-white">{u.username}</span> registrou-se no sistema.
                          </p>
                          <span className="ml-auto text-xs text-gray-400">Há instantes</span>
                      </div>
                  ))}
              </div>
          </Card>
      </div>
  );

  const renderUsers = () => {
      const filtered = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      const openTitles = async (u: Profile) => {
          setEditingItem(u);
          
          if (!u.group_id) {
              alert("Usuário precisa estar em uma turma para ter títulos.");
              return;
          }

          const groupSubjects = subjects.filter(s => s.group_id === u.group_id);
          const reps: string[] = [];
          for (const s of groupSubjects) {
              // @ts-ignore
              const subjectReps = await Service.getSubjectRepresentatives(s.id);
              if (subjectReps.includes(u.id)) reps.push(s.id);
          }
          setUserReps(reps);
          setModalMode('titles');
          setIsModalOpen(true);
      };

      const handleToggleRep = async (subjectId: string) => {
          const isRep = userReps.includes(subjectId);
          // @ts-ignore
          await Service.manageRepresentative(editingItem.id, subjectId, !isRep);
          setUserReps(prev => isRep ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
      };

      return (
      <div className="h-full flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total: {users.length} cadastrados</p>
              </div>
              <div className="relative w-full sm:w-72">
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou email..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] text-sm focus:ring-2 focus:ring-[#7900c5] outline-none"
                  />
                  <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
          </div>

          <Card className="flex-1 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                              <th className="px-6 py-4">Usuário</th>
                              <th className="px-6 py-4">Turma</th>
                              <th className="px-6 py-4">Cargo</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {filtered.map(u => (
                              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 overflow-hidden border border-gray-200 dark:border-gray-700">
                                              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : (u.username?.[0]?.toUpperCase() || 'U')}
                                          </div>
                                          <div>
                                              <p className="font-bold text-gray-900 dark:text-white">{u.username}</p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{u.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="relative group/select">
                                          <select 
                                            value={u.group_id || ''}
                                            onChange={(e) => handleUserUpdate(u.id, 'group_id', e.target.value)}
                                            className="appearance-none bg-transparent pl-0 pr-6 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-transparent hover:border-gray-300 focus:border-[#7900c5] outline-none cursor-pointer transition-all"
                                          >
                                              <option value="">Sem Turma</option>
                                              {groups.map(g => <option key={g.id} value={g.id} className="dark:bg-gray-900">{g.name}</option>)}
                                          </select>
                                          <Icons.Dynamic name="chevron-down" className="w-3 h-3 absolute right-0 top-1.5 text-gray-400 pointer-events-none group-hover/select:text-[#7900c5]" />
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                       <div className="relative inline-block">
                                          <select 
                                            value={u.role}
                                            onChange={(e) => handleUserUpdate(u.id, 'role', e.target.value)}
                                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer outline-none focus:ring-2 ring-offset-1 dark:ring-offset-black transition-all ${
                                                u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-red-200' :
                                                u.role === 'teacher' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 ring-orange-200' :
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-blue-200'
                                            }`}
                                          >
                                              <option value="student">Estudante</option>
                                              <option value="teacher">Professor</option>
                                              <option value="admin">Admin</option>
                                          </select>
                                          <Icons.Dynamic name="chevron-down" className="w-3 h-3 absolute right-2 top-1.5 opacity-50 pointer-events-none" />
                                       </div>
                                  </td>
                                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                                      <ActionButton 
                                        icon={Icons.Trophy} 
                                        variant="gold"
                                        onClick={() => openTitles(u)} 
                                        title="Gerenciar Títulos"
                                      />
                                      <ActionButton 
                                        icon={Icons.Trash} 
                                        variant="danger" 
                                        onClick={() => handleDelete('user', u.id)} 
                                        title="Banir Usuário"
                                      />
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>

          {isModalOpen && modalMode === 'titles' && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                  <Card className="w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 flex items-center justify-center">
                              <Icons.Trophy className="w-5 h-5" />
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">Gerenciar Representantes</h3>
                              <p className="text-xs text-gray-500">Usuário: {editingItem.username}</p>
                          </div>
                      </div>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-6">
                          <p className="text-xs font-bold text-gray-400 uppercase">Matérias da Turma</p>
                          {subjects.filter(s => s.group_id === editingItem.group_id).length === 0 && <p className="text-sm text-gray-500">Nenhuma matéria nesta turma.</p>}
                          {subjects.filter(s => s.group_id === editingItem.group_id).map(s => (
                              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: s.color_hex }}>
                                          <Icons.Dynamic name={s.icon_name} className="w-4 h-4" />
                                      </div>
                                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.name}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleRep(s.id)}
                                    className={`w-10 h-6 rounded-full p-1 transition-colors ${userReps.includes(s.id) ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                  >
                                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${userReps.includes(s.id) ? 'translate-x-4' : ''}`} />
                                  </button>
                              </div>
                          ))}
                      </div>

                      <div className="flex justify-end">
                          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">Fechar</button>
                      </div>
                  </Card>
              </div>
          )}
      </div>
  )};

  const renderGroups = () => {
      const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          if (modalMode === 'create') await Service.createGroup(editingItem.name, editingItem.academic_year, editingItem.icon_name);
          else await Service.updateGroup(editingItem.id, { name: editingItem.name, academic_year: editingItem.academic_year, icon_name: editingItem.icon_name });
          setIsModalOpen(false); loadData();
      };

      const openMembers = (group: Group) => {
          setEditingItem(group); setModalMode('members'); setMemberSearchTerm(''); setIsModalOpen(true);
      };

      return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Turmas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerenciar classes e anos letivos.</p>
              </div>
              <button 
                onClick={() => { setEditingItem({ name: '', academic_year: new Date().getFullYear(), icon_name: 'users' }); setModalMode('create'); setIsModalOpen(true); }}
                className="bg-[#7900c5] hover:bg-[#60009e] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none flex items-center space-x-2 transition-transform active:scale-95"
              >
                  <Icons.Plus className="w-4 h-4" /> <span>Nova Turma</span>
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {groups.map(g => {
                  const count = users.filter(u => u.group_id === g.id).length;
                  return (
                  <Card key={g.id} className="p-6 relative group hover:border-[#7900c5]/30 transition-all hover:shadow-md">
                      <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ActionButton icon={Icons.Edit} onClick={() => { setEditingItem(g); setModalMode('edit'); setIsModalOpen(true); }} />
                          <ActionButton icon={Icons.Trash} variant="danger" onClick={() => handleDelete('group', g.id)} />
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-inner">
                              <Icons.Dynamic name={g.icon_name || 'users'} className="w-7 h-7" />
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{g.name}</h3>
                              <Badge color="gray">{g.academic_year}</Badge>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{count} Alunos</span>
                          <button onClick={() => openMembers(g)} className="text-xs font-bold text-[#7900c5] hover:underline">
                              Gerenciar Membros
                          </button>
                      </div>
                  </Card>
              )})}
          </div>

          {isModalOpen && (modalMode === 'create' || modalMode === 'edit') && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                  <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{modalMode === 'create' ? 'Criar Turma' : 'Editar Turma'}</h3>
                      <form onSubmit={handleSave} className="space-y-5">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nome da Turma</label>
                              <input required value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none text-gray-900 dark:text-white" placeholder="Ex: 3º Ano A" />
                          </div>
                          <div className="flex gap-4">
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Ano Letivo</label>
                                  <input type="number" required value={editingItem.academic_year} onChange={e => setEditingItem({...editingItem, academic_year: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none text-gray-900 dark:text-white" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Ícone</label>
                              <div className="grid grid-cols-6 gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto custom-scrollbar">
                                  {availableIcons.map(icon => (
                                      <button key={icon} type="button" onClick={() => setEditingItem({...editingItem, icon_name: icon})} className={`p-2 rounded-lg flex justify-center items-center hover:bg-white dark:hover:bg-gray-800 transition-all ${editingItem.icon_name === icon ? 'bg-[#7900c5] text-white shadow-md' : 'text-gray-500'}`}>
                                          <Icons.Dynamic name={icon} className="w-5 h-5" />
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-4">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancelar</button>
                              <button type="submit" className="px-6 py-2 text-sm font-bold bg-[#7900c5] text-white rounded-lg hover:bg-[#60009e] shadow-lg shadow-purple-200 dark:shadow-none">Salvar</button>
                          </div>
                      </form>
                  </Card>
              </div>
          )}

          {isModalOpen && modalMode === 'members' && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                  <Card className="w-full max-w-lg flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95">
                      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Membros</h3>
                          <p className="text-sm text-gray-500">{editingItem.name}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                          <input placeholder="Buscar aluno para adicionar..." value={memberSearchTerm} onChange={e => setMemberSearchTerm(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none text-gray-900 dark:text-white" />
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                          {users.filter(u => u.username.toLowerCase().includes(memberSearchTerm.toLowerCase())).sort((a,b) => (a.group_id === editingItem.id ? -1 : 1)).map(u => {
                              const isMember = u.group_id === editingItem.id;
                              return (
                                  <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isMember ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                                      <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                                              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover"/> : (u.username?.[0] || 'U')}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-900 dark:text-white">{u.username}</p>
                                              <p className="text-[10px] text-gray-500 dark:text-gray-400">{u.email}</p>
                                          </div>
                                      </div>
                                      <button onClick={() => handleUserUpdate(u.id, 'group_id', isMember ? '' : editingItem.id)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isMember ? 'text-red-500 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                                          {isMember ? 'Remover' : 'Adicionar'}
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                      <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-right">
                          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">Fechar</button>
                      </div>
                  </Card>
              </div>
          )}
      </div>
  )};

  const renderSubjects = () => {
      const handleSave = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!editingItem.name.trim()) return alert("O nome da matéria é obrigatório.");
          
          if(modalMode === 'edit') {
              await Service.updateSubject(editingItem.id, { 
                  name: editingItem.name, 
                  color_hex: editingItem.color_hex, 
                  icon_name: editingItem.icon_name,
                  monitor_id: editingItem.monitor_id || null,
                  teacher_id: editingItem.teacher_id || null
              });
          } else {
              if (selectedGroupIds.length === 0) return alert("Selecione pelo menos uma turma.");
              
              const confirmMessage = "Ao desmarcar uma turma, a matéria e todos os arquivos associados a ela naquela turma serão EXCLUÍDOS PERMANENTEMENTE. Continuar?";
              
              if(!window.confirm("Isso criará a matéria em TODAS as turmas selecionadas. " + confirmMessage)) return;

              await Service.manageSubjectDistribution(
                  editingItem.name, 
                  originalSubjectName, 
                  editingItem.color_hex, 
                  editingItem.icon_name, 
                  selectedGroupIds
              );
          }
          setIsModalOpen(false); 
          loadData();
      };

      const openEditSubject = (subject: Subject) => {
          setEditingItem({ ...subject });
          setOriginalSubjectName(subject.name); 
          setModalMode('edit');
          setIsModalOpen(true);
      };

      return (
      <div className="space-y-8">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Matérias</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Organização curricular por turma.</p>
              </div>
              <button 
                onClick={() => { setEditingItem({ name: '', color_hex: THEME_COLORS[0], icon_name: 'book' }); setSelectedGroupIds([]); setModalMode('create'); setIsModalOpen(true); }}
                className="bg-[#7900c5] hover:bg-[#60009e] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center space-x-2 transition-transform active:scale-95"
              >
                  <Icons.Plus className="w-4 h-4" /> <span>Nova Matéria</span>
              </button>
          </div>

          <div className="grid gap-8">
              {groups.map(g => {
                  const subList = subjects.filter(s => s.group_id === g.id);
                  if(subList.length === 0) return null;
                  return (
                      <Card key={g.id} className="p-6">
                          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                              <Icons.Dynamic name={g.icon_name || 'users'} className="w-5 h-5 text-gray-400" />
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{g.name}</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {subList.map(s => {
                                  const monitorName = users.find(u => u.id === s.monitor_id)?.username;
                                  const teacherName = users.find(u => u.id === s.teacher_id)?.username;
                                  return (
                                  <div key={s.id} className="group flex flex-col p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 hover:shadow-md transition-all relative overflow-hidden">
                                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{backgroundColor: s.color_hex}}></div>
                                      
                                      <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center space-x-3">
                                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm" style={{backgroundColor: s.color_hex}}>
                                                  <Icons.Dynamic name={s.icon_name} className="w-5 h-5" />
                                              </div>
                                              <span className="font-bold text-sm text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{s.name}</span>
                                          </div>
                                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => openEditSubject(s)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#7900c5]"><Icons.Edit className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => handleDelete('subject', s.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><Icons.Trash className="w-3.5 h-3.5" /></button>
                                          </div>
                                      </div>

                                      <div className="space-y-1 mt-2">
                                          {teacherName && (
                                              <div className="flex items-center gap-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg w-fit">
                                                  <Icons.User className="w-3 h-3 text-purple-500" />
                                                  <span className="truncate max-w-[100px]">Prof. {teacherName}</span>
                                              </div>
                                          )}
                                          {monitorName && (
                                              <div className="flex items-center gap-1.5 ml-1 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg w-fit">
                                                  <Icons.Shield className="w-3 h-3 text-blue-500" />
                                                  <span className="truncate max-w-[100px]">Mon. {monitorName}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )})}
                          </div>
                      </Card>
                  );
              })}
          </div>

          {isModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                  <Card className="w-full max-w-2xl p-0 shadow-2xl animate-in zoom-in-95 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{modalMode === 'create' ? 'Nova Matéria' : 'Editar Matéria'}</h3>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nome</label>
                              <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none text-gray-900 dark:text-white font-bold" placeholder="Ex: Biologia" />
                          </div>
                          
                          {modalMode === 'edit' && (
                              <div className="grid grid-cols-1 gap-4">
                                  {/* TEACHER SELECT */}
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase flex items-center gap-2">
                                          <Icons.User className="w-3 h-3" /> Professor Responsável
                                      </label>
                                      <div className="relative">
                                          <select 
                                            value={editingItem.teacher_id || ''}
                                            onChange={e => setEditingItem({...editingItem, teacher_id: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none text-gray-900 dark:text-white appearance-none cursor-pointer"
                                          >
                                              <option value="">-- Nenhum Professor --</option>
                                              {users.filter(u => u.group_id === editingItem.group_id && (u.role === 'teacher' || u.role === 'admin')).map(u => (
                                                  <option key={u.id} value={u.id}>{u.username}</option>
                                              ))}
                                          </select>
                                          <Icons.Dynamic name="chevron-down" className="w-4 h-4 absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                                      </div>
                                  </div>

                                  {/* MONITOR SELECT */}
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase flex items-center gap-2">
                                          <Icons.Shield className="w-3 h-3" /> Monitor da Matéria
                                      </label>
                                      <div className="relative">
                                          <select 
                                            value={editingItem.monitor_id || ''}
                                            onChange={e => setEditingItem({...editingItem, monitor_id: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#7900c5] outline-none text-gray-900 dark:text-white appearance-none cursor-pointer"
                                          >
                                              <option value="">-- Nenhum Monitor --</option>
                                              {users.filter(u => u.group_id === editingItem.group_id).map(u => (
                                                  <option key={u.id} value={u.id}>{u.username}</option>
                                              ))}
                                          </select>
                                          <Icons.Dynamic name="chevron-down" className="w-4 h-4 absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                                      </div>
                                  </div>
                              </div>
                          )}

                          {modalMode === 'create' && (
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Aplicar nas Turmas</label>
                                  <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
                                      {groups.map(g => (
                                          <label key={g.id} className="flex items-center space-x-3 p-2.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                                              <input 
                                                type="checkbox" 
                                                checked={selectedGroupIds.includes(g.id)} 
                                                onChange={() => {
                                                    const newIds = selectedGroupIds.includes(g.id) 
                                                        ? selectedGroupIds.filter(i => i !== g.id) 
                                                        : [...selectedGroupIds, g.id];
                                                    setSelectedGroupIds(newIds);
                                                }} 
                                                className="w-4 h-4 rounded text-[#7900c5] focus:ring-[#7900c5] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" 
                                              />
                                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{g.name}</span>
                                              {selectedGroupIds.includes(g.id) && <span className="text-[10px] font-bold text-[#7900c5] bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">Ativo</span>}
                                          </label>
                                      ))}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-2 italic">A matéria será criada nas turmas selecionadas.</p>
                              </div>
                          )}

                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Cor Tema</label>
                              <div className="flex flex-wrap gap-3">
                                  {THEME_COLORS.map(c => (
                                      <button 
                                        key={c} 
                                        type="button" 
                                        onClick={() => setEditingItem({...editingItem, color_hex: c})} 
                                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${editingItem.color_hex === c ? 'border-gray-900 dark:border-white scale-110 shadow-lg' : 'border-transparent'}`} 
                                        style={{backgroundColor: c}} 
                                      />
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="w-full md:w-72 bg-gray-50 dark:bg-[#181818] border-l border-gray-100 dark:border-gray-800 p-8 flex flex-col">
                          <div className="mb-6">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase text-center">Preview</label>
                              <div className="w-full aspect-[4/3] rounded-2xl flex flex-col justify-between p-4 text-white shadow-xl transition-all relative overflow-hidden" style={{backgroundColor: editingItem.color_hex}}>
                                  <div className="absolute -bottom-4 -right-4 opacity-20 rotate-12">
                                      <Icons.Dynamic name={editingItem.icon_name} className="w-24 h-24" />
                                  </div>
                                  <div className="relative z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                      <Icons.Dynamic name={editingItem.icon_name} className="w-6 h-6" />
                                  </div>
                                  <span className="font-bold text-lg relative z-10 leading-tight">{editingItem.name || 'Nome da Matéria'}</span>
                              </div>
                          </div>
                          
                          <div className="flex-1 overflow-hidden flex flex-col">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Ícone</label>
                              <div className="grid grid-cols-4 gap-2 overflow-y-auto custom-scrollbar pr-1 pb-2">
                                  {availableIcons.map(icon => (
                                      <button 
                                        key={icon} 
                                        type="button" 
                                        onClick={() => setEditingItem({...editingItem, icon_name: icon})} 
                                        className={`aspect-square rounded-xl flex items-center justify-center transition-all ${editingItem.icon_name === icon ? 'bg-white dark:bg-gray-700 text-[#7900c5] shadow-md ring-2 ring-[#7900c5]' : 'text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-600'}`}
                                        title={icon}
                                      >
                                          <Icons.Dynamic name={icon} className="w-5 h-5" />
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex justify-between gap-3 pt-6 mt-auto border-t border-gray-200 dark:border-gray-700">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm">Cancelar</button>
                              <button type="button" onClick={handleSave} className="flex-1 py-2 font-bold bg-[#7900c5] text-white rounded-lg shadow-lg hover:bg-[#60009e] text-sm">Salvar</button>
                          </div>
                      </div>
                  </Card>
              </div>
          )}
      </div>
  )};

  const renderFeedbacks = () => {
      return (
          <div className="space-y-6">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedbacks do Sistema</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reportes de bugs e sugestões dos usuários.</p>
              </div>

              {feedbacks.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-gray-600">
                      <Icons.BadgeCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum feedback pendente.</p>
                  </div>
              ) : (
                  <div className="grid gap-4">
                      {feedbacks.map(f => (
                          <Card key={f.id} className="p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
                              <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                      <Badge color={f.status === 'open' ? 'orange' : 'green'}>
                                          {f.status === 'open' ? 'Aberto' : 'Resolvido'}
                                      </Badge>
                                      {f.include_logs && (
                                          <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">LOGS</span>
                                      )}
                                      <span className="text-xs text-gray-400 ml-auto md:ml-2">
                                          {new Date(f.created_at).toLocaleDateString()} • {new Date(f.created_at).toLocaleTimeString()}
                                      </span>
                                  </div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                                      "{f.content}"
                                  </p>
                                  <div className="flex items-center gap-2 pt-2">
                                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden">
                                          {f.user?.username?.[0] || '?'}
                                      </div>
                                      <span className="text-xs text-gray-500">{f.user?.username || 'Usuário Desconhecido'}</span>
                                  </div>
                              </div>
                              <div className="flex items-center md:border-l md:pl-4 border-gray-100 dark:border-gray-800">
                                  {f.status === 'open' && (
                                      <button 
                                          onClick={() => handleResolveFeedback(f.id)}
                                          className="w-full md:w-auto px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-2">
                                          <Icons.BadgeCheck className="w-4 h-4" /> Marcar Resolvido
                                      </button>
                                  )}
                              </div>
                          </Card>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col md:flex-row font-inter overflow-hidden">
        <aside className="w-full md:w-64 bg-white dark:bg-[#121212] border-r border-gray-100 dark:border-gray-800 flex flex-col z-20 shadow-xl md:shadow-none">
            <div className="p-6">
                <div className="flex items-center space-x-3 text-[#7900c5]">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <Icons.Shield className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Admin Panel</span>
                </div>
            </div>
            
            <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</p>
                <SidebarItem id="dashboard" label="Visão Geral" icon={Icons.Home} />
                <SidebarItem id="users" label="Usuários" icon={Icons.Users} />
                <SidebarItem id="groups" label="Turmas" icon={Icons.Backpack} />
                <SidebarItem id="subjects" label="Matérias" icon={Icons.BookOpen} />
                <div className="h-4"></div>
                <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Suporte</p>
                <SidebarItem id="feedbacks" label="Feedbacks" icon={Icons.Bug} />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => navigate('/')} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Icons.LogOut className="w-5 h-5" />
                    <span>Sair do Painel</span>
                </button>
            </div>
        </aside>

        <main className="flex-1 overflow-y-auto h-screen scroll-smooth bg-gray-50 dark:bg-black">
            <div className="max-w-7xl mx-auto p-6 md:p-12 pb-24">
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'users' && renderUsers()}
                {currentView === 'groups' && renderGroups()}
                {currentView === 'subjects' && renderSubjects()}
                {currentView === 'feedbacks' && renderFeedbacks()}
            </div>
        </main>
    </div>
  );
};