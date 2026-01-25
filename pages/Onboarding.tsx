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

  const fetchGroups = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await Service.getGroups();
      setGroups(data);
    } catch {
      setError('Erro ao carregar turmas.');
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

        if (error) {
          setError('Erro ao salvar a turma.');
          return;
        }

        updateProfile({ group_id: selectedGroup });
        window.location.reload();
      }
    } catch {
      setError('Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#121212] rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#7900c5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bem-vindo
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Selecione sua turma para continuar.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400 text-sm">
              Carregando turmas...
            </div>
          ) : (
            groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  selectedGroup === group.id
                    ? 'border-[#7900c5] bg-purple-50 dark:bg-purple-900/20 text-[#7900c5]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  <Icons.Dynamic
                    name={group.icon_name || 'users'}
                    className="w-4 h-4"
                  />
                  {group.name}
                </div>
                <div className="text-xs text-gray-400 mt-1 ml-6">
                  Ano Letivo {group.academic_year}
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={handleJoin}
          disabled={!selectedGroup || loading}
          className="w-full mt-6 bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Continuar'}
        </button>

      </div>
    </div>
  );
};