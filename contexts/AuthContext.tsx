import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode, Service } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>; 
  signInWithCredentials: (e: string, p: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (e: string, p: string, u: string, g: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocalProfile = async (userId: string, fullAuthUser?: any) => {
      try {
          if (isDemoMode) {
              const groups = await Service.getGroups();
              const demoGroup = groups.find(g => g.id === 'demo-group') || groups[0];
              return { 
                  id: userId, 
                  username: 'Admin Demo', 
                  email: 'admin@demo.com', 
                  role: 'admin', 
                  group_id: demoGroup?.id || 'demo-group',
                  group: demoGroup,
                  avatar_url: null,
                  background_url: null
              } as Profile;
          }

          if (fullAuthUser && Service.ensureProfileExists) {
              const p = await Service.ensureProfileExists(fullAuthUser);
              if (p && p.group_id) {
                  const groups = await Service.getGroups();
                  p.group = groups.find(g => g.id === p.group_id);
              }
              return p;
          }
          return null;
      } catch (e) {
          console.error("AuthContext: Failed to fetch/sync local profile", e);
          return null;
      }
  };

  useEffect(() => {
    if (isDemoMode) {
        const stored = localStorage.getItem('demo_user_session');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed.user);
            Service.getGroups().then(groups => {
                const hydratedProfile = { ...parsed.profile };
                if (hydratedProfile.group_id && !hydratedProfile.group) {
                    hydratedProfile.group = groups.find((g: any) => g.id === hydratedProfile.group_id);
                }
                setProfile(hydratedProfile);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
        return;
    }

    const initializeAuth = async () => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            
            if (session?.user) {
                setUser(session.user);
                const userProfile = await fetchLocalProfile(session.user.id, session.user);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error("Auth Init Error:", error);
        } finally {
            setLoading(false);
        }
    };

    initializeAuth();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
                setUser(session.user);
                setProfile(prev => {
                    if (!prev) fetchLocalProfile(session.user.id, session.user).then(setProfile);
                    return prev; 
                });
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (isDemoMode) {
        alert("Login com Google desativado no modo DEMO.");
        return;
    }
    
    const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    });

    if (error) throw error;
  };

  const signInWithCredentials = async (email: string, pass: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode) {
        const mockUser = { id: 'user-demo', email: 'admin@demo.com' };
        const groups = await Service.getGroups();
        const demoGroup = groups.find(g => g.id === 'demo-group') || { id: 'demo-group', name: 'Turma Demo', academic_year: 2026, slug: 'demo', icon_name: 'users' };
        const mockProfile = { 
            id: 'user-demo', username: 'Admin Demo', role: 'admin', group_id: demoGroup.id, group: demoGroup,
            followers_count: 120, following_count: 15, bio: 'Conta de demonstração.', avatar_url: null, background_url: null
        };
        setUser(mockUser);
        setProfile(mockProfile as Profile);
        localStorage.setItem('demo_user_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
        return { success: true };
    } else {
        const { data, error } = await supabase!.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        
        if (data.user) {
            const p = await fetchLocalProfile(data.user.id, data.user);
            setProfile(p);
        }
        
        return { success: true };
    }
  };

  const signUp = async (email: string, pass: string, username: string, groupId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      if (isDemoMode) return { success: true };
      
      const { data, error } = await supabase!.auth.signUp({
          email, 
          password: pass,
          options: { 
              data: { full_name: username, group_id: groupId } 
          } 
      });
      
      if (error) return { success: false, error: error.message };
      
      if (data.user) {
          await fetchLocalProfile(data.user.id, data.user);
      }

      if (data.user && !data.session) return { success: true, message: 'check_email' };
      return { success: true };
  };

  const signOut = async () => {
    if (isDemoMode) {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('demo_user_session');
    } else {
        await supabase!.auth.signOut();
        setUser(null);
        setProfile(null);
    }
  };

  const resetPassword = async (email: string) => {
      if (isDemoMode) return { success: true };
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithCredentials, signUp, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};