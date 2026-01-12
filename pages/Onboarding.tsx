import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Service, supabase, isDemoMode } from '../services/supabase';
import { Group } from '../types';

export const Onboarding: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
       setGroups(await Service.getGroups());
    };
    fetchGroups();
  }, []);

  const handleJoin = async () => {
    if (!selectedGroup) return;
    setLoading(true);

    if (isDemoMode) {
        updateProfile({ group_id: selectedGroup });
    } else {
        const { error } = await supabase
            .from('profiles')
            .update({ group_id: selectedGroup })
            .eq('id', user.id);
        
        if (!error) {
            updateProfile({ group_id: selectedGroup });
        }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Materials</h1>
            <p className="text-gray-500 mt-2">Para começar, selecione sua turma.</p>
        </div>

        <div className="space-y-4">
            {groups.map(group => (
                <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedGroup === group.id 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    }`}
                >
                    <div className="font-bold">{group.name}</div>
                    <div className="text-xs text-gray-400 mt-1">Ano Letivo {group.academic_year}</div>
                </button>
            ))}
        </div>

        <button 
            onClick={handleJoin}
            disabled={!selectedGroup || loading}
            className="w-full mt-8 bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
            {loading ? 'Entrando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
};