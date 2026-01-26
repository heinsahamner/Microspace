import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Icons } from '../../components/Icons';
import { clearSession } from '../../services/supabase';

export const Login: React.FC = () => {
    const { signIn, signInWithCredentials } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            await signIn();
        } catch (err: any) {
            setError('Erro ao iniciar login com Google. ' + (err.message || ''));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signInWithCredentials(email, password);
            if (result.success) {
                navigate('/'); 
            } else {
                setError('Email ou senha incorretos.');
            }
        } catch (err) {
            setError('Falha na conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Olá novamente!" subtitle="Sentimos sua falta. Vamos conectar você.">
            
            <div className="space-y-5">
                {error && (
                    <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-medium flex flex-col gap-1.5 animate-in shake">
                        <div className="flex items-center gap-2">
                            <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={clearSession} 
                            className="underline hover:text-red-800 dark:hover:text-red-200 text-left pl-6"
                        >
                            Corrigir erro de sessão
                        </button>
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex items-center justify-center space-x-3 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all duration-300 group"
                >
                    <Icons.Google className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Continuar com Google</span>
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200/60 dark:border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">ou</span>
                    <div className="flex-grow border-t border-gray-200/60 dark:border-white/10"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icons.Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#7900c5] transition-colors" />
                            </div>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7900c5]/50 focus:bg-white/80 dark:focus:bg-black/40 focus:border-transparent transition-all backdrop-blur-sm"
                                placeholder="Seu email"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icons.Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#7900c5] transition-colors" />
                            </div>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7900c5]/50 focus:bg-white/80 dark:focus:bg-black/40 focus:border-transparent transition-all backdrop-blur-sm"
                                placeholder="Sua senha"
                            />
                        </div>
                        <div className="flex justify-end pt-1">
                            <Link to="/forgot-password" className="text-xs font-bold text-gray-400 hover:text-[#7900c5] transition-colors">
                                Esqueceu sua senha?
                            </Link>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#7900c5] to-[#9f5fd6] hover:to-[#b27bf9] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Entrar'}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Ainda não tem uma conta?{' '}
                    <Link to="/register" className="font-bold text-[#7900c5] hover:text-[#9f5fd6] transition-colors underline decoration-2 decoration-transparent hover:decoration-[#7900c5]">
                        Criar conta
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};