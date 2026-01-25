import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Icons } from '../Icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Subject } from '../../types';
import { Service } from '../../services/supabase';
import { CommandPalette } from '../shared/CommandPalette';

export const TopBar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [showMenu, setShowMenu] = useState(false);
  const [showSubjectsMenu, setShowSubjectsMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setShowCmdPalette(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMenu = () => {
      setShowMenu(!showMenu);
      setShowSubjectsMenu(false);
  };

  const toggleSubjectsMenu = async () => {
    if (!showSubjectsMenu) {
        const subs = await Service.getAllSubjects();
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

  const AppItem = ({ icon: Icon, title, desc, url, colorClass }: any) => (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
      >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${colorClass}`}>
              <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
              <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{desc}</p>
          </div>
          <div className="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors">
              <Icons.Dynamic name="chevron-right" className="w-5 h-5" />
          </div>
      </a>
  );

  return (
    <>
    <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 shadow-sm transition-colors duration-200">
      <div className="w-full">
        <div className="px-4 py-3 flex items-center justify-between relative">
            
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

            <div className="absolute left-1/2 transform -translate-x-1/2 z-10 cursor-pointer group" onClick={() => setShowAbout(true)}>
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white transition-all duration-300 group-hover:text-primary group-hover:scale-105 inline-block animate-float">Microspace</span>
            </div>

            <div className="flex items-center space-x-3 z-20">
                <button 
                    onClick={() => setShowCmdPalette(true)}
                    className="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                    title="Busca Global (Ctrl + K)"
                >
                    <Icons.Search className="w-5 h-5" />
                </button>

                <button onClick={() => navigate('/upload')} className="hidden md:flex p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors" title="Novo Upload">
                    <Icons.Upload className="w-5 h-5" />
                </button>

                <div className="relative">
                    <button onClick={toggleMenu} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white ml-auto hover:opacity-90 transition-opacity overflow-hidden border-2 border-transparent focus:border-purple-300">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            profile?.username?.[0]?.toUpperCase() || 'U'
                        )}
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
                            <button onClick={() => { navigate('/upload'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2 md:hidden">
                                <Icons.Upload className="w-4 h-4" /> <span>Publicar Material</span>
                            </button>
                            {profile?.role === 'admin' && (
                                <button onClick={() => { navigate('/admin'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-purple-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                    <Icons.Shield className="w-4 h-4" /> <span>Painel Admin</span>
                                </button>
                            )}
                            <button onClick={() => { navigate('/profile/edit'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                <Icons.Edit className="w-4 h-4" /> <span>Editar Perfil</span>
                            </button>
                             <button onClick={() => { navigate('/settings'); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2">
                                <Icons.Settings className="w-4 h-4" /> <span>Configurações</span>
                            </button>
                            <button onClick={() => signOut()} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-2 mt-1">
                                <Icons.LogOut className="w-4 h-4" /> <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="hidden md:block pb-1 px-4">
            <div className="flex justify-center">
                 <div className="flex space-x-1 p-1 rounded-full">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                currentPath === tab.path 
                                ? 'bg-primary text-white shadow-md' 
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

    <CommandPalette isOpen={showCmdPalette} onClose={() => setShowCmdPalette(false)} />

    {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ zIndex: 100 }}>
            <div 
                className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in" 
                onClick={() => setShowAbout(false)}
            />

            <div className="relative w-full max-w-sm bg-white dark:bg-[#121212] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                
                <div className="flex justify-between items-center p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="font-bold text-lg">M</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">Microspace</h2>
                            <p className="text-xs text-gray-400 font-medium">Ecossistema Educacional</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAbout(false)}
                        className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
                        title="Fechar"
                    >
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-2">
                    <AppItem 
                        title="Fórum" 
                        desc="Comunidade e dúvidas" 
                        icon={Icons.MessageCircle} 
                        url="https://forumcefet.site" 
                        colorClass="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    />
                    <AppItem 
                        title="Diary" 
                        desc="Agenda e organização" 
                        icon={Icons.BookOpen} 
                        url="https://diary.microspace.site"
                        colorClass="text-pink-600 bg-pink-50 dark:bg-pink-900/20"
                    />
                    <AppItem 
                        title="Notes" 
                        desc="Caderno digital inteligente" 
                        icon={(props: any) => <Icons.Dynamic name="penTool" {...props} />} 
                        url="https://notes.microspace.site"
                        colorClass="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                    />
                </div>

                <div className="p-6 pt-2 text-center">
                    <div className="w-12 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4"></div>
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 font-medium uppercase tracking-widest">
                        Versão 0.7.0 (Pré-Alpha)
                    </p>
                </div>
            </div>
        </div>
    )}
    </>
  );
};