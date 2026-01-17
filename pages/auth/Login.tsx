import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Icons } from '../../components/Icons';

export const Login: React.FC = () => {
    const { signInWithCredentials } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signInWithCredentials(email, password, rememberMe);
            if (result.success) {
                navigate('/'); 
            } else {
                setError('Email ou senha inválidos.');
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Entrar na sua conta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center space-x-2">
                        <Icons.AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icons.Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Senha</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icons.Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                
                <div className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id="remember"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#7900c5] focus:ring-[#7900c5]" 
                        />
                        <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">Lembrar de mim</label>
                    </div>
                    <Link to="/forgot-password" className="text-sm font-bold text-[#7900c5] hover:underline">
                        Esqueceu?
                    </Link>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7900c5] text-white font-bold py-3 rounded-xl hover:bg-[#60009e] transition-all shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50 flex justify-center items-center"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Entrar'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="font-bold text-[#7900c5] hover:underline">
                        Criar agora
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};