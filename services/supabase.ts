import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileData, Subject, Profile, Group, Comment, Role } from '../types';

const getEnv = (key: string) => {
    if (typeof process !== 'undefined' && process.env) return process.env[key];
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key];
    return undefined;
};

const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL');
const SUPABASE_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY');

const isDemo = !SUPABASE_URL || !SUPABASE_KEY;

export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    SUPABASE_KEY || 'placeholder'
);
export const isDemoMode = isDemo;


let MOCK_GROUPS: Group[] = [
  { id: 'g1', name: '3º Ano Info', slug: '3-info', academic_year: 2024 },
  { id: 'g2', name: '2º Ano Mecatrônica', slug: '2-meca', academic_year: 2024 },
];

let MOCK_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Matemática', color_hex: '#7900c5', icon_name: 'calculator', group_id: 'g1' },
];

let MOCK_PROFILES: Profile[] = [
    {
        id: 'admin1', username: 'Lucas Willian', role: 'admin', group_id: 'g1', avatar_url: null, background_url: null, bio: 'Criador do Microspace', followers_count: 999, following_count: 0
    },
    {
        id: 'u_demo', username: 'demo_user', role: 'student', group_id: 'g1', avatar_url: null, background_url: null, bio: 'Usuário de demonstração', followers_count: 0, following_count: 0
    }
];

let MOCK_FOLLOWS: Record<string, string[]> = {};
let MOCK_LIKES: Record<string, string[]> = {};
let MOCK_COMMENT_LIKES: Record<string, string[]> = {};
let MOCK_FILES: FileData[] = [];
let MOCK_COMMENTS: Comment[] = []; 

export const MockService = {
  getGroups: async (): Promise<Group[]> => {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_GROUPS;
  },
  
  createGroup: async (name: string, year: number): Promise<void> => {
      await new Promise(r => setTimeout(r, 800));
      MOCK_GROUPS.push({
          id: `g${Date.now()}`,
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          academic_year: year
      });
  },

  updateGroup: async (id: string, updates: Partial<Group>): Promise<void> => {
      const idx = MOCK_GROUPS.findIndex(g => g.id === id);
      if (idx > -1) {
          MOCK_GROUPS[idx] = { ...MOCK_GROUPS[idx], ...updates };
      }
  },

  deleteGroup: async (id: string): Promise<void> => {
      MOCK_GROUPS = MOCK_GROUPS.filter(g => g.id !== id);
  },

  getAllUsers: async (): Promise<Profile[]> => {
      await new Promise(r => setTimeout(r, 600));
      return MOCK_PROFILES.map(p => ({
          ...p,
          group: MOCK_GROUPS.find(g => g.id === p.group_id)
      }));
  },

  updateUserRole: async (userId: string, role: Role): Promise<void> => {
      const idx = MOCK_PROFILES.findIndex(p => p.id === userId);
      if (idx > -1) {
          MOCK_PROFILES[idx].role = role;
      }
  },

  createProfile: async (username: string, groupId: string): Promise<Profile> => {
      await new Promise(r => setTimeout(r, 800));
      const newId = `u${Date.now()}`;
      const newProfile: Profile = {
          id: newId,
          username,
          group_id: groupId,
          role: 'student',
          avatar_url: null,
          background_url: null,
          bio: 'Novo estudante',
          followers_count: 0,
          following_count: 0
      };
      MOCK_PROFILES.push(newProfile);
      return newProfile;
  },

  getSubjects: async (groupId: string): Promise<Subject[]> => {
    await new Promise(r => setTimeout(r, 400));
    const subjects = MOCK_SUBJECTS.filter(s => s.group_id === groupId);
    return subjects.map(s => ({
        ...s,
        file_count: MOCK_FILES.filter(f => f.subject_id === s.id).length
    }));
  },

  getAllSubjects: async (): Promise<Subject[]> => {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_SUBJECTS;
  },

  createSubject: async (name: string, color: string, icon: string, groupId: string): Promise<void> => {
     await new Promise(r => setTimeout(r, 500));
     MOCK_SUBJECTS.push({
         id: `s${Date.now()}`,
         name,
         color_hex: color,
         icon_name: icon,
         group_id: groupId
     });
  },

  updateSubject: async (id: string, updates: Partial<Subject>): Promise<void> => {
      const idx = MOCK_SUBJECTS.findIndex(s => s.id === id);
      if (idx > -1) {
          MOCK_SUBJECTS[idx] = { ...MOCK_SUBJECTS[idx], ...updates };
      }
  },

  deleteSubject: async (id: string): Promise<void> => {
      MOCK_SUBJECTS = MOCK_SUBJECTS.filter(s => s.id !== id);
  },

  copySubjectsToGroup: async (sourceSubjectIds: string[], targetGroupId: string): Promise<void> => {
      await new Promise(r => setTimeout(r, 600));
      sourceSubjectIds.forEach(subId => {
          const original = MOCK_SUBJECTS.find(s => s.id === subId);
          if (original) {
              MOCK_SUBJECTS.push({
                  ...original,
                  id: `s${Date.now()}${Math.random()}`,
                  group_id: targetGroupId,
                  file_count: 0 
              });
          }
      });
  },

  getFiles: async (
      subjectId: string | null, 
      category: string, 
      sourceType: 'official' | 'community' | 'all',
      groupId: string | null,
      currentUserId: string = 'u_demo'
  ): Promise<FileData[]> => {
    await new Promise(r => setTimeout(r, 500));
    let files = MOCK_FILES;
    
    if (groupId) {
        files = files.filter(f => f.target_group_id === groupId);
    }

    if (subjectId) {
        files = files.filter(f => f.subject_id === subjectId);
    }
    
    if (category !== 'all') {
        files = files.filter(f => f.category === category);
    }
    
    if (sourceType !== 'all') {
        files = files.filter(f => f.source_type === sourceType);
    }

    return files.map(f => ({
        ...f,
        subject: MOCK_SUBJECTS.find(s => s.id === f.subject_id),
        uploader: MOCK_PROFILES.find(p => p.id === f.uploader_id),
        isLiked: MOCK_LIKES[f.id]?.includes(currentUserId) || false,
        likes_count: MOCK_LIKES[f.id]?.length || 0,
        comments_count: MOCK_COMMENTS.filter(c => c.file_id === f.id && !c.is_deleted).length
    }));
  },

  uploadFile: async (file: File | null, meta: any): Promise<boolean> => {
     await new Promise(r => setTimeout(r, 1000));
     const newFile: FileData = {
         id: `f${Date.now()}`,
         title: meta.title,
         description: meta.description,
         file_url: file ? URL.createObjectURL(file) : null, 
         file_type: file ? file.name.split('.').pop() || 'file' : 'text',
         size_bytes: file ? file.size : 0,
         uploader_id: meta.uploader_id,
         subject_id: meta.subject_id,
         target_group_id: meta.target_group_id,
         category: meta.category,
         source_type: 'community',
         year_reference: 2024,
         views_count: 0,
         likes_count: 0,
         comments_count: 0,
         created_at: new Date().toISOString()
     };
     MOCK_FILES.push(newFile);
     return true;
  },

  toggleLike: async (fileId: string, userId: string): Promise<boolean> => {
    if (!MOCK_LIKES[fileId]) MOCK_LIKES[fileId] = [];
    const index = MOCK_LIKES[fileId].indexOf(userId);
    if (index > -1) {
        MOCK_LIKES[fileId].splice(index, 1);
        return false; 
    } else {
        MOCK_LIKES[fileId].push(userId);
        return true; 
    }
  },

  getUserProfile: async (userId: string, currentUserId: string): Promise<{ profile: Profile, posts: FileData[] }> => {
      await new Promise(r => setTimeout(r, 500));
      const profile = MOCK_PROFILES.find(p => p.id === userId);
      if (!profile) throw new Error("User not found");
      
      const posts = MOCK_FILES
          .filter(f => f.uploader_id === userId)
          .map(f => ({
            ...f,
            subject: MOCK_SUBJECTS.find(s => s.id === f.subject_id),
            uploader: profile,
            isLiked: MOCK_LIKES[f.id]?.includes(currentUserId) || false,
            likes_count: MOCK_LIKES[f.id]?.length || 0,
            comments_count: MOCK_COMMENTS.filter(c => c.file_id === f.id && !c.is_deleted).length
          }));

      const isFollowing = MOCK_FOLLOWS[currentUserId]?.includes(userId) || false;

      return { 
          profile: { ...profile, is_following: isFollowing, group: MOCK_GROUPS.find(g => g.id === profile.group_id) }, 
          posts 
      };
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
      const index = MOCK_PROFILES.findIndex(p => p.id === userId);
      if (index > -1) {
          MOCK_PROFILES[index] = { ...MOCK_PROFILES[index], ...updates };
          return MOCK_PROFILES[index];
      }
      throw new Error("Profile not found");
  },

  toggleFollow: async (targetUserId: string, currentUserId: string): Promise<boolean> => {
      if (!MOCK_FOLLOWS[currentUserId]) MOCK_FOLLOWS[currentUserId] = [];
      const index = MOCK_FOLLOWS[currentUserId].indexOf(targetUserId);
      const targetProfile = MOCK_PROFILES.find(p => p.id === targetUserId);
      const myProfile = MOCK_PROFILES.find(p => p.id === currentUserId);

      if (index > -1) {
          MOCK_FOLLOWS[currentUserId].splice(index, 1);
          if (targetProfile) targetProfile.followers_count--;
          if (myProfile) myProfile.following_count--;
          return false; 
      } else {
          MOCK_FOLLOWS[currentUserId].push(targetUserId);
          if (targetProfile) targetProfile.followers_count++;
          if (myProfile) myProfile.following_count++;
          return true;
      }
  },

  getFollowedPosts: async (currentUserId: string): Promise<FileData[]> => {
      await new Promise(r => setTimeout(r, 400));
      const followedIds = MOCK_FOLLOWS[currentUserId] || [];
      if (followedIds.length === 0) return [];
      let files = MOCK_FILES.filter(f => followedIds.includes(f.uploader_id));
      files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return files.slice(0, 5).map(f => ({
          ...f,
          subject: MOCK_SUBJECTS.find(s => s.id === f.subject_id),
          uploader: MOCK_PROFILES.find(p => p.id === f.uploader_id),
          comments_count: 0
      }));
  },

  getComments: async (fileId: string): Promise<Comment[]> => {
      await new Promise(r => setTimeout(r, 300));
      
      const allComments = MOCK_COMMENTS
        .filter(c => c.file_id === fileId) 
        .map(c => ({
            ...c,
            user: MOCK_PROFILES.find(p => p.id === c.user_id),
            likes_count: MOCK_COMMENT_LIKES[c.id]?.length || 0,
            isLiked: MOCK_COMMENT_LIKES[c.id]?.includes('u_demo') || false 
        }));

      allComments.sort((a,b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const rootComments = allComments.filter(c => !c.parent_id);
      
      const attachChildren = (parents: Comment[]) => {
        parents.forEach(p => {
             const children = allComments.filter(c => c.parent_id === p.id);
             children.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
             p.replies = children;
             attachChildren(children);
        });
      };
      attachChildren(rootComments);

      return rootComments;
  },

  addComment: async (fileId: string, userId: string, content: string, parentId?: string): Promise<Comment> => {
      await new Promise(r => setTimeout(r, 300));
      const newComment: Comment = {
          id: `c${Date.now()}`,
          file_id: fileId,
          user_id: userId,
          content,
          parent_id: parentId,
          created_at: new Date().toISOString(),
          likes_count: 0,
          is_deleted: false,
          is_pinned: false
      };
      MOCK_COMMENTS.push(newComment);
      return { ...newComment, user: MOCK_PROFILES.find(p => p.id === userId), replies: [] };
  },

  deleteComment: async (commentId: string): Promise<void> => {
      MOCK_COMMENTS = MOCK_COMMENTS.filter(c => c.id !== commentId && c.parent_id !== commentId);
  },

  toggleCommentLike: async (commentId: string, userId: string): Promise<boolean> => {
      if (!MOCK_COMMENT_LIKES[commentId]) MOCK_COMMENT_LIKES[commentId] = [];
      const index = MOCK_COMMENT_LIKES[commentId].indexOf(userId);
      if (index > -1) {
          MOCK_COMMENT_LIKES[commentId].splice(index, 1);
          return false;
      } else {
          MOCK_COMMENT_LIKES[commentId].push(userId);
          return true;
      }
  },

  pinComment: async (commentId: string, isPinned: boolean): Promise<void> => {
      const idx = MOCK_COMMENTS.findIndex(c => c.id === commentId);
      if (idx > -1) {
          MOCK_COMMENTS[idx].is_pinned = isPinned;
      }
  }
};

export const RealService = {
    getFiles: async (
        subjectId: string | null, 
        category: string, 
        sourceType: 'official' | 'community' | 'all',
        groupId: string | null,
        currentUserId: string
    ) => {
        let query = supabase.from('files').select(`
            *,
            subject:subjects(*),
            uploader:profiles(*),
            likes:likes(count),
            interactions:likes(user_id),
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
            isLiked: f.interactions?.some((i: any) => i.user_id === currentUserId),
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
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${meta.target_group_id}/${meta.subject_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('materials')
                .getPublicUrl(filePath);
            
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
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('file_id', fileId)
            .eq('user_id', userId)
            .single();

        if (data) {
            await supabase.from('likes').delete().eq('id', data.id);
            return false;
        } else {
            await supabase.from('likes').insert({ file_id: fileId, user_id: userId });
            return true;
        }
    },

    getComments: async (fileId: string, currentUserId: string) => {
         const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:profiles(*),
                likes:comment_likes(user_id),
                likes_count:comment_likes(count)
            `)
            .eq('file_id', fileId)
            .order('created_at', { ascending: true });

         if (error) throw error;

         const allComments = data.map((c: any) => ({
             ...c,
             likes_count: c.likes_count?.[0]?.count || 0,
             isLiked: c.likes?.some((l: any) => l.user_id === currentUserId),
             replies: []
         }));

         allComments.sort((a: any, b: any) => {
             if (a.is_pinned && !b.is_pinned) return -1;
             if (!a.is_pinned && b.is_pinned) return 1;
             return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
         });

         const rootComments = allComments.filter((c: any) => !c.parent_id);
         const attachChildren = (parents: any[]) => {
             parents.forEach(p => {
                 const children = allComments.filter((c: any) => c.parent_id === p.id);
                 children.sort((a:any, b:any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                 p.replies = children;
                 attachChildren(children);
             });
         };
         attachChildren(rootComments);
         return rootComments;
    },

    addComment: async (fileId: string, userId: string, content: string, parentId?: string) => {
        const { data, error } = await supabase
            .from('comments')
            .insert({
                file_id: fileId,
                user_id: userId,
                content: content,
                parent_id: parentId || null
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    deleteComment: async (commentId: string) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) throw error;
    },

    toggleCommentLike: async (commentId: string, userId: string) => {
        const { data } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .single();
        
        if (data) {
            await supabase.from('comment_likes').delete().eq('id', data.id);
            return false;
        } else {
            await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
            return true;
        }
    },

    pinComment: async (commentId: string, isPinned: boolean) => {
        const { error } = await supabase.from('comments').update({ is_pinned: isPinned }).eq('id', commentId);
        if(error) throw error;
    },

    getUserProfile: async (userId: string, currentUserId: string) => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*, group:groups(*)')
            .eq('id', userId)
            .single();
        
        if (error) throw error;

        const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('following_id', userId)
            .single();

        const posts = await RealService.getFiles(null, 'all', 'all', null, currentUserId);
        const userPosts = posts.filter((p: any) => p.uploader_id === userId);

        return {
            profile: { ...profile, is_following: !!followData },
            posts: userPosts
        };
    },

    toggleFollow: async (targetUserId: string, currentUserId: string) => {
        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId)
            .single();

        if (data) {
            await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: targetUserId });
            await supabase.rpc('decrement_follows', { userid: targetUserId, followerid: currentUserId });
            return false;
        } else {
            await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
            return true;
        }
    },

    updateProfile: async (userId: string, updates: Partial<Profile>) => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

export const useFiles = (
    subjectId: string | null,
    category: string,
    sourceType: 'official' | 'community' | 'all',
    groupId: string | null,
    currentUserId?: string
) => {
    return useQuery({
        queryKey: ['files', subjectId, category, sourceType, groupId],
        queryFn: async () => {
            if (!currentUserId) return [];
            if (isDemoMode) {
                return MockService.getFiles(subjectId, category, sourceType, groupId, currentUserId);
            } else {
                return RealService.getFiles(subjectId, category, sourceType, groupId, currentUserId);
            }
        },
        enabled: !!currentUserId
    });
};

export const useComments = (fileId: string, currentUserId?: string) => {
    return useQuery({
        queryKey: ['comments', fileId],
        queryFn: async () => {
            if (!currentUserId) return [];
            if (isDemoMode) {
                return MockService.getComments(fileId);
            } else {
                return RealService.getComments(fileId, currentUserId);
            }
        },
        enabled: !!currentUserId && !!fileId
    });
};