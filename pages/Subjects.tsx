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
    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, [profile]);

  if (loading) return <div className="p-6 dark:text-gray-300">Carregando matérias...</div>;

  return (
    <div className="p-4 md:max-w-4xl md:mx-auto">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Minhas Matérias</h1>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
             {profile?.group?.name}
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div 
            key={subject.id} 
            onClick={() => navigate(`/subject/${subject.id}`, { state: { subject } })}
            className="group relative overflow-hidden rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 aspect-[4/3] flex flex-col justify-between cursor-pointer"
            style={{ backgroundColor: subject.color_hex }}
          >
            <div className="absolute -bottom-6 -right-6 text-white opacity-20 rotate-12 group-hover:scale-110 group-hover:opacity-30 transition-all duration-300">
               <Icons.Dynamic name={subject.icon_name} className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 flex-1">
            </div>

            <div className="relative z-10">
              <h2 className="text-white font-bold text-lg md:text-xl leading-tight">
                {subject.name}
              </h2>
              <p className="text-white/80 text-xs mt-1 font-medium">
                {subject.file_count !== undefined ? subject.file_count : 0} arquivos
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};