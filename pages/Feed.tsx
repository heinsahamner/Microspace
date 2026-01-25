import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { FileData, Subject, Category, Group } from '../types';
import { Icons } from '../components/Icons';
import { FileCard } from '../components/shared/FileCard';

interface FeedPageProps {
    type: 'community' | 'official';
}

const CATEGORIES: {id: Category | 'all', label: string}[] = [
    { id: 'all', label: 'Tudo' },
    { id: 'summary', label: 'Resumos' },
    { id: 'activity', label: 'Atividades' },
    { id: 'assessment', label: 'Provas' },
];

export const FeedPage: React.FC<FeedPageProps> = ({ type }) => {
  const { profile, user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (profile?.group_id && !selectedGroup) {
        setSelectedGroup(profile.group_id);
    }
  }, [profile]);

  useEffect(() => {
      setSelectedSubject('all');
  }, [selectedGroup]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadData = async () => {
      setLoading(true);
      if (profile?.group_id && user) {
          const [allSubs, allGroups] = await Promise.all([
              Service.getAllSubjects(),
              Service.getGroups()
          ]);
          setSubjects(allSubs);
          setGroups(allGroups);

          const subjectFilter = selectedSubject === 'all' ? null : selectedSubject;
          const categoryFilter = selectedCategory === 'all' ? 'all' : selectedCategory;
          const groupFilter = selectedGroup || profile.group_id; 
          const sourceType = type === 'official' ? 'official' : 'community'; 
          
          let data = await Service.getFiles(subjectFilter, categoryFilter, sourceType, groupFilter, user.id);
          setFiles(data);
      }
      setLoading(false);
    };
    
    if(selectedGroup || profile?.group_id) {
        loadData();
    }
  }, [profile, type, selectedCategory, selectedSubject, selectedGroup, user]);

  const handleDelete = (id: string) => {
      setFiles(prev => prev.filter(f => f.id !== id));
  };

  const filteredFiles = useMemo(() => {
      if (!searchTerm) return files;
      const lowerSearch = searchTerm.toLowerCase();
      return files.filter(file => 
          file.title.toLowerCase().includes(lowerSearch) ||
          file.description?.toLowerCase().includes(lowerSearch)
      );
  }, [files, searchTerm]);

  const availableSubjects = useMemo(() => {
      if (!selectedGroup) return [];
      return subjects
          .filter(s => s.group_id === selectedGroup)
          .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, selectedGroup]);

  const pageConfig = type === 'official' ? {
      title: "Mural Oficial",
      subtitle: "Comunicados e materiais verificados.",
      icon: Icons.BadgeCheck,
      color: "text-primary",
      bg: "bg-primary/10"
  } : {
      title: "Comunidade",
      subtitle: "O que a turma está compartilhando.",
      icon: Icons.Users,
      color: "text-primary",
      bg: "bg-primary/10"
  };

  return (
    <div className="min-h-screen p-4 md:max-w-5xl md:mx-auto pb-24">
        
        <div className="flex items-end justify-between mb-8 px-2 mt-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${pageConfig.bg} ${pageConfig.color} shadow-sm`}>
                    <pageConfig.icon className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{pageConfig.title}</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{pageConfig.subtitle}</p>
                </div>
            </div>
        </div>

        <div className="sticky top-20 z-30 space-y-3 mb-6">
            <div className="flex gap-3">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icons.Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Pesquisar publicações..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm transition-all placeholder-gray-400"
                    />
                </div>

                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm shadow-sm ${
                        showFilters 
                        ? 'bg-primary text-white border-transparent' 
                        : 'bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <Icons.Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filtros</span>
                </button>
            </div>

            {showFilters && (
                <div className="bg-white dark:bg-[#121212] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Turma</label>
                            <div className="relative">
                                <select 
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary outline-none"
                                >
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>
                                            {g.name} {g.id === profile?.group_id ? '(Minha)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <Icons.Dynamic name="chevron-down" className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Matéria</label>
                            <div className="relative">
                                <select 
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="all">Todas as Matérias</option>
                                    {availableSubjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <Icons.BookOpen className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2 px-1 -mx-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border whitespace-nowrap transition-all duration-200 ${
                            selectedCategory === cat.id 
                            ? 'bg-primary text-white border-transparent shadow-md transform scale-105' 
                            : 'bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-5">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm font-medium">Buscando atualizações...</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="text-center py-24 px-6">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-700 transform rotate-3">
                        {searchTerm ? <Icons.Search className="w-10 h-10" /> : <Icons.Layers className="w-10 h-10" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {searchTerm ? 'Nada encontrado.' : 'Tudo limpo por aqui.'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto mb-8">
                        {searchTerm 
                            ? `Não encontramos nada com "${searchTerm}". Tente outra palavra-chave.` 
                            : 'Nenhum material foi publicado nesta categoria ainda.'}
                    </p>
                </div>
            ) : (
                filteredFiles.map(file => (
                    <FileCard 
                        key={file.id} 
                        file={file} 
                        colorHex={file.subject?.color_hex || '#9ca3af'}
                        highlightTerm={searchTerm} 
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    </div>
  );
};