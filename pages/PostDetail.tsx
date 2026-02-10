
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Service } from '../services/supabase';
import { FileData } from '../types';
import { Icons } from '../components/Icons';
import { FileCard } from '../components/shared/FileCard';
import { CommentsDrawer } from '../components/shared/CommentsDrawer';
import { PostSkeleton } from '../components/shared/Skeleton';

export const PostDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [file, setFile] = useState<FileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchFile = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await Service.getFile(id);
                if (data) {
                    setFile(data);
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-6">
                        <Icons.ArrowLeft className="w-5 h-5" /> Voltar
                    </button>
                    <PostSkeleton />
                </div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Icons.FileText className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Post não encontrado</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Este conteúdo pode ter sido removido ou você não tem permissão para vê-lo.</p>
                <button onClick={() => navigate('/')} className="bg-[#7900c5] text-white px-6 py-2 rounded-xl font-bold">
                    Voltar ao Início
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8 pb-24">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <Icons.ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Publicação</h1>
                </div>

                <FileCard 
                    file={file} 
                    colorHex={file.subject?.color_hex || '#9ca3af'}
                    isDetailView={true}
                    onDelete={() => navigate(-1)}
                />

                <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 px-2">Comentários</h3>
                    <CommentsDrawer 
                        isOpen={true}
                        fileId={file.id}
                        currentUser={user}
                        onUpdateCount={() => {}}
                        variant="inline"
                    />
                </div>
            </div>
        </div>
    );
};
