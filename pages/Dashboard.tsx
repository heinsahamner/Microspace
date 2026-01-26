import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { Service } from '../services/supabase';
import { FileData } from '../types';
import { Skeleton } from '../components/shared/Skeleton';
import { FileCard } from '../components/shared/FileCard';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [followingPosts, setFollowingPosts] = useState<FileData[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<FileData[]>([]);
  const [stats, setStats] = useState({ likesReceived: 0, commentsReceived: 0, uploadsCount: 0 });
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
      const loadData = async () => {
          if (user && profile?.group_id) {
              setLoading(true);
              
              const fPosts = await Service.getFollowedPosts(user.id);
              setFollowingPosts(fPosts);

              const tPosts = await Service.getFiles(null, 'all', 'all', profile.group_id, user.id);
              setTrendingPosts(tPosts.slice(0, 5));

              const userStats = await Service.getUserStats(user.id);
              //havia um ts ignore aqui, acho
              setStats(userStats);
              
              setLoading(false);
          }
      };
      loadData();
  }, [user, profile]);

  const handleDelete = (id: string) => {
      setTrendingPosts(prev => prev.filter(p => p.id !== id));
      setFollowingPosts(prev => prev.filter(p => p.id !== id));
  };

  const QuickAction = ({ to, icon: Icon, label, color }: any) => (
      <Link to={to} className="flex flex-col items-center space-y-2 group">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${color}`}>
              <Icon className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-[#7900c5] dark:group-hover:text-white transition-colors">{label}</span>
      </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
      <div className="bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 pb-8 pt-6 px-6 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="md:max-w-7xl md:mx-auto relative z-10">
              
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
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                          <Icons.Layers className="w-16 h-16 text-indigo-500" />
                      </div>
                      <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          <Icons.Layers className="w-4 h-4" />
                          <span>Produtividade</span>
                      </div>
                      <div>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.uploadsCount}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1 uppercase">Materiais</span>
                      </div>
                  </div>

                  <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                          <Icons.Star className="w-16 h-16 text-pink-500" fill="currentColor" />
                      </div>
                      <div className="flex items-center space-x-2 text-pink-600 dark:text-pink-400 font-bold text-sm">
                          <Icons.Star className="w-4 h-4" fill="currentColor" />
                          <span>Reconhecimento</span>
                      </div>
                      <div>
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.likesReceived}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1 uppercase">Curtidas</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="md:max-w-7xl md:mx-auto px-6 mt-8 space-y-10">
          
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
                                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                      {post.uploader?.username?.[0] || 'U'}
                                  </div>
                                  <div className="overflow-hidden">
                                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{post.uploader?.username}</p>
                                      <p className="text-[10px] text-gray-500">Há 2h</p>
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
                      <Link to="/community" className="text-xs font-bold text-[#7900c5] mt-2 inline-block">Descobrir colegas</Link>
                  </div>
              )}
          </div>

          <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Icons.TrendingUp className="w-5 h-5 text-red-500" />
                  Destaques da Semana
              </h3>
              
              <div className="space-y-6">
                  {loading ? (
                      [1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)
                  ) : trendingPosts.length > 0 ? (
                      trendingPosts.map(post => (
                          <FileCard 
                            key={post.id} 
                            file={post} 
                            colorHex={post.subject?.color_hex || '#999'} 
                            onDelete={handleDelete}
                          />
                      ))
                  ) : (
                      <div className="text-center py-10 text-gray-400">
                          <Icons.FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma atividade recente.</p>
                      </div>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};