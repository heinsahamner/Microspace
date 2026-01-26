import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Service, supabase } from '../services/supabase';
import { Group } from '../types';
import { Icons } from '../components/Icons';
import { useNavigate } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGroups = async () => {
     setLoading(true);
     setError('');
     try {
         const data = await Service.getGroups();
         
         if (data.length === 0) {
             setGroups([]);
         } else {
             setGroups(data);
         }
     } catch (e: any) {
         console.error("Onboarding Error:", e);
         setError('Erro ao carregar turmas. Tente novamente.');
     } finally {
         setLoading(false);
     }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = async () => {
    if (!selectedGroup) return;
    setLoading(true);

    try {
        const profilePayload = {
            id: user.id,
            group_id: selectedGroup,
            username: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Aluno',
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            role: 'student'
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' });
        
        if (!error) {
            updateProfile({ group_id: selectedGroup });
            setTimeout(() => window.location.reload(), 800);
        } else {
            console.error("Supabase Save Error:", error);
            if (error.code === 'PGRST301') {
                alert("Erro de autenticação. Entre em contato com o suporte.");
            } else if (error.code === '23503') {
                alert("Erro ao criar perfil. Entre em contato com o suporte.");
            } else {
                alert(`Erro ao salvar: ${error.message}`);
            }
        }
    } catch (e: any) {
        console.error("Unexpected Error:", e);
        alert(`Erro inesperado: ${e.message}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#7900c5] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bem-vindo ao Materials</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Para começar, selecione sua turma.</p>
        </div>

        {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 text-center mb-6">
                <div className="flex flex-col items-center">
                    <Icons.AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-sm text-red-700 dark:text-red-300 font-bold mb-1">{error}</p>
                </div>
                <button onClick={fetchGroups} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                    Tentar Novamente
                </button>
            </div>
        ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                {loading && groups.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-4">Carregando turmas...</div>
                ) : groups.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-4">
                        Nenhuma turma disponível. Entre em contato com o administrador.
                    </div>
                ) : (
                    groups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(group.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                selectedGroup === group.id 
                                ? 'border-[#7900c5] bg-purple-50 dark:bg-purple-900/20 text-[#7900c5] dark:text-purple-300' 
                                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-black'
                            }`}
                        >
                            <div className="font-bold flex items-center gap-2">
                                <Icons.Dynamic name={group.icon_name || 'users'} className="w-4 h-4" />
                                {group.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 ml-6">Ano Letivo {group.academic_year}</div>
                        </button>
                    ))
                )}
            </div>
        )}

        <button 
            onClick={handleJoin}
            disabled={!selectedGroup || loading}
            className="w-full mt-6 bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
        >
            {loading ? 'Entrando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};