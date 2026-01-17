import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import { Icons } from '../../components/Icons';

export const ForgotPassword: React.FC = () => {
    const { resetPassword } = useAuth();
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const result = await resetPassword(email);
            if (result.success) {
                setMessage({ type: 'success', text: 'Se o email existir, enviamos um link de recuperação.' });
                setEmail('');
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao enviar email.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Ocorreu um erro inesperado.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Recuperar Senha</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Digite seu email para receber o link de redefinição.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                    <div className={`p-3 rounded-lg text-sm flex items-center space-x-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                        {message.type === 'success' ? <Icons.BadgeCheck className="w-4 h-4" /> : <Icons.AlertCircle className="w-4 h-4" />}
                        <span>{message.text}</span>
                    </div>
                )}

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

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7900c5] text-white font-bold py-3 rounded-xl hover:bg-[#60009e] transition-all shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50 flex justify-center items-center"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Enviar Link'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                    Voltar para Login
                </Link>
            </div>
        </AuthLayout>
    );
};