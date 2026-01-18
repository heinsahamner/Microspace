import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/Icons';

export const AdminClaim: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [key, setKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        
        try {
            const success = await Service.claimAdminAccess(key);
            
            if (success) {
                setStatus('success');
                setTimeout(() => {
                   window.location.href = '/admin';
                }, 1000);
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    if (profile?.role === 'admin') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-10 text-center max-w-sm w-full border border-green-100 dark:border-green-900/30 shadow-xl">
                     <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                        <Icons.Shield className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso Confirmado</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Você já possui privilégios de administrador.</p>
                    <button 
                        onClick={() => navigate('/admin')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                        <Icons.Settings className="w-5 h-5" />
                        Abrir Painel Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
            <div className="max-w-md w-full bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-gray-200 dark:shadow-none transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Icons.Lock className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">System Admin</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Digite a chave mestra para elevar seus privilégios de acesso.
                    </p>
                </div>

                <form onSubmit={handleClaim} className="space-y-6">
                    <div className="relative group">
                        <input 
                            type="password" 
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="CHAVE-MESTRA"
                            className="w-full text-center tracking-[0.5em] text-xl font-bold font-mono p-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black text-gray-900 dark:text-white focus:border-[#7900c5] focus:ring-0 outline-none transition-all uppercase placeholder-gray-300"
                            autoFocus
                        />
                        <div className="absolute inset-0 rounded-2xl ring-4 ring-[#7900c5]/10 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold text-center rounded-xl animate-in shake border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2">
                            <Icons.AlertCircle className="w-4 h-4" />
                            Acesso Negado. Chave inválida.
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold text-center rounded-xl animate-in zoom-in border border-green-100 dark:border-green-900/30">
                            Autenticado. Redirecionando...
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={status === 'loading' || status === 'success' || !key}
                        className="w-full bg-[#7900c5] text-white font-bold py-4 rounded-2xl hover:bg-[#60009e] transition-all shadow-xl shadow-purple-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
                    >
                        {status === 'loading' ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Verificando Credenciais...</span>
                            </>
                        ) : 'Liberar Acesso Total'}
                    </button>
                </form>
                
                <div className="mt-8 text-center">
                    <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm font-medium">Cancelar e voltar</button>
                </div>
            </div>
        </div>
    );
};