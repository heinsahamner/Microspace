import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TopBar } from './components/layout/TopBar';
import { MobileNav } from './components/layout/MobileNav';

import { Dashboard } from './pages/Dashboard';
import { SubjectsPage } from './pages/Subjects';
import { SubjectDetail } from './pages/SubjectDetail';
import { FeedPage } from './pages/Feed';
import { Upload } from './pages/Upload';
import { Backpack } from './pages/Backpack';
import { Onboarding } from './pages/Onboarding';
import { UserProfile } from './pages/UserProfile';
import { EditProfile } from './pages/EditProfile';
import { AdminPanel } from './pages/AdminPanel';
import { AdminClaim } from './pages/AdminClaim';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200 pb-20 md:pb-0">
            <TopBar />
            <main className="pb-8">
                {children}
            </main>
            <MobileNav />
        </div>
    );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { user, profile, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-500">Carregando...</div>;
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!profile?.group_id) {
        return <Onboarding />;
    }

    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-500">Carregando...</div>;
    if (user) return <Navigate to="/" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <Router>
            <Routes>
                <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
                <Route path="/subject/:id" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><FeedPage type="community" /></ProtectedRoute>} />
                <Route path="/official" element={<ProtectedRoute><FeedPage type="official" /></ProtectedRoute>} />
                <Route path="/backpack" element={<ProtectedRoute><Backpack /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                <Route path="/u/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="/claim-admin" element={<ProtectedRoute><AdminClaim /></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;