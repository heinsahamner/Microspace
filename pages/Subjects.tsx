import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Subject } from '../types';
import { Icons } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

export const SubjectsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    if (!profile?.group_id) return;
    const data = await Service.getSubjects(profile.group_id);
    
    const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
    
    setSubjects(sortedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, [profile]);

  if (loading) return <div className="p-6 dark:text-gray-300">Carregando matérias...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Minhas Matérias</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
              {profile?.group?.name}
            </p>
          </div>
          <div className="hidden md:block text-xs text-gray-400 uppercase font-bold tracking-widest">
            {subjects.length} Disciplinas
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {subjects.map((subject) => (
          <div 
            key={subject.id} 
            onClick={() => navigate(`/subject/${subject.id}`, { state: { subject } })}
            className="group relative overflow-hidden rounded-3xl p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 aspect-[4/3] md:aspect-[16/10] flex flex-col justify-between cursor-pointer"
            style={{ backgroundColor: subject.color_hex }}
          >
            <div className="absolute -bottom-6 -right-6 text-white opacity-20 rotate-12 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500 ease-out">
               <Icons.Dynamic name={subject.icon_name} className="w-32 h-32 md:w-48 md:h-48" />
            </div>
            
            <div className="relative z-10 flex-1 flex items-start justify-between min-h-0">
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-2 group-hover:translate-y-0">
                  <Icons.Dynamic name={subject.icon_name} className="w-4 h-4 md:w-5 md:h-5" />
               </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-white font-bold text-base sm:text-lg md:text-3xl leading-tight tracking-tight drop-shadow-md line-clamp-2">
                {subject.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-black/20 backdrop-blur-sm text-white/90 text-[10px] md:text-xs font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full whitespace-nowrap">
                  {subject.file_count !== undefined ? subject.file_count : 0} arquivos
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};