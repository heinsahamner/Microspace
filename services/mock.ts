import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileData, Subject, Profile, Group, Comment, Role, Feedback } from '../types';

// =============================================================================
// 1. INDEXED DB DEFINITION & INITIALIZATION
// =============================================================================

export interface MicrospaceDB extends DBSchema {
  groups: { key: string; value: Group };
  profiles: { key: string; value: Profile };
  subjects: { key: string; value: Subject };
  files: { key: string; value: FileData };
  comments: { key: string; value: Comment };
  likes: { key: string; value: { id: string; user_id: string; file_id: string } };
  comment_likes: { key: string; value: { id: string; user_id: string; comment_id: string } };
  follows: { key: string; value: { id: string; follower_id: string; following_id: string } };
  backpack_saves: { key: string; value: FileData }; 
  feedbacks: { key: string; value: Feedback };
}

let dbPromise: Promise<IDBPDatabase<MicrospaceDB>>;

// Exported for RealService to use ONLY for Backpack functionality
export const initDB = async (shouldSeed: boolean = false) => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<MicrospaceDB>('microspace-db', 5, { 
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('subjects')) db.createObjectStore('subjects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('comments')) db.createObjectStore('comments', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('likes')) db.createObjectStore('likes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('comment_likes')) db.createObjectStore('comment_likes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('follows')) db.createObjectStore('follows', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('backpack_saves')) db.createObjectStore('backpack_saves', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('feedbacks')) db.createObjectStore('feedbacks', { keyPath: 'id' });
    },
  });

  if (shouldSeed) {
      const db = await dbPromise;
      const groupsCount = await db.count('groups');
      
      if (groupsCount === 0) {
          console.log("🌱 Seeding Demo Data...");
          
          // 1. Create a robust Demo Group
          const demoGroupId = 'demo-group';
          const groupData: Group = { 
              id: demoGroupId, 
              name: 'Turma Demo 2024', 
              slug: 'demo-2024', 
              academic_year: 2024, 
              icon_name: 'users' 
          };
          await db.put('groups', groupData);
          
          // 2. Create Subjects for this group
          await db.put('subjects', { id: 'sub-math', name: 'Matemática', color_hex: '#3b82f6', icon_name: 'calculator', group_id: demoGroupId });
          await db.put('subjects', { id: 'sub-hist', name: 'História', color_hex: '#f59e0b', icon_name: 'book', group_id: demoGroupId });
          await db.put('subjects', { id: 'sub-phys', name: 'Física', color_hex: '#7900c5', icon_name: 'atom', group_id: demoGroupId });

          // 3. Create the Main Demo User (Admin)
          await db.put('profiles', { 
              id: 'user-demo', 
              username: 'Admin Demo', 
              email: 'admin@demo.com',
              role: 'admin', 
              group_id: demoGroupId,
              followers_count: 120,
              following_count: 15,
              bio: 'Conta de demonstração com acesso administrativo completo.',
              avatar_url: null,
              background_url: null
          });

          // 4. Create Fake Post linked to this ecosystem
          await db.put('files', {
              id: 'file-demo-1',
              title: 'Resumo de Funções',
              description: 'Material introdutório sobre funções afim e quadrática.\n\n#matematica #funcoes',
              file_url: '#',
              file_type: 'application/pdf',
              size_bytes: 1024 * 500,
              uploader_id: 'user-demo',
              subject_id: 'sub-math',
              target_group_id: demoGroupId,
              category: 'summary',
              source_type: 'community',
              year_reference: 2024,
              views_count: 42,
              likes_count: 5,
              comments_count: 0,
              created_at: new Date().toISOString()
          });
      }
  }

  return dbPromise;
};

// =============================================================================
// 2. MOCK SERVICE IMPLEMENTATION
// =============================================================================

export const MockService = {
  // Helper to simulate network delay
  _delay: async () => new Promise(resolve => setTimeout(resolve, 300)),

  ensureProfileExists: async (user: any) => {
      const db = await initDB(true);
      const existing = await db.get('profiles', user.id);
      if (existing) return existing;
      
      const newProfile: Profile = {
          id: user.id,
          username: user.email.split('@')[0],
          email: user.email,
          role: 'student',
          group_id: null,
          avatar_url: null,
          background_url: null,
          bio: '',
          followers_count: 0,
          following_count: 0
      };
      await db.put('profiles', newProfile);
      return newProfile;
  },

  getGroups: async (): Promise<Group[]> => { 
      const db = await initDB(true); 
      return await db.getAll('groups'); 
  },

  getSubjects: async (groupId: string): Promise<Subject[]> => {
      const db = await initDB(true);
      const allSubjects = await db.getAll('subjects');
      const allFiles = await db.getAll('files');
      
      // Filter by group and count files
      return allSubjects
          .filter(s => s.group_id === groupId)
          .map(s => ({
              ...s,
              file_count: allFiles.filter(f => f.subject_id === s.id).length
          }));
  },

  getAllSubjects: async () => {
      const db = await initDB(true);
      return await db.getAll('subjects');
  },

  getFiles: async (subjectId: string | null, category: string, sourceType: string, groupId: string | null, currentUserId: string) => {
      const db = await initDB(true);
      let files = await db.getAll('files');
      
      // IMPORTANT: Filter by group first if provided
      if (groupId) files = files.filter(f => f.target_group_id === groupId);
      if (subjectId) files = files.filter(f => f.subject_id === subjectId);
      if (category !== 'all') files = files.filter(f => f.category === category);
      if (sourceType !== 'all') files = files.filter(f => f.source_type === sourceType);

      // Manual JOINs
      const enriched = await Promise.all(files.map(async f => {
          const uploader = await db.get('profiles', f.uploader_id);
          const subject = await db.get('subjects', f.subject_id);
          
          // Count likes and comments by querying those stores
          const allLikes = await db.getAll('likes');
          const fileLikes = allLikes.filter(l => l.file_id === f.id);
          const isLiked = fileLikes.some(l => l.user_id === currentUserId);
          
          const allComments = await db.getAll('comments');
          const commentsCount = allComments.filter(c => c.file_id === f.id && !c.is_deleted).length;

          // Check save status
          const savedFile = await db.get('backpack_saves', f.id);

          return {
              ...f,
              uploader,
              subject,
              likes_count: fileLikes.length,
              comments_count: commentsCount,
              isLiked,
              isSaved: !!savedFile
          };
      }));

      return enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  uploadFile: async (files: File[], meta: any) => {
      const db = await initDB(true);
      const newFile: FileData = {
          id: Math.random().toString(36).substr(2, 9),
          ...meta,
          file_url: '#', // Mock URL
          file_type: files[0]?.type || 'unknown',
          size_bytes: files[0]?.size || 0,
          created_at: new Date().toISOString(),
          views_count: 0,
          likes_count: 0,
          comments_count: 0,
          attachments: files.map(f => ({ name: f.name, size: f.size, type: f.type, url: '#' }))
      };
      await db.put('files', newFile);
      return true;
  },

  // --- SOCIAL MOCK ---
  toggleLike: async (fileId: string, userId: string) => {
      const db = await initDB(true);
      const allLikes = await db.getAll('likes');
      const existing = allLikes.find(l => l.file_id === fileId && l.user_id === userId);
      
      if (existing) {
          await db.delete('likes', existing.id);
          return false;
      } else {
          await db.put('likes', { id: Math.random().toString(36), file_id: fileId, user_id: userId });
          return true;
      }
  },

  getComments: async (fileId: string, currentUserId: string) => {
      const db = await initDB(true);
      const allComments = await db.getAll('comments');
      const fileComments = allComments.filter(c => c.file_id === fileId);
      
      const enriched = await Promise.all(fileComments.map(async c => {
          const user = await db.get('profiles', c.user_id);
          
          const allCommentLikes = await db.getAll('comment_likes');
          const likes = allCommentLikes.filter(l => l.comment_id === c.id);
          const isLiked = likes.some(l => l.user_id === currentUserId);

          return {
              ...c,
              user,
              likes_count: likes.length,
              isLiked,
              replies: []
          };
      }));
      
      const roots = enriched.filter(c => !c.parent_id);
      roots.forEach(root => {
          root.replies = enriched.filter(c => c.parent_id === root.id);
      });
      
      return roots.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addComment: async (fileId: string, userId: string, content: string, parentId?: string) => {
      const db = await initDB(true);
      const newComment: Comment = {
          id: Math.random().toString(36).substr(2, 9),
          file_id: fileId,
          user_id: userId,
          content,
          parent_id: parentId,
          created_at: new Date().toISOString(),
          likes_count: 0,
          is_deleted: false
      };
      await db.put('comments', newComment);
      return newComment;
  },

  deleteComment: async (id: string) => {
      const db = await initDB(true);
      await db.delete('comments', id);
  },

  toggleCommentLike: async (cid: string, uid: string) => {
      const db = await initDB(true);
      const all = await db.getAll('comment_likes');
      const existing = all.find(l => l.comment_id === cid && l.user_id === uid);
      if (existing) {
          await db.delete('comment_likes', existing.id);
          return false;
      } else {
          await db.put('comment_likes', { id: Math.random().toString(), comment_id: cid, user_id: uid });
          return true;
      }
  },

  // --- USER MOCK ---
  getUserProfile: async (userId: string, currentUserId: string) => {
      const db = await initDB(true);
      const profile = await db.get('profiles', userId);
      const allFollows = await db.getAll('follows');
      const isFollowing = allFollows.some(f => f.follower_id === currentUserId && f.following_id === userId);
      
      // Use getFiles directly to get correct posts
      const posts = await MockService.getFiles(null, 'all', 'all', null, currentUserId);
      const userPosts = posts.filter((p: any) => p.uploader_id === userId);

      if (profile && profile.group_id) {
          profile.group = await db.get('groups', profile.group_id);
      }

      return { 
          profile: { ...profile!, is_following: isFollowing }, 
          posts: userPosts 
      };
  },

  updateProfile: async (userId: string, updates: any) => {
      const db = await initDB(true);
      const p = await db.get('profiles', userId);
      if(p) {
          await db.put('profiles', { ...p, ...updates });
      }
  },

  toggleFollow: async (targetId: string, myId: string) => {
      const db = await initDB(true);
      const all = await db.getAll('follows');
      const existing = all.find(f => f.follower_id === myId && f.following_id === targetId);
      
      if (existing) {
          await db.delete('follows', existing.id);
          const pTarget = await db.get('profiles', targetId);
          if(pTarget) await db.put('profiles', {...pTarget, followers_count: Math.max(0, pTarget.followers_count - 1)});
          return false;
      } else {
          await db.put('follows', { id: Math.random().toString(), follower_id: myId, following_id: targetId });
          const pTarget = await db.get('profiles', targetId);
          if(pTarget) await db.put('profiles', {...pTarget, followers_count: pTarget.followers_count + 1});
          return true;
      }
  },

  getFollowedPosts: async (myId: string) => {
      const db = await initDB(true);
      const allFollows = await db.getAll('follows');
      const followingIds = allFollows.filter(f => f.follower_id === myId).map(f => f.following_id);
      
      if (followingIds.length === 0) return [];
      
      const allFiles = await MockService.getFiles(null, 'all', 'all', null, myId);
      return allFiles.filter((f: any) => followingIds.includes(f.uploader_id));
  },

  getUserStats: async (userId: string) => {
      const db = await initDB(true);
      const files = await db.getAll('files');
      const userFiles = files.filter(f => f.uploader_id === userId);
      
      const allLikes = await db.getAll('likes');
      const likesReceived = allLikes.filter(l => userFiles.some(f => f.id === l.file_id)).length;
      
      const allComments = await db.getAll('comments');
      const commentsReceived = allComments.filter(c => userFiles.some(f => f.id === c.file_id)).length;

      return { likesReceived, commentsReceived, uploadsCount: userFiles.length };
  },

  uploadProfileImage: async () => "https://via.placeholder.com/150", 

  // --- BACKPACK ---
  getSavedFiles: async (userId: string) => {
      const db = await initDB(true);
      return await db.getAll('backpack_saves');
  },
  
  toggleSave: async (file: FileData) => {
      const db = await initDB(true);
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

  // --- FEEDBACK ---
  sendFeedback: async (userId: string, content: string, includeLogs: boolean) => {
      const db = await initDB(true);
      await db.put('feedbacks', {
          id: Math.random().toString(36).substr(2, 9),
          user_id: userId,
          content,
          include_logs: includeLogs,
          status: 'open',
          created_at: new Date().toISOString()
      });
  },

  getFeedbacks: async () => {
      const db = await initDB(true);
      const all = await db.getAll('feedbacks');
      const profiles = await db.getAll('profiles');
      
      return all.map(f => ({
          ...f,
          user: profiles.find(p => p.id === f.user_id)
      })).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  resolveFeedback: async (id: string) => {
      const db = await initDB(true);
      const f = await db.get('feedbacks', id);
      if(f) await db.put('feedbacks', {...f, status: 'resolved'});
  },

  // --- ADMIN MOCK ---
  createGroup: async (name: string, year: number, iconName: string) => {
      const db = await initDB(true);
      await db.put('groups', { 
          id: Math.random().toString(36).substr(2, 9), 
          name, 
          slug: name.toLowerCase(), 
          academic_year: year, 
          icon_name: iconName 
      });
  },
  updateGroup: async (id: string, updates: any) => {
      const db = await initDB(true);
      const g = await db.get('groups', id);
      if(g) await db.put('groups', {...g, ...updates});
  },
  deleteGroup: async (id: string) => {
      const db = await initDB(true);
      await db.delete('groups', id);
  },
  updateUserRole: async (userId: string, role: Role) => {
      const db = await initDB(true);
      const u = await db.get('profiles', userId);
      if(u) await db.put('profiles', {...u, role});
  },
  updateUserGroup: async (userId: string, groupId: string) => {
      const db = await initDB(true);
      const u = await db.get('profiles', userId);
      if(u) await db.put('profiles', {...u, group_id: groupId});
  },
  deleteUser: async (userId: string) => {
      const db = await initDB(true);
      await db.delete('profiles', userId);
  },
  getAllUsers: async () => {
      const db = await initDB(true);
      return await db.getAll('profiles');
  },
  createSubject: async (name: string, color: string, icon: string, groupId: string) => {
      const db = await initDB(true);
      await db.put('subjects', {
          id: Math.random().toString(), name, color_hex: color, icon_name: icon, group_id: groupId
      });
  },
  updateSubject: async (id: string, updates: any) => {
      const db = await initDB(true);
      const s = await db.get('subjects', id);
      if(s) await db.put('subjects', {...s, ...updates});
  },
  deleteSubject: async (id: string) => {
      const db = await initDB(true);
      await db.delete('subjects', id);
  },
  manageSubjectDistribution: async (newName: string, originalName: string, color: string, icon: string, targetGroupIds: string[]) => {
      const db = await initDB(true);
      const allSubjects = await db.getAll('subjects');
      
      const toDelete = allSubjects.filter(s => s.name === originalName && !targetGroupIds.includes(s.group_id));
      for (const s of toDelete) await db.delete('subjects', s.id);

      for (const gid of targetGroupIds) {
          const existing = allSubjects.find(s => s.name === originalName && s.group_id === gid);
          if (existing) {
              await db.put('subjects', { ...existing, name: newName, color_hex: color, icon_name: icon });
          } else {
              await db.put('subjects', { id: Math.random().toString(), name: newName, color_hex: color, icon_name: icon, group_id: gid });
          }
      }
  },
  getAdminStats: async () => {
      const db = await initDB(true);
      const users = await db.count('profiles');
      const groups = await db.count('groups');
      const files = await db.count('files');
      return { users, groups, files, storage: 'Mock' };
  },
  claimAdminAccess: async (key: string) => {
      return key === 'demo';
  },
  pinComment: async (cid: string, isPinned: boolean) => {}
};