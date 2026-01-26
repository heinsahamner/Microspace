import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Icons } from '../../components/Icons';
import { clearSession } from '../../services/supabase';

export const Login: React.FC = () => {
    const { signInWithCredentials } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <AuthLayout title="Acesse sua conta" subtitle="Bem-vindo de volta! Por favor, insira seus dados.">
            
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex flex-col gap-2 animate-in shake">
                        <div className="flex items-center space-x-3">
                            <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={clearSession} 
                            className="text-xs font-bold underline hover:text-red-800 dark:hover:text-red-200 text-left pl-8"
                        >
                            Resetar site e Cache (Correção de Erros)
                        </button>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icons.Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#7900c5] transition-colors" />
                        </div>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] focus:bg-white dark:focus:bg-black transition-all"
                            placeholder="valentina@eccard.miller"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Senha</label>
                        <Link to="/forgot-password" className="text-xs font-bold text-[#7900c5] hover:underline">
                            Esqueceu a senha?
                        </Link>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icons.Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#7900c5] transition-colors" />
                        </div>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] focus:bg-white dark:focus:bg-black transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Entrar na conta'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Não tem uma conta?{' '}
                    <Link to="/register" className="font-bold text-[#7900c5] hover:text-[#60009e] transition-colors">
                        Cadastre-se grátis
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};