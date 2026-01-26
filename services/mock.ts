import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileData, Subject, Profile, Group, Comment, Role, Feedback, Poll, FlashcardDeck, Flashcard } from '../types';

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
  polls: { key: string; value: Poll };
  flashcard_decks: { key: string; value: FlashcardDeck };
  flashcards: { key: string; value: Flashcard & { deck_id: string } };
  subject_representatives: { key: string; value: { id: string; user_id: string; subject_id: string } };
}

let dbPromise: Promise<IDBPDatabase<MicrospaceDB>>;

export const initDB = async (shouldSeed: boolean = false) => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<MicrospaceDB>('microspace-db', 7, { 
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
      if (!db.objectStoreNames.contains('polls')) db.createObjectStore('polls', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('flashcard_decks')) db.createObjectStore('flashcard_decks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('flashcards')) db.createObjectStore('flashcards', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('subject_representatives')) db.createObjectStore('subject_representatives', { keyPath: 'id' });
    },
  });

  if (shouldSeed) {
      const db = await dbPromise;
      const groupsCount = await db.count('groups');
      
      if (groupsCount === 0) {
          console.log("🌱 Seeding Demo Data...");
          const demoGroupId = 'demo-group';
          await db.put('groups', { id: demoGroupId, name: 'Turma Demo 2024', slug: 'demo-2024', academic_year: 2024, icon_name: 'users' });
          await db.put('subjects', { id: 'sub-math', name: 'Matemática', color_hex: '#3b82f6', icon_name: 'calculator', group_id: demoGroupId });
          await db.put('subjects', { id: 'sub-hist', name: 'História', color_hex: '#f59e0b', icon_name: 'book', group_id: demoGroupId });
          await db.put('profiles', { id: 'user-demo', username: 'Admin Demo', email: 'admin@demo.com', role: 'admin', group_id: demoGroupId, followers_count: 120, following_count: 15, bio: 'Conta de demonstração.', avatar_url: null, background_url: null });
          
          const fileId = 'file-demo-poll';
          await db.put('files', {
              id: fileId,
              title: 'Qual o melhor método?',
              description: 'Votem abaixo no método de estudo preferido da turma.',
              file_url: '#', file_type: 'text', size_bytes: 0,
              uploader_id: 'user-demo', subject_id: 'sub-math', target_group_id: demoGroupId, category: 'activity', source_type: 'community', year_reference: 2024, views_count: 10, likes_count: 2, comments_count: 0, created_at: new Date().toISOString()
          });
          await db.put('polls', {
              id: 'poll-1',
              file_id: fileId,
              question: 'Qual método você prefere?',
              total_votes: 3,
              options: [
                  { id: 'opt-1', text: 'Pomodoro', votes: 2 },
                  { id: 'opt-2', text: 'Resumos', votes: 1 },
                  { id: 'opt-3', text: 'Flashcards', votes: 0 }
              ]
          });
      }
  }
  return dbPromise;
};

export const MockService = {
  _delay: async () => new Promise(resolve => setTimeout(resolve, 300)),

  ensureProfileExists: async (user: any) => {
      const db = await initDB(true);
      const existing = await db.get('profiles', user.id);
      if (existing) return existing;
      const newProfile: Profile = { id: user.id, username: user.email.split('@')[0], email: user.email, role: 'student', group_id: null, avatar_url: null, background_url: null, bio: '', followers_count: 0, following_count: 0 };
      await db.put('profiles', newProfile);
      return newProfile;
  },
  getGroups: async () => (await initDB(true)).getAll('groups'),
  getSubjects: async (groupId: string) => {
      const db = await initDB(true);
      const allSubjects = await db.getAll('subjects');
      const allFiles = await db.getAll('files');
      return allSubjects.filter(s => s.group_id === groupId).map(s => ({ ...s, file_count: allFiles.filter(f => f.subject_id === s.id).length }));
  },
  getAllSubjects: async () => (await initDB(true)).getAll('subjects'),
  
  getFiles: async (subjectId: string | null, category: string, sourceType: string, groupId: string | null, currentUserId: string) => {
      const db = await initDB(true);
      let files = await db.getAll('files');
      if (groupId) files = files.filter(f => f.target_group_id === groupId);
      if (subjectId) files = files.filter(f => f.subject_id === subjectId);
      if (category !== 'all') files = files.filter(f => f.category === category);
      if (sourceType !== 'all') files = files.filter(f => f.source_type === sourceType);

      const polls = await db.getAll('polls');
      const allReps = await db.getAll('subject_representatives');

      const enriched = await Promise.all(files.map(async f => {
          const uploader = await db.get('profiles', f.uploader_id);
          const subject = await db.get('subjects', f.subject_id);
          const allLikes = await db.getAll('likes');
          const fileLikes = allLikes.filter(l => l.file_id === f.id);
          const isLiked = fileLikes.some(l => l.user_id === currentUserId);
          const allComments = await db.getAll('comments');
          const commentsCount = allComments.filter(c => c.file_id === f.id && !c.is_deleted).length;
          const savedFile = await db.get('backpack_saves', f.id);
          const poll = polls.find(p => p.file_id === f.id);

          let author_role: 'teacher' | 'monitor' | 'representative' | null = null;
          if (subject) {
              if (subject.teacher_id === f.uploader_id) {
                  author_role = 'teacher';
              } else if (subject.monitor_id === f.uploader_id) {
                  author_role = 'monitor';
              } else {
                  const isRep = allReps.some(r => r.user_id === f.uploader_id && r.subject_id === f.subject_id);
                  if (isRep) author_role = 'representative';
              }
          }

          return { ...f, uploader, subject, likes_count: fileLikes.length, comments_count: commentsCount, isLiked, isSaved: !!savedFile, poll, author_role };
      }));
      return enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getFile: async (fileId: string) => {
      const db = await initDB(true);
      const file = await db.get('files', fileId);
      if (!file) return null;
      const uploader = await db.get('profiles', file.uploader_id);
      const subject = await db.get('subjects', file.subject_id);
      return { ...file, uploader, subject };
  },

  uploadFile: async (files: File[], meta: any, pollData?: { question: string, options: string[] }) => {
      const db = await initDB(true);
      const fileId = Math.random().toString(36).substr(2, 9);
      const newFile: FileData = {
          id: fileId,
          ...meta,
          file_url: '#',
          file_type: files[0]?.type || 'unknown',
          size_bytes: files[0]?.size || 0,
          created_at: new Date().toISOString(),
          views_count: 0,
          likes_count: 0,
          comments_count: 0,
          attachments: files.map(f => ({ name: f.name, size: f.size, type: f.type, url: '#' }))
      };
      await db.put('files', newFile);

      if (pollData) {
          const newPoll: Poll = {
              id: Math.random().toString(36),
              file_id: fileId,
              question: pollData.question,
              total_votes: 0,
              options: pollData.options.map(opt => ({ id: Math.random().toString(36), text: opt, votes: 0 }))
          };
          await db.put('polls', newPoll);
      }
      return true;
  },

  votePoll: async (pollId: string, optionId: string, userId: string) => {
      const db = await initDB(true);
      const poll = await db.get('polls', pollId);
      if (poll && !poll.user_vote_option_id) {
          const optIndex = poll.options.findIndex(o => o.id === optionId);
          if (optIndex >= 0) {
              poll.options[optIndex].votes++;
              poll.total_votes++;
              poll.user_vote_option_id = optionId; 
              await db.put('polls', poll);
          }
      }
  },

  updateSubject: async (id: string, updates: any) => { 
      const db = await initDB(true); 
      const s = await db.get('subjects', id); 
      if(s) await db.put('subjects', {...s, ...updates}); 
  },

  createSubject: async (name: string, color: string, icon: string, groupId: string, monitorId?: string, teacherId?: string) => {
      const db = await initDB(true);
      await db.put('subjects', {
          id: Math.random().toString(36),
          name, color_hex: color, icon_name: icon, group_id: groupId,
          monitor_id: monitorId, teacher_id: teacherId
      });
  },

  getSubjectRepresentatives: async (subjectId: string) => {
      const db = await initDB(true);
      const reps = await db.getAll('subject_representatives');
      return reps.filter(r => r.subject_id === subjectId).map(r => r.user_id);
  },

  manageRepresentative: async (userId: string, subjectId: string, isAdding: boolean) => {
      const db = await initDB(true);
      const allReps = await db.getAll('subject_representatives');
      const existing = allReps.find(r => r.user_id === userId && r.subject_id === subjectId);
      
      if (isAdding && !existing) {
          await db.put('subject_representatives', { id: Math.random().toString(36), user_id: userId, subject_id: subjectId });
      } else if (!isAdding && existing) {
          await db.delete('subject_representatives', existing.id);
      }
  },

  getUserProfile: async (userId: string, currentUserId: string) => {
      const db = await initDB(true);
      const profile = await db.get('profiles', userId);
      if (!profile) return null;

      const titles = [];
      const subjects = await db.getAll('subjects');
      
      const monitorSubjects = subjects.filter(s => s.monitor_id === userId);
      monitorSubjects.forEach(s => titles.push({ type: 'monitor', subject_id: s.id, subject_name: s.name }));

      const allReps = await db.getAll('subject_representatives');
      const repEntries = allReps.filter(r => r.user_id === userId);
      repEntries.forEach(r => {
          const sub = subjects.find(s => s.id === r.subject_id);
          if (sub) titles.push({ type: 'representative', subject_id: sub.id, subject_name: sub.name });
      });

      const posts = await MockService.getFiles(null, 'all', 'all', null, userId); 
      
      const enrichedProfile = { ...profile, titles, is_following: false }; 
      return { profile: enrichedProfile, posts: posts.filter((p: any) => p.uploader_id === userId) };
  },

  updateFile: async (fileId: string, updates: Partial<FileData>) => { const db = await initDB(true); const f = await db.get('files', fileId); if(f) await db.put('files', {...f, ...updates}); },
  deleteFile: async (fileId: string) => { const db = await initDB(true); await db.delete('files', fileId); await db.delete('backpack_saves', fileId); },
  toggleLike: async (fileId: string, userId: string) => { const db = await initDB(true); const all = await db.getAll('likes'); const ex = all.find(l => l.file_id === fileId && l.user_id === userId); if(ex) { await db.delete('likes', ex.id); return false; } else { await db.put('likes', { id: Math.random().toString(), file_id: fileId, user_id: userId }); return true; } },
  getComments: async (fileId: string, currentUserId: string) => { const db = await initDB(true); const all = await db.getAll('comments'); return all.filter(c => c.file_id === fileId).map(c => ({...c, likes_count: 0})).sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime()); },
  addComment: async (fileId: string, userId: string, content: string, parentId?: string) => { const db = await initDB(true); const c = { id: Math.random().toString(), file_id: fileId, user_id: userId, content, parent_id: parentId, created_at: new Date().toISOString(), likes_count: 0, is_deleted: false }; await db.put('comments', c); return c; },
  deleteComment: async (id: string) => { const db = await initDB(true); await db.delete('comments', id); },
  toggleCommentLike: async () => true,
  updateProfile: async (userId: string, updates: any) => { const db = await initDB(true); const p = await db.get('profiles', userId); if(p) await db.put('profiles', {...p, ...updates}); },
  toggleFollow: async () => true,
  getFollowedPosts: async () => [],
  getUserStats: async () => ({ likesReceived: 0, commentsReceived: 0, uploadsCount: 0 }),
  uploadProfileImage: async () => "https://via.placeholder.com/150",
  getSavedFiles: async () => [],
  toggleSave: async () => true,
  sendFeedback: async () => {},
  getFeedbacks: async () => [],
  resolveFeedback: async () => {},
  createGroup: async () => {},
  updateGroup: async () => {},
  deleteGroup: async () => {},
  updateUserRole: async () => {},
  updateUserGroup: async () => {},
  deleteUser: async () => {},
  getAllUsers: async () => (await initDB(true)).getAll('profiles'),
  deleteSubject: async () => {},
  manageSubjectDistribution: async () => {},
  getAdminStats: async () => ({ users: 0, groups: 0, files: 0, storage: 'Mock' }),
  claimAdminAccess: async () => true,
  pinComment: async () => {},
  getFlashcardDecks: async () => [],
  getDeckCards: async () => [],
  createFlashcardDeck: async () => {},
  updateFlashcardDeck: async () => {},
  deleteFlashcardDeck: async () => {}
};