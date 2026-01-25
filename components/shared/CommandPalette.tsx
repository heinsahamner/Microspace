import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { Service } from '../../services/supabase';
import { Subject } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandItemType = {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  group: 'Navegação' | 'Matérias' | 'Apps' | 'Ações';
  shortcut?: string;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && profile?.group_id) {
      Service.getSubjects(profile.group_id).then(setSubjects);
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, profile]);

  const staticCommands: CommandItemType[] = [
    { id: 'nav-dash', label: 'Ir para Dashboard', icon: Icons.Home, group: 'Navegação', action: () => navigate('/') },
    { id: 'nav-backpack', label: 'Minha Mochila', icon: Icons.Backpack, group: 'Navegação', action: () => navigate('/backpack') },
    { id: 'nav-community', label: 'Comunidade', icon: Icons.Users, group: 'Navegação', action: () => navigate('/community') },
    { id: 'nav-profile', label: 'Meu Perfil', icon: Icons.User, group: 'Navegação', action: () => navigate(`/u/${profile?.id}`) },
    { id: 'act-upload', label: 'Publicar Novo Material', icon: Icons.Upload, group: 'Ações', action: () => navigate('/upload'), shortcut: 'N' },
    { id: 'app-diary', label: 'Abrir Diary', icon: Icons.BookOpen, group: 'Apps', action: () => window.open('https://diary.microspace.app', '_blank') },
    { id: 'app-notes', label: 'Abrir Notes', icon: (props: any) => <Icons.Dynamic name="penTool" {...props} />, group: 'Apps', action: () => window.open('https://notes.microspace.app', '_blank') },
    { id: 'app-forum', label: 'Abrir Fórum', icon: Icons.MessageCircle, group: 'Apps', action: () => window.open('https://forum.microspace.app', '_blank') },
    { id: 'sys-settings', label: 'Configurações', icon: Icons.Settings, group: 'Ações', action: () => navigate('/settings') },
    { id: 'sys-logout', label: 'Sair da Conta', icon: Icons.LogOut, group: 'Ações', action: () => signOut() },
  ];

  const filteredItems = useMemo(() => {
    const subjectCommands: CommandItemType[] = subjects.map(sub => ({
      id: `sub-${sub.id}`,
      label: sub.name,
      icon: (props: any) => <Icons.Dynamic name={sub.icon_name} {...props} />,
      group: 'Matérias',
      action: () => navigate(`/subject/${sub.id}`, { state: { subject: sub } })
    }));

    const all = [...staticCommands, ...subjectCommands];

    if (!query) return all;

    const lowerQuery = query.toLowerCase();
    return all.filter(item => 
      item.label.toLowerCase().includes(lowerQuery) || 
      item.group.toLowerCase().includes(lowerQuery)
    );
  }, [query, subjects, profile]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[activeIndex];
        if (item) {
          item.action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filteredItems, activeIndex, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredItems.length]);

  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div 
        className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-4 duration-200">
        
        <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <Icons.Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="O que você procura?"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
            autoComplete="off"
          />
          <div className="text-[10px] font-bold text-gray-400 border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 bg-gray-50 dark:bg-gray-900">
            ESC
          </div>
        </div>

        <div 
          className="max-h-[60vh] overflow-y-auto p-2 scroll-smooth"
          ref={listRef}
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p>Nenhum resultado encontrado.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isActive = index === activeIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => { item.action(); onClose(); }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors duration-150 ${
                    isActive 
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white dark:bg-black text-[#7900c5] shadow-sm' : 'bg-gray-100 dark:bg-gray-900 text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col truncate">
                        <span className={`text-sm font-medium truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {item.label}
                        </span>
                        {query && (
                             <span className="text-[10px] uppercase font-bold text-gray-400">{item.group}</span>
                        )}
                    </div>
                  </div>
                  
                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 bg-white dark:bg-black">
                      {item.shortcut}
                    </span>
                  )}
                  {isActive && !item.shortcut && (
                    <Icons.Dynamic name="corner-down-left" className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bg-gray-50 dark:bg-black/50 px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-medium">
            <span>Microspace Spotlight</span>
            <div className="flex gap-3">
                <span>Navigate <b className="text-gray-600 dark:text-gray-300">↑↓</b></span>
                <span>Select <b className="text-gray-600 dark:text-gray-300">↵</b></span>
            </div>
        </div>
      </div>
    </div>
  );
};