import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Subject, Category, FileData, TabItem } from '../types';
import { Icons } from '../components/Icons';
import { Service } from '../services/supabase';
import { FileCard } from '../components/shared/FileCard';
import { PostSkeleton } from '../components/shared/Skeleton';
import { useAuth } from '../contexts/AuthContext';

const TABS: TabItem[] = [
  { id: 'summary', label: 'Resumos' },
  { id: 'activity', label: 'Atividades' },
  { id: 'assessment', label: 'Avaliações' },
];

type SourceFilter = 'all' | 'official' | 'community';

export const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [subject, setSubject] = useState<Subject | null>(location.state?.subject || null);
  const [activeTab, setActiveTab] = useState<Category>('summary');
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  useEffect(() => {
    if (!subject && id) {
        const fetchSub = async () => {
             const subs = await Service.getAllSubjects();
             const found = subs.find(s => s.id === id);
             if (found) setSubject(found);
        };
        fetchSub();
    }
  }, [id, subject]);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      if (!id || !user) return;
      const data = await Service.getFiles(id, activeTab, sourceFilter, null, user.id);
      setFiles(data);
      setLoading(false);
    };

    fetchFiles();
  }, [id, activeTab, sourceFilter, user]);

  const filteredFiles = useMemo(() => {
      if (!searchTerm) return files;
      const lowerSearch = searchTerm.toLowerCase();
      return files.filter(file => 
          file.title.toLowerCase().includes(lowerSearch) ||
          file.description?.toLowerCase().includes(lowerSearch)
      );
  }, [files, searchTerm]);

  if (!subject) return <div className="p-6 text-center text-gray-500">Carregando informações da matéria...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      
      {/* Modern Minimal Header */}
      <div className="bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 pt-6 pb-6 px-4 sticky top-0 z-20 transition-colors">
          <div className="md:max-w-5xl md:mx-auto">
              <div className="flex items-center gap-4 mb-6">
                   <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                      <Icons.ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {subject.name}
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color_hex }}></div>
                      </h1>
                  </div>
              </div>

              {/* Controls Row */}
              <div className="flex flex-col gap-4">
                  {/* Search */}
                  <div className="relative">
                      <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                          type="text" 
                          placeholder="Filtrar por nome ou conteúdo..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-gray-400"
                      />
                  </div>

                  {/* Filter Groups - Horizontal Scroll for Mobile Safety */}
                  <div className="flex items-center overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4 w-[calc(100%+2rem)] md:w-auto md:mx-0 md:px-0">
                      {/* Tabs (Compacted) */}
                      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shrink-0">
                          {TABS.map((tab) => (
                              <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-shrink-0 ${
                                      activeTab === tab.id
                                          ? 'bg-white dark:bg-[#121212] text-primary shadow-sm'
                                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                              >
                                  {tab.label}
                              </button>
                          ))}
                      </div>

                      <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 shrink-0 hidden sm:block"></div>

                      {/* Source Filter (Compacted) */}
                      <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shrink-0">
                           <button 
                              onClick={() => setSourceFilter('all')}
                              className={`px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${sourceFilter === 'all' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
                              title="Todos"
                           >
                               <Icons.Filter className="w-4 h-4" />
                           </button>
                           <button 
                              onClick={() => setSourceFilter('official')}
                              className={`px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${sourceFilter === 'official' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
                              title="Apenas Oficial"
                           >
                               <Icons.BadgeCheck className="w-4 h-4" />
                           </button>
                           <button 
                              onClick={() => setSourceFilter('community')}
                              className={`px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${sourceFilter === 'community' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
                              title="Apenas Comunidade"
                           >
                               <Icons.Users className="w-4 h-4" />
                           </button>
                      </div>
                      
                      {/* Wider Spacer to prevent clipping */}
                      <div className="w-8 h-1 flex-shrink-0 md:hidden"></div>
                  </div>
              </div>
          </div>
      </div>

      <div className="md:max-w-5xl md:mx-auto px-4 mt-6">
        <div className="space-y-4">
            {loading ? (
                <>
                    <PostSkeleton />
                    <PostSkeleton />
                </>
            ) : filteredFiles.length === 0 ? (
                <div className="text-center py-20 px-6">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-600">
                        <Icons.Dynamic name={subject.icon_name} className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-bold mb-1">Nada nesta seção.</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {searchTerm ? 'Tente buscar com outro termo.' : 'Seja o primeiro a compartilhar algo aqui!'}
                    </p>
                    {!searchTerm && (
                         <button onClick={() => navigate('/upload')} className="mt-6 text-sm font-bold text-primary hover:underline">
                             Criar novo material
                         </button>
                    )}
                </div>
            ) : (
                filteredFiles.map(file => (
                    <FileCard 
                        key={file.id} 
                        file={file} 
                        colorHex={subject.color_hex} 
                        highlightTerm={searchTerm}
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
};