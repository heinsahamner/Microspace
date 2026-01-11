import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MockService, isDemoMode, supabase } from '../services/supabase';
import { Subject, Category, Group } from '../types';
import { Icons } from '../components/Icons';

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
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const allGroups = await MockService.getGroups();
      setGroups(allGroups);
      if (profile?.group_id) setTargetGroupId(profile.group_id);

      if (profile?.group_id) {
        if(isDemoMode) {
             setSubjects(await MockService.getSubjects(profile.group_id));
        } else {
             const { data } = await supabase.from('subjects').select('*');
             if(data) setSubjects(data);
        }
      }
    };
    loadData();
  }, [profile]);

  const insertText = (text: string) => {
      if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          const current = description;
          const newText = current.substring(0, start) + text + current.substring(end);
          setDescription(newText);
          
          setTimeout(() => {
              if (textareaRef.current) {
                  textareaRef.current.focus();
                  textareaRef.current.setSelectionRange(start + text.length, start + text.length);
              }
          }, 0);
      }
  };

  const wrapText = (wrapper: string) => {
    if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const current = description;
        const selected = current.substring(start, end);
        
        if (selected) {
            const newText = current.substring(0, start) + `${wrapper}${selected}${wrapper}` + current.substring(end);
            setDescription(newText);
        } else {
            insertText(wrapper);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!file && !description) || !subjectId || !title || !targetGroupId) return;

    setIsSubmitting(true);

    try {
        if (isDemoMode) {
            const meta = {
                title,
                description,
                subject_id: subjectId,
                target_group_id: targetGroupId,
                category,
                uploader_id: profile?.id
            };
            await MockService.uploadFile(file, meta);
            setTimeout(() => {
                navigate('/community');
            }, 1000);
        } else {
            navigate('/');
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao enviar.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6 md:p-12 pb-24 transition-colors duration-200">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-8">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Icons.ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Publicar Material</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Arquivo (Opcional)</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Icons.Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-600" />
                    <span className="text-sm font-medium">
                        {file ? file.name : "Toque para selecionar um arquivo"}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF ou Imagem (Max 10MB)</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-shadow"
                    placeholder="Ex: Resumo de Biologia Celular"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conteúdo / Descrição</label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#7900c5] transition-shadow">
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button type="button" onClick={() => wrapText('**')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400" title="Negrito">
                            <Icons.Bold className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => wrapText('*')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400" title="Itálico">
                            <Icons.Italic className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertText('[Link](url)')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400" title="Link">
                            <Icons.Link className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button type="button" onClick={() => insertText('@')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 font-bold text-sm px-2" title="Mencionar Publicação">
                            @Ref
                        </button>
                        <button type="button" onClick={() => insertText('#')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 font-bold text-sm px-2" title="Mencionar Usuário">
                            #User
                        </button>
                    </div>
                    <textarea 
                        ref={textareaRef}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none h-32 resize-none"
                        placeholder="Escreva aqui..."
                    />
                </div>
            </div>

            {/* Público-alvo (grupo) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Para qual Turma?</label>
                <select 
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                    required
                >
                    <option value="">Selecione a turma alvo...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Matéria</label>
                    <select 
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                        required
                    >
                        <option value="">Selecione...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                    >
                        <option value="summary">Resumo</option>
                        <option value="activity">Atividade</option>
                        <option value="assessment">Avaliação</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] transition-colors shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50"
            >
                {isSubmitting ? 'Enviando...' : 'Publicar'}
            </button>
        </form>
      </div>
    </div>
  );
};