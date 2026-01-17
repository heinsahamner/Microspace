import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Subject, Category, Group } from '../types';
import { Icons } from '../components/Icons';
import { MarkdownEditor } from '../components/shared/MarkdownEditor';

export const Upload: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [category, setCategory] = useState<Category>('summary');
  
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allGroups = await Service.getGroups();
      setGroups(allGroups);
      if (profile?.group_id) {
          setTargetGroupId(profile.group_id);
          const subs = await Service.getSubjects(profile.group_id);
          setSubjects(subs);
          if (subs.length > 0) setSubjectId(subs[0].id);
      }
    };
    loadData();
  }, [profile]);

  useEffect(() => {
      if(targetGroupId) {
           Service.getSubjects(targetGroupId).then(setSubjects);
      }
  }, [targetGroupId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          if (files.length + newFiles.length > 3) {
              alert("Máximo de 3 arquivos permitidos.");
              return;
          }
          setFiles([...files, ...newFiles]);
      }
  };

  const removeFile = (index: number) => {
      setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title || !targetGroupId) return;

    setIsSubmitting(true);
    try {
        const meta = {
            title,
            description,
            subject_id: subjectId,
            target_group_id: targetGroupId,
            category,
            uploader_id: profile?.id
        };
        await Service.uploadFile(files, meta);
        setTimeout(() => navigate('/community'), 1000);
    } catch (error) {
        console.error(error);
        alert('Erro ao enviar.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200 pb-20">
      
      <div className="bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Icons.ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Novo Material</h1>
          </div>
          <div className="flex items-center space-x-3">
              <button 
                type="button" 
                onClick={() => navigate(-1)} 
                className="hidden md:block text-sm font-bold text-gray-500 hover:text-gray-800 px-4 py-2"
              >
                  Cancelar
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !title}
                className="bg-[#7900c5] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none hover:bg-[#60009e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                  {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
          </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            <div className="md:col-span-1 space-y-6 order-2 md:order-1">
                <div className="bg-white dark:bg-[#121212] rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Contexto</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Turma</label>
                            <select 
                                value={targetGroupId}
                                onChange={(e) => setTargetGroupId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5] text-sm"
                            >
                                <option value="">Selecione...</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Matéria</label>
                            <select 
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5] text-sm"
                            >
                                <option value="">Selecione...</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo de Material</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setCategory('summary')} className={`py-2 text-xs font-bold rounded-lg border transition-colors ${category === 'summary' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Resumo</button>
                                <button type="button" onClick={() => setCategory('activity')} className={`py-2 text-xs font-bold rounded-lg border transition-colors ${category === 'activity' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Atividade</button>
                                <button type="button" onClick={() => setCategory('assessment')} className={`py-2 text-xs font-bold rounded-lg border transition-colors ${category === 'assessment' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Prova</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-start gap-3">
                        <Icons.Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            <p className="font-bold mb-1">Dica de Qualidade</p>
                            Use o editor Markdown para formatar seu texto com negrito, listas e links. Títulos claros ajudam outros alunos a encontrar seu material.
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-6 order-1 md:order-2">
                
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-3xl font-bold bg-transparent border-none placeholder-gray-300 dark:placeholder-gray-700 text-gray-900 dark:text-white focus:ring-0 px-0"
                    placeholder="Título do Material..."
                    autoFocus
                />

                <div className="h-[400px]">
                    <MarkdownEditor value={description} onChange={setDescription} />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Anexos ({files.length}/3)</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {files.map((file, idx) => (
                            <div key={idx} className="relative bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center space-x-3 shadow-sm animate-in fade-in zoom-in-95">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase">
                                    {file.name.split('.').pop()?.substring(0,3)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button type="button" onClick={() => removeFile(idx)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                    <span className="sr-only">Remover</span>
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                            <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#7900c5] hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all h-[72px] sm:h-auto">
                                <input type="file" onChange={handleFileChange} className="hidden" multiple accept="application/pdf,image/*" />
                                <Icons.Upload className="w-5 h-5 text-gray-400 mb-1" />
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Adicionar Arquivo</span>
                            </label>
                        )}
                    </div>
                </div>

            </div>

        </form>
      </div>
    </div>
  );
};