export type Role = 'student' | 'teacher' | 'admin';
export type Category = 'summary' | 'activity' | 'assessment';
export type SourceType = 'community' | 'official';
export type InteractionType = 'like' | 'backpack';

export interface Group {
  id: string;
  name: string;
  slug: string;
  academic_year: number;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  background_url: string | null;
  bio: string | null;
  role: Role;
  group_id: string | null;
  followers_count: number;
  following_count: number;
  group?: Group; 
  is_following?: boolean;
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

export interface FileData {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null; 
  file_type: string | null;
  size_bytes: number | null;
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
}

export interface Interaction {
  id: string;
  user_id: string;
  file_id: string;
  type: InteractionType;
}

export interface TabItem {
  id: Category;
  label: string;
}

export type Theme = 'light' | 'dark';