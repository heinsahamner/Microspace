import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Subject, Group, Profile, Role } from '../types';
import { Icons, availableIcons } from '../components/Icons';

export const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'subjects' | 'groups' | 'users'>('subjects');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#7900c5');
  const [newSubIcon, setNewSubIcon] = useState('book');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupYear, setNewGroupYear] = useState(new Date().getFullYear());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<Role>('student');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSourceGroup, setLinkSourceGroup] = useState('');
  const [subjectsToLink, setSubjectsToLink] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.role !== 'admin') {
        navigate('/');
        return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
      const g = await Service.getGroups();
      setGroups(g);
      const s = await Service.getAllSubjects();
      setSubjects(s);
      const u = await Service.getAllUsers();
      setUsers(u);

      if(!selectedGroup && g.length > 0) setSelectedGroup(g[0].id);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedGroup) return;
      
      if (editingSubId) {
          await Service.updateSubject(editingSubId, { name: newSubName, color_hex: newSubColor, icon_name: newSubIcon });
      } else {
          await Service.createSubject(newSubName, newSubColor, newSubIcon, selectedGroup);
      }
      setNewSubName(''); setShowCreateSub(false); setEditingSubId(null); loadData();
  };

  const handleDeleteSubject = async (id: string) => {
      if(window.confirm("Excluir matéria?")) { await Service.deleteSubject(id); loadData(); }
  };

  const handleLinkSubjects = async () => {
      if (!selectedGroup || subjectsToLink.length === 0) return;
      await Service.copySubjectsToGroup(subjectsToLink, selectedGroup);
      setShowLinkModal(false); setSubjectsToLink([]); loadData();
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingGroupId) {
          await Service.updateGroup(editingGroupId, { name: newGroupName, academic_year: newGroupYear });
      } else {
          await Service.createGroup(newGroupName, newGroupYear);
      }
      setNewGroupName(''); setShowCreateGroup(false); setEditingGroupId(null); loadData();
  };

  const handleDeleteGroup = async (id: string) => {
      if (window.confirm("Excluir turma?")) { await Service.deleteGroup(id); loadData(); }
  };

  const startEditGroup = (group: Group) => {
      setNewGroupName(group.name); setNewGroupYear(group.academic_year); setEditingGroupId(group.id); setShowCreateGroup(true);
  };

  const handleUpdateRole = async (userId: string) => {
      await Service.updateUserRole(userId, editingUserRole);
      setEditingUserId(null); loadData();
  };

  const filteredSubjects = subjects.filter(s => s.group_id === selectedGroup);
  const linkableSubjects = subjects.filter(s => s.group_id === linkSourceGroup);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6 md:p-12 pb-24 transition-colors duration-200">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-gray-900 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                    <Icons.ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administração</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#121212] rounded-xl p-2 h-fit border border-gray-100 dark:border-gray-800">
                     <button onClick={() => setActiveTab('subjects')} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm mb-1 ${activeTab === 'subjects' ? 'bg-[#7900c5] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Matérias e Conteúdo</button>
                     <button onClick={() => setActiveTab('groups')} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm mb-1 ${activeTab === 'groups' ? 'bg-[#7900c5] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Turmas</button>
                     <button onClick={() => setActiveTab('users')} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm ${activeTab === 'users' ? 'bg-[#7900c5] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Usuários</button>
                </div>

                <div className="md:col-span-3">
                    {activeTab === 'subjects' && (
                        <div className="bg-white dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Selecione a Turma</label>
                                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2 self-end">
                                     <button onClick={() => setShowLinkModal(true)} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"><Icons.Link className="w-4 h-4" /> Importar</button>
                                    <button onClick={() => { setNewSubName(''); setShowCreateSub(true); }} className="bg-[#7900c5] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> Adicionar</button>
                                </div>
                            </div>
                            {showCreateSub && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 border border-dashed border-gray-300 dark:border-gray-700">
                                    <form onSubmit={handleSaveSubject} className="flex gap-3 items-end">
                                        <div className="flex-1"><input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Nome da Matéria" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required /></div>
                                        <div className="w-32"><select value={newSubIcon} onChange={e => setNewSubIcon(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white">{availableIcons.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                                        <input type="color" value={newSubColor} onChange={e => setNewSubColor(e.target.value)} className="w-10 h-10 rounded p-1 dark:bg-gray-800 dark:border-gray-700" />
                                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">Salvar</button>
                                    </form>
                                </div>
                            )}
                            <div className="grid gap-3">
                                {filteredSubjects.length === 0 ? (<p className="text-gray-400 text-center py-8">Nenhuma matéria nesta turma.</p>) : filteredSubjects.map(sub => (
                                    <div key={sub.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{background: sub.color_hex}}><Icons.Dynamic name={sub.icon_name} className="w-4 h-4" /></div><span className="font-bold text-sm text-gray-800 dark:text-gray-200">{sub.name}</span></div>
                                        <button onClick={() => handleDeleteSubject(sub.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Icons.Trash className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'groups' && (
                        <div className="bg-white dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciar Turmas</h3><button onClick={() => { setNewGroupName(''); setEditingGroupId(null); setShowCreateGroup(true); }} className="bg-[#7900c5] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> Nova Turma</button></div>
                            {showCreateGroup && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 border border-dashed border-gray-300 dark:border-gray-700">
                                     <form onSubmit={handleSaveGroup} className="flex gap-3 items-end">
                                        <div className="flex-1"><label className="text-xs font-bold text-gray-400">Nome da Turma</label><input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Ex: 3º Ano Info" className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required /></div>
                                        <div className="w-32"><label className="text-xs font-bold text-gray-400">Ano</label><input type="number" value={newGroupYear} onChange={e => setNewGroupYear(parseInt(e.target.value))} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required /></div>
                                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">Salvar</button>
                                    </form>
                                </div>
                            )}
                            <div className="space-y-3">
                                {groups.map(g => (
                                    <div key={g.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center justify-between"><div><p className="font-bold text-gray-900 dark:text-white">{g.name}</p><p className="text-xs text-gray-500">Ano: {g.academic_year}</p></div><div className="flex gap-2"><button onClick={() => startEditGroup(g)} className="p-2 text-gray-500 hover:text-[#7900c5]"><Icons.Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteGroup(g.id)} className="p-2 text-gray-500 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button></div></div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'users' && (
                         <div className="bg-white dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-gray-800 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Lista de Usuários</h3>
                            <div className="space-y-4">
                                {users.map(u => (
                                    <div key={u.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">{u.username[0]}</div>
                                            <div><p className="font-bold text-gray-900 dark:text-white">{u.username}</p><div className="flex gap-2 text-xs"><span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{u.group?.name || 'Sem turma'}</span><span className={`px-2 py-0.5 rounded text-white ${u.role === 'admin' ? 'bg-red-500' : u.role === 'teacher' ? 'bg-orange-500' : 'bg-blue-500'}`}>{u.role === 'admin' ? 'Administrador' : u.role === 'teacher' ? 'Professor' : 'Estudante'}</span></div></div>
                                        </div>
                                        {editingUserId === u.id ? (
                                            <div className="flex items-center gap-2"><select value={editingUserRole} onChange={e => setEditingUserRole(e.target.value as Role)} className="p-2 border rounded bg-white dark:bg-gray-900 dark:text-white dark:border-gray-600 text-sm"><option value="student">Estudante</option><option value="teacher">Professor</option><option value="admin">Administrador</option></select><button onClick={() => handleUpdateRole(u.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold">Salvar</button><button onClick={() => setEditingUserId(null)} className="text-gray-500 text-sm">Cancelar</button></div>
                                        ) : (
                                            <button onClick={() => { setEditingUserId(u.id); setEditingUserRole(u.role); }} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">Editar Cargo</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                    {showLinkModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                                <h3 className="font-bold text-lg mb-4 dark:text-white">Importar Matérias</h3>
                                <div className="mb-4"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">COPIAR DE:</label><select value={linkSourceGroup} onChange={e => setLinkSourceGroup(e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"><option value="">Selecione...</option>{groups.filter(g => g.id !== selectedGroup).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
                                {linkSourceGroup && (
                                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-4 bg-gray-50 dark:bg-gray-900">
                                        {linkableSubjects.map(s => (
                                            <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer dark:text-gray-300"><input type="checkbox" checked={subjectsToLink.includes(s.id)} onChange={e => { if(e.target.checked) setSubjectsToLink([...subjectsToLink, s.id]); else setSubjectsToLink(subjectsToLink.filter(id => id !== s.id)); }} className="rounded text-[#7900c5] focus:ring-[#7900c5]" /><span>{s.name}</span></label>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-end gap-2"><button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium text-sm">Cancelar</button><button onClick={handleLinkSubjects} disabled={subjectsToLink.length === 0} className="bg-[#7900c5] text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50">Confirmar Importação</button></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};