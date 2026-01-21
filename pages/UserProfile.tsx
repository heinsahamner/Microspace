import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { Profile, FileData } from '../types';
import { Icons } from '../components/Icons';
import { FileCard } from '../components/shared/FileCard';

// Helper to determine user rank based on posts
const getRank = (postCount: number) => {
    if (postCount > 20) return { label: 'Mestre', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Icons.Trophy };
    if (postCount > 5) return { label: 'Colaborador', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: Icons.Star };
    return { label: 'Estudante', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Icons.BookOpen };
};

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<FileData[]>([]);
  const [savedPosts, setSavedPosts] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'about'>('posts');

  const isMe = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
        if (!id || !currentUser) return;
        setLoading(true);
        try {
            const data = await Service.getUserProfile(id, currentUser.id);
            setProfile(data.profile);
            setPosts(data.posts);
            setIsFollowing(data.profile.is_following || false);

            if (currentUser.id === id) {
                // @ts-ignore
                const saved = await Service.getSavedFiles(currentUser.id);
                setSavedPosts(saved);
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
      await Service.toggleFollow(profile.id, currentUser.id);
  };

  if (loading) {
      return <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-500">Usuário não encontrado.</div>;

  const rank = getRank(posts.length);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 overflow-x-hidden">
       
       {/* --- HERO BANNER --- */}
       <div className="h-48 md:h-64 relative group overflow-hidden w-full">
           {profile.background_url ? (
               <img src={profile.background_url} alt="Banner" className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black relative">
                   <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-gray-50/90 dark:from-black/90 via-transparent to-transparent"></div>
           
           {/* Navigation Actions */}
           <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
               <button onClick={() => navigate(-1)} className="p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors">
                   <Icons.ArrowLeft className="w-5 h-5" />
               </button>
               {isMe && (
                   <button onClick={() => navigate('/profile/edit')} className="p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors">
                       <Icons.Settings className="w-5 h-5" />
                   </button>
               )}
           </div>
       </div>

       {/* --- PROFILE CONTENT --- */}
       <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 w-full">
           
           {/* Header Section */}
           <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 mb-8 gap-4 md:gap-6">
               
               {/* Avatar */}
               <div className="relative flex-shrink-0">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-gray-50 dark:border-black bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex items-center justify-center text-5xl font-bold text-gray-300 dark:text-gray-600">
                       {profile.avatar_url ? (
                           <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                       ) : (
                           profile.username?.[0]?.toUpperCase()
                       )}
                   </div>
                   <div className="absolute bottom-2 right-2 bg-white dark:bg-black rounded-full p-1 shadow-sm" title={`Nível: ${rank.label}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rank.bg} ${rank.color}`}>
                           <rank.icon className="w-4 h-4" fill="currentColor" />
                       </div>
                   </div>
               </div>

               {/* Info & Actions */}
               <div className="flex-1 text-center md:text-left min-w-0 w-full">
                   <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white truncate leading-tight">{profile.username}</h1>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm">
                       <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded-md">
                           <Icons.Users className="w-3 h-3" /> {profile.group?.name || 'Sem turma'}
                       </span>
                       <span className={`${rank.color} font-medium flex items-center gap-1 bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded-md`}>
                           {rank.label}
                       </span>
                   </div>
               </div>

               {/* Action Button */}
               <div className="flex-shrink-0 mt-2 md:mt-0">
                   {isMe ? (
                       <button onClick={() => navigate('/profile/edit')} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
                           Editar Perfil
                       </button>
                   ) : (
                       <button 
                         onClick={handleFollow}
                         className={`px-8 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                             isFollowing 
                             ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
                             : 'bg-[#7900c5] text-white hover:bg-[#6a00ac] shadow-purple-500/30'
                         }`}
                       >
                           {isFollowing ? 'Seguindo' : 'Seguir'}
                       </button>
                   )}
               </div>
           </div>

           {/* --- STATS BAR & BIO --- */}
           {/* Changed to lg:grid-cols-3 to prevent squeezing on tablets */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 mb-10 w-full">
               
               {/* Left: Bio (Takes 2 cols on large screens) */}
               <div className="lg:col-span-2 order-2 lg:order-1">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Icons.Info className="w-3 h-3" /> Sobre
                   </h3>
                   <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                       <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                           {profile.bio || "Este usuário ainda não escreveu uma biografia."}
                       </p>
                   </div>
               </div>

               {/* Right: Stats (Takes 1 col on large screens) */}
               <div className="lg:col-span-1 order-1 lg:order-2">
                   <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col justify-center">
                       <div className="flex items-center justify-between gap-2 text-center">
                           <div className="flex-1 min-w-0">
                               <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">{posts.length}</div>
                               <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1 truncate">Posts</div>
                           </div>
                           <div className="w-px h-10 bg-gray-100 dark:bg-gray-800"></div>
                           <div className="flex-1 min-w-0">
                               <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">{profile.followers_count}</div>
                               <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1 truncate">Seguidores</div>
                           </div>
                           <div className="w-px h-10 bg-gray-100 dark:bg-gray-800"></div>
                           <div className="flex-1 min-w-0">
                               <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">{profile.following_count}</div>
                               <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1 truncate">Seguindo</div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>

           {/* --- NAVIGATION TABS --- */}
           <div className="sticky top-[72px] z-30 bg-gray-50/95 dark:bg-black/95 backdrop-blur-sm pt-2 -mx-4 px-4 md:mx-0 md:px-0">
               <div className="flex p-1 bg-gray-200 dark:bg-gray-900 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                   <button 
                     onClick={() => setActiveTab('posts')}
                     className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                         activeTab === 'posts' 
                         ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm' 
                         : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                     }`}
                   >
                       Publicações
                   </button>
                   {isMe && (
                       <button 
                         onClick={() => setActiveTab('saved')}
                         className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                             activeTab === 'saved' 
                             ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm' 
                             : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                         }`}
                       >
                           Salvos
                       </button>
                   )}
                   <button 
                     onClick={() => setActiveTab('about')}
                     className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                         activeTab === 'about' 
                         ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm' 
                         : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                     }`}
                   >
                       Detalhes
                   </button>
               </div>
           </div>

           {/* --- CONTENT AREA --- */}
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[300px]">
               {activeTab === 'posts' && (
                   <div className="space-y-4">
                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <Icons.FileText className="w-8 h-8" />
                                </div>
                                <p className="text-gray-500 font-medium">Nenhuma publicação ainda.</p>
                                {isMe && <button onClick={() => navigate('/upload')} className="mt-4 text-[#7900c5] text-sm font-bold hover:underline">Criar agora</button>}
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {posts.map(post => (
                                    <FileCard key={post.id} file={post} colorHex={post.subject?.color_hex || '#ccc'} />
                                ))}
                            </div>
                        )}
                   </div>
               )}

               {activeTab === 'saved' && isMe && (
                   <div className="space-y-4">
                        {savedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                                    <Icons.Backpack className="w-8 h-8" />
                                </div>
                                <p className="text-gray-500 font-medium">Sua mochila está vazia.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {savedPosts.map(post => (
                                    <FileCard key={post.id} file={post} colorHex={post.subject?.color_hex || '#ccc'} />
                                ))}
                            </div>
                        )}
                   </div>
               )}

               {activeTab === 'about' && (
                   <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-6">
                       <h3 className="font-bold text-lg text-gray-900 dark:text-white">Informações da Conta</h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                                   <Icons.CalendarPlus className="w-5 h-5" />
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 uppercase font-bold">Membro Desde</p>
                                   <p className="text-sm font-medium text-gray-900 dark:text-white">
                                       {new Date(profile.created_at || Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                   </p>
                               </div>
                           </div>

                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                                   <Icons.Mail className="w-5 h-5" />
                               </div>
                               <div>
                                   <p className="text-xs text-gray-500 uppercase font-bold">Contato</p>
                                   <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.email}</p>
                               </div>
                           </div>
                       </div>

                       <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                           <h4 className="font-bold text-gray-900 dark:text-white mb-4">Estatísticas de Engajamento</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                   <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                                       {posts.reduce((acc, p) => acc + (p.likes_count || 0), 0)}
                                   </span>
                                   <span className="text-xs text-gray-500 font-bold uppercase">Curtidas Recebidas</span>
                               </div>
                               <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                   <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                                       {posts.reduce((acc, p) => acc + (p.views_count || 0), 0)}
                                   </span>
                                   <span className="text-xs text-gray-500 font-bold uppercase">Visualizações</span>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>
       </div>
    </div>
  );
};