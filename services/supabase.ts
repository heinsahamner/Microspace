import { createClient } from '@supabase/supabase-js';
import { FileData, Subject, Profile, Group, Comment, Role } from '../types';

const getEnv = (key: string) => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
        return import.meta.env[`VITE_${key}`];
    }
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`REACT_APP_${key}`]) {
        return import.meta.env[`REACT_APP_${key}`];
    }
    return undefined;
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY');

export const isDemoMode = !SUPABASE_URL || !SUPABASE_KEY;

export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    SUPABASE_KEY || 'placeholder'
);

let MOCK_GROUPS: Group[] = [
  { id: 'g1', name: '3º Ano Info', slug: '3-info', academic_year: 2024 },
  { id: 'g2', name: '2º Ano Mecatrônica', slug: '2-meca', academic_year: 2024 },
];

let MOCK_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Matemática', color_hex: '#7900c5', icon_name: 'calculator', group_id: 'g1' },
];

let MOCK_PROFILES: Profile[] = [
    { id: 'admin1', username: 'Lucas Willian', role: 'admin', group_id: 'g1', avatar_url: null, background_url: null, bio: 'Criador do Microspace', followers_count: 999, following_count: 0 },
    { id: 'u_demo', username: 'demo_user', role: 'student', group_id: 'g1', avatar_url: null, background_url: null, bio: 'Usuário de demonstração', followers_count: 0, following_count: 0 }
];

let MOCK_FOLLOWS: Record<string, string[]> = {};
let MOCK_LIKES: Record<string, string[]> = {};
let MOCK_COMMENT_LIKES: Record<string, string[]> = {};
let MOCK_FILES: FileData[] = [];
let MOCK_COMMENTS: Comment[] = []; 

export const MockService = {
  getGroups: async (): Promise<Group[]> => MOCK_GROUPS,
  createGroup: async (name: string, year: number) => { MOCK_GROUPS.push({ id: `g${Date.now()}`, name, slug: name.toLowerCase(), academic_year: year }); },
  updateGroup: async (id: string, updates: Partial<Group>) => { const i = MOCK_GROUPS.findIndex(g => g.id === id); if(i>-1) MOCK_GROUPS[i] = {...MOCK_GROUPS[i], ...updates}; },
  deleteGroup: async (id: string) => { MOCK_GROUPS = MOCK_GROUPS.filter(g => g.id !== id); },
  getAllUsers: async (): Promise<Profile[]> => MOCK_PROFILES.map(p => ({...p, group: MOCK_GROUPS.find(g => g.id === p.group_id)})),
  updateUserRole: async (userId: string, role: Role) => { const i = MOCK_PROFILES.findIndex(p => p.id === userId); if(i>-1) MOCK_PROFILES[i].role = role; },
  createProfile: async (username: string, groupId: string): Promise<Profile> => { const p: Profile = { id: `u${Date.now()}`, username, group_id: groupId, role: 'student', avatar_url: null, background_url: null, bio: '', followers_count: 0, following_count: 0 }; MOCK_PROFILES.push(p); return p; },
  getSubjects: async (groupId: string): Promise<Subject[]> => MOCK_SUBJECTS.filter(s => s.group_id === groupId).map(s => ({ ...s, file_count: MOCK_FILES.filter(f => f.subject_id === s.id).length })),
  getAllSubjects: async (): Promise<Subject[]> => MOCK_SUBJECTS,
  createSubject: async (name: string, color: string, icon: string, groupId: string) => { MOCK_SUBJECTS.push({ id: `s${Date.now()}`, name, color_hex: color, icon_name: icon, group_id: groupId }); },
  updateSubject: async (id: string, updates: Partial<Subject>) => { const i = MOCK_SUBJECTS.findIndex(s => s.id === id); if(i>-1) MOCK_SUBJECTS[i] = {...MOCK_SUBJECTS[i], ...updates}; },
  deleteSubject: async (id: string) => { MOCK_SUBJECTS = MOCK_SUBJECTS.filter(s => s.id !== id); },
  copySubjectsToGroup: async (ids: string[], targetId: string) => { ids.forEach(sid => { const s = MOCK_SUBJECTS.find(x => x.id === sid); if(s) MOCK_SUBJECTS.push({...s, id: `s${Date.now()}${Math.random()}`, group_id: targetId}); }); },
  getFiles: async (subjectId: string | null, category: string, sourceType: string, groupId: string | null, currentUserId: string = 'u_demo'): Promise<FileData[]> => {
    let files = MOCK_FILES;
    if (groupId) files = files.filter(f => f.target_group_id === groupId);
    if (subjectId) files = files.filter(f => f.subject_id === subjectId);
    if (category !== 'all') files = files.filter(f => f.category === category);
    if (sourceType !== 'all') files = files.filter(f => f.source_type === sourceType);
    return files.map(f => ({ ...f, subject: MOCK_SUBJECTS.find(s => s.id === f.subject_id), uploader: MOCK_PROFILES.find(p => p.id === f.uploader_id), isLiked: MOCK_LIKES[f.id]?.includes(currentUserId) || false, likes_count: MOCK_LIKES[f.id]?.length || 0, comments_count: MOCK_COMMENTS.filter(c => c.file_id === f.id).length }));
  },
  uploadFile: async (file: File | null, meta: any) => { MOCK_FILES.push({ id: `f${Date.now()}`, ...meta, file_url: file ? URL.createObjectURL(file) : null, created_at: new Date().toISOString(), likes_count: 0, comments_count: 0, views_count: 0 }); return true; },
  toggleLike: async (fileId: string, userId: string) => { if(!MOCK_LIKES[fileId]) MOCK_LIKES[fileId] = []; const i = MOCK_LIKES[fileId].indexOf(userId); if(i>-1) { MOCK_LIKES[fileId].splice(i,1); return false; } else { MOCK_LIKES[fileId].push(userId); return true; } },
  getUserProfile: async (userId: string, currentUserId: string) => { 
      const p = MOCK_PROFILES.find(x => x.id === userId); 
      if(!p) throw new Error("404"); 
      const posts = await MockService.getFiles(null,'all','all',null,currentUserId);
      return { profile: { ...p, is_following: MOCK_FOLLOWS[currentUserId]?.includes(userId) }, posts: posts.filter(f => f.uploader_id === userId) };
  },
  updateProfile: async (userId: string, updates: Partial<Profile>) => { const i = MOCK_PROFILES.findIndex(p => p.id === userId); if(i>-1) MOCK_PROFILES[i] = {...MOCK_PROFILES[i], ...updates}; return MOCK_PROFILES[i]; },
  toggleFollow: async (targetId: string, myId: string) => { if(!MOCK_FOLLOWS[myId]) MOCK_FOLLOWS[myId] = []; const i = MOCK_FOLLOWS[myId].indexOf(targetId); if(i>-1) { MOCK_FOLLOWS[myId].splice(i,1); return false; } else { MOCK_FOLLOWS[myId].push(targetId); return true; } },
  getFollowedPosts: async (myId: string) => { const f = MOCK_FOLLOWS[myId] || []; return (await MockService.getFiles(null,'all','all',null,myId)).filter(x => f.includes(x.uploader_id)); },
  getComments: async (fileId: string) => MOCK_COMMENTS.filter(c => c.file_id === fileId).map(c => ({...c, user: MOCK_PROFILES.find(p=>p.id===c.user_id), replies: []})),
  addComment: async (fileId: string, userId: string, content: string, parentId?: string) => { const c:Comment = { id: `c${Date.now()}`, file_id: fileId, user_id: userId, content, parent_id: parentId, created_at: new Date().toISOString(), likes_count: 0, is_deleted: false }; MOCK_COMMENTS.push(c); return c; },
  deleteComment: async (id: string) => { MOCK_COMMENTS = MOCK_COMMENTS.filter(c => c.id !== id); },
  toggleCommentLike: async (cid: string, uid: string) => { return true; },
  pinComment: async (cid: string, pinned: boolean) => { const c = MOCK_COMMENTS.find(x => x.id === cid); if(c) c.is_pinned = pinned; }
};

export const RealService = {
    getGroups: async (): Promise<Group[]> => {
        const { data } = await supabase.from('groups').select('*');
        return data || [];
    },
    createGroup: async (name: string, year: number) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        await supabase.from('groups').insert({ name, slug, academic_year: year });
    },
    updateGroup: async (id: string, updates: Partial<Group>) => {
        await supabase.from('groups').update(updates).eq('id', id);
    },
    deleteGroup: async (id: string) => {
        await supabase.from('groups').delete().eq('id', id);
    },
    getAllUsers: async (): Promise<Profile[]> => {
        const { data } = await supabase.from('profiles').select('*, group:groups(*)');
        return data || [];
    },
    updateUserRole: async (userId: string, role: Role) => {
        await supabase.from('profiles').update({ role }).eq('id', userId);
    },
    getSubjects: async (groupId: string): Promise<Subject[]> => {
        const { data } = await supabase.from('subjects').select('*, files(count)').eq('group_id', groupId);
        return data?.map((s: any) => ({ ...s, file_count: s.files?.[0]?.count || 0 })) || [];
    },
    getAllSubjects: async (): Promise<Subject[]> => {
        const { data } = await supabase.from('subjects').select('*');
        return data || [];
    },
    createSubject: async (name: string, color: string, icon: string, groupId: string) => {
        await supabase.from('subjects').insert({ name, color_hex: color, icon_name: icon, group_id: groupId });
    },
    updateSubject: async (id: string, updates: Partial<Subject>) => {
        await supabase.from('subjects').update(updates).eq('id', id);
    },
    deleteSubject: async (id: string) => {
        await supabase.from('subjects').delete().eq('id', id);
    },
    copySubjectsToGroup: async (ids: string[], targetId: string) => {
        const { data: sources } = await supabase.from('subjects').select('*').in('id', ids);
        if (!sources) return;
        const newSubjects = sources.map(s => ({
            name: s.name,
            color_hex: s.color_hex,
            icon_name: s.icon_name,
            group_id: targetId
        }));
        await supabase.from('subjects').insert(newSubjects);
    },
    getFiles: async (
        subjectId: string | null, 
        category: string, 
        sourceType: string,
        groupId: string | null,
        currentUserId: string
    ) => {
        let query = supabase.from('files').select(`
            *,
            subject:subjects(*),
            uploader:profiles(*),
            likes:likes(count),
            my_likes:likes(user_id),
            comments:comments(count)
        `);

        if (groupId) query = query.eq('target_group_id', groupId);
        if (subjectId) query = query.eq('subject_id', subjectId);
        if (category !== 'all') query = query.eq('category', category);
        if (sourceType !== 'all') query = query.eq('source_type', sourceType);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        return data.map((f: any) => ({
            ...f,
            isLiked: f.my_likes?.some((l: any) => l.user_id === currentUserId),
            likes_count: f.likes?.[0]?.count || 0,
            comments_count: f.comments?.[0]?.count || 0,
        }));
    },
    uploadFile: async (file: File | null, meta: any) => {
        let fileUrl = null;
        let sizeBytes = 0;
        let fileType = 'text';

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.floor(Math.random()*1000)}.${fileExt}`;
            const filePath = `${meta.target_group_id}/${meta.subject_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath);
            fileUrl = publicUrl;
            sizeBytes = file.size;
            fileType = fileExt || 'file';
        }

        const { error: dbError } = await supabase.from('files').insert({
            title: meta.title,
            description: meta.description,
            file_url: fileUrl,
            file_type: fileType,
            size_bytes: sizeBytes,
            uploader_id: meta.uploader_id,
            subject_id: meta.subject_id,
            target_group_id: meta.target_group_id,
            category: meta.category,
            source_type: 'community' 
        });

        if (dbError) throw dbError;
        return true;
    },
    toggleLike: async (fileId: string, userId: string) => {
        const { data } = await supabase.from('likes').select('id').eq('file_id', fileId).eq('user_id', userId).single();
        if (data) {
            await supabase.from('likes').delete().eq('id', data.id);
            return false;
        } else {
            await supabase.from('likes').insert({ file_id: fileId, user_id: userId });
            return true;
        }
    },
    getUserProfile: async (userId: string, currentUserId: string) => {
        const { data: profile, error } = await supabase.from('profiles').select('*, group:groups(*)').eq('id', userId).single();
        if (error) throw error;

        const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', currentUserId).eq('following_id', userId).single();
        const posts = await RealService.getFiles(null, 'all', 'all', null, currentUserId);
        const userPosts = posts.filter((p: any) => p.uploader_id === userId);

        return {
            profile: { ...profile, is_following: !!followData },
            posts: userPosts
        };
    },
    updateProfile: async (userId: string, updates: Partial<Profile>) => {
        await supabase.from('profiles').update(updates).eq('id', userId);
        return updates as Profile; 
    },
    toggleFollow: async (targetId: string, myId: string) => {
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
        const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', myId);
        if (!following || following.length === 0) return [];
        
        const ids = following.map((f: any) => f.following_id);
        
        const allFiles = await RealService.getFiles(null, 'all', 'all', null, myId);
        return allFiles.filter((f: any) => ids.includes(f.uploader_id)).slice(0, 10);
    },
    getComments: async (fileId: string, currentUserId: string) => {
         const { data, error } = await supabase.from('comments')
            .select(`*, user:profiles(*), likes:comment_likes(user_id), likes_count:comment_likes(count)`)
            .eq('file_id', fileId)
            .order('created_at', { ascending: true });
         if (error) throw error;

         const all = data.map((c: any) => ({
             ...c,
             likes_count: c.likes_count?.[0]?.count || 0,
             isLiked: c.likes?.some((l: any) => l.user_id === currentUserId),
             replies: []
         }));
         
         const root = all.filter((c: any) => !c.parent_id);
         const attach = (parents: any[]) => {
             parents.forEach(p => {
                 const kids = all.filter((c: any) => c.parent_id === p.id);
                 p.replies = kids;
                 attach(kids);
             });
         };
         attach(root);
         return root;
    },
    addComment: async (fileId: string, userId: string, content: string, parentId?: string) => {
        const { data } = await supabase.from('comments').insert({ file_id: fileId, user_id: userId, content, parent_id: parentId || null }).select().single();
        return data;
    },
    deleteComment: async (id: string) => { await supabase.from('comments').delete().eq('id', id); },
    toggleCommentLike: async (cid: string, uid: string) => {
        const { data } = await supabase.from('comment_likes').select('id').eq('comment_id', cid).eq('user_id', uid).single();
        if (data) { await supabase.from('comment_likes').delete().eq('id', data.id); return false; }
        else { await supabase.from('comment_likes').insert({ comment_id: cid, user_id: uid }); return true; }
    },
    pinComment: async (cid: string, isPinned: boolean) => { await supabase.from('comments').update({ is_pinned: isPinned }).eq('id', cid); }
};

export const Service = isDemoMode ? MockService : RealService;