import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Service, supabase, isDemoMode } from '../services/supabase';
import { Group } from '../types';
import { Icons } from '../components/Icons';

export const Onboarding: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configError, setConfigError] = useState(false);

  const fetchGroups = async () => {
     setLoading(true);
     setError('');
     setConfigError(false);
     try {
         const data = await Service.getGroups();
         if (data.length === 0 && !isDemoMode) {
             // If data is empty in real mode, it's suspicious. But the real 401 is caught in Service logs.
             // We can assume if it returns empty here and we are in real mode, connection failed or was rejected.
             setError('Não foi possível carregar as turmas. Verifique o console para erros de conexão (401).');
             setConfigError(true);
         }
         setGroups(data);
     } catch (e: any) {
         setError('Erro de conexão ao buscar turmas.');
         console.error(e);
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
        if (isDemoMode) {
            updateProfile({ group_id: selectedGroup });
        } else {
            const { error } = await supabase
                .from('profiles')
                .update({ group_id: selectedGroup })
                .eq('id', user.id);
            
            if (!error) {
                updateProfile({ group_id: selectedGroup });
                setTimeout(() => window.location.reload(), 500);
            } else {
                console.error(error);
                if (error.code === 'PGRST301') {
                    alert("Erro 401: As chaves secretas não batem. Veja o console.");
                } else {
                    alert("Erro ao salvar. Tente novamente.");
                }
            }
        }
    } catch (e) {
        console.error(e);
        alert("Erro inesperado.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 transition-colors">
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
                <Icons.AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-3">{error}</p>
                {configError && (
                    <div className="text-xs text-left bg-white dark:bg-black p-2 rounded border border-red-200 dark:border-red-800 mb-3 text-gray-600 dark:text-gray-400 font-mono">
                        DICA TYDA: Se você vê erros 401 no console, seu JWT Secret Local está diferente do Cloud. Atualize o config.toml local.
                    </div>
                )}
                <button 
                    onClick={fetchGroups} 
                    className="text-xs font-bold bg-white dark:bg-black border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                    Tentar Novamente
                </button>
            </div>
        ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                {loading && groups.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-4">Carregando turmas...</div>
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
            className="w-full mt-8 bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
        >
            {loading ? 'Entrando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};