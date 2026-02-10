
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { Service } from '../services/supabase';
import { FileData } from '../types';
import { Skeleton, PostSkeleton } from '../components/shared/Skeleton';
import { FileCard } from '../components/shared/FileCard';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [followingPosts, setFollowingPosts] = useState<FileData[]>([]);
  const [feedPosts, setFeedPosts] = useState<FileData[]>([]);
  const [assessments, setAssessments] = useState<FileData[]>([]);
  const [stats, setStats] = useState({ likesReceived: 0, commentsReceived: 0, uploadsCount: 0 });
  const [loading, setLoading] = useState(true);
  
  const [feedFilter, setFeedFilter] = useState<'all' | 'official'>('all');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
      const loadData = async () => {
          if (user && profile?.group_id) {
              setLoading(true);
              
              const fPosts = await Service.getFollowedPosts(user.id);
              setFollowingPosts(fPosts);

              const tPosts = await Service.getFiles(null, 'all', 'all', profile.group_id, user.id);
              setFeedPosts(tPosts);

              const assess = tPosts.filter(p => p.category === 'assessment' || p.category === 'activity').slice(0, 3);
              setAssessments(assess);

              const userStats = await Service.getUserStats(user.id);
              // @ts-ignore
              setStats(userStats);
              
              setLoading(false);
          }
      };
      loadData();
  }, [user, profile]);

  const handleDelete = (id: string) => {
      setFeedPosts(prev => prev.filter(p => p.id !== id));
      setFollowingPosts(prev => prev.filter(p => p.id !== id));
  };

  const displayedFeed = useMemo(() => {
      if (feedFilter === 'official') {
          return feedPosts.filter(p => p.source_type === 'official');
      }
      return feedPosts.slice(0, 10); 
  }, [feedPosts, feedFilter]);

  const QuickAction = ({ to, icon: Icon, label, color, desktopClass = "" }: any) => (
      <Link to={to} className={`flex flex-col items-center space-y-2 group ${desktopClass}`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${color}`}>
              <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-[#7900c5] dark:group-hover:text-white transition-colors">{label}</span>
      </Link>
  );

  const MobileLayout = () => (
      <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 md:hidden">
          <div className="bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 pb-8 pt-6 px-6 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                  <div className="mb-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 uppercase tracking-wide opacity-80">
                          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {greeting}, <br/>
                          <span className="text-[#7900c5]">{profile?.username?.split(' ')[0]}</span>
                      </h1>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                              <Icons.Layers className="w-16 h-16 text-indigo-500" />
                          </div>
                          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                              <Icons.Layers className="w-4 h-4" />
                              <span>Contribuições</span>
                          </div>
                          <div>
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.uploadsCount}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1 uppercase">Materiais</span>
                          </div>
                      </div>

                      <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                              <Icons.Star className="w-16 h-16 text-pink-500" fill="currentColor" />
                          </div>
                          <div className="flex items-center space-x-2 text-pink-600 dark:text-pink-400 font-bold text-sm">
                              <Icons.Star className="w-4 h-4" fill="currentColor" />
                              <span>Reputação</span>
                          </div>
                          <div>
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.likesReceived}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1 uppercase">Curtidas</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="px-6 mt-8 space-y-10">
              <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider">Acesso Rápido</h3>
                  <div className="flex justify-between px-2">
                      <QuickAction to="/subjects" icon={Icons.BookOpen} label="Matérias" color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
                      <QuickAction to="/community" icon={Icons.Users} label="Social" color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
                      <QuickAction to="/official" icon={Icons.BadgeCheck} label="Oficial" color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" />
                      <QuickAction to="/upload" icon={Icons.Upload} label="Postar" color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
                  </div>
              </div>

              <div>
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Icons.UserCheck className="w-5 h-5 text-[#7900c5]" />
                          Quem você segue
                      </h3>
                      <Link to="/community" className="text-xs font-bold text-[#7900c5]">Ver tudo</Link>
                  </div>
                  
                  {loading ? (
                      <div className="flex space-x-4 overflow-hidden">
                          {[1,2].map(i => <Skeleton key={i} className="w-64 h-32 flex-shrink-0" />)}
                      </div>
                  ) : followingPosts.length > 0 ? (
                      <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                          {followingPosts.map(post => (
                              <div 
                                key={post.id} 
                                onClick={() => navigate(`/u/${post.uploader_id}`)}
                                className="min-w-[240px] bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                              >
                                  <div className="flex items-center space-x-3 mb-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                                          {post.uploader?.avatar_url ? <img src={post.uploader.avatar_url} className="w-full h-full object-cover" /> : (post.uploader?.username?.[0] || 'U')}
                                      </div>
                                      <div className="overflow-hidden">
                                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{post.uploader?.username}</p>
                                          <p className="text-[10px] text-gray-500">Há pouco</p>
                                      </div>
                                  </div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">{post.title}</p>
                                  <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-[10px] font-bold text-gray-500 uppercase">
                                      {post.subject?.name}
                                  </span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-6 text-center border border-dashed border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Você ainda não segue ninguém.</p>
                      </div>
                  )}
              </div>

              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Icons.TrendingUp className="w-5 h-5 text-red-500" />
                      Destaques
                  </h3>
                  <div className="space-y-6">
                      {loading ? (
                          [1,2].map(i => <PostSkeleton key={i} />)
                      ) : feedPosts.length > 0 ? (
                          feedPosts.slice(0, 5).map(post => (
                              <FileCard 
                                key={post.id} 
                                file={post} 
                                colorHex={post.subject?.color_hex || '#999'} 
                                onDelete={handleDelete}
                              />
                          ))
                      ) : (
                          <div className="text-center py-10 text-gray-400">
                              <p>Nenhuma atividade recente.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  const DesktopLayout = () => {
      const xp = (stats.uploadsCount * 50) + (stats.likesReceived * 10);
      const level = Math.floor(xp / 100) + 1;
      const nextLevelXp = level * 100;
      const progress = Math.min((xp % 100) / 100 * 100, 100);

      return (
          <div className="hidden md:block min-h-screen bg-gray-50 dark:bg-black">
              <div className="max-w-7xl mx-auto p-8 grid grid-cols-12 gap-8">
                  
                  <div className="col-span-8 space-y-8">
                      <div className="flex justify-between items-end">
                          <div>
                              <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                  {greeting}, {profile?.username?.split(' ')[0]}
                              </h1>
                              <p className="text-gray-500 dark:text-gray-400 mt-2">
                                  Aqui está o resumo da sua turma <span className="font-bold text-[#7900c5]">{profile?.group?.name}</span>
                              </p>
                          </div>
                          <div className="flex gap-2">
                              <button 
                                onClick={() => setFeedFilter('all')} 
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${feedFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                              >
                                  Geral
                              </button>
                              <button 
                                onClick={() => setFeedFilter('official')} 
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${feedFilter === 'official' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                              >
                                  Oficial
                              </button>
                          </div>
                      </div>

                      {followingPosts.length > 0 && (
                          <div className="relative">
                              <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">Atualizações de quem você segue</h3>
                              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                  {followingPosts.map(post => (
                                      <div 
                                        key={post.id} 
                                        onClick={() => navigate(`/u/${post.uploader_id}`)}
                                        className="min-w-[200px] w-[200px] bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                                      >
                                          <div className="flex justify-between items-start mb-3">
                                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-black shadow-sm">
                                                  {post.uploader?.avatar_url ? <img src={post.uploader.avatar_url} className="w-full h-full object-cover" /> : (post.uploader?.username?.[0] || 'U')}
                                              </div>
                                              <div className="w-2 h-2 rounded-full bg-[#7900c5]"></div>
                                          </div>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">@{post.uploader?.username}</p>
                                          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#7900c5] transition-colors">
                                              {post.title}
                                          </p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="space-y-6">
                          <h3 className="text-xs font-bold text-gray-400 uppercase px-1">Feed Recente</h3>
                          {loading ? (
                              [1,2].map(i => <PostSkeleton key={i} />)
                          ) : displayedFeed.length > 0 ? (
                              displayedFeed.map(post => (
                                  <FileCard 
                                    key={post.id} 
                                    file={post} 
                                    colorHex={post.subject?.color_hex || '#999'} 
                                    onDelete={handleDelete}
                                  />
                              ))
                          ) : (
                              <div className="text-center py-20 bg-white dark:bg-[#121212] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                  <Icons.Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                  <p className="text-gray-500">Nenhum post encontrado para este filtro.</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="col-span-4 space-y-6">
                      
                      <div className="bg-white dark:bg-[#121212] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[#7900c5] to-indigo-600 opacity-10"></div>
                          <div className="relative z-10 flex flex-col items-center text-center mt-4">
                              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#121212] shadow-lg overflow-hidden bg-gray-200 mb-3">
                                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold">{profile?.username?.[0]}</div>}
                              </div>
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.username}</h2>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{profile?.group?.name}</p>
                              
                              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-2 overflow-hidden">
                                  <div className="bg-gradient-to-r from-[#7900c5] to-pink-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                              </div>
                              <div className="flex justify-between w-full text-xs font-bold text-gray-400 uppercase tracking-wider">
                                  <span>Nível {level}</span>
                                  <span>{Math.floor(xp)} XP</span>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-[#121212] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                          <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                              <Icons.CalendarPlus className="w-5 h-5" />
                              <h3 className="font-bold text-gray-900 dark:text-white">Próximas Avaliações</h3>
                          </div>
                          {assessments.length > 0 ? (
                              <div className="space-y-3">
                                  {assessments.map(item => (
                                      <Link key={item.id} to={`/subject/${item.subject_id}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                              <span className="text-xs font-bold">{new Date(item.created_at).getDate()}</span>
                                          </div>
                                          <div className="min-w-0">
                                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-red-600 transition-colors">{item.title}</p>
                                              <p className="text-xs text-gray-500 truncate">{item.subject?.name}</p>
                                          </div>
                                      </Link>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-6 text-gray-400 text-sm">
                                  Nenhuma prova ou atividade recente.
                              </div>
                          )}
                      </div>

                      <div className="bg-white dark:bg-[#121212] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Atalhos</h3>
                          <div className="space-y-2">
                              <Link to="/upload" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm">
                                  <Icons.Upload className="w-5 h-5" /> Publicar Material
                              </Link>
                              <Link to="/backpack" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm">
                                  <Icons.Backpack className="w-5 h-5" /> Minha Mochila
                              </Link>
                              <Link to="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-300 font-medium text-sm">
                                  <Icons.Settings className="w-5 h-5" /> Configurações
                              </Link>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      );
  };

  return (
    <>
        <MobileLayout />
        <DesktopLayout />
    </>
  );
};