import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Subject, Category, FileData, TabItem } from '../types';
import { Icons } from '../components/Icons';
import { MockService, isDemoMode, supabase } from '../services/supabase';
import { FileCard } from '../components/shared/FileCard';
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
  
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const cycleFilter = () => {
      if (sourceFilter === 'all') setSourceFilter('official');
      else if (sourceFilter === 'official') setSourceFilter('community');
      else setSourceFilter('all');
  };

  const getFilterIcon = () => {
      if (sourceFilter === 'all') return <Icons.Filter className="w-4 h-4" />;
      if (sourceFilter === 'official') return <Icons.BadgeCheck className="w-4 h-4" />;
      return <Icons.Users className="w-4 h-4" />;
  };

  const getFilterLabel = () => {
      if (sourceFilter === 'all') return 'Todos';
      if (sourceFilter === 'official') return 'Oficial';
      return 'Comunidade';
  };

  const getFilterColorClass = () => {
       if (sourceFilter === 'official') return 'bg-blue-50 text-blue-700 border-blue-200';
       if (sourceFilter === 'community') return 'bg-orange-50 text-orange-700 border-orange-200';
       return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  useEffect(() => {
    if (!subject && id) {
        const fetchSub = async () => {
             const subs = await MockService.getAllSubjects();
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

      if (isDemoMode) {
        const data = await MockService.getFiles(id, activeTab, sourceFilter, null, user.id);
        setFiles(data);
      } else {
        // Supabase virá aqui
      }
      setLoading(false);
    };

    fetchFiles();
  }, [id, activeTab, sourceFilter, user]);

  if (!subject) return <div className="p-6">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ '--theme-color': subject.color_hex } as React.CSSProperties}>
      {/* Header */}
      <div className="bg-[var(--theme-color)] text-white pt-8 pb-12 px-6 rounded-b-[2.5rem] relative shadow-lg transition-all duration-300">
        <div className="md:max-w-4xl md:mx-auto">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <Icons.ArrowLeft className="w-6 h-6" />
                </button>
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                    <Icons.Dynamic name={subject.icon_name} className="w-6 h-6 text-white" />
                </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
            <p className="opacity-90">Explorar materiais compartilhados</p>
        </div>
      </div>

      <div className="md:max-w-4xl md:mx-auto px-4 -mt-8 relative z-10">
        {/* Controles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Abas */}
            <div className="flex bg-gray-50 p-1 rounded-full w-full md:w-auto">
                {TABS.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 md:flex-none px-6 py-2 text-xs font-bold rounded-full transition-all text-center ${
                    activeTab === tab.id
                        ? 'bg-[#7900c5] text-white shadow-md shadow-purple-100'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    {tab.label}
                </button>
                ))}
            </div>

            {/* Filtro */}
            <button 
                onClick={cycleFilter}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all w-full md:w-auto justify-center ${getFilterColorClass()}`}
            >
                {getFilterIcon()}
                <span>{getFilterLabel()}</span>
                <span className="ml-1 text-[10px] opacity-60 uppercase tracking-wider">Mudar</span>
            </button>

        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando arquivos...</div>
            ) : files.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Icons.FileText className="w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum arquivo encontrado.</p>
                </div>
            ) : (
                files.map(file => (
                    <FileCard key={file.id} file={file} colorHex={subject.color_hex} />
                ))
            )}
        </div>
      </div>
    </div>
  );
};