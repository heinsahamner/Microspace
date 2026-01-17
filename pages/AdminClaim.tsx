import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Icons } from '../components/Icons';

export const AdminClaim: React.FC = () => {
    const { profile, refreshProfile } = useAuth();
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
                await refreshProfile();
                
                setTimeout(() => {
                    navigate('/admin');
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
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Icons.Shield className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Você já é um Admin!</h2>
                <button onClick={() => navigate('/admin')} className="mt-4 text-[#7900c5] font-bold">Ir para o Painel</button>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Icons.Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso Restrito</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        Insira a Chave Mestra definida no banco de dados para elevar seus privilégios.
                    </p>
                </div>

                <form onSubmit={handleClaim} className="space-y-4">
                    <div>
                        <input 
                            type="password" 
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Chave Mestra..."
                            className="w-full text-center tracking-widest text-lg font-mono p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-[#7900c5] outline-none"
                            autoFocus
                        />
                    </div>

                    {status === 'error' && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold text-center rounded-lg animate-in shake">
                            Erro. Verifique a senha ou se o script SQL foi rodado.
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold text-center rounded-lg animate-in zoom-in">
                            Acesso Concedido! Entrando...
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={status === 'loading' || status === 'success' || !key}
                        className="w-full bg-[#7900c5] text-white font-bold py-4 rounded-xl hover:bg-[#60009e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? 'Verificando...' : 'Reivindicar Acesso'}
                    </button>
                </form>
            </div>
        </div>
    );
};