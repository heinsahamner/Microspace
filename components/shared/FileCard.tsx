
import React, { useState, useEffect } from 'react';
import { FileData, FileAttachment } from '../../types';
import { Icons } from '../Icons';
import { useAuth } from '../../contexts/AuthContext';
import { Service } from '../../services/supabase';
import { OfflineService } from '../../services/offline'; // Import OfflineService
import { DeepLinkService } from '../../services/deepLink';
import { useNavigate } from 'react-router-dom';
import { RichTextRenderer } from './RichTextRenderer';
import { CommentsDrawer } from './CommentsDrawer';
import { Highlight } from './Highlight';
import { PollWidget } from './PollWidget';

interface FileCardProps {
  file: FileData;
  colorHex: string;
  onToggleSave?: (id: string, status: boolean) => void;
  onDelete?: (id: string) => void;
  highlightTerm?: string;
}

const AttachmentViewer: React.FC<{ attachment: FileAttachment }> = ({ attachment }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isImage = attachment.type.startsWith('image/');
    const isPDF = attachment.type === 'application/pdf';
    const isDoc = attachment.name.endsWith('.doc') || attachment.name.endsWith('.docx') || attachment.type.includes('word') || attachment.type.includes('officedocument');

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(attachment.url, '_blank');
    };

    if (isImage) {
        return (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative group bg-gray-100 dark:bg-black">
                <img 
                    src={attachment.url} 
                    alt={attachment.name} 
                    className={`w-full object-cover transition-all duration-300 ${isExpanded ? 'max-h-full' : 'max-h-96 cursor-zoom-in'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleDownload} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-sm">
                        <Icons.Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (isPDF) {
        return (
            <div className="mt-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212]">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded">
                            <Icons.FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{attachment.name}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="Baixar PDF"
                        >
                            <Icons.Download className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {isExpanded ? 'Fechar' : 'Ler Arquivo'}
                        </button>
                    </div>
                </div>
                
                {isExpanded && (
                    <div className="w-full h-[500px] bg-gray-200 dark:bg-gray-800 relative">
                        <iframe 
                            src={`${attachment.url}#toolbar=0`} 
                            className="w-full h-full"
                            title={attachment.name}
                        />
                        <div className="absolute bottom-2 right-4 text-[10px] text-gray-500 bg-white/80 dark:bg-black/80 px-2 py-1 rounded backdrop-blur">
                            Visualização nativa
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Docs / Generic Fallback
    return (
        <div className="mt-2 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg ${isDoc ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                    {isDoc ? <Icons.FileWord className="w-4 h-4" /> : <Icons.FileText className="w-4 h-4" />}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{attachment.name}</span>
                    <span className="text-[10px] text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</span>
                </div>
            </div>
            <button onClick={handleDownload} className="text-[#7900c5] hover:underline text-xs font-bold px-2">
                Baixar
            </button>
        </div>
    );
};

export const FileCard: React.FC<FileCardProps> = ({ file, colorHex, onToggleSave, onDelete, highlightTerm }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isLiked, setIsLiked] = useState(file.isLiked);
  const [isSaved, setIsSaved] = useState(file.isSaved || false);
  const [likesCount, setLikesCount] = useState(file.likes_count);
  const [commentCount, setCommentCount] = useState(file.comments_count || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Controls
  const [showMenu, setShowMenu] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Check Save Status Locally on Mount (Since cloud doesn't know about local saves)
  useEffect(() => {
      // Only check if it wasn't already passed as true (e.g. from Backpack page)
      if (!isSaved) {
          OfflineService.isFileSaved(file.id).then(status => {
              if (status) setIsSaved(true);
          });
      }
  }, [file.id]);

  // Permissions
  const canEdit = user && file.uploader_id === user.id;
  const canDelete = user && (file.uploader_id === user.id || profile?.role === 'admin');

  // Gamification Styles
  let borderClass = "border border-gray-100 dark:border-gray-800";
  let badge = null;

  if (file.author_role === 'teacher') {
      borderClass = "border-2 border-purple-400 dark:border-purple-600 shadow-[0_0_15px_rgba(121,0,197,0.15)]";
      badge = (
          <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-200 dark:border-purple-800">
              <Icons.User className="w-3 h-3" />
              <span>Professor</span>
          </div>
      );
  } else if (file.author_role === 'monitor') {
      borderClass = "border-2 border-cyan-400 dark:border-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.15)]";
      badge = (
          <div className="flex items-center gap-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-cyan-200 dark:border-cyan-800">
              <Icons.Shield className="w-3 h-3" />
              <span>Monitor</span>
          </div>
      );
  } else if (file.author_role === 'representative') {
      borderClass = "border-2 border-yellow-400 dark:border-yellow-600 shadow-[0_0_15px_rgba(250,204,21,0.15)]";
      badge = (
          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-yellow-200 dark:border-yellow-800">
              <Icons.Trophy className="w-3 h-3" />
              <span>Rep</span>
          </div>
      );
  }

  const handleAddToDiary = () => {
    const payload = {
        title: file.title,
        description: `Material de referência: ${file.title}\n\n${file.description || ''}\n\nLink original: ${window.location.origin}/subject/${file.subject_id}`,
        subject: file.subject?.name || 'Geral',
        date: 'tomorrow', 
        priority: 'medium',
        type: file.category === 'assessment' ? 'exam' : 'homework'
    };

    const diaryUrl = DeepLinkService.generateLink(
        'https://diary.microspace.site/', 
        'create', 
        {}, 
        payload
    );

    window.open(diaryUrl, '_blank');
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
      await Service.toggleLike(file.id, user.id);
  };

  const handleSave = async () => {
      if (!user) return;
      const newStatus = !isSaved;
      setIsSaved(newStatus);
      await Service.toggleSave(file.id, user.id);
      if (onToggleSave) onToggleSave(file.id, newStatus);
  };

  const handleDelete = async () => {
      if(!window.confirm("Tem certeza que deseja excluir esta postagem permanentemente?")) return;
      try {
          await Service.deleteFile(file.id);
          if (onDelete) onDelete(file.id);
      } catch(e) {
          alert("Erro ao deletar.");
          console.error(e);
      }
  };

  const goToProfile = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (file.uploader_id) {
          navigate(`/u/${file.uploader_id}`);
      }
  };

  return (
    <>
    <div className={`bg-white dark:bg-[#121212] rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group ${borderClass}`}>
      
      {(canEdit || canDelete) && (
          <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={() => setShowMenu(!showMenu)} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
              >
                  <Icons.MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                  <div 
                    className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                      {canEdit && (
                          <button 
                            onClick={() => navigate(`/post/edit/${file.id}`)}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                          >
                              <Icons.Edit className="w-3 h-3" /> Editar
                          </button>
                      )}
                      {canDelete && (
                          <button 
                            onClick={handleDelete}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                              <Icons.Trash className="w-3 h-3" /> Excluir
                          </button>
                      )}
                  </div>
              )}
          </div>
      )}

      <div className="flex justify-between items-start mb-3 pr-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 relative">
            <Icons.FileText className="w-6 h-6" />
            {file.category === 'assessment' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-black"></div>}
          </div>
          <div className="cursor-pointer" onClick={goToProfile}>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 hover:text-[#7900c5] dark:hover:text-purple-400 transition-colors flex items-center gap-2">
                <Highlight text={file.title} term={highlightTerm} />
                {badge}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {file.subject && (
                    <span className="flex items-center gap-1.5 font-bold hover:underline" style={{ color: file.subject.color_hex }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: file.subject.color_hex }}></div>
                        {file.subject.name}
                    </span>
                )}
                <span>•</span>
                <span className="hover:underline">{file.uploader?.username}</span>
                <span>•</span>
                <span>{new Date(file.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
            </div>
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
          <RichTextRenderer 
            text={file.description || "Sem descrição."} 
            className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3" 
            highlightTerm={highlightTerm}
          />
          
          {/* ATTACHMENTS VIEWER */}
          {file.attachments && file.attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                  {file.attachments.map((att, idx) => (
                      <AttachmentViewer key={idx} attachment={att} />
                  ))}
              </div>
          )}

          {/* POLL RENDERER */}
          {file.poll && <PollWidget poll={file.poll} />}
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
             onClick={() => setIsCommentsOpen(true)}
             className="transition-colors flex items-center space-x-1 text-gray-400 dark:text-gray-500 hover:text-blue-500"
           >
             <Icons.MessageCircle className="w-5 h-5" />
             <span className="text-xs font-medium">{commentCount}</span>
           </button>
        </div>

        <div className="flex space-x-2">
            <button 
                onClick={handleSave}
                className={`text-xs font-medium flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${isSaved ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100'}`}
            >
                <Icons.Backpack className="w-4 h-4" />
                <span className="hidden sm:inline">{isSaved ? 'Salvo no App' : 'Salvar Local'}</span>
            </button>

            <button 
            onClick={handleAddToDiary}
            className="text-xs font-medium flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: `${colorHex}15`, color: colorHex }} 
            >
            <Icons.CalendarPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Agendar</span>
            </button>
        </div>
      </div>
    </div>

    {isCommentsOpen && (
        <CommentsDrawer 
            isOpen={isCommentsOpen} 
            onClose={() => setIsCommentsOpen(false)} 
            fileId={file.id} 
            currentUser={user}
            onUpdateCount={(count) => setCommentCount(count)}
        />
    )}
    </>
  );
};