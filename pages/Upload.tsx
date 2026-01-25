import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id } = useParams<{ id: string }>(); 
  
  const isEditMode = !!id;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [category, setCategory] = useState<Category>('summary');
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allGroups = await Service.getGroups();
      setGroups(allGroups);
      if (profile?.group_id && !targetGroupId) {
          setTargetGroupId(profile.group_id);
      }
    };
    loadData();
  }, [profile]);

  useEffect(() => {
      if(targetGroupId) {
           Service.getSubjects(targetGroupId).then(subs => {
               setSubjects(subs);
               if (subs.length > 0 && !subjectId && !isEditMode) setSubjectId(subs[0].id);
           });
      }
  }, [targetGroupId]);

  useEffect(() => {
      if (isEditMode && id) {
          setIsLoadingData(true);
          Service.getFile(id).then(file => {
              if (file) {
                  if (file.uploader_id !== user.id) {
                      addToast("Você não tem permissão para editar este post.", "error");
                      navigate('/');
                      return;
                  }
                  setTitle(file.title);
                  setDescription(file.description || '');
                  setTargetGroupId(file.target_group_id);
                  setSubjectId(file.subject_id);
                  setCategory(file.category as Category);
              } else {
                  addToast("Post não encontrado.", "error");
                  navigate('/');
              }
              setIsLoadingData(false);
          });
      }
  }, [id, user, isEditMode]);

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
              setDescription(prev => `${prev}\n#${currentTag.trim()}`);
          }
          setCurrentTag('');
      }
  };

  const handlePollOptionChange = (idx: number, value: string) => {
      const newOptions = [...pollOptions];
      newOptions[idx] = value;
      setPollOptions(newOptions);
  };

  const addPollOption = () => {
      if (pollOptions.length < 10) setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (idx: number) => {
      if (pollOptions.length > 2) {
          setPollOptions(pollOptions.filter((_, i) => i !== idx));
      }
  };

  const handleSubmit = async () => {
    if (!subjectId || !title || !targetGroupId) {
        addToast("Preencha os campos obrigatórios.", "error");
        return;
    }

    if (isPollEnabled) {
        if (!pollQuestion.trim()) return addToast("Defina a pergunta da enquete.", "error");
        const validOptions = pollOptions.filter(o => o.trim());
        if (validOptions.length < 2) return addToast("A enquete precisa de pelo menos 2 opções válidas.", "error");
    }

    setIsSubmitting(true);
    try {
        if (isEditMode && id) {
            await Service.updateFile(id, {
                title, description, subject_id: subjectId, target_group_id: targetGroupId, category
            });
            addToast("Alterações salvas com sucesso!");
        } else {
            const meta = {
                title, description, subject_id: subjectId, target_group_id: targetGroupId, category,
                uploader_id: profile?.id, source_type: 'community' 
            };
            
            const pollData = isPollEnabled ? {
                question: pollQuestion,
                options: pollOptions.filter(o => o.trim())
            } : undefined;

            await Service.uploadFile(files, meta, pollData);
            addToast("Material publicado com sucesso!");
        }
        setTimeout(() => navigate(-1), 500);
    } catch (error) {
        console.error(error);
        addToast('Erro ao salvar material.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

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
          views_count: 0, likes_count: 0, comments_count: 0,
          created_at: new Date().toISOString(),
          uploader: profile,
          subject: selectedSubject || { id: 'temp', name: 'Matéria', color_hex: '#9ca3af', icon_name: 'book', group_id: 'temp' },
          poll: isPollEnabled ? {
              id: 'prev-poll', file_id: 'prev', total_votes: 0, 
              question: pollQuestion || 'Pergunta da enquete?',
              options: pollOptions.filter(o => o).map((o, i) => ({ id: `opt-${i}`, text: o, votes: 0 }))
          } : null
      };
  }, [title, description, subjectId, targetGroupId, category, files, profile, subjects, isPollEnabled, pollQuestion, pollOptions]);

  if (isLoadingData) return <div className="min-h-screen flex items-center justify-center dark:bg-black dark:text-white">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      
      <div className="bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                  <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                      <Icons.ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                      <h1 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{isEditMode ? 'Editar Material' : 'Estúdio de Criação'}</h1>
                      <p className="text-[10px] text-gray-500">{isEditMode ? 'Atualizar informações' : 'Publicar novo material'}</p>
                  </div>
              </div>
              <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !title || !subjectId}
                    className="bg-[#7900c5] hover:bg-[#60009e] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                      {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      <span>{isEditMode ? 'Salvar Alterações' : 'Publicar'}</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            
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

            {isEditMode ? (
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex items-center gap-3">
                    <Icons.AlertCircle className="w-5 h-5 text-orange-500" />
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                        No momento, não é possível substituir os arquivos de um post existente. Você está editando apenas o texto e a classificação.
                    </p>
                </div>
            ) : (
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
            )}

            {!isEditMode && (
                <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isPollEnabled ? 'border-[#7900c5] bg-purple-50/50 dark:bg-purple-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
                    <button 
                        onClick={() => setIsPollEnabled(!isPollEnabled)}
                        className="w-full flex items-center justify-between p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isPollEnabled ? 'bg-[#7900c5] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                <Icons.Dynamic name="BarChart" className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className={`text-sm font-bold ${isPollEnabled ? 'text-[#7900c5]' : 'text-gray-900 dark:text-white'}`}>Adicionar Enquete</h3>
                                <p className="text-xs text-gray-500">Crie uma votação para a turma</p>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPollEnabled ? 'bg-[#7900c5]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isPollEnabled ? 'translate-x-4' : ''}`} />
                        </div>
                    </button>

                    {isPollEnabled && (
                        <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                            <input 
                                value={pollQuestion}
                                onChange={e => setPollQuestion(e.target.value)}
                                placeholder="Faça uma pergunta..."
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7900c5] outline-none"
                            />
                            <div className="space-y-2">
                                {pollOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input 
                                                value={opt}
                                                onChange={e => handlePollOptionChange(idx, e.target.value)}
                                                placeholder={`Opção ${idx + 1}`}
                                                className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7900c5] outline-none"
                                            />
                                            <div className="absolute left-3 top-3.5 text-xs font-bold text-gray-400">
                                                {idx + 1}.
                                            </div>
                                        </div>
                                        {pollOptions.length > 2 && (
                                            <button 
                                                onClick={() => removePollOption(idx)}
                                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl"
                                            >
                                                <Icons.Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {pollOptions.length < 10 && (
                                    <button onClick={addPollOption} className="text-xs font-bold text-[#7900c5] hover:underline pl-2 flex items-center gap-1">
                                        <Icons.Plus className="w-3 h-3" /> Adicionar opção ({pollOptions.length}/10)
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                <div className="h-[500px] shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl overflow-hidden">
                    <MarkdownEditor value={description} onChange={setDescription} />
                </div>
            </div>

        </div>

        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm sticky top-24">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center">
                    <Icons.Settings className="w-4 h-4 mr-2" />
                    Configurações
                </h3>

                <div className="space-y-5">
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