import React, { useState, useEffect } from 'react';
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
    { id: 'assessment', label: 'Avaliações' },
];

export const FeedPage: React.FC<FeedPageProps> = ({ type }) => {
  const { profile, user } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    if (profile?.group_id && !selectedGroup) {
        setSelectedGroup(profile.group_id);
    }
  }, [profile]);

  useEffect(() => {
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

  return (
    <div className="min-h-screen p-4 md:max-w-4xl md:mx-auto">
        <div className="bg-white dark:bg-[#121212] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 transition-colors">
            <div className="flex flex-col space-y-4">
                
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                        <select 
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full sm:w-auto pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#7900c5] focus:border-transparent outline-none appearance-none"
                        >
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.name} {g.id === profile?.group_id ? '(Minha Turma)' : ''}
                                </option>
                            ))}
                        </select>
                        <Icons.Filter className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative flex-1">
                        <select 
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#7900c5] focus:border-transparent outline-none appearance-none"
                        >
                            <option value="all">Todas as Matérias</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <Icons.BookOpen className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-400 pointer-events-none" />
                    </div>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap transition-colors ${
                                selectedCategory === cat.id 
                                ? 'bg-[#7900c5] text-white border-[#7900c5]' 
                                : 'bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-4">
            {loading ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">Carregando feed...</div>
            ) : files.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-600">
                        {type === 'official' ? <Icons.BadgeCheck className="w-8 h-8" /> : <Icons.Users className="w-8 h-8" />}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum material encontrado para este filtro.</p>
                </div>
            ) : (
                files.map(file => (
                    <FileCard key={file.id} file={file} colorHex={file.subject?.color_hex || '#9ca3af'} />
                ))
            )}
        </div>
    </div>
  );
};