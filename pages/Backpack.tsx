import React, { useEffect, useState, useMemo } from 'react';
import { Icons } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { FileData, Category } from '../types';
import { FileCard } from '../components/shared/FileCard';
import { Link } from 'react-router-dom';

export const Backpack: React.FC = () => {
  const { user } = useAuth();
  const [savedFiles, setSavedFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'group'>('grid');

  useEffect(() => {
      const fetchSaved = async () => {
          if (!user) return;
          const data = await Service.getSavedFiles(user.id);
          setSavedFiles(data);
          setLoading(false);
      };
      fetchSaved();
  }, [user]);

  const handleUnsave = (id: string, status: boolean) => {
      if (!status) {
          setSavedFiles(prev => prev.filter(f => f.id !== id));
      }
  };

  const filteredFiles = useMemo(() => {
      return savedFiles.filter(file => {
          const matchesSearch = 
            file.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            file.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
          const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
          return matchesSearch && matchesCategory;
      });
  }, [savedFiles, searchTerm, selectedCategory]);

  const groupedFiles = useMemo(() => {
      const groups: Record<string, FileData[]> = {};
      filteredFiles.forEach(file => {
          const subName = file.subject?.name || 'Geral';
          if (!groups[subName]) groups[subName] = [];
          groups[subName].push(file);
      });
      return groups;
  }, [filteredFiles]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:max-w-5xl md:mx-auto pb-24 transition-colors duration-200">
       
       <div className="mb-8 pt-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center space-x-4 mb-2">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm">
                    <Icons.Backpack className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Mochila</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {savedFiles.length} {savedFiles.length === 1 ? 'item salvo' : 'itens salvos'}
                    </p>
                </div>
            </div>
       </div>

       <div className="bg-white dark:bg-[#121212] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 sticky top-20 z-30 transition-all">
           <div className="flex flex-col md:flex-row gap-4">
               
               <div className="relative flex-1">
                   <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                   <input 
                        type="text" 
                        placeholder="Buscar materiais, assuntos..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-gray-400"
                   />
               </div>

               <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 md:flex-none">
                       {(['all', 'summary', 'activity', 'assessment'] as const).map(cat => (
                           <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    selectedCategory === cat 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none' 
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                           >
                               {cat === 'all' ? 'Tudo' : cat === 'summary' ? 'Resumos' : cat === 'activity' ? 'Atividades' : 'Provas'}
                           </button>
                       ))}
                   </div>

                   <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

                   <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0">
                       <button 
                            onClick={() => setViewMode('grid')}
                            title="Visualização em Grade"
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#121212] text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                       >
                           <Icons.List className="w-4 h-4" />
                       </button>
                       <button 
                            onClick={() => setViewMode('group')}
                            title="Agrupar por Matéria"
                            className={`p-2 rounded-lg transition-all ${viewMode === 'group' ? 'bg-white dark:bg-[#121212] text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                       >
                           <Icons.Layers className="w-4 h-4" />
                       </button>
                   </div>
               </div>
           </div>
       </div>

       <div className="animate-in fade-in duration-500">
           {loading ? (
               <div className="flex flex-col items-center justify-center py-20">
                   <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-gray-400 text-sm">Carregando mochila...</p>
               </div>
           ) : filteredFiles.length === 0 ? (
               <div className="text-center py-20 bg-white dark:bg-[#121212] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                   <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-600">
                       <Icons.Search className="w-8 h-8" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Nenhum item encontrado</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto mb-6">
                       {savedFiles.length === 0 
                        ? 'Sua mochila está vazia. Salve materiais da comunidade para vê-los aqui.'
                        : 'Tente mudar os filtros ou o termo de busca.'}
                   </p>
                   {savedFiles.length === 0 && (
                       <Link to="/community" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                           Explorar Comunidade
                       </Link>
                   )}
               </div>
           ) : viewMode === 'grid' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredFiles.map(file => (
                       <FileCard 
                            key={file.id} 
                            file={file} 
                            colorHex={file.subject?.color_hex || '#7900c5'} 
                            onToggleSave={handleUnsave}
                            highlightTerm={searchTerm}
                       />
                   ))}
               </div>
           ) : (
               <div className="space-y-8">
                   {Object.entries(groupedFiles).map(([subjectName, files]: [string, FileData[]]) => (
                       <div key={subjectName} className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                           <div className="flex items-center gap-3 mb-4">
                               <div className="w-3 h-8 rounded-full bg-indigo-500"></div>
                               <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                   {subjectName}
                               </h3>
                               <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-lg">
                                   {files.length}
                               </span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {files.map(file => (
                                   <FileCard 
                                        key={file.id} 
                                        file={file} 
                                        colorHex={file.subject?.color_hex || '#7900c5'} 
                                        onToggleSave={handleUnsave}
                                        highlightTerm={searchTerm}
                                   />
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </div>
  );
};