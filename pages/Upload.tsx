
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Service } from '../services/supabase';
import { Subject, Category, Group, FileData, SourceType } from '../types';
import { Icons } from '../components/Icons';
import { MarkdownEditor } from '../components/shared/MarkdownEditor';
import { FileCard } from '../components/shared/FileCard';

// Helper component for Mobile Tabs
const MobileTabControl: React.FC<{ activeTab: string; onChange: (tab: string) => void }> = ({ activeTab, onChange }) => (
    <div className="flex bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
        <button 
            onClick={() => onChange('content')}
            className={`flex-1 p-3 flex flex-col items-center gap-1 ${activeTab === 'content' ? 'text-[#7900c5]' : 'text-gray-400'}`}
        >
            <Icons.Edit className="w-5 h-5" />
            <span className="text-[10px] font-bold">Conteúdo</span>
        </button>
        <button 
            onClick={() => onChange('config')}
            className={`flex-1 p-3 flex flex-col items-center gap-1 ${activeTab === 'config' ? 'text-[#7900c5]' : 'text-gray-400'}`}
        >
            <Icons.Settings className="w-5 h-5" />
            <span className="text-[10px] font-bold">Ajustes</span>
        </button>
        <button 
            onClick={() => onChange('preview')}
            className={`flex-1 p-3 flex flex-col items-center gap-1 ${activeTab === 'preview' ? 'text-[#7900c5]' : 'text-gray-400'}`}
        >
            <Icons.Eye className="w-5 h-5" />
            <span className="text-[10px] font-bold">Preview</span>
        </button>
    </div>
);

export const Upload: React.FC = () => {
  const { profile, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  
  const isEditMode = !!id;

  // Data State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [category, setCategory] = useState<Category>('summary');
  const [sourceType, setSourceType] = useState<SourceType>('community');
  const [files, setFiles] = useState<File[]>([]);
  const [isPollEnabled, setIsPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Mobile specific state
  const [mobileTab, setMobileTab] = useState<'content' | 'config' | 'preview'>('content');

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

  // Determine permissions based on selected subject
  const canPostOfficial = useMemo(() => {
      if (!profile || !user) return false;
      
      // 1. Admins always can
      if (profile.role === 'admin') return true;
      
      // 2. Check specific subject assignment (Monitor OR Teacher)
      const selectedSubject = subjects.find(s => s.id === subjectId);
      if (selectedSubject) {
          if (selectedSubject.monitor_id === user.id) return true;
          if (selectedSubject.teacher_id === user.id) return true;
      }
      
      return false;
  }, [profile, user, subjects, subjectId]);

  // Reset to community if permission is lost during selection change
  useEffect(() => {
      if (!canPostOfficial) {
          setSourceType('community');
      }
  }, [canPostOfficial]);

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
                  setSourceType(file.source_type as SourceType);
              } else {
                  addToast("Post não encontrado.", "error");
                  navigate('/');
              }
              setIsLoadingData(false);
          });
      }
  }, [id, user, isEditMode]);

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
        addToast("Preencha os campos obrigatórios (Título, Turma, Matéria).", "error");
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
                title, description, subject_id: subjectId, target_group_id: targetGroupId, category, source_type: sourceType
            });
            addToast("Alterações salvas com sucesso!");
        } else {
            const meta = {
                title, description, subject_id: subjectId, target_group_id: targetGroupId, category,
                uploader_id: profile?.id, source_type: sourceType 
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
      
      let prevRole: 'teacher' | 'monitor' | 'representative' | null = null;
      if (selectedSubject) {
          if (selectedSubject.teacher_id === profile.id) prevRole = 'teacher';
          else if (selectedSubject.monitor_id === profile.id) prevRole = 'monitor';
      }

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
          source_type: sourceType,
          year_reference: new Date().getFullYear(),
          views_count: 0, likes_count: 0, comments_count: 0,
          created_at: new Date().toISOString(),
          uploader: profile,
          subject: selectedSubject || { id: 'temp', name: 'Matéria', color_hex: '#9ca3af', icon_name: 'book', group_id: 'temp' },
          poll: isPollEnabled ? {
              id: 'prev-poll', file_id: 'prev', total_votes: 0, 
              question: pollQuestion || 'Pergunta da enquete?',
              options: pollOptions.filter(o => o).map((o, i) => ({ id: `opt-${i}`, text: o, votes: 0 }))
          } : null,
          author_role: prevRole
      };
  }, [title, description, subjectId, targetGroupId, category, files, profile, subjects, isPollEnabled, pollQuestion, pollOptions, sourceType]);

  if (isLoadingData) return <div className="min-h-screen flex items-center justify-center dark:bg-black dark:text-white">Carregando dados...</div>;

  // --- COMPONENT SECTIONS ---

  const renderEditor = () => (
      <div className="space-y-6 animate-in slide-in-from-bottom-2">
          {/* Title Input */}
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

          {/* Files Area */}
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
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" multiple accept=".pdf, .doc, .docx, image/*" />
                
                <div className="p-6 md:p-8 text-center">
                    {files.length === 0 ? (
                        <div className="space-y-3 pointer-events-none">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400 group-hover:text-[#7900c5] group-hover:scale-110 transition-all duration-300">
                                <Icons.Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">Upload de Arquivos</h3>
                                <p className="text-xs text-gray-500">PDF, Imagens, Word (Máx 3)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-20">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 animate-in zoom-in">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                                        {file.name.endsWith('.docx') || file.name.endsWith('.doc') ? <Icons.FileWord className="w-5 h-5 text-blue-600" /> : file.type.includes('pdf') ? <Icons.FileText className="w-5 h-5 text-red-600" /> : <Icons.Camera className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                        <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                                    <Icons.Plus className="w-5 h-5 mb-1" />
                                    <span className="text-[10px] font-bold">Adicionar</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
          </div>

          {/* Editor */}
          <div className="h-[400px] shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <MarkdownEditor value={description} onChange={setDescription} />
          </div>

          {/* Poll Section */}
          <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isPollEnabled ? 'border-[#7900c5] bg-purple-50/30 dark:bg-purple-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
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
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPollEnabled ? 'bg-[#7900c5]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isPollEnabled ? 'translate-x-4' : ''}`} />
                    </div>
                </button>

                {isPollEnabled && (
                    <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2">
                        <input 
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                            placeholder="Pergunta da enquete..."
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
                                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7900c5] outline-none"
                                        />
                                        <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">{idx + 1}.</span>
                                    </div>
                                    {pollOptions.length > 2 && (
                                        <button onClick={() => removePollOption(idx)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {pollOptions.length < 10 && (
                                <button onClick={addPollOption} className="text-xs font-bold text-[#7900c5] hover:underline pl-1 flex items-center gap-1">
                                    <Icons.Plus className="w-3 h-3" /> Adicionar opção
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
      </div>
  );

  const renderConfig = () => (
      <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6 h-full overflow-y-auto">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Icons.Settings className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Configurações</h3>
          </div>

          <div className="space-y-4">
              {/* Group Select */}
              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Turma</label>
                  <div className="relative">
                      <select 
                          value={targetGroupId}
                          onChange={(e) => setTargetGroupId(e.target.value)}
                          className="w-full pl-3 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#7900c5] outline-none"
                      >
                          <option value="">Selecione...</option>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <Icons.Dynamic name="chevron-down" className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
              </div>

              {/* Subject Select */}
              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Matéria</label>
                  <div className="relative">
                      <select 
                          value={subjectId}
                          onChange={(e) => setSubjectId(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-sm font-medium text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#7900c5] outline-none"
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

              {/* Category Select */}
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
                                  ? 'bg-[#7900c5] border-[#7900c5] text-white shadow-md' 
                                  : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-500 hover:border-[#7900c5]/50'
                              }`}
                          >
                              <cat.icon className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-bold">{cat.label}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Official Source Toggle */}
              {canPostOfficial && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">Tipo de Publicação</label>
                      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                          <button 
                              onClick={() => setSourceType('community')}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sourceType === 'community' ? 'bg-white dark:bg-black shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}
                          >
                              Comunidade
                          </button>
                          <button 
                              onClick={() => setSourceType('official')}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sourceType === 'official' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                          >
                              Oficial
                          </button>
                      </div>
                  </div>
              )}
          </div>
          
          <div className="pt-6 mt-auto">
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !title || !subjectId}
                className="w-full bg-[#7900c5] hover:bg-[#60009e] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{isEditMode ? 'Salvar Alterações' : 'Publicar Material'}</span>
              </button>
          </div>
      </div>
  );

  const renderPreview = () => (
      <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 text-gray-400 mb-4 px-1">
              <Icons.Eye className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Preview ao Vivo</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 pb-4">
              <div className="transform origin-top transition-all duration-500 pointer-events-none md:pointer-events-auto">
                    {previewData && (
                        <FileCard 
                        file={previewData} 
                        colorHex={subjects.find(s => s.id === subjectId)?.color_hex || '#9ca3af'} 
                        />
                    )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 md:pb-8 flex flex-col">
      
      {/* Header */}
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
              <div className="hidden md:flex items-center space-x-3">
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !title || !subjectId}
                    className="bg-[#7900c5] hover:bg-[#60009e] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                      {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      <span>{isEditMode ? 'Salvar' : 'Publicar'}</span>
                  </button>
              </div>
          </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        
        {/* DESKTOP LAYOUT (Split View) */}
        <div className="hidden md:grid grid-cols-12 gap-8 h-full min-h-[calc(100vh-140px)]">
            {/* Left Column: Editor */}
            <div className="col-span-7 lg:col-span-8 flex flex-col">
                {renderEditor()}
            </div>

            {/* Right Column: Config & Preview */}
            <div className="col-span-5 lg:col-span-4 flex flex-col gap-6 sticky top-24 h-fit max-h-[calc(100vh-100px)]">
                <div className="flex-shrink-0">
                    {renderConfig()}
                </div>
                <div className="flex-1 min-h-0 bg-gray-100/50 dark:bg-gray-900/30 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50">
                    {renderPreview()}
                </div>
            </div>
        </div>

        {/* MOBILE LAYOUT (Tabs) */}
        <div className="md:hidden pb-20">
            {mobileTab === 'content' && renderEditor()}
            
            {mobileTab === 'config' && (
                <div className="animate-in slide-in-from-right-4">
                    {renderConfig()}
                </div>
            )}
            
            {mobileTab === 'preview' && (
                <div className="animate-in zoom-in-95 p-2">
                    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-3xl min-h-[50vh] flex flex-col justify-center">
                        {renderPreview()}
                    </div>
                    {/* Floating Publish Button for Mobile Preview */}
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !title || !subjectId}
                        className="fixed bottom-20 right-4 left-4 bg-[#7900c5] text-white py-3 rounded-xl font-bold shadow-xl z-50 flex justify-center items-center gap-2"
                    >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isEditMode ? 'Salvar' : 'Publicar Agora'}
                    </button>
                </div>
            )}
        </div>

      </div>

      <MobileTabControl activeTab={mobileTab} onChange={(t) => setMobileTab(t as any)} />
    </div>
  );
};
