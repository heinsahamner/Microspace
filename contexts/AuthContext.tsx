import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient, dbClient, isDemoMode, Service, setDbToken } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>; // OAuth Google via Cloud
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

  // --- 1. Helper: Fetch Profile from Local DB ---
  const fetchLocalProfile = async (userId: string, fullAuthUser?: any) => {
      try {
          if (isDemoMode) {
              // Retrieve specific seeded demo user
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

          // Use the Service to ensure sync between Cloud Auth ID and Local DB Profile
          if (fullAuthUser && Service.ensureProfileExists) {
              const p = await Service.ensureProfileExists(fullAuthUser);
              
              // We need to attach the Group object for UI display
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
    // --- DEMO MODE HANDLER ---
    if (isDemoMode) {
        const stored = localStorage.getItem('demo_user_session');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser(parsed.user);
            // Re-hydrate group data if missing in storage but present in DB
            Service.getGroups().then(groups => {
                const hydratedProfile = { ...parsed.profile };
                if (hydratedProfile.group_id && !hydratedProfile.group) {
                    hydratedProfile.group = groups.find((g: any) => g.id === hydratedProfile.group_id);
                }
                setProfile(hydratedProfile);
            });
        }
        setLoading(false);
        return;
    }

    // --- REAL MODE (Cloud Auth + Local DB) ---
    
    // 1. Check active Cloud session
    const checkSession = async () => {
        try {
            const { data: { session } } = await authClient!.auth.getSession();
            if (session?.user) {
                // CRITICAL: Inject Cloud Token into Local DB Client
                setDbToken(session.access_token);
                
                setUser(session.user);
                // SYNC: Cloud ID -> Local DB
                const userProfile = await fetchLocalProfile(session.user.id, session.user);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error("AuthContext: Session check failed", error);
        } finally {
            setLoading(false);
        }
    };

    checkSession();

    // 2. Listen for Auth Changes (Cloud)
    const { data: { subscription } } = authClient!.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            // CRITICAL: Inject Cloud Token into Local DB Client
            setDbToken(session.access_token);

            setUser(session.user);
            // Sync on login/token refresh
            const userProfile = await fetchLocalProfile(session.user.id, session.user);
            setProfile(userProfile);
        } else {
            // Remove token when signed out
            setDbToken(null);
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- ACTIONS ---

  const signIn = async () => {
    if (isDemoMode) {
        // Mock Login - ALWAYS LOGIN AS THE SEEDED ADMIN USER
        const mockUser = { id: 'user-demo', email: 'admin@demo.com' };
        
        const groups = await Service.getGroups();
        const demoGroup = groups.find(g => g.id === 'demo-group') || { id: 'demo-group', name: 'Turma Demo', academic_year: 2024, slug: 'demo', icon_name: 'users' };

        const mockProfile = { 
            id: 'user-demo', 
            username: 'Admin Demo', 
            role: 'admin', 
            group_id: demoGroup.id,
            group: demoGroup,
            followers_count: 120, 
            following_count: 15, 
            bio: 'Conta de demonstração.',
            avatar_url: null,
            background_url: null
        };
        
        setUser(mockUser);
        setProfile(mockProfile as Profile);
        localStorage.setItem('demo_user_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
    } else {
        // Cloud Login
        await authClient!.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    }
  };

  const signInWithCredentials = async (email: string, pass: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode) {
        // Reuse general mock login logic for consistency
        await signIn();
        return { success: true };
    } else {
        // Cloud Login
        const { error } = await authClient!.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        return { success: true };
    }
  };

  const signUp = async (email: string, pass: string, username: string, groupId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      if (isDemoMode) {
          return { success: true };
      } else {
          // Cloud Signup
          const { data, error } = await authClient!.auth.signUp({
              email, 
              password: pass,
              options: { 
                  data: { full_name: username, group_id: groupId } // Meta stored in Cloud Auth
              } 
          });
          
          if (error) return { success: false, error: error.message };
          
          // Force Sync immediately if session exists
          if (data.user) {
              if (data.session) setDbToken(data.session.access_token);
              await fetchLocalProfile(data.user.id, data.user);
          }

          if (data.user && !data.session) return { success: true, message: 'check_email' };
          return { success: true };
      }
  };

  const signOut = async () => {
    if (isDemoMode) {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('demo_user_session');
    } else {
        await authClient!.auth.signOut();
    }
  };

  const resetPassword = async (email: string) => {
      if (isDemoMode) return { success: true };
      const { error } = await authClient!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    } else if (user) {
        // Allow updating even if profile was previously null (e.g. fresh onboarding)
        setProfile({
            id: user.id,
            username: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email,
            role: 'student',
            group_id: updates.group_id || null,
            followers_count: 0,
            following_count: 0,
            avatar_url: null,
            background_url: null,
            bio: null,
            ...updates
        } as Profile);
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