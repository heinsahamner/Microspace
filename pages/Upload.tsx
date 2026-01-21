
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Service } from '../services/supabase';
import { Subject, Category, Group, FileData } from '../types';
import { Icons } from '../components/Icons';
import { MarkdownEditor } from '../components/shared/MarkdownEditor';
import { FileCard } from '../components/shared/FileCard';

export const Upload: React.FC = () => {
  const { profile, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  // Data State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [category, setCategory] = useState<Category>('summary');
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allGroups = await Service.getGroups();
      setGroups(allGroups);
      if (profile?.group_id) {
          setTargetGroupId(profile.group_id);
      }
    };
    loadData();
  }, [profile]);

  useEffect(() => {
      if(targetGroupId) {
           Service.getSubjects(targetGroupId).then(subs => {
               setSubjects(subs);
               if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
           });
      }
  }, [targetGroupId]);

  // --- Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (newFiles: File[]) => {
      if (files.length + newFiles.length > 3) {
          addToast("Máximo de 3 arquivos permitidos.", "error");
          return;
      }
      setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) {
          addFiles(Array.from(e.dataTransfer.files));
      }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && currentTag.trim()) {
          e.preventDefault();
          if (!tags.includes(currentTag.trim())) {
              const newTags = [...tags, currentTag.trim()];
              setTags(newTags);
              // Append to description automatically
              setDescription(prev => `${prev}\n#${currentTag.trim()}`);
          }
          setCurrentTag('');
      }
  };

  const handleSubmit = async () => {
    if (!subjectId || !title || !targetGroupId) {
        addToast("Preencha os campos obrigatórios.", "error");
        return;
    }

    setIsSubmitting(true);
    try {
        const meta = {
            title,
            description,
            subject_id: subjectId,
            target_group_id: targetGroupId,
            category,
            uploader_id: profile?.id,
            source_type: 'community' 
        };
        await Service.uploadFile(files, meta);
        addToast("Material publicado com sucesso!");
        setTimeout(() => navigate('/community'), 500);
    } catch (error) {
        console.error(error);
        addToast('Erro ao enviar material.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Live Preview Generator ---
  const previewData: FileData | null = useMemo(() => {
      if (!profile || !targetGroupId) return null;
      const selectedSubject = subjects.find(s => s.id === subjectId);
      
      return {
          id: 'preview',
          title: title || 'Título do Material',
          description: description || 'A descrição do seu material aparecerá aqui...',
          file_url: files.length > 0 ? '#' : null,
          file_type: files.length > 0 ? files[0].type : null,
          size_bytes: 0,
          attachments: files.map(f => ({ name: f.name, size: f.size, type: f.type, url: '#' })),
          uploader_id: profile.id,
          subject_id: subjectId,
          target_group_id: targetGroupId,
          category: category,
          source_type: 'community',
          year_reference: new Date().getFullYear(),
          views_count: 0,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          uploader: profile,
          subject: selectedSubject || { id: 'temp', name: 'Matéria', color_hex: '#9ca3af', icon_name: 'book', group_id: 'temp' }
      };
  }, [title, description, subjectId, targetGroupId, category, files, profile, subjects]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      
      {/* Navbar Minimalista */}
      <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                  <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                      <Icons.ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                      <h1 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Estúdio de Criação</h1>
                      <p className="text-[10px] text-gray-500">Publicar novo material</p>
                  </div>
              </div>
              <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400 hidden sm:block">
                      {isSubmitting ? 'Salvando...' : 'Alterações não salvas'}
                  </span>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !title || !subjectId}
                    className="bg-[#7900c5] hover:bg-[#60009e] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                      {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      <span>Publicar</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: EDITOR (8/12) */}
        <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Title Section */}
            <div className="space-y-2">
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none placeholder-gray-300 dark:placeholder-gray-700 text-gray-900 dark:text-white focus:ring-0 px-0 leading-tight"
                    placeholder="Dê um título incrível..."
                    autoFocus
                />
            </div>

            {/* Enhanced File Dropzone */}
            <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden ${
                    isDragOver 
                    ? 'border-[#7900c5] bg-purple-50 dark:bg-purple-900/20 scale-[1.01]' 
                    : files.length > 0 
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212]'
                        : 'border-gray-300 dark:border-gray-700 hover:border-[#7900c5] hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" multiple accept="application/pdf,image/*" />
                
                <div className="p-8 md:p-12 text-center">
                    {files.length === 0 ? (
                        <div className="space-y-4 pointer-events-none">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 group-hover:text-[#7900c5] group-hover:scale-110 transition-all duration-300">
                                <Icons.Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Arraste arquivos aqui</h3>
                                <p className="text-sm text-gray-500">ou clique para navegar</p>
                            </div>
                            <p className="text-xs text-gray-400">PDF, Imagens (Máx 3 arquivos)</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-20">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 animate-in zoom-in">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                                        {file.name.split('.').pop()?.substring(0,3)}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); const newFiles = [...files]; newFiles.splice(idx, 1); setFiles(newFiles); }}
                                        className="p-2 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {files.length < 3 && (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-400 hover:text-[#7900c5] hover:border-[#7900c5] hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                                    <Icons.Plus className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-bold">Adicionar mais</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Markdown Editor */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Descrição Detalhada</label>
                    <div className="flex items-center space-x-2">
                         <div className="relative">
                            <Icons.Hash className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                value={currentTag}
                                onChange={e => setCurrentTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Add tag + Enter"
                                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full focus:ring-1 focus:ring-[#7900c5] outline-none text-gray-700 dark:text-gray-300 w-32 focus:w-48 transition-all"
                            />
                         </div>
                    </div>
                </div>
                
                <div className="h-[500px] shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl overflow-hidden">
                    <MarkdownEditor value={description} onChange={setDescription} />
                </div>
            </div>

        </div>

        {/* COLUNA DIREITA: SETTINGS & PREVIEW (4/12) */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Context Panel */}
            <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm sticky top-24">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center">
                    <Icons.Settings className="w-4 h-4 mr-2" />
                    Configurações
                </h3>

                <div className="space-y-5">
                    {/* Class Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Para qual turma?</label>
                        <div className="relative">
                            <select 
                                value={targetGroupId}
                                onChange={(e) => setTargetGroupId(e.target.value)}
                                className="w-full pl-3 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#7900c5] outline-none transition-all"
                            >
                                <option value="">Selecione...</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <Icons.Dynamic name="chevron-down" className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Subject Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Qual a matéria?</label>
                        <div className="relative">
                            <select 
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#7900c5] outline-none transition-all"
                            >
                                <option value="">Selecione...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <div className="absolute left-3 top-3 text-gray-400">
                                {subjectId ? (
                                    <div className="w-4 h-4 rounded-full" style={{background: subjects.find(s => s.id === subjectId)?.color_hex}}></div>
                                ) : (
                                    <Icons.BookOpen className="w-4 h-4" />
                                )}
                            </div>
                            <Icons.Dynamic name="chevron-down" className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Categoria</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'summary', label: 'Resumo', icon: Icons.FileText },
                                { id: 'activity', label: 'Atividade', icon: Icons.Activity },
                                { id: 'assessment', label: 'Prova', icon: Icons.BadgeCheck }
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id as Category)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                        category === cat.id 
                                        ? 'bg-[#7900c5] border-[#7900c5] text-white shadow-md transform scale-105' 
                                        : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 hover:border-[#7900c5]/50'
                                    }`}
                                >
                                    <cat.icon className="w-5 h-5 mb-1" />
                                    <span className="text-[10px] font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Preview Widget */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                        <span>Live Preview</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">Ao Vivo</span>
                    </h3>
                    <div className="transform scale-95 origin-top opacity-90 hover:opacity-100 hover:scale-100 transition-all duration-500">
                         {previewData && (
                             <FileCard 
                                file={previewData} 
                                colorHex={subjects.find(s => s.id === subjectId)?.color_hex || '#9ca3af'} 
                             />
                         )}
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};
