import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MockService, isDemoMode } from '../services/supabase';
import { Profile, FileData } from '../types';
import { Icons } from '../components/Icons';
import { FileCard } from '../components/shared/FileCard';

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
        if (!id || !currentUser) return;
        setLoading(true);
        try {
            if (isDemoMode) {
                const data = await MockService.getUserProfile(id, currentUser.id);
                setProfile(data.profile);
                setPosts(data.posts);
                setIsFollowing(data.profile.is_following || false);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };
    fetchProfile();
  }, [id, currentUser]);

  const handleFollow = async () => {
      if (!profile || !currentUser) return;
      
      const newStatus = !isFollowing;
      setIsFollowing(newStatus);
      
      setProfile(prev => prev ? ({
          ...prev,
          followers_count: newStatus ? prev.followers_count + 1 : prev.followers_count - 1
      }) : null);

      if (isDemoMode) {
          await MockService.toggleFollow(profile.id, currentUser.id);
      }
  };

  const isMe = currentUser?.id === id;

  if (loading) return <div className="p-12 text-center text-gray-500 dark:text-gray-400">Carregando perfil...</div>;
  if (!profile) return <div className="p-12 text-center text-gray-500 dark:text-gray-400">Usuário não encontrado.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
       {/* Banner */}
       <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
           {profile.background_url && (
               <img src={profile.background_url} alt="Banner" className="w-full h-full object-cover" />
           )}
           <button 
             onClick={() => navigate(-1)} 
             className="absolute top-6 left-6 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors"
            >
               <Icons.ArrowLeft className="w-6 h-6" />
           </button>
       </div>

       <div className="px-6 md:max-w-4xl md:mx-auto relative z-10 -mt-16">
           <div className="flex justify-between items-end mb-4">
               <div className="w-32 h-32 rounded-full border-4 border-white dark:border-black bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-md flex items-center justify-center text-4xl font-bold text-gray-400">
                   {profile.avatar_url ? (
                       <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                   ) : (
                       profile.username[0].toUpperCase()
                   )}
               </div>
               
               <div className="mb-2">
                   {isMe ? (
                       <button 
                         onClick={() => navigate('/profile/edit')}
                         className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2"
                       >
                           <Icons.Edit className="w-4 h-4" />
                           <span>Editar Perfil</span>
                       </button>
                   ) : (
                       <button 
                         onClick={handleFollow}
                         className={`px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center space-x-2 ${
                             isFollowing 
                             ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700' 
                             : 'bg-[#7900c5] text-white hover:bg-[#6a00ac]'
                         }`}
                       >
                           {isFollowing ? (
                               <>
                                <Icons.UserCheck className="w-4 h-4" />
                                <span>Seguindo</span>
                               </>
                           ) : (
                               <>
                                <Icons.UserPlus className="w-4 h-4" />
                                <span>Seguir</span>
                               </>
                           )}
                       </button>
                   )}
               </div>
           </div>

           <div className="mb-8">
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
               <div className="flex items-center space-x-2 text-sm mt-1">
                   <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                       profile.role === 'teacher' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                   }`}>
                       {profile.role === 'teacher' ? 'Professor(a)' : 'Estudante'}
                   </span>
                   <span className="text-gray-500 dark:text-gray-400">• {profile.group?.name}</span>
               </div>
               
               <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-lg">
                   {profile.bio || "Sem biografia."}
               </p>

               <div className="flex space-x-6 mt-4">
                   <div className="flex flex-col">
                       <span className="font-bold text-gray-900 dark:text-white">{posts.length}</span>
                       <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Publicações</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="font-bold text-gray-900 dark:text-white">{profile.followers_count}</span>
                       <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seguidores</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="font-bold text-gray-900 dark:text-white">{profile.following_count}</span>
                       <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seguindo</span>
                   </div>
               </div>
           </div>

           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Publicações</h3>
           <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-gray-400">Nenhuma publicação ainda.</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <FileCard key={post.id} file={post} colorHex={post.subject?.color_hex || '#ccc'} />
                    ))
                )}
           </div>
       </div>
    </div>
  );
};