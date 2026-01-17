import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { Service } from '../services/supabase';
import { FileData } from '../types';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [followingPosts, setFollowingPosts] = useState<FileData[]>([]);

  useEffect(() => {
      const loadFollowing = async () => {
          if (user) {
              const posts = await Service.getFollowedPosts(user.id);
              setFollowingPosts(posts);
          }
      };
      loadFollowing();
  }, [user]);

  return (
    <div className="p-4 md:max-w-4xl md:mx-auto">
      <div className="mb-6 mt-2 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bom dia, {profile?.username}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{profile?.group?.name || 'Estudante'} • {new Date().getFullYear()}</p>
        </div>
        <button onClick={() => navigate(`/u/${profile?.id}`)} className="text-xs font-bold text-[#7900c5] hover:underline">
            Ver meu perfil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#7900c5] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-purple-200 dark:shadow-none">
              <div className="relative z-10">
                  <h2 className="font-bold text-lg mb-1">Novas Atividades</h2>
                  <p className="text-purple-100 text-sm mb-4">Você tem 3 novas listas de exercícios publicadas hoje.</p>
                  <Link to="/official" className="inline-block bg-white text-[#7900c5] px-4 py-2 rounded-lg text-sm font-bold">Ver agora</Link>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
                  <Icons.BookOpen className="w-32 h-32" />
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#121212] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
             <h2 className="font-bold text-gray-900 dark:text-white mb-2">Acesso Rápido</h2>
             <div className="flex space-x-4">
                 <Link to="/community" className="flex flex-col items-center space-y-1 group">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icons.Users className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Social</span>
                 </Link>
                 <Link to="/official" className="flex flex-col items-center space-y-1 group">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icons.BadgeCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Oficial</span>
                 </Link>
                 <Link to="/backpack" className="flex flex-col items-center space-y-1 group">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icons.Backpack className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Mochila</span>
                 </Link>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
               <div className="flex items-center space-x-2 mb-2">
                   <Icons.Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Curtidas</span>
               </div>
               <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
               <p className="text-[10px] text-gray-400">Total recebido</p>
           </div>
           <div className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
               <div className="flex items-center space-x-2 mb-2">
                   <Icons.MessageCircle className="w-5 h-5 text-blue-500" />
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Comentários</span>
               </div>
               <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
               <p className="text-[10px] text-gray-400">Em suas publicações</p>
           </div>
      </div>

      <div className="mb-8">
          <div className="flex items-center space-x-2 mb-3 px-1">
              <Icons.UserCheck className="w-5 h-5 text-[#7900c5]" />
              <h2 className="font-bold text-gray-800 dark:text-gray-100">Recentes de quem você segue</h2>
          </div>
          
          {followingPosts.length > 0 ? (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                  {followingPosts.map(post => (
                      <div key={post.id} className="min-w-[200px] bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-sm cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors" onClick={() => navigate(`/u/${post.uploader_id}`)}>
                          <div className="flex items-center space-x-2 mb-2">
                              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-bold">
                                  {post.uploader?.username[0] || 'U'}
                              </div>
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{post.uploader?.username}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-1">{post.title}</p>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 rounded">{post.subject?.name}</span>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-white dark:bg-[#121212] rounded-xl p-6 text-center border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Você ainda não segue ninguém.</p>
                  <Link to="/community" className="text-sm font-bold text-[#7900c5] mt-1 inline-block">Explorar comunidade</Link>
              </div>
          )}
      </div>
    </div>
  );
};