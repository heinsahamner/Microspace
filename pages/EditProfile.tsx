import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Icons } from '../components/Icons';

export const EditProfile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [bio, setBio] = useState(profile?.bio || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;
      setLoading(true);

      const updates = { bio, username };
      
      await Service.updateProfile(profile.id, updates);
      updateProfile(updates);

      setLoading(false);
      navigate(`/u/${profile.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">
                    Cancelar
                </button>
                <h1 className="font-bold text-gray-900">Editar Perfil</h1>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="text-[#7900c5] font-bold disabled:opacity-50"
                >
                    Salvar
                </button>
            </div>
            
            <div className="p-6 space-y-6">
                
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Imagens</label>
                    <div className="relative h-32 bg-gray-200 rounded-xl overflow-hidden group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                            <Icons.Camera className="text-white w-8 h-8 opacity-70" />
                        </div>
                        {profile?.background_url && <img src={profile.background_url} className="w-full h-full object-cover"/>}
                    </div>
                    <div className="flex justify-center -mt-12 relative z-10">
                        <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white relative cursor-pointer group overflow-hidden">
                             <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                <Icons.Camera className="text-white w-6 h-6 opacity-70" />
                            </div>
                            {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover"/>}
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400">Toque para alterar (Simulado)</p>
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Nome de usuário</label>
                    <input 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7900c5] outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700">Bio</label>
                    <textarea 
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7900c5] outline-none h-24 resize-none"
                        placeholder="Escreva algo sobre você..."
                    />
                </div>
            </div>
        </div>
    </div>
  );
};