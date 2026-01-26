import { createClient } from '@supabase/supabase-js';
import { FileData, Role, FlashcardDeck, Flashcard, FileAttachment } from '../types';
import { MockService, initDB } from './mock';
import { OfflineService } from './offline'; 

const getEnv = (key: string): string => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env[key] || '';
        }
    } catch (e) {
        console.warn('Environment access error:', e);
    }
    return '';
};

const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('MICROSPACE_CUSTOM_URL') : null;
const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('MICROSPACE_CUSTOM_KEY') : null;

const SUPABASE_URL = storedUrl || getEnv('VITE_SUPABASE_URL');
const SUPABASE_KEY = storedKey || getEnv('VITE_SUPABASE_ANON_KEY');

export const isDemoMode = !SUPABASE_URL || !SUPABASE_KEY;

export const supabase = isDemoMode
    ? null
    : createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'microspace-auth-token',
            flowType: 'pkce' 
        }
    });

export const authClient = supabase;
export const dbClient = supabase;

export const getDiagnosticInfo = () => {
    return {
        mode: isDemoMode ? 'DEMO (Mock)' : 'REAL (Supabase)',
        activeUrl: SUPABASE_URL || 'Not Set',
        localUrl: SUPABASE_URL || '', 
        activeKeySnippet: SUPABASE_KEY ? `${SUPABASE_KEY.substring(0, 5)}...` : 'Not Set',
        localKeySnippet: SUPABASE_KEY ? `${SUPABASE_KEY.substring(0, 5)}...` : 'Not Set',
        fullLocalKey: SUPABASE_KEY || '',
        isManualOverride: !!storedUrl
    };
};

export const clearSession = async () => {
    localStorage.clear();
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
};

export const runConnectionDiagnostics = async () => {
    const results = {
        serverReachable: false,
        anonKeyValid: false,
        details: [] as string[]
    };

    const log = (msg: string) => results.details.push(msg);

    if (isDemoMode) {
        log("⚠️ Modo Demo ativo. VITE_SUPABASE_URL/ANON_KEY ausentes.");
        return results;
    }

    try {
        log(`Tentando conectar a: ${SUPABASE_URL}`);
        
        if (SUPABASE_URL.includes('ngrok') || SUPABASE_URL.includes('trycloudflare')) {
            log("ℹ️ Detectado uso de Túnel (Ngrok/Cloudflare).");
        } else if (window.location.protocol === 'https:' && SUPABASE_URL.startsWith('http:')) {
            log("⚠️ AVISO CRÍTICO: Site em HTTPS tentando acessar Banco em HTTP.");
            log("Isso causará erro de 'Mixed Content' em celulares/produção.");
            log("Solução: Use um túnel (ngrok) ou HTTPS no banco.");
        }

        const { error } = await supabase!.from('groups').select('count', { count: 'exact', head: true });
        
        if (!error) {
            results.serverReachable = true;
            results.anonKeyValid = true;
            log("✅ Conexão estabelecida com sucesso.");
        } else {
            results.serverReachable = true; 
            log(`❌ Erro da API: ${error.message} (${error.code})`);
            
            if (error.code === 'PGRST301' || error.message.includes('JWT')) {
                results.anonKeyValid = false;
                log("⚠️ Chave inválida ou incompatível com o JWT Secret.");
            }
            if (error.message.includes('Failed to fetch')) {
                results.serverReachable = false;
                log("⚠️ Falha de rede. O servidor não respondeu.");
            }
        }
    } catch (e: any) {
        log(`❌ Falha crítica: ${e.message}`);
    }

    return results;
};

const RealService = {
    syncUserToLocalDB: async (cloudUser: any) => {
        if (!supabase) return null;
        
        const metaGroupId = cloudUser.user_metadata?.group_id || cloudUser.raw_user_meta_data?.group_id || null;
        
        const profileData = {
            id: cloudUser.id,
            email: cloudUser.email,
            username: cloudUser.user_metadata?.full_name || cloudUser.email?.split('@')[0],
            avatar_url: cloudUser.user_metadata?.avatar_url,
            role: 'student',
            group_id: metaGroupId
        };

        try {
            const { data: existing } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', cloudUser.id)
                .single();

            if (!existing) {
                const dbProfile = { ...profileData };
                if (dbProfile.group_id === '00000000-0000-0000-0000-000000000000') {
                    dbProfile.group_id = null;
                }

                const { error } = await supabase.from('profiles').insert(dbProfile);
                if (error) console.warn("⚠️ Sync: DB Insert Falhou.", error.message);
                return dbProfile;
            }
            return existing;
        } catch (err) {
            console.error("🔥 Sync Error:", err);
            return profileData;
        }
    },

   getSavedFiles: async (userId: string) => {
        const savedFiles = await OfflineService.getAllFiles();
        
        if (savedFiles.length > 0 && navigator.onLine && supabase) {
            const ids = savedFiles.map(f => f.id);
            try {
                const { data: freshFiles } = await supabase.from('files')
                    .select(`*, subject:subjects(*), uploader:profiles(*)`)
                    .in('id', ids);
                
                if (freshFiles) {
                    for (const fresh of freshFiles) {
                        const updated = { ...fresh, isSaved: true };
                        await OfflineService.saveFile(updated);
                    }
                    return await OfflineService.getAllFiles();
                }
            } catch (e) {
                console.warn("Could not refresh backpack items from cloud", e);
            }
        }

        return savedFiles;
    },

    toggleSave: async (fileId: string, userId: string) => {
        
        const isSaved = await OfflineService.isFileSaved(fileId);
        
        if (isSaved) {
            await OfflineService.removeFile(fileId);
            return false;
        } else {
            const fullFile = await RealService.getFile(fileId);
            if (fullFile) {
                // @ts-ignore
                await OfflineService.saveFile({ ...fullFile, isSaved: true });
                return true;
            }
            return false;
        }
    },

    getGroups: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('groups').select('*');
        if (error) {
            console.error("Error fetching groups:", error);
            return [];
        }
        return data || [];
    },
    
    getSubjects: async (groupId: string) => { 
        if (!supabase) return [];
        try {
            const { data } = await supabase.from('subjects').select('*, files(count)').eq('group_id', groupId); 
            return data?.map((s: any) => ({ ...s, file_count: s.files?.[0]?.count || 0 })) || []; 
        } catch (e) { return []; }
    },
    
    getAllSubjects: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('subjects').select('*');
        return data || [];
    },

    getFiles: async (subjectId: string | null, category: string, sourceType: string, groupId: string | null, currentUserId: string) => {
        if (!supabase) return [];
        try {
            let query = supabase.from('files').select(`
                *, 
                subject:subjects(*), 
                uploader:profiles(*), 
                likes:likes(count), 
                my_likes:likes(user_id),
                comments:comments(count),
                poll:polls(*, options:poll_options(*), votes:poll_votes(option_id, user_id))
            `);
            
            if (groupId) query = query.eq('target_group_id', groupId);
            if (subjectId) query = query.eq('subject_id', subjectId);
            if (category !== 'all') query = query.eq('category', category);
            if (sourceType !== 'all') query = query.eq('source_type', sourceType);
            
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            const subjectIds = [...new Set(data.map((f: any) => f.subject_id))];
            
            let reps: any[] = [];
            if (subjectIds.length > 0) {
                const { data: fetchedReps } = await supabase
                    .from('subject_representatives')
                    .select('user_id, subject_id')
                    .in('subject_id', subjectIds);
                reps = fetchedReps || [];
            }

            return data.map((f: any) => {
                let pollData = null;
                if (f.poll && f.poll.length > 0) {
                    const p = f.poll[0];
                    const voteCounts: Record<string, number> = {};
                    p.options.forEach((o: any) => voteCounts[o.id] = 0);
                    
                    if (p.votes) {
                        p.votes.forEach((v: any) => {
                            if (voteCounts[v.option_id] !== undefined) voteCounts[v.option_id]++;
                        });
                    }

                    const myVote = p.votes?.find((v: any) => v.user_id === currentUserId);

                    pollData = {
                        ...p,
                        total_votes: p.votes?.length || 0,
                        options: p.options.map((o: any) => ({
                            ...o,
                            votes: voteCounts[o.id] || 0
                        })).sort((a:any, b:any) => a.id.localeCompare(b.id)),
                        user_vote_option_id: myVote?.option_id || null
                    };
                }

                let author_role: 'monitor' | 'representative' | null = null;
                
                if (f.subject && f.subject.monitor_id === f.uploader_id) {
                    author_role = 'monitor';
                } 
                else if (reps.some((r: any) => r.user_id === f.uploader_id && r.subject_id === f.subject_id)) {
                    author_role = 'representative';
                }

                return {
                    ...f,
                    isLiked: f.my_likes?.some((l: any) => l.user_id === currentUserId),
                    likes_count: f.likes?.[0]?.count || 0,
                    comments_count: f.comments?.[0]?.count || 0,
                    isSaved: false,
                    poll: pollData,
                    author_role
                };
            });
        } catch (e) {
            console.error("Fetch Files Error:", e);
            return [];
        }
    },

    getFile: async (fileId: string) => {
        if (!supabase) return null;
        const { data, error } = await supabase.from('files').select(`*, subject:subjects(*), uploader:profiles(*)`).eq('id', fileId).single();
        if (error) return null;
        return data;
    },

    uploadFile: async (files: File[], meta: any, pollData?: { question: string, options: string[] }) => { 
        if (!supabase) return;
        
        try {
            const uploadedAttachments: FileAttachment[] = [];
            
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${meta.uploader_id}/${Date.now()}_${sanitizedName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(filePath, file, { upsert: false });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                uploadedAttachments.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: urlData.publicUrl
                });
            }

            const { data: fileRow, error } = await supabase.from('files').insert({
                ...meta,
                size_bytes: files[0]?.size || 0, 
                file_type: files[0]?.type || 'text/plain', 
                attachments: uploadedAttachments
            }).select().single();

            if(error) throw error;

            if (pollData && fileRow) {
                const { data: poll } = await supabase.from('polls').insert({
                    file_id: fileRow.id,
                    question: pollData.question
                }).select().single();

                if (poll) {
                    const optionsPayload = pollData.options.map(opt => ({
                        poll_id: poll.id,
                        text: opt
                    }));
                    await supabase.from('poll_options').insert(optionsPayload);
                }
            }

            return true;
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    },

    updateFile: async (fileId: string, updates: Partial<FileData>) => {
        if (!supabase) return;
        const { error } = await supabase.from('files').update(updates).eq('id', fileId);
        if (error) throw error;
    },

    deleteFile: async (fileId: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('files').delete().eq('id', fileId);
        if (error) throw error;
    },

    votePoll: async (pollId: string, optionId: string, userId: string) => {
        if (!supabase) return;
        const { data: existing } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId).eq('user_id', userId).single();
        if (existing) return;

        await supabase.from('poll_votes').insert({ poll_id: pollId, option_id: optionId, user_id: userId });
        await supabase.rpc('increment_poll_vote', { option_id: optionId });
    },

    getFlashcardDecks: async (subjectId: string): Promise<FlashcardDeck[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('flashcard_decks').select('*, cards:flashcards(count), creator:profiles(username, id)').eq('subject_id', subjectId);
        return data?.map((d: any) => ({ 
            ...d, 
            cards_count: d.cards?.[0]?.count || 0,
            creator_name: d.creator?.username 
        })) || [];
    },

    getDeckCards: async (deckId: string): Promise<Flashcard[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('flashcards').select('*').eq('deck_id', deckId);
        return data || [];
    },

    createFlashcardDeck: async (subjectId: string, title: string, creatorId: string, cards: {front: string, back: string}[]) => {
        if (!supabase) return;
        const { data: deck } = await supabase.from('flashcard_decks').insert({ subject_id: subjectId, title, creator_id: creatorId }).select().single();
        if (deck) {
            const cardsPayload = cards.map(c => ({ deck_id: deck.id, front: c.front, back: c.back }));
            await supabase.from('flashcards').insert(cardsPayload);
        }
    },

    updateFlashcardDeck: async (deckId: string, title: string, cards: {id?: string, front: string, back: string}[]) => {
        if (!supabase) return;
        
        await supabase.from('flashcard_decks').update({ title }).eq('id', deckId);

        await supabase.from('flashcards').delete().eq('deck_id', deckId);
        
        const cardsPayload = cards.map(c => ({ 
            deck_id: deckId, 
            front: c.front, 
            back: c.back 
        }));
        await supabase.from('flashcards').insert(cardsPayload);
    },

    deleteFlashcardDeck: async (deckId: string) => {
        if (!supabase) return;
        await supabase.from('flashcard_decks').delete().eq('id', deckId);
    },

    getUserProfile: async (userId: string, currentUserId: string) => {
        if (!supabase) return null;
        
        const [profileRes, followRes, subjectsRes, repsRes, posts] = await Promise.all([
            supabase.from('profiles').select('*, group:groups(*)').eq('id', userId).single(),
            supabase.from('follows').select('*').eq('follower_id', currentUserId).eq('following_id', userId).single(),
            supabase.from('subjects').select('id, name, monitor_id').eq('monitor_id', userId),
            supabase.from('subject_representatives').select('subject:subjects(id, name)').eq('user_id', userId),
            RealService.getFiles(null, 'all', 'all', null, currentUserId)
        ]);

        const profile = profileRes.data;
        if (!profile) return null;

        const titles = [];
        if (subjectsRes.data) {
            subjectsRes.data.forEach((s: any) => titles.push({ type: 'monitor', subject_id: s.id, subject_name: s.name }));
        }
        if (repsRes.data) {
            repsRes.data.forEach((r: any) => {
                if (r.subject) titles.push({ type: 'representative', subject_id: r.subject.id, subject_name: r.subject.name });
            });
        }

        return { 
            profile: { ...profile, is_following: !!followRes.data, titles }, 
            posts: posts.filter((p: any) => p.uploader_id === userId) 
        };
    },

    getSubjectRepresentatives: async (subjectId: string) => {
        if (!supabase) return [];
        const { data } = await supabase.from('subject_representatives').select('user_id').eq('subject_id', subjectId);
        return data?.map((r: any) => r.user_id) || [];
    },

    manageRepresentative: async (userId: string, subjectId: string, isAdding: boolean) => {
        if (!supabase) return;
        if (isAdding) {
            await supabase.from('subject_representatives').insert({ user_id: userId, subject_id: subjectId });
        } else {
            await supabase.from('subject_representatives')
                .delete()
                .eq('user_id', userId)
                .eq('subject_id', subjectId);
        }
    },

    toggleLike: async (fileId: string, userId: string) => {
        if (!supabase) return false;
        const { data } = await supabase.from('likes').select('id').eq('file_id', fileId).eq('user_id', userId).single();
        if (data) { 
            await supabase.from('likes').delete().eq('id', data.id); 
            return false; 
        } else { 
            await supabase.from('likes').insert({ file_id: fileId, user_id: userId }); 
            return true; 
        }
    },

    getComments: async (fileId: string, currentUserId: string) => {
         if (!supabase) return [];
         const { data } = await supabase.from('comments')
            .select(`*, user:profiles(*), likes:comment_likes(user_id), likes_count:comment_likes(count)`)
            .eq('file_id', fileId)
            .order('created_at', { ascending: true });
         
         return data?.map((c: any) => ({ 
             ...c, 
             likes_count: c.likes_count?.[0]?.count || 0, 
             isLiked: c.likes?.some((l: any) => l.user_id === currentUserId), 
             replies: [] 
         })) || [];
    },

    addComment: async (fileId: string, userId: string, content: string, parentId?: string) => { 
        if (!supabase) return;
        const { data } = await supabase.from('comments').insert({ 
            file_id: fileId, 
            user_id: userId, 
            content, 
            parent_id: parentId || null 
        }).select().single(); 
        return data; 
    },

    deleteComment: async (id: string) => { 
        if (supabase) await supabase.from('comments').delete().eq('id', id); 
    },

    toggleCommentLike: async (cid: string, uid: string) => {
        if (!supabase) return false;
        const { data } = await supabase.from('comment_likes').select('id').eq('comment_id', cid).eq('user_id', uid).single();
        if (data) { 
            await supabase.from('comment_likes').delete().eq('id', data.id); 
            return false; 
        } else { 
            await supabase.from('comment_likes').insert({ comment_id: cid, user_id: uid }); 
            return true; 
        }
    },

    pinComment: async (cid: string, isPinned: boolean) => { 
        if(supabase) await supabase.from('comments').update({ is_pinned: isPinned }).eq('id', cid); 
    },

    sendFeedback: async (userId: string, content: string, includeLogs: boolean) => {
        if(supabase) await supabase.from('feedbacks').insert({ user_id: userId, content, include_logs: includeLogs });
    },

    getFeedbacks: async () => {
        if(!supabase) return [];
        const { data } = await supabase.from('feedbacks').select('*, user:profiles(*)').order('created_at', { ascending: false });
        return data || [];
    },

    resolveFeedback: async (id: string) => {
        if(supabase) await supabase.from('feedbacks').update({ status: 'resolved' }).eq('id', id);
    },

    createGroup: async (name: string, year: number, iconName: string) => { 
        if(!supabase) return;
        const slug = name.toLowerCase().replace(/\s+/g, '-'); 
        const { error } = await supabase.from('groups').insert({ name, slug, academic_year: year, icon_name: iconName }); 
        if(error) console.error("Create Group Failed:", error);
    },

    updateGroup: async (id: string, updates: any) => { 
        if(supabase) await supabase.from('groups').update(updates).eq('id', id); 
    },

    deleteGroup: async (id: string) => { 
        if(supabase) await supabase.from('groups').delete().eq('id', id); 
    },

    updateUserRole: async (userId: string, role: Role) => { 
        if(supabase) await supabase.from('profiles').update({ role }).eq('id', userId); 
    },

    updateUserGroup: async (userId: string, groupId: string) => { 
        if(supabase) await supabase.from('profiles').update({ group_id: groupId }).eq('id', userId); 
    },

    deleteUser: async (userId: string) => { 
        if(supabase) await supabase.from('profiles').delete().eq('id', userId); 
    },

    createSubject: async (name: string, color: string, icon: string, groupId: string, monitorId?: string, teacherId?: string) => { 
        if(!supabase) return;
        const { error } = await supabase.from('subjects').insert({ 
            name, 
            color_hex: color, 
            icon_name: icon, 
            group_id: groupId,
            monitor_id: monitorId || null,
            teacher_id: teacherId || null
        }); 
        if (error) { 
            console.error("Create Subject Error:", error); 
            throw error; 
        }
    },

    updateSubject: async (id: string, updates: any) => { 
        if(supabase) await supabase.from('subjects').update(updates).eq('id', id); 
    },

    deleteSubject: async (id: string) => { 
        if(supabase) await supabase.from('subjects').delete().eq('id', id); 
    },

    manageSubjectDistribution: async (newName: string, originalName: string, color: string, icon: string, targetGroupIds: string[]) => {
        if (!supabase) return;
        const { data: allSubjects } = await supabase.from('subjects').select('*').eq('name', originalName);
        if (!allSubjects) return;
        
        const toDeleteIds = allSubjects.filter(s => !targetGroupIds.includes(s.group_id)).map(s => s.id);
        if (toDeleteIds.length > 0) { 
            await supabase.from('subjects').delete().in('id', toDeleteIds); 
        }
        
        for (const gid of targetGroupIds) {
            const existing = allSubjects.find(s => s.group_id === gid);
            if (existing) { 
                await supabase.from('subjects').update({ name: newName, color_hex: color, icon_name: icon }).eq('id', existing.id); 
            } else { 
                await supabase.from('subjects').insert({ name: newName, color_hex: color, icon_name: icon, group_id: gid }); 
            }
        }
    },

    getAllUsers: async () => {
        if(!supabase) return [];
        const { data } = await supabase.from('profiles').select('*');
        return data || [];
    },

    getAdminStats: async () => { 
        if (!supabase) return { users: 0, groups: 0, files: 0, storage: '0' };
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: groups } = await supabase.from('groups').select('*', { count: 'exact', head: true });
        const { count: files } = await supabase.from('files').select('*', { count: 'exact', head: true });
        return { 
            users: users || 0, 
            groups: groups || 0, 
            files: files || 0, 
            storage: 'DB Local' 
        };
    },

    claimAdminAccess: async (key: string) => {
        if (!supabase) return false;
        const { data, error } = await supabase.rpc('promote_me', { secret_key: key });
        return !error && data;
    },

    updateProfile: async (userId: string, updates: any) => { 
        if(supabase) await supabase.from('profiles').update(updates).eq('id', userId); 
        return updates; 
    },

    toggleFollow: async (targetId: string, myId: string) => {
        if (!supabase) return false;
        const { data } = await supabase.from('follows').select('*').eq('follower_id', myId).eq('following_id', targetId).single();
        if (data) { 
            await supabase.from('follows').delete().match({ follower_id: myId, following_id: targetId }); 
            return false; 
        } else { 
            await supabase.from('follows').insert({ follower_id: myId, following_id: targetId }); 
            return true; 
        }
    },

    getFollowedPosts: async (myId: string) => {
        if (!supabase) return [];
        const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', myId);
        if (!following || following.length === 0) return [];
        const ids = following.map((f: any) => f.following_id);
        const allFiles = await RealService.getFiles(null, 'all', 'all', null, myId);
        return allFiles.filter((f: any) => ids.includes(f.uploader_id)).slice(0, 10);
    },

    getUserStats: async (userId: string) => {
        if (!supabase) return { likesReceived: 0, commentsReceived: 0, uploadsCount: 0 };
        const { data: files } = await supabase.from('files').select('id, likes:likes(count), comments:comments(count)').eq('uploader_id', userId);
        let likesReceived = 0; 
        let commentsReceived = 0; 
        let uploadsCount = 0;
        if (files) {
            uploadsCount = files.length;
            files.forEach((f: any) => { 
                likesReceived += f.likes?.[0]?.count || 0; 
                commentsReceived += f.comments?.[0]?.count || 0; 
            });
        }
        return { likesReceived, commentsReceived, uploadsCount };
    },

    uploadProfileImage: async (userId: string, file: File, type: 'avatar' | 'background') => {
        if (!supabase) return "";
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
        const bucket = 'profiles';
        try {
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
            return data.publicUrl;
        } catch (e) { 
            console.error("Storage Exception:", e); 
            throw e; 
        }
    },

    ensureProfileExists: async (user: any) => RealService.syncUserToLocalDB(user),

    createProfile: async () => ({} as any),
};

export const Service = isDemoMode ? MockService : RealService;