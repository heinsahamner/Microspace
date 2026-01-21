import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Icons } from '../../components/Icons';

export const Login: React.FC = () => {
    const { signInWithCredentials, signIn } = useAuth();
    const navigate = useNavigate();
    
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
            
            {/* Social Login */}
            <button 
                onClick={signIn}
                className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all mb-6 group"
            >
                <Icons.Google className="w-5 h-5 text-gray-600 dark:text-white group-hover:scale-110 transition-transform" />
                <span>Entrar com Google</span>
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-black px-2 text-gray-400 font-bold tracking-wider">Ou entre com email</span>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-center space-x-3 animate-in shake">
                        <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
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
                            placeholder="aluno@escola.com"
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