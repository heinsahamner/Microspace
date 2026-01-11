import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Icons } from '../Icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Subject } from '../../types';
import { MockService } from '../../services/supabase';

export const TopBar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [showMenu, setShowMenu] = useState(false);
  const [showSubjectsMenu, setShowSubjectsMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  const toggleMenu = () => {
      setShowMenu(!showMenu);
      setShowSubjectsMenu(false);
  };

  const toggleSubjectsMenu = async () => {
    if (!showSubjectsMenu) {
        const subs = await MockService.getAllSubjects();
        if (profile?.group_id) {
             setAllSubjects(subs.filter(s => s.group_id === profile.group_id));
        } else {
             setAllSubjects([]);
        }
    }
    setShowSubjectsMenu(!showSubjectsMenu);
    setShowMenu(false);
};

  const tabs = [
    { path: '/', label: 'Dashboard' },
    { path: '/subjects', label: 'Matérias' },
    { path: '/community', label: 'Comunidade' },
    { path: '/official', label: 'Oficial' },
    { path: '/backpack', label: 'Mochila' },
  ];

  return (
    <>
    <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 shadow-sm transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between relative">
            
            {/* Acesso Rápido */}
            <div className="flex items-center space-x-2 z-20">
                 <button onClick={toggleSubjectsMenu} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 relative">
                    <Icons.MoreVertical className="w-6 h-6" />
                    {showSubjectsMenu && (
                        <div className="absolute top-12 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-100 dark:border-gray-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Matérias da Turma</h3>
                            <div className="max-h-64 overflow-y-auto no-scrollbar space-y-1">
                                {allSubjects.length > 0 ? allSubjects.map(sub => (
                                    <div 
                                        key={sub.id} 
                                        onClick={() => {
                                            navigate(`/subject/${sub.id}`, { state: { subject: sub } });
                                            setShowSubjectsMenu(false);
                                        }} 
                                        className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer space-x-2"
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{background: sub.color_hex}}></div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sub.name}</span>
                                    </div>
                                )) : (
                                    <p className="px-3 py-2 text-sm text-gray-500">Nenhuma matéria encontrada.</p>
                                )}
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 z-10 cursor-pointer group" onClick={() => setShowAbout(true)}>
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white transition-all duration-300 group-hover:text-[#7900c5] group-hover:scale-105 inline-block animate-float">Microspace</span>
            </div>

            {/* Ações e Perfil */}
            <div className="flex items-center space-x-3 z-20">
                <button onClick={() => navigate('/upload')} className="hidden md:flex p-2 text-gray-500 hover:text-[#7900c5] dark:text-gray-400 dark:hover:text-purple-400 transition-colors" title="Novo Upload">
                    <Icons.Upload className="w-5 h-5" />
                </button>

                <div className="relative">
                    <button onClick={toggleMenu} className="w-9 h-9 rounded-full bg-[#7900c5] flex items-center justify-center text-sm font-bold text-white ml-auto hover:opacity-90 transition-opacity">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </button>
                    
                    {showMenu && (
                        <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-100 dark:border-gray-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                             <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                                <p className="font-bold text-gray-900 dark:text-white truncate">{profile?.username}</p>
                                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                            </div>
                            <button onClick={() => { navigate(`/u/${profile?.id}`); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                <Icons.User className="w-4 h-4" /> <span>Meu Perfil</span>
                            </button>
                            {/* Upload (Mobile) */}
                            <button onClick={() => { navigate('/upload'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2 md:hidden">
                                <Icons.Upload className="w-4 h-4" /> <span>Publicar Material</span>
                            </button>
                            {profile?.role === 'admin' && (
                                <button onClick={() => { navigate('/admin'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-[#7900c5] hover:bg-purple-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                    <Icons.Shield className="w-4 h-4" /> <span>Painel Admin</span>
                                </button>
                            )}
                            <button onClick={() => { navigate('/profile/edit'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                <Icons.Edit className="w-4 h-4" /> <span>Editar Perfil</span>
                            </button>
                             <button onClick={() => { toggleTheme(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                <Icons.Moon className="w-4 h-4" /> <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                            </button>
                            <button onClick={() => signOut()} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-2 mt-1">
                                <Icons.LogOut className="w-4 h-4" /> <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Abas de Navegação (Desktop) */}
        <div className="hidden md:block pb-1 px-4">
            <div className="flex justify-center">
                 <div className="flex space-x-1 p-1 rounded-full">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                currentPath === tab.path 
                                ? 'bg-[#7900c5] text-white shadow-md' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </header>

    {/* Sobre */}
    {showAbout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-[#121212] rounded-2xl p-8 max-w-sm w-full shadow-2xl relative border border-gray-100 dark:border-gray-800">
                <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-[#7900c5] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                         <span className="text-white text-3xl font-bold">M</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Microspace</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Criado por Lucas Willian</p>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                        <p className="font-bold mb-1">Como usar:</p>
                        <p>Compartilhe resumos e atividades com sua turma. Use a aba "Comunidade" para interagir e "Oficial" para conteúdos validados.</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400"><Icons.Github className="w-5 h-5" /></div>
                    <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400"><Icons.Globe className="w-5 h-5" /></div>
                    <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400"><Icons.Link className="w-5 h-5" /></div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};