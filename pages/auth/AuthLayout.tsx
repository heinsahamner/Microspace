import React from 'react';
import { Icons } from '../../components/Icons';

export const AuthLayout: React.FC<{ children: React.ReactNode; title?: string; subtitle?: string }> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex bg-white dark:bg-black transition-colors duration-200">
            {/* Left Side: Visual Hero */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#1a0b2e] to-black relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 p-12">
                    <div className="w-64 h-64 bg-[#7900c5] rounded-full filter blur-[128px] opacity-20 animate-pulse"></div>
                </div>
                
                <div className="relative z-10 max-w-lg text-left">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                         <span className="text-white text-3xl font-bold">M</span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Seu espaço de <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b96df3] to-[#7900c5]">conhecimento.</span>
                    </h1>
                    <p className="text-lg text-gray-400 leading-relaxed">
                        Centralize materiais, colabore com sua turma e transforme a maneira como você estuda. Tudo em um só lugar.
                    </p>
                    
                    <div className="mt-12 flex items-center space-x-4">
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gray-800 border-2 border-[#1a0b2e] flex items-center justify-center text-xs font-bold text-gray-400">
                                    <Icons.User className="w-4 h-4" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">+200 alunos conectados</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 xl:p-24 relative">
                {/* Mobile Header Logo */}
                <div className="lg:hidden mb-8 text-center">
                    <div className="w-12 h-12 bg-[#7900c5] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                         <span className="text-white text-2xl font-bold">M</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Microspace</h2>
                </div>

                <div className="max-w-sm w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{title || 'Bem-vindo'}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{subtitle || 'Insira seus dados para continuar.'}</p>
                    </div>
                    
                    {children}

                    <div className="mt-12 text-center text-xs text-gray-400">
                        &copy; 2024 Microspace App. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    );
};