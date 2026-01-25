import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Service } from '../../services/supabase';
import { Group } from '../../types';
import { Icons } from '../../components/Icons';

export const Register: React.FC = () => {
    const { signUp } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    
    const [groups, setGroups] = useState<Group[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMode, setSuccessMode] = useState(false);

    useEffect(() => {
        Service.getGroups().then(setGroups).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!selectedGroup) {
            setError('Por favor, selecione sua turma.');
            return;
        }

        setLoading(true);
        try {
            const result = await signUp(email, password, username, selectedGroup);
            
            if (!result.success) {
                setError(result.error || 'Erro ao criar conta.');
            } else if (result.message === 'check_email') {
                setSuccessMode(true);
            }
        } catch (err) {
            setError('Ocorreu um erro ao tentar registrar.');
        } finally {
            setLoading(false);
        }
    };

    if (successMode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black p-6">
                <div className="w-full max-w-sm bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce">
                        <Icons.BadgeCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifique seu email!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Enviamos um link mágico para <b>{email}</b>. <br/>Clique nele para ativar sua conta e acessar a turma.
                    </p>
                    <Link 
                        to="/login"
                        className="block w-full bg-[#7900c5] text-white font-bold py-3.5 rounded-xl hover:bg-[#60009e] transition-colors shadow-lg shadow-purple-500/20"
                    >
                        Voltar para Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout title="Crie sua conta" subtitle="Junte-se à sua turma e comece a colaborar.">
            
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-center space-x-3 animate-in shake">
                        <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Nome Completo</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Icons.User className="h-5 w-5 text-gray-400 group-focus-within:text-[#7900c5] transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] focus:bg-white dark:focus:bg-black transition-all"
                            placeholder="Ex: João Silva"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Email Escolar</label>
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
                            placeholder="joao@aluno.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Sua Turma</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icons.Users className="h-5 w-5 text-gray-400 group-focus-within:text-[#7900c5] transition-colors" />
                            </div>
                            <select 
                                required
                                value={selectedGroup}
                                onChange={e => setSelectedGroup(e.target.value)}
                                className="w-full pl-11 pr-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5] focus:bg-white dark:focus:bg-black transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Selecione...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Icons.Dynamic name="chevron-down" className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Senha</label>
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
                                placeholder="Mín. 6 caracteres"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Criar Conta Gratuita'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Já tem cadastro?{' '}
                    <Link to="/login" className="font-bold text-[#7900c5] hover:text-[#60009e] transition-colors">
                        Fazer login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};