import React, { useState } from 'react';
import { FileData } from '../../types';
import { Icons } from '../Icons';
import { useAuth } from '../../contexts/AuthContext';
import { Service } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { RichTextRenderer } from './RichTextRenderer';
import { CommentsDrawer } from './CommentsDrawer';
import { Highlight } from './Highlight';

interface FileCardProps {
  file: FileData;
  colorHex: string;
  onToggleSave?: (id: string, status: boolean) => void;
  highlightTerm?: string;
}

export const FileCard: React.FC<FileCardProps> = ({ file, colorHex, onToggleSave, highlightTerm }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLiked, setIsLiked] = useState(file.isLiked);
  const [isSaved, setIsSaved] = useState(file.isSaved);
  const [likesCount, setLikesCount] = useState(file.likes_count);
  const [commentCount, setCommentCount] = useState(file.comments_count || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // New Drawer State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleAddToDiary = () => {
    const title = encodeURIComponent(file.title);
    const link = encodeURIComponent(window.location.origin + `/subject/${file.subject_id}`);
    const diaryUrl = `https://diary.microspace.app/tasks/new?title=${title}&link=${link}`;
    window.open(diaryUrl, '_blank');
  };

  const handleDownload = () => {
    if (file.file_url) {
        if (file.file_url.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = file.file_url;
            const fileName = file.attachments && file.attachments.length > 0 
                ? file.attachments[0].name 
                : `arquivo-${file.title}.pdf`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            window.open(file.file_url, '_blank');
        }
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

      await Service.toggleLike(file.id, user.id);
  };

  const handleSave = async () => {
      if (!user) return;
      const newStatus = !isSaved;
      setIsSaved(newStatus);
      // @ts-ignore
      await Service.toggleSave(file.id, user.id);
      if (onToggleSave) onToggleSave(file.id, newStatus);
  };

  const goToProfile = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (file.uploader_id) {
          navigate(`/u/${file.uploader_id}`);
      }
  };

  return (
    <>
    <div className="bg-white dark:bg-[#121212] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md dark:hover:border-gray-700 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <Icons.FileText className="w-6 h-6" />
          </div>
          <div className="cursor-pointer" onClick={goToProfile}>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 hover:text-[#7900c5] dark:hover:text-purple-400 transition-colors">
                <Highlight text={file.title} term={highlightTerm} />
            </h3>
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
          <RichTextRenderer 
            text={file.description || "Sem descrição."} 
            className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3" 
            highlightTerm={highlightTerm}
          />
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

        <div className="flex space-x-2">
            <button 
                onClick={handleSave}
                className={`text-xs font-medium flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${isSaved ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100'}`}
            >
                <Icons.Backpack className="w-4 h-4" />
                <span className="hidden sm:inline">{isSaved ? 'Na Mochila' : 'Salvar'}</span>
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

    {/* Comments Drawer - Isolated */}
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