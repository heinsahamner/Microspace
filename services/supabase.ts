import { createClient } from '@supabase/supabase-js';
import { FileData, Role } from '../types';
import { MockService, initDB } from './mock';

// =============================================================================
// 1. CONFIGURATION & CLIENTS
// =============================================================================

const env = import.meta.env || {} as any;

// --- CLOUD AUTH CLIENT (Google Login) ---
const CLOUD_URL = env.VITE_CLOUD_AUTH_URL;
const CLOUD_KEY = env.VITE_CLOUD_AUTH_KEY;

// --- LOCAL DATABASE CLIENT (Real Data) ---
const LOCAL_URL = env.VITE_LOCAL_DB_URL;
const LOCAL_KEY = env.VITE_LOCAL_DB_KEY;

// --- MODE CHECK ---
export const isDemoMode = !CLOUD_URL || !LOCAL_URL;

if (isDemoMode) {
    console.warn("⚠️ MICROSPACE: Faltam chaves no .env. Rodando em modo MOCK (IndexedDB puro).");
} else {
    console.log("🚀 MICROSPACE: Modo TYDA Ativo.");
    console.log(`   ├─ Auth: Cloud (${CLOUD_URL})`);
    console.log(`   ├─ Data: Local (${LOCAL_URL})`);
    console.log(`   └─ Backpack: Browser (IndexedDB)`);
}

// Client for Authentication ONLY
export const authClient = isDemoMode 
    ? null 
    : createClient(CLOUD_URL, CLOUD_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });

// --- CUSTOM FETCH WRAPPER FOR LOCAL DB ---
let activeDbToken: string | null = null;

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    
    if (activeDbToken) {
        headers.set('Authorization', `Bearer ${activeDbToken}`);
    }

    const response = await fetch(input, { ...init, headers });

    // --- TYDA DIAGNOSTIC ---
    if (response.status === 401 && activeDbToken) {
        console.group("🔥 ERRO CRÍTICO DE SINCRONIA (TYDA)");
        console.error("O Banco de Dados Local rejeitou o token da Nuvem (401 Unauthorized).");
        console.error("Causa Provável: O 'JWT Secret' do Supabase Local é diferente do Supabase Cloud.");
        console.warn("SOLUÇÃO:");
        console.warn("1. Vá no Dashboard da Nuvem > Project Settings > API > copie o 'JWT Secret'.");
        console.warn("2. No seu projeto local, abra 'supabase/config.toml'.");
        console.warn("3. Na seção [auth], defina: jwt_secret = 'SEU_SECRET_COPIADO'");
        console.warn("4. Reinicie o Supabase Local (supabase stop && supabase start).");
        console.warn("5. ATENÇÃO: Ao reiniciar, o Local vai gerar uma NOVA 'anon key'. Atualize seu .env local com ela!");
        console.groupEnd();
    }

    return response;
};

export const dbClient = isDemoMode
    ? null
    : createClient(LOCAL_URL, LOCAL_KEY, {
        global: {
            fetch: customFetch
        }
    });

export const supabase = dbClient;

export const setDbToken = (token: string | null) => {
    activeDbToken = token;
    if (dbClient && token) {
        dbClient.realtime.setAuth(token);
    }
};

// =============================================================================
// 2. REAL SERVICE (Cloud Auth + Local DB + IDB Backpack)
// =============================================================================

const RealService = {
    // --- AUTH & SYNC ---
    syncUserToLocalDB: async (cloudUser: any) => {
        if (!dbClient) return null;
        
        try {
            const { data: existing, error: fetchError } = await dbClient
                .from('profiles')
                .select('*')
                .eq('id', cloudUser.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
                console.error("Sync Fetch Error:", fetchError);
                return null;
            }

            if (!existing) {
                // Check metadata for group_id (from register flow)
                const metaGroupId = cloudUser.user_metadata?.group_id || cloudUser.raw_user_meta_data?.group_id || null;

                const newProfile = {
                    id: cloudUser.id,
                    email: cloudUser.email,
                    username: cloudUser.user_metadata?.full_name || cloudUser.email?.split('@')[0],
                    avatar_url: cloudUser.user_metadata?.avatar_url,
                    role: 'student',
                    group_id: metaGroupId // Use metadata if available
                };
                
                const { error } = await dbClient.from('profiles').insert(newProfile);
                if (error) {
                    console.error("Sync Insert Error:", error);
                    // If insert fails, we might be offline or blocked. Return temp profile to avoid crash
                    return newProfile; 
                }
                return newProfile;
            }
            return existing;
        } catch (err) {
            console.error("Sync Critical Error:", err);
            return null;
        }
    },

    // --- BACKPACK (IndexedDB Only - Uses helper from mock file but strictly for local storage) ---
    getSavedFiles: async (userId: string) => {
        const db = await initDB(false); // Should not seed
        return await db.getAll('backpack_saves');
    },

    toggleSave: async (file: FileData) => {
        const db = await initDB(false); // Should not seed
        const existing = await db.get('backpack_saves', file.id);
        
        if (existing) {
            await db.delete('backpack_saves', file.id);
            return false;
        } else {
            const fileToSave = { ...file, isSaved: true };
            await db.put('backpack_saves', fileToSave);
            return true;
        }
    },

    // --- STANDARD DATA ---
    getGroups: async () => {
        if (!dbClient) return [];
        const { data, error } = await dbClient.from('groups').select('*');
        if (error) {
            console.error("Error fetching groups:", error);
            // Don't return empty array immediately if it's a 401, let the component handle the error state based on empty data + console logs
            if (error.code === 'PGRST301') return []; 
            return [];
        }
        return data || [];
    },
    
    getSubjects: async (groupId: string) => { 
        const { data } = await dbClient!.from('subjects').select('*, files(count)').eq('group_id', groupId); 
        return data?.map((s: any) => ({ ...s, file_count: s.files?.[0]?.count || 0 })) || []; 
    },
    
    getAllSubjects: async () => (await dbClient!.from('subjects').select('*')).data || [],

    getFiles: async (subjectId: string | null, category: string, sourceType: string, groupId: string | null, currentUserId: string) => {
        let query = dbClient!.from('files').select(`*, subject:subjects(*), uploader:profiles(*), likes:likes(count), my_likes:likes(user_id), comments:comments(count)`);
        
        if (groupId) query = query.eq('target_group_id', groupId);
        if (subjectId) query = query.eq('subject_id', subjectId);
        if (category !== 'all') query = query.eq('category', category);
        if (sourceType !== 'all') query = query.eq('source_type', sourceType);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Merge with local backpack data
        const db = await initDB(false);
        const savedIds = (await db.getAllKeys('backpack_saves')).map(k => String(k));

        return data.map((f: any) => ({
            ...f,
            isLiked: f.my_likes?.some((l: any) => l.user_id === currentUserId),
            likes_count: f.likes?.[0]?.count || 0,
            comments_count: f.comments?.[0]?.count || 0,
            isSaved: savedIds.includes(f.id)
        }));
    },

    uploadFile: async (files: File[], meta: any) => { 
        const { error } = await dbClient!.from('files').insert({
            ...meta,
            size_bytes: files[0]?.size || 0,
            file_type: files[0]?.type
        });
        if(error) throw error;
        return true; 
    },

    getUserProfile: async (userId: string, currentUserId: string) => {
        const { data: profile } = await dbClient!.from('profiles').select('*, group:groups(*)').eq('id', userId).single();
        const { data: followData } = await dbClient!.from('follows').select('*').eq('follower_id', currentUserId).eq('following_id', userId).single();
        const posts = await RealService.getFiles(null, 'all', 'all', null, currentUserId);
        return { 
            profile: { ...profile, is_following: !!followData }, 
            posts: posts.filter((p: any) => p.uploader_id === userId) 
        };
    },

    toggleLike: async (fileId: string, userId: string) => {
        const { data } = await dbClient!.from('likes').select('id').eq('file_id', fileId).eq('user_id', userId).single();
        if (data) { await dbClient!.from('likes').delete().eq('id', data.id); return false; }
        else { await dbClient!.from('likes').insert({ file_id: fileId, user_id: userId }); return true; }
    },

    getComments: async (fileId: string, currentUserId: string) => {
         const { data } = await dbClient!.from('comments').select(`*, user:profiles(*), likes:comment_likes(user_id), likes_count:comment_likes(count)`).eq('file_id', fileId).order('created_at', { ascending: true });
         return data?.map((c: any) => ({ ...c, likes_count: c.likes_count?.[0]?.count || 0, isLiked: c.likes?.some((l: any) => l.user_id === currentUserId), replies: [] })) || [];
    },

    addComment: async (fileId: string, userId: string, content: string, parentId?: string) => { 
        const { data } = await dbClient!.from('comments').insert({ file_id: fileId, user_id: userId, content, parent_id: parentId || null }).select().single(); 
        return data; 
    },

    deleteComment: async (id: string) => { await dbClient!.from('comments').delete().eq('id', id); },
    toggleCommentLike: async (cid: string, uid: string) => {
        const { data } = await dbClient!.from('comment_likes').select('id').eq('comment_id', cid).eq('user_id', uid).single();
        if (data) { await dbClient!.from('comment_likes').delete().eq('id', data.id); return false; }
        else { await dbClient!.from('comment_likes').insert({ comment_id: cid, user_id: uid }); return true; }
    },
    pinComment: async (cid: string, isPinned: boolean) => { await dbClient!.from('comments').update({ is_pinned: isPinned }).eq('id', cid); },
    
    // --- FEEDBACKS ---
    sendFeedback: async (userId: string, content: string, includeLogs: boolean) => {
        await dbClient!.from('feedbacks').insert({ user_id: userId, content, include_logs: includeLogs });
    },
    getFeedbacks: async () => {
        const { data } = await dbClient!.from('feedbacks').select('*, user:profiles(*)').order('created_at', { ascending: false });
        return data || [];
    },
    resolveFeedback: async (id: string) => {
        await dbClient!.from('feedbacks').update({ status: 'resolved' }).eq('id', id);
    },

    // Admin ops
    createGroup: async (name: string, year: number, iconName: string) => { 
        const slug = name.toLowerCase().replace(/\s+/g, '-'); 
        await dbClient!.from('groups').insert({ name, slug, academic_year: year, icon_name: iconName }); 
    },
    updateGroup: async (id: string, updates: any) => { await dbClient!.from('groups').update(updates).eq('id', id); },
    deleteGroup: async (id: string) => { await dbClient!.from('groups').delete().eq('id', id); },
    updateUserRole: async (userId: string, role: Role) => { await dbClient!.from('profiles').update({ role }).eq('id', userId); },
    updateUserGroup: async (userId: string, groupId: string) => { await dbClient!.from('profiles').update({ group_id: groupId }).eq('id', userId); },
    deleteUser: async (userId: string) => { await dbClient!.from('profiles').delete().eq('id', userId); },
    createSubject: async (name: string, color: string, icon: string, groupId: string) => { await dbClient!.from('subjects').insert({ name, color_hex: color, icon_name: icon, group_id: groupId }); },
    updateSubject: async (id: string, updates: any) => { await dbClient!.from('subjects').update(updates).eq('id', id); },
    deleteSubject: async (id: string) => { await dbClient!.from('subjects').delete().eq('id', id); },
    manageSubjectDistribution: async (newName: string, originalName: string, color: string, icon: string, targetGroupIds: string[]) => {
        console.log("Managing subjects via DB Client");
        // Implementation for batch management would go here for real DB
    },
    getAllUsers: async () => (await dbClient!.from('profiles').select('*')).data || [],
    getAdminStats: async () => { return { users: 0, groups: 0, files: 0, storage: 'Local DB' }; },
    claimAdminAccess: async (key: string) => false,
    
    updateProfile: async (userId: string, updates: any) => { await dbClient!.from('profiles').update(updates).eq('id', userId); return updates; },
    toggleFollow: async (targetId: string, myId: string) => {
        const { data } = await dbClient!.from('follows').select('*').eq('follower_id', myId).eq('following_id', targetId).single();
        if (data) { await dbClient!.from('follows').delete().match({ follower_id: myId, following_id: targetId }); return false; }
        else { await dbClient!.from('follows').insert({ follower_id: myId, following_id: targetId }); return true; }
    },
    getFollowedPosts: async (myId: string) => {
        const { data: following } = await dbClient!.from('follows').select('following_id').eq('follower_id', myId);
        if (!following || following.length === 0) return [];
        const ids = following.map((f: any) => f.following_id);
        const allFiles = await RealService.getFiles(null, 'all', 'all', null, myId);
        return allFiles.filter((f: any) => ids.includes(f.uploader_id)).slice(0, 10);
    },
    getUserStats: async (userId: string) => {
        const { data: files } = await dbClient!.from('files').select('id, likes:likes(count), comments:comments(count)').eq('uploader_id', userId);
        
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
    uploadProfileImage: async () => "", 
    ensureProfileExists: async (user: any) => RealService.syncUserToLocalDB(user),
    createProfile: async () => ({} as any),
};

export const Service = isDemoMode ? MockService : RealService;