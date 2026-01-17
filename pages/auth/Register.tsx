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
            } else {
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
                <div className="w-full max-w-sm bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <Icons.BadgeCheck className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifique seu email!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Enviamos um link de confirmação para <b>{email}</b>. Clique no link para ativar sua conta.
                    </p>
                    <Link 
                        to="/login"
                        className="block w-full bg-[#7900c5] text-white font-bold py-3 rounded-xl hover:bg-[#60009e] transition-colors"
                    >
                        Voltar para Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Criar nova conta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center space-x-2">
                        <Icons.AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Nome de Usuário</label>
                    <input 
                        type="text" 
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-all"
                        placeholder="Como quer ser chamado?"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Sua Turma</label>
                    <select 
                        required
                        value={selectedGroup}
                        onChange={e => setSelectedGroup(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-all appearance-none"
                    >
                        <option value="">Selecione...</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-all"
                        placeholder="seu@email.com"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 uppercase">Senha</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#181818] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7900c5] transition-all"
                        placeholder="Crie uma senha forte"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7900c5] text-white font-bold py-3 rounded-xl hover:bg-[#60009e] transition-all shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50 flex justify-center items-center mt-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Criar Conta'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-bold text-[#7900c5] hover:underline">
                        Fazer login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};