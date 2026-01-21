import React, { useEffect, useState, useRef } from 'react';
import { Comment, Profile } from '../../types';
import { Icons } from '../Icons';
import { Service } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { RichTextRenderer } from './RichTextRenderer';
import { Skeleton } from './Skeleton';

interface CommentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    currentUser: any;
    onUpdateCount: (newCount: number) => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({ isOpen, onClose, fileId, currentUser, onUpdateCount }) => {
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Auto-scroll logic
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadComments();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, fileId]);

    // Auto-focus textarea when replying
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo]);

    const loadComments = async () => {
        setLoading(true);
        // @ts-ignore
        const data = await Service.getComments(fileId, currentUser?.id || '');
        setComments(data);
        setLoading(false);
    };

    const submitComment = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newComment.trim() || !currentUser || isSubmitting) return;
        
        setIsSubmitting(true);
        const parentId = replyingTo ? replyingTo.id : undefined;

        await Service.addComment(fileId, currentUser.id, newComment, parentId);
        
        // Refresh & Reset
        // @ts-ignore
        const updated = await Service.getComments(fileId, currentUser.id);
        setComments(updated);
        
        // Calculate total comments properly (including replies if flatten, but here simplistic)
        // Note: The service currently returns top-level comments with nested replies in some versions, 
        // or flat list. Assuming Service.getComments returns recursive structure for UI but logic needs flat count.
        // For simplicity, we increment blindly or need a recursive counter. 
        // Let's assume onUpdateCount just wants a signal or current length + 1
        // We'll rely on the parent to refetch or just optimistic increment.
        // Better: count all nodes.
        const countNodes = (nodes: Comment[]): number => nodes.reduce((acc, c) => acc + 1 + (c.replies ? countNodes(c.replies) : 0), 0);
        onUpdateCount(countNodes(updated));

        setNewComment('');
        setReplyingTo(null);
        setIsSubmitting(false);
        
        // Scroll to bottom
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const deleteComment = async (commentId: string) => {
        if (!window.confirm("Apagar comentário?")) return;
        await Service.deleteComment(commentId);
        // @ts-ignore
        const updated = await Service.getComments(fileId, currentUser.id);
        setComments(updated);
        
        const countNodes = (nodes: Comment[]): number => nodes.reduce((acc, c) => acc + 1 + (c.replies ? countNodes(c.replies) : 0), 0);
        onUpdateCount(countNodes(updated));
    };

    const toggleLike = async (commentId: string) => {
        await Service.toggleCommentLike(commentId, currentUser.id);
        // Optimistic UI could happen here, but fast refresh is okay for now
        // @ts-ignore
        const updated = await Service.getComments(fileId, currentUser.id);
        setComments(updated);
    };

    if (!isOpen) return null;

    const CommentItem: React.FC<{ comment: Comment, depth?: number }> = ({ comment, depth = 0 }) => (
        <div className={`relative ${depth > 0 ? 'ml-9 mt-3' : 'mt-4'}`}>
            {/* Thread Line */}
            {depth > 0 && (
                <div className="absolute -left-[22px] top-0 w-3 h-3 border-l-2 border-b-2 border-gray-200 dark:border-gray-700 rounded-bl-xl"></div>
            )}
            
            <div className="flex space-x-3 group">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => { onClose(); navigate(`/u/${comment.user_id}`); }}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {comment.user?.avatar_url ? (
                            <img src={comment.user.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-gray-500">{comment.user?.username?.[0]}</span>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl rounded-tl-none p-3 border border-transparent dark:border-gray-800">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-gray-900 dark:text-white hover:underline cursor-pointer" onClick={() => { onClose(); navigate(`/u/${comment.user_id}`); }}>
                                {comment.user?.username}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                            <RichTextRenderer text={comment.content} />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-1 ml-1">
                        <button 
                            onClick={() => toggleLike(comment.id)}
                            className={`flex items-center space-x-1 text-xs font-bold transition-colors ${comment.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <Icons.Heart className="w-3.5 h-3.5" fill={comment.isLiked ? "currentColor" : "none"} />
                            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                        </button>
                        
                        <button 
                            onClick={() => setReplyingTo(comment)}
                            className="text-xs font-bold text-gray-400 hover:text-[#7900c5] transition-colors"
                        >
                            Responder
                        </button>

                        {(currentUser?.id === comment.user_id) && (
                            <button onClick={() => deleteComment(comment.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir">
                                <Icons.Trash className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Render Replies */}
            {comment.replies && comment.replies.map(reply => (
                <div key={reply.id} className="relative">
                    {/* Vertical Thread Line Extension */}
                    <div className="absolute left-[15px] top-[-10px] bottom-0 w-px bg-gray-200 dark:bg-gray-800 -z-10"></div>
                    <CommentItem comment={reply} depth={depth + 1} />
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative w-full md:w-[480px] h-full bg-white dark:bg-[#121212] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 dark:border-gray-800">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md z-10 sticky top-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Comentários <span className="text-gray-400 text-sm font-normal">({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex space-x-3">
                                    <Skeleton variant="circular" className="w-8 h-8" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="w-full h-16 rounded-xl" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Icons.MessageCircle className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">Nenhum comentário ainda.</p>
                            <p className="text-xs">Seja o primeiro a iniciar a conversa!</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {comments.map(c => <CommentItem key={c.id} comment={c} />)}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121212]">
                    {replyingTo && (
                        <div className="flex justify-between items-center mb-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold animate-in slide-in-from-bottom-2">
                            <span>Respondendo a @{replyingTo.user?.username}</span>
                            <button onClick={() => setReplyingTo(null)} className="hover:text-purple-900 p-1"><Icons.X className="w-3 h-3" /></button>
                        </div>
                    )}
                    
                    <form onSubmit={submitComment} className="flex items-end gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-[#7900c5] transition-all border border-transparent dark:border-gray-700">
                            <textarea
                                ref={textareaRef}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Adicione um comentário..."
                                className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 resize-none max-h-32 min-h-[24px] py-1"
                                rows={1}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        submitComment();
                                    }
                                }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!newComment.trim() || isSubmitting}
                            className="p-3 bg-[#7900c5] hover:bg-[#60009e] text-white rounded-full shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90 flex items-center justify-center"
                        >
                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Icons.Send className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};