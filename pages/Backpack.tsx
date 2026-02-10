
import React, { useEffect, useState, useMemo } from 'react';
import { Icons } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { OfflineService } from '../services/offline';
import { FileData, Category, BackpackCollection } from '../types';
import { FileCard } from '../components/shared/FileCard';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export const Backpack: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [savedFiles, setSavedFiles] = useState<FileData[]>([]);
  const [collections, setCollections] = useState<BackpackCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  
  const [manageMode, setManageMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveTo, setShowMoveTo] = useState(false);

  const fetchBackpackData = async () => {
      if (!user) return;
      try {
          const files = await Service.getSavedFiles(user.id);
          const cols = await OfflineService.getCollections();
          setSavedFiles(files);
          setCollections(cols);
          
          if (!navigator.onLine) setIsOfflineMode(true);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchBackpackData();
      const handleOnline = () => { setIsOfflineMode(false); fetchBackpackData(); };
      const handleOffline = () => setIsOfflineMode(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, [user]);

  const handleUnsave = (id: string, status: boolean) => {
      if (!status) {
          setSavedFiles(prev => prev.filter(f => f.id !== id));
      }
  };

  const handleCreateCollection = async () => {
      if (!newFolderName.trim()) return;
      const col = await OfflineService.createCollection(newFolderName);
      setCollections([...collections, col]);
      setNewFolderName('');
      setShowCreateFolder(false);
      addToast('Pasta criada!', 'success');
  };

  const handleDeleteCollection = async (id: string) => {
      if (!window.confirm("Apagar pasta? Os arquivos voltarão para 'Não classificados'.")) return;
      await OfflineService.deleteCollection(id);
      
      setSavedFiles(prev => prev.map(f => f.collection_id === id ? { ...f, collection_id: null } : f));
      setCollections(prev => prev.filter(c => c.id !== id));
      if (selectedCollectionId === id) setSelectedCollectionId(null);
  };

  const toggleFileSelection = (id: string) => {
      const newSet = new Set(selectedFileIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedFileIds(newSet);
  };

  const handleMoveFiles = async (targetCollectionId: string | null) => {
      for (const fileId of selectedFileIds) {
          if (targetCollectionId) {
              await OfflineService.addFileToCollection(fileId, targetCollectionId);
          } else {
              await OfflineService.removeFileFromCollection(fileId);
          }
      }
      
      setSavedFiles(prev => prev.map(f => {
          if (selectedFileIds.has(f.id)) {
              return { ...f, collection_id: targetCollectionId };
          }
          return f;
      }));

      addToast('Arquivos movidos!', 'success');
      setManageMode(false);
      setSelectedFileIds(new Set());
      setShowMoveTo(false);
  };

  const filteredFiles = useMemo(() => {
      let filtered = savedFiles.filter(file => 
          file.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          file.subject?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedCollectionId) {
          filtered = filtered.filter(f => f.collection_id === selectedCollectionId);
      } else {
          
          if (selectedCollectionId === 'unsorted') {
              filtered = filtered.filter(f => !f.collection_id);
          }
      }

      return filtered;
  }, [savedFiles, searchTerm, selectedCollectionId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:max-w-5xl md:mx-auto pb-24 transition-colors duration-200">
       
       <div className="mb-6 pt-4 animate-in slide-in-from-top-4 duration-500 flex justify-between items-start">
            <div className="flex items-center space-x-4 mb-2">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-sm">
                    <Icons.Backpack className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Mochila</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {savedFiles.length} itens salvos
                    </p>
                </div>
            </div>
            
            {isOfflineMode && (
                <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-orange-200 dark:border-orange-800">
                    <Icons.Dynamic name="wifi-off" className="w-3 h-3" />
                    Offline
                </div>
            )}
       </div>

       <div className="mb-8">
           <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Minhas Pastas</h3>
               <button 
                 onClick={() => setShowCreateFolder(true)}
                 className="text-xs text-[#7900c5] font-bold hover:underline flex items-center gap-1"
               >
                   <Icons.Plus className="w-3 h-3" /> Nova Pasta
               </button>
           </div>
           
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
               <button 
                   onClick={() => setSelectedCollectionId(null)}
                   className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all flex flex-col justify-between min-w-[100px] h-20 ${
                       selectedCollectionId === null
                       ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg'
                       : 'bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                   }`}
               >
                   <Icons.Backpack className="w-5 h-5 opacity-70" />
                   <span className="text-xs font-bold mt-2 text-left">Tudo</span>
               </button>

                <button 
                   onClick={() => setSelectedCollectionId('unsorted')}
                   className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all flex flex-col justify-between min-w-[100px] h-20 ${
                       selectedCollectionId === 'unsorted'
                       ? 'bg-indigo-600 text-white border-transparent shadow-lg'
                       : 'bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                   }`}
               >
                   <Icons.Folder className="w-5 h-5 opacity-70" />
                   <span className="text-xs font-bold mt-2 text-left">Sem Pasta</span>
               </button>

               {collections.map(col => (
                   <div key={col.id} className="relative group">
                       <button 
                           onClick={() => setSelectedCollectionId(col.id)}
                           className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all flex flex-col justify-between min-w-[120px] h-20 relative overflow-hidden ${
                               selectedCollectionId === col.id
                               ? 'bg-indigo-600 text-white border-transparent shadow-lg'
                               : 'bg-white dark:bg-[#121212] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                           }`}
                       >
                           <div className="flex justify-between w-full">
                               <Icons.Folder className="w-5 h-5 opacity-70" />
                               <span className="text-[10px] font-mono opacity-60">
                                   {savedFiles.filter(f => f.collection_id === col.id).length}
                               </span>
                           </div>
                           <span className="text-xs font-bold mt-2 text-left truncate w-full">{col.name}</span>
                       </button>
                       <button 
                           onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                           className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                       >
                           <Icons.X className="w-3 h-3" />
                       </button>
                   </div>
               ))}
           </div>
       </div>

       <div className="bg-white dark:bg-[#121212] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 sticky top-20 z-30">
           <div className="flex gap-3">
               <div className="relative flex-1">
                   <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                   <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                   />
               </div>
               
               <button 
                   onClick={() => { setManageMode(!manageMode); setSelectedFileIds(new Set()); }}
                   className={`px-4 rounded-xl font-bold text-xs border transition-all ${
                       manageMode 
                       ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
                       : 'bg-white dark:bg-black text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                   }`}
               >
                   {manageMode ? 'Cancelar' : 'Gerenciar'}
               </button>
           </div>

           {manageMode && selectedFileIds.size > 0 && (
               <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center animate-in slide-in-from-top-1">
                   <span className="text-xs font-bold text-gray-500">{selectedFileIds.size} selecionados</span>
                   <button 
                       onClick={() => setShowMoveTo(true)}
                       className="bg-[#7900c5] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-[#60009e] transition-colors flex items-center gap-2"
                   >
                       <Icons.FolderPlus className="w-3 h-3" /> Mover para Pasta
                   </button>
               </div>
           )}
       </div>

       <div className="animate-in fade-in duration-500">
           {loading ? (
               <div className="flex flex-col items-center justify-center py-20">
                   <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-gray-400 text-sm">Carregando mochila...</p>
               </div>
           ) : filteredFiles.length === 0 ? (
               <div className="text-center py-20 text-gray-400">
                   <Icons.Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                   <p className="text-sm">Pasta vazia ou nenhum item encontrado.</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredFiles.map(file => (
                       <div key={file.id} className="relative group">
                           {manageMode && (
                               <div 
                                   className="absolute inset-0 z-20 cursor-pointer" 
                                   onClick={() => toggleFileSelection(file.id)}
                               >
                                   <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${
                                       selectedFileIds.has(file.id) 
                                       ? 'bg-[#7900c5] border-[#7900c5] scale-110' 
                                       : 'bg-white dark:bg-black border-gray-300 dark:border-gray-600'
                                   }`}>
                                       {selectedFileIds.has(file.id) && <Icons.Dynamic name="check" className="w-3 h-3 text-white" />}
                                   </div>
                               </div>
                           )}
                           
                           <div className={`${manageMode ? 'pointer-events-none opacity-90' : ''}`}>
                               <FileCard 
                                    file={file} 
                                    colorHex={file.subject?.color_hex || '#7900c5'} 
                                    onToggleSave={handleUnsave}
                                    highlightTerm={searchTerm}
                               />
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </div>

       {showCreateFolder && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
               <div className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nova Pasta</h3>
                   <input 
                       value={newFolderName}
                       onChange={e => setNewFolderName(e.target.value)}
                       className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-sm outline-none focus:border-[#7900c5] mb-4"
                       placeholder="Nome da pasta..."
                       autoFocus
                   />
                   <div className="flex gap-3 justify-end">
                       <button onClick={() => setShowCreateFolder(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                       <button onClick={handleCreateCollection} className="px-4 py-2 bg-[#7900c5] text-white rounded-lg text-sm font-bold">Criar</button>
                   </div>
               </div>
           </div>
       )}

       {showMoveTo && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
               <div className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                   <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                       <h3 className="font-bold text-gray-900 dark:text-white">Mover para...</h3>
                   </div>
                   <div className="max-h-60 overflow-y-auto">
                       <button onClick={() => handleMoveFiles(null)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-3">
                           <Icons.Folder className="w-5 h-5 text-gray-400" />
                           <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sem Pasta (Raiz)</span>
                       </button>
                       {collections.map(col => (
                           <button key={col.id} onClick={() => handleMoveFiles(col.id)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-3 border-t border-gray-50 dark:border-gray-800">
                               <Icons.Folder className="w-5 h-5 text-[#7900c5]" />
                               <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{col.name}</span>
                           </button>
                       ))}
                   </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 text-center">
                       <button onClick={() => setShowMoveTo(false)} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">Cancelar</button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};
