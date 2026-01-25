
export type Role = 'student' | 'teacher' | 'admin';
export type Category = 'summary' | 'activity' | 'assessment';
export type SourceType = 'community' | 'official';
export type InteractionType = 'like' | 'backpack';

export interface Group {
  id: string;
  name: string;
  slug: string;
  academic_year: number;
  icon_name?: string;
}

export interface Profile {
  id: string;
  username: string;
  email?: string; 
  avatar_url: string | null;
  background_url: string | null;
  bio: string | null;
  role: Role;
  group_id: string | null;
  followers_count: number;
  following_count: number;
  group?: Group; 
  is_following?: boolean;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  color_hex: string;
  icon_name: string; 
  group_id: string;
  file_count?: number;
}

export interface Comment {
    id: string;
    file_id: string;
    user_id: string;
    content: string;
    created_at: string;
    likes_count: number;
    is_deleted: boolean;
    is_pinned?: boolean;
    parent_id?: string | null;
    user?: Profile;
    isLiked?: boolean;
    replies?: Comment[];
}

export interface FileAttachment {
    url: string;
    name: string;
    type: string;
    size: number;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    id: string;
    file_id: string;
    question: string;
    options: PollOption[];
    total_votes: number;
    user_vote_option_id?: string | null;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
}

export interface FlashcardDeck {
    id: string;
    subject_id: string;
    title: string;
    creator_id: string;
    cards_count: number;
    cards?: Flashcard[];
}

export interface FileData {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  size_bytes: number | null;
  attachments?: FileAttachment[];
  uploader_id: string;
  subject_id: string;
  target_group_id: string; 
  category: Category;
  source_type: SourceType;
  year_reference: number | null;
  views_count: number;
  likes_count: number; 
  comments_count: number;
  created_at: string;
  uploader?: Profile; 
  subject?: Subject; 
  isLiked?: boolean; 
  isSaved?: boolean;
  poll?: Poll | null;
}

export interface Interaction {
  id: string;
  user_id: string;
  file_id: string;
  type: InteractionType;
}

export interface Feedback {
    id: string;
    user_id: string;
    content: string;
    include_logs: boolean;
    status: 'open' | 'resolved';
    created_at: string;
    user?: Profile;
}

export interface TabItem {
  id: Category | 'flashcards';
  label: string;
}

export type Theme = 'light' | 'dark';
