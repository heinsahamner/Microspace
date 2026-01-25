import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Service } from '../services/supabase';
import { Icons } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

const usePreferences = () => {
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('microspace_preferences');
        return saved ? JSON.parse(saved) : {
            notifications_push: true,
            notifications_mentions: true,
            reduced_motion: false,
            privacy_mode: false,
        };
    });

    const toggle = (key: string) => {
        const newState = { ...preferences, [key]: !preferences[key] };
        setPreferences(newState);
        localStorage.setItem('microspace_preferences', JSON.stringify(newState));
        return newState[key];
    };

    return { preferences, toggle };
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-8 px-2">
        {title}
    </h3>
);

const SettingItem: React.FC<{ 
    icon: any; 
    label: string; 
    subLabel?: string; 
    onClick?: () => void;
    action?: React.ReactNode;
    isDestructive?: boolean;
    disabled?: boolean;
}> = ({ icon: Icon, label, subLabel, onClick, action, isDestructive, disabled }) => (
    <div 
        onClick={!disabled ? onClick : undefined}
        className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-200 border border-transparent ${
            disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : onClick 
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-100 dark:hover:border-gray-800' 
                    : ''
        }`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg transition-colors ${
                isDestructive 
                ? 'bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 group-hover:text-primary group-hover:bg-primary/10'
            }`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className={`text-sm font-bold ${isDestructive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {label}
                </p>
                {subLabel && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subLabel}</p>}
            </div>
        </div>
        {action && <div>{action}</div>}
        {onClick && !action && <Icons.Dynamic name="chevron-right" className="w-4 h-4 text-gray-400" />}
    </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-black ${
            checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
        }`}
    >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const ColorPicker: React.FC<{ current: string; onSelect: (c: string) => void }> = ({ current, onSelect }) => {
    const colors = [
        '#7900c5', '#2563eb', '#059669', '#dc2626', '#d946ef', '#ea580c', '#000000'
    ];

    return (
        <div className="flex gap-2">
            {colors.map(c => (
                <button
                    key={c}
                    onClick={(e) => { e.stopPropagation(); onSelect(c); }}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                        current === c ? 'border-gray-900 dark:border-white scale-125 ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-700' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    );
};

const SettingsModal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; action?: React.ReactNode }> = ({ title, children, onClose, action }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Icons.X className="w-5 h-5 text-gray-500" />
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
            {action && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    {action}
                </div>
            )}
        </div>
    </div>
);

export const Settings: React.FC = () => {
    const { profile, updateProfile, signOut } = useAuth();
    const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
    const { addToast } = useToast();
    const { preferences, toggle } = usePreferences();
    const navigate = useNavigate();
    
    const [modalOpen, setModalOpen] = useState<'password' | 'delete' | 'support' | null>(null);
    
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [feedbackContent, setFeedbackContent] = useState('');
    const [includeLogs, setIncludeLogs] = useState(true);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const [adminKey, setAdminKey] = useState('');
    const [claimStatus, setClaimStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleToggle = (key: string, label: string) => {
        const val = toggle(key);
        addToast(`${label} ${val ? 'ativado' : 'desativado'}`, 'info');
    };

    const handleClearCache = () => {
        if(window.confirm('Isso limpará dados temporários e recarregará o site. Continuar?')) {
            localStorage.clear();
            localStorage.setItem('theme', theme);
            localStorage.setItem('accentColor', accentColor);
            window.location.reload();
        }
    };

    const handleExportData = () => {
        const data = {
            profile,
            preferences,
            timestamp: new Date().toISOString(),
            app_version: '0.7.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `microspace-data-${profile?.username}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast('Dados exportados com sucesso!');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }
        setPassLoading(true);
        // Simulado
        setTimeout(() => {
            setPassLoading(false);
            setModalOpen(null);
            setPassData({ current: '', new: '', confirm: '' });
            addToast('Senha alterada com sucesso!');
        }, 1500);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== 'DELETAR') return;
        setDeleteLoading(true);
        try {
            if (profile) await Service.deleteUser(profile.id);
            signOut();
            addToast('Sua conta foi excluída.', 'info');
            navigate('/login');
        } catch (e) {
            addToast('Erro ao excluir conta.', 'error');
            setDeleteLoading(false);
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackContent.trim()) return;
        setFeedbackLoading(true);
        try {
            if (profile) {
                await Service.sendFeedback(profile.id, feedbackContent, includeLogs);
                addToast('Feedback enviado! Obrigado.');
                setFeedbackContent('');
                setModalOpen(null);
            }
        } catch (e) {
            addToast('Erro ao enviar feedback.', 'error');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const handleClaimAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setClaimStatus('loading');
        const success = await Service.claimAdminAccess(adminKey);
        if (success) {
            setClaimStatus('success');
            updateProfile({ role: 'admin' });
            addToast("Privilégios de Administrador concedidos!", "success");
            setTimeout(() => { setAdminKey(''); setClaimStatus('idle'); }, 2000);
        } else {
            setClaimStatus('error');
            addToast("Chave inválida.", "error");
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black transition-colors duration-200">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">
                        <Icons.ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">Configurações</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 pb-24">
                
                <SectionHeader title="Aparência & Acessibilidade" />
                <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        <SettingItem 
                            icon={Icons.Moon} 
                            label="Modo Escuro" 
                            subLabel="Alternar tema da interface"
                            action={<Toggle checked={theme === 'dark'} onChange={toggleTheme} />}
                        />
                        <SettingItem 
                            icon={Icons.Palette} 
                            label="Cor de Destaque" 
                            subLabel="Personalize a identidade do site"
                            action={<ColorPicker current={accentColor} onSelect={setAccentColor} />}
                        />
                        <SettingItem 
                            icon={Icons.Activity} 
                            label="Reduzir Movimento" 
                            subLabel="Minimizar animações"
                            action={<Toggle checked={preferences.reduced_motion} onChange={() => handleToggle('reduced_motion', 'Movimento Reduzido')} />}
                        />
                    </div>
                </div>

                <SectionHeader title="Notificações" />
                <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        <SettingItem 
                            icon={Icons.Zap} 
                            label="Push Notifications" 
                            action={<Toggle checked={preferences.notifications_push} onChange={() => handleToggle('notifications_push', 'Notificações Push')} />}
                        />
                        <SettingItem 
                            icon={Icons.AtSign} 
                            label="Menções" 
                            subLabel="Quando alguém te marca"
                            action={<Toggle checked={preferences.notifications_mentions} onChange={() => handleToggle('notifications_mentions', 'Menções')} />}
                        />
                    </div>
                </div>

                <SectionHeader title="Dados e Privacidade" />
                <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        <SettingItem 
                            icon={Icons.EyeOff} 
                            label="Modo Privado" 
                            subLabel="Ocultar status online"
                            action={<Toggle checked={preferences.privacy_mode} onChange={() => handleToggle('privacy_mode', 'Modo Privado')} />}
                        />
                        <SettingItem 
                            icon={Icons.FileJson} 
                            label="Exportar Meus Dados" 
                            subLabel="Baixar cópia em JSON"
                            onClick={handleExportData}
                        />
                        <SettingItem 
                            icon={Icons.Trash} 
                            label="Limpar Cache Local" 
                            subLabel="Libera espaço e corrige erros"
                            onClick={handleClearCache}
                            isDestructive
                        />
                    </div>
                </div>

                <SectionHeader title="Conta" />
                <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        <SettingItem 
                            icon={Icons.User} 
                            label="Editar Perfil" 
                            onClick={() => navigate('/profile/edit')}
                        />
                        <SettingItem 
                            icon={Icons.Lock} 
                            label="Alterar Senha" 
                            onClick={() => setModalOpen('password')}
                        />
                        <SettingItem 
                            icon={Icons.Power} 
                            label="Excluir Conta" 
                            subLabel="Ação permanente"
                            isDestructive
                            onClick={() => setModalOpen('delete')}
                        />
                    </div>
                </div>

                <SectionHeader title="Sobre & Suporte" />
                <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        <SettingItem 
                            icon={Icons.Bug} 
                            label="Reportar Problema" 
                            onClick={() => setModalOpen('support')}
                        />
                        <SettingItem 
                            icon={Icons.LifeBuoy} 
                            label="Termos de Uso" 
                            subLabel="v0.1 - Atualizado em 2026"
                            onClick={() => navigate('/terms')}
                        />
                        <div className="p-4 flex justify-between items-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                            <span>Microspace</span>
                            <span className="font-mono">v0.7.0 (Pré-Alpha)</span>
                        </div>
                    </div>
                </div>

                <SectionHeader title="Zona Avançada" />
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#121212] dark:to-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 relative overflow-hidden mb-8">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg">
                                <Icons.Shield className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Acesso Administrativo</h3>
                        </div>

                        {profile?.role === 'admin' ? (
                            <div>
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-4 flex items-center gap-2">
                                    <Icons.BadgeCheck className="w-4 h-4" />
                                    Modo Administrador Ativo
                                </p>
                                <button 
                                    onClick={() => navigate('/admin')}
                                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm shadow-lg"
                                >
                                    Acessar Painel de Controle
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                                    Insira a chave mestra para elevar seus privilégios e gerenciar a plataforma.
                                </p>
                                <form onSubmit={handleClaimAdmin} className="flex gap-2">
                                    <input 
                                        type="password"
                                        value={adminKey}
                                        onChange={(e) => setAdminKey(e.target.value)}
                                        placeholder="Chave Mestra"
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-sm outline-none focus:border-primary transition-colors shadow-sm"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!adminKey || claimStatus === 'loading'}
                                        className="px-6 bg-primary text-white rounded-xl font-bold text-sm hover:bg-opacity-90 disabled:opacity-50 transition-colors shadow-lg shadow-purple-500/20"
                                    >
                                        {claimStatus === 'loading' ? '...' : 'Ativar'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                    <Icons.Shield className="absolute -right-6 -bottom-6 w-32 h-32 text-gray-200 dark:text-gray-800 opacity-50 rotate-12 pointer-events-none" />
                </div>

                <div className="text-center pb-8">
                    <button onClick={signOut} className="text-red-500 font-bold text-sm hover:underline flex items-center justify-center gap-2 mx-auto">
                        <Icons.LogOut className="w-4 h-4" /> Sair da Conta
                    </button>
                </div>

            </div>

            {modalOpen === 'password' && (
                <SettingsModal 
                    title="Alterar Senha" 
                    onClose={() => setModalOpen(null)}
                    action={
                        <button onClick={handleChangePassword} disabled={passLoading} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50">
                            {passLoading ? 'Alterando...' : 'Confirmar'}
                        </button>
                    }
                >
                    <form className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Senha Atual</label>
                            <input type="password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nova Senha</label>
                            <input type="password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Confirmar Nova Senha</label>
                            <input type="password" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-primary" />
                        </div>
                    </form>
                </SettingsModal>
            )}

            {modalOpen === 'delete' && (
                <SettingsModal 
                    title="Excluir Conta Permanentemente" 
                    onClose={() => setModalOpen(null)}
                    action={
                        <button 
                            onClick={handleDeleteAccount} 
                            disabled={deleteConfirm !== 'DELETAR' || deleteLoading} 
                            className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
                        </button>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl text-sm leading-relaxed">
                            <p className="font-bold flex items-center gap-2 mb-2"><Icons.AlertCircle className="w-4 h-4" /> Atenção!</p>
                            Isso apagará todos os seus posts, comentários, curtidas e configurações. Esta ação não pode ser desfeita.
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Digite "DELETAR" para confirmar</label>
                            <input 
                                type="text" 
                                value={deleteConfirm} 
                                onChange={e => setDeleteConfirm(e.target.value)} 
                                className="w-full p-3 rounded-xl bg-white dark:bg-black border-2 border-red-100 dark:border-red-900/50 text-sm outline-none focus:border-red-500 text-center font-bold tracking-widest placeholder-gray-300"
                                placeholder="DELETAR"
                            />
                        </div>
                    </div>
                </SettingsModal>
            )}

            {modalOpen === 'support' && (
                <SettingsModal 
                    title="Reportar um Problema" 
                    onClose={() => setModalOpen(null)}
                    action={
                        <button onClick={handleSendFeedback} disabled={feedbackLoading} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50">
                            {feedbackLoading ? 'Enviando...' : 'Enviar'}
                        </button>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">Encontrou um bug ou tem uma sugestão? Conte para nós.</p>
                        <textarea 
                            value={feedbackContent}
                            onChange={e => setFeedbackContent(e.target.value)}
                            className="w-full h-32 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-primary resize-none" 
                            placeholder="Descreva o que aconteceu..." 
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <input 
                                type="checkbox" 
                                checked={includeLogs}
                                onChange={e => setIncludeLogs(e.target.checked)}
                                className="rounded text-primary focus:ring-primary bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600" 
                            />
                            <label>Incluir logs do sistema para diagnóstico.</label>
                        </div>
                    </div>
                </SettingsModal>
            )}

        </div>
    );
};