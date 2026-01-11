import React, { useState } from 'react';
import { FileData, Comment } from '../../types';
import { Icons } from '../Icons';
import { useAuth } from '../../contexts/AuthContext';
import { MockService, isDemoMode } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { RichTextRenderer } from './RichTextRenderer';

interface FileCardProps {
  file: FileData;
  colorHex: string;
}

export const FileCard: React.FC<FileCardProps> = ({ file, colorHex }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(file.isLiked);
  const [likesCount, setLikesCount] = useState(file.likes_count);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(file.comments_count || 0);

  const handleAddToDiary = () => {
    const title = encodeURIComponent(file.title);
    const link = encodeURIComponent(file.file_url || window.location.href);
    const diaryUrl = `https://diary.microspace.app/tasks/new?title=${title}&link=${link}`;
    window.open(diaryUrl, '_blank');
  };

  const handleDownload = () => {
    if (file.file_url && file.file_url !== '#') {
        window.open(file.file_url, '_blank');
    }
  };

  const handleLike = async () => {
      if (!user) return;
      
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      if(newIsLiked) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
      }

      if (isDemoMode) {
          await MockService.toggleLike(file.id, user.id);
      }
  };

  const toggleComments = async () => {
      if (!showComments) {
          setLoadingComments(true);
          if (isDemoMode) {
              const data = await MockService.getComments(file.id);
              setComments(data);
          }
          setLoadingComments(false);
      }
      setShowComments(!showComments);
  };

  const submitComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim() || !user) return;
      
      const parentId = replyingTo ? replyingTo.id : null;

      if (isDemoMode) {
          await MockService.addComment(file.id, user.id, newComment, parentId);
          const updated = await MockService.getComments(file.id);
          setComments(updated);
          setNewComment('');
          setReplyingTo(null);
          setCommentCount(prev => prev + 1);
      }
  };

  const deleteComment = async (commentId: string) => {
      if (!window.confirm("Apagar comentário permanentemente?")) return;
      if (isDemoMode) {
          await MockService.deleteComment(commentId);
          const updated = await MockService.getComments(file.id);
          setComments(updated);
          setCommentCount(prev => prev - 1);
      }
  };

  const toggleCommentLike = async (commentId: string) => {
      if (!user || !isDemoMode) return;
      await MockService.toggleCommentLike(commentId, user.id);
      const updated = await MockService.getComments(file.id);
      setComments(updated);
  };

  const pinComment = async (commentId: string, currentPinState: boolean) => {
      if (!user || !isDemoMode) return;
      await MockService.pinComment(commentId, !currentPinState);
      const updated = await MockService.getComments(file.id);
      setComments(updated);
  }

  const handleReplyClick = (comment: Comment, depth: number) => {
      setReplyingTo(comment);
      if (depth >= 2) {
          setNewComment(`@${comment.user?.username} `);
      } else {
          setNewComment('');
      }
  };

  const goToProfile = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (file.uploader_id) {
          navigate(`/u/${file.uploader_id}`);
      }
  };

  const isOwner = user?.id === file.uploader_id;

  const renderComment = (comment: Comment, depth: number = 0) => {
      const isMaxDepth = depth >= 2;
      
      return (
      <div key={comment.id} className={`flex space-x-2 text-sm group ${depth > 0 ? 'mt-2' : 'mt-4'} ${depth > 0 && !isMaxDepth ? 'ml-8 border-l-2 border-gray-100 dark:border-gray-800 pl-2' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
              {comment.user?.avatar_url ? (
                  <img src={comment.user.avatar_url} className="w-full h-full rounded-full object-cover"/>
              ) : (
                  comment.user?.username[0]
              )}
          </div>
          <div className="flex-1 min-w-0">
              <div className={`rounded-2xl p-3 relative ${comment.is_pinned ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  {comment.is_pinned && <div className="absolute -top-2 -right-1 bg-yellow-400 text-white rounded-full p-0.5 shadow-sm"><Icons.Pin className="w-3 h-3" /></div>}
                  <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-gray-900 dark:text-white cursor-pointer hover:underline" onClick={() => navigate(`/u/${comment.user_id}`)}>
                          {comment.user?.username}
                      </span>
                      <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
                      <RichTextRenderer text={comment.content} />
                  </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-1 ml-2">
                  <button onClick={() => toggleCommentLike(comment.id)} className={`flex items-center space-x-1 text-xs font-bold transition-colors ${comment.isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
                      <Icons.ThumbsUp className="w-3.5 h-3.5" />
                      <span>{comment.likes_count > 0 ? comment.likes_count : 'Curtir'}</span>
                  </button>
                  <button onClick={() => handleReplyClick(comment, depth)} className="flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-[#7900c5] transition-colors">
                      <Icons.CornerDownRight className="w-3.5 h-3.5" />
                      <span>Responder</span>
                  </button>
                  
                  <div className="flex space-x-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {(isOwner || user?.id === comment.user_id) && (
                        <button onClick={() => deleteComment(comment.id)} className="text-gray-400 hover:text-red-500" title="Excluir">
                            <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {isOwner && (
                        <button onClick={() => pinComment(comment.id, !!comment.is_pinned)} className={`hover:text-yellow-600 ${comment.is_pinned ? 'text-yellow-500' : 'text-gray-400'}`} title="Fixar">
                            <Icons.Pin className="w-3.5 h-3.5" />
                        </button>
                    )}
                  </div>
              </div>

              {replyingTo?.id === comment.id && (
                  <form onSubmit={submitComment} className="mt-3 flex items-start space-x-2 animate-in slide-in-from-top-2 fade-in duration-200">
                       <div className="w-6 h-6 rounded-full bg-[#7900c5] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-1">
                            {profile?.username[0]}
                       </div>
                       <div className="flex-1">
                            <div className="relative">
                                <textarea 
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder={`Respondendo a ${comment.user?.username}...`}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm px-3 py-2 focus:ring-2 focus:ring-[#7900c5] focus:outline-none text-gray-900 dark:text-white resize-none"
                                    rows={2}
                                    autoFocus
                                />
                                <button 
                                    type="button" 
                                    onClick={() => { setReplyingTo(null); setNewComment(''); }}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <button type="submit" disabled={!newComment.trim()} className="bg-[#7900c5] text-white px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-[#60009e] transition-colors">
                                    Responder
                                </button>
                            </div>
                       </div>
                  </form>
              )}

              {comment.replies && comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
      </div>
  )};

  return (
    <div className="bg-white dark:bg-[#121212] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md dark:hover:border-gray-700 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <Icons.FileText className="w-6 h-6" />
          </div>
          <div className="cursor-pointer" onClick={goToProfile}>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 hover:text-[#7900c5] dark:hover:text-purple-400 transition-colors">{file.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
              {file.uploader?.username} • {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {file.source_type === 'official' && (
           <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full flex items-center space-x-1 border border-blue-100 dark:border-blue-900/30">
             <Icons.BadgeCheck className="w-3 h-3" />
             <span>OFICIAL</span>
           </span>
        )}
      </div>

      <div className="mb-4">
          <RichTextRenderer text={file.description || "Sem descrição."} className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
        <div className="flex space-x-4">
           <button 
             onClick={handleLike}
             className={`transition-colors flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-500'}`}
           >
             <div className={`${isAnimating ? 'scale-125' : 'scale-100'} transition-transform`}>
                <Icons.Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
             </div>
             <span className="text-xs font-medium">{likesCount}</span>
           </button>
           
           <button 
             onClick={toggleComments}
             className={`transition-colors flex items-center space-x-1 ${showComments ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 hover:text-blue-500'}`}
           >
             <Icons.MessageCircle className="w-5 h-5" />
             <span className="text-xs font-medium">{commentCount}</span>
           </button>

           {file.file_url && file.file_url !== '#' && (
               <button 
                 onClick={handleDownload}
                 className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                 title="Baixar/Abrir"
                >
                 <Icons.Download className="w-5 h-5" />
               </button>
           )}
        </div>

        <button 
          onClick={handleAddToDiary}
          className="text-xs font-medium flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: `${colorHex}15`, color: colorHex }} 
        >
          <Icons.CalendarPlus className="w-4 h-4" />
          <span>Agendar</span>
        </button>
      </div>

      {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-1">
              
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Comentários ({commentCount})</h4>
                <button onClick={() => setShowComments(false)} className="text-xs text-gray-400 hover:text-gray-600">Fechar</button>
              </div>
              
              <div className="mb-4 pr-1">
                  {loadingComments ? (
                      <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#7900c5] rounded-full animate-spin"></div>
                      </div>
                  ) : comments.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-400">Seja o primeiro a comentar.</p>
                      </div>
                  ) : (
                      comments.map(c => renderComment(c))
                  )}
              </div>

              {!replyingTo && (
                  <form onSubmit={submitComment} className="flex items-start space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 rounded-full bg-[#7900c5] flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                            {profile?.username[0]}
                       </div>
                      <div className="flex-1 flex flex-col">
                        <textarea 
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Escreva um comentário..."
                            className="bg-transparent border-none text-sm px-2 py-1.5 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 resize-none h-10 min-h-[40px]"
                        />
                        <div className="flex justify-end mt-1">
                            <button type="submit" disabled={!newComment.trim()} className="text-[#7900c5] hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1 rounded-full font-bold text-xs disabled:opacity-50 transition-colors">
                                Publicar
                            </button>
                        </div>
                      </div>
                  </form>
              )}
          </div>
      )}
    </div>
  );
};