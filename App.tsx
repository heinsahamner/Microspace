import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TopBar } from './components/layout/TopBar';
import { MobileNav } from './components/layout/MobileNav';
import { Service } from './services/supabase';
import { Group } from './types';

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

const LoginScreen = () => {
    const { signInWithCredentials, signUp } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isRegistering && groups.length === 0) {
            Service.getGroups().then(setGroups);
        }
    }, [isRegistering, groups.length]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const success = await signInWithCredentials(email, password, rememberMe);
        if (!success) {
            setError('Credenciais inválidas.');
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        if (!selectedGroup) {
            setError('Por favor, selecione sua turma.');
            setLoading(false);
            return;
        }

        const success = await signUp(regEmail, regPassword, regUsername, selectedGroup, rememberMe);
        if (!success) {
             setError('Erro ao criar conta.');
             setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-6 transition-colors duration-200">
            <div className="w-20 h-20 bg-[#7900c5] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-200 dark:shadow-purple-900/30">
                 <span className="text-white text-4xl font-bold">M</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Microspace</h1>
            <p className="text-center text-gray-500 dark:text-gray-400 max-w-xs mb-8">
                Central de materiais acadêmicos.
            </p>

            <div className="w-full max-w-sm mb-6 flex rounded-xl bg-gray-100 dark:bg-gray-900 p-1">
                <button 
                    onClick={() => setIsRegistering(false)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Entrar
                </button>
                <button 
                    onClick={() => setIsRegistering(true)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Criar Conta
                </button>
            </div>

            {!isRegistering ? (
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">EMAIL</label>
                        <input 
                            type="email" 
                            placeholder="seu@email.com" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">SENHA</label>
                        <input 
                            type="password" 
                            placeholder="Sua senha" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2 py-1">
                        <input 
                            type="checkbox" 
                            id="remember"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#7900c5] focus:ring-[#7900c5]" 
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-300">Lembrar de mim</label>
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#7900c5] text-white font-bold py-3 rounded-xl hover:bg-[#60009e] transition-colors shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4 mb-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">EMAIL</label>
                        <input 
                            type="email" 
                            placeholder="seu@email.com" 
                            value={regEmail}
                            onChange={e => setRegEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                            required
                        />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">NOME DE USUÁRIO</label>
                        <input 
                            type="text" 
                            placeholder="Como quer ser chamado?" 
                            value={regUsername}
                            onChange={e => setRegUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                         <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">SUA TURMA</label>
                         <select 
                            value={selectedGroup}
                            onChange={e => setSelectedGroup(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                            required
                        >
                            <option value="">Selecione...</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">SENHA</label>
                        <input 
                            type="password" 
                            placeholder="Crie uma senha" 
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5]"
                            required
                        />
                    </div>

                    <div className="flex items-center space-x-2 py-1">
                        <input 
                            type="checkbox" 
                            id="rememberReg"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#7900c5] focus:ring-[#7900c5]" 
                        />
                        <label htmlFor="rememberReg" className="text-sm text-gray-600 dark:text-gray-300">Lembrar de mim</label>
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#7900c5] text-white font-bold py-3 rounded-xl hover:bg-[#60009e] transition-colors shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50"
                    >
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                    </button>
                </form>
            )}
        </div>
    );
}

const MainLayout = ({ children }: { children: React.ReactNode }) => {
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
        return <LoginScreen />;
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

const App: React.FC = () => {
  return (
    <AuthProvider>
        <Router>
            <Routes>
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
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;