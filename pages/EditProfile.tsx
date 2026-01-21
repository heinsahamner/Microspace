import React, { useState, useRef } from 'react';
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

  // Image State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [bgPreview, setBgPreview] = useState<string | null>(profile?.background_url || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          
          if (type === 'avatar') {
              setAvatarFile(file);
              setAvatarPreview(url);
          } else {
              setBgFile(file);
              setBgPreview(url);
          }
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;
      setLoading(true);

      try {
          let newAvatarUrl = profile.avatar_url;
          let newBgUrl = profile.background_url;

          // Upload images if changed
          if (avatarFile) {
              // @ts-ignore
              newAvatarUrl = await Service.uploadProfileImage(profile.id, avatarFile, 'avatar');
          }
          if (bgFile) {
              // @ts-ignore
              newBgUrl = await Service.uploadProfileImage(profile.id, bgFile, 'background');
          }

          const updates = { 
              bio, 
              username,
              avatar_url: newAvatarUrl,
              background_url: newBgUrl
          };
          
          await Service.updateProfile(profile.id, updates);
          updateProfile(updates);
          
          navigate(`/u/${profile.id}`);
      } catch (error) {
          console.error("Error updating profile:", error);
          alert("Erro ao atualizar perfil.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6 md:p-12 transition-colors duration-200">
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                    Cancelar
                </button>
                <h1 className="font-bold text-gray-900 dark:text-white">Editar Perfil</h1>
                <button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="text-[#7900c5] font-bold disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
            
            <div className="p-6 space-y-6">
                
                {/* Images Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Imagens</label>
                    
                    {/* Background Banner */}
                    <div 
                        className="relative h-32 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden group cursor-pointer"
                        onClick={() => bgInputRef.current?.click()}
                    >
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10">
                            <Icons.Camera className="text-white w-8 h-8 opacity-70 drop-shadow-md" />
                        </div>
                        {bgPreview ? (
                            <img src={bgPreview} className="w-full h-full object-cover" alt="Banner Preview" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700"></div>
                        )}
                        <input 
                            type="file" 
                            ref={bgInputRef} 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => handleFileSelect(e, 'background')}
                        />
                    </div>

                    {/* Avatar */}
                    <div className="flex justify-center -mt-12 relative z-20">
                        <div 
                            className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-900 relative cursor-pointer group overflow-hidden"
                            onClick={() => avatarInputRef.current?.click()}
                        >
                             <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10">
                                <Icons.Camera className="text-white w-6 h-6 opacity-70 drop-shadow-md" />
                            </div>
                            {avatarPreview ? (
                                <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar Preview" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-2xl">
                                    {username?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={avatarInputRef} 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={(e) => handleFileSelect(e, 'avatar')}
                            />
                        </div>
                    </div>
                    <p className="text-center text-xs text-gray-400">Toque nas imagens para alterar</p>
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Nome de usuário</label>
                    <input 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7900c5] outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Bio</label>
                    <textarea 
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7900c5] outline-none h-24 resize-none"
                        placeholder="Escreva algo sobre você..."
                    />
                </div>
            </div>
        </div>
    </div>
  );
};