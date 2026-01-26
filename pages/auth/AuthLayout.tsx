import React from 'react';
import { Icons } from '../../components/Icons';

export const AuthLayout: React.FC<{ children: React.ReactNode; title?: string; subtitle?: string }> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fc] dark:bg-[#050505] relative overflow-hidden transition-colors duration-500 font-inter selection:bg-[#7900c5] selection:text-white">
            
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[120px] animate-float opacity-70"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[120px] animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
                
                <div className="absolute top-[20%] right-[20%] w-32 h-32 bg-gradient-to-br from-[#7900c5] to-violet-600 rounded-full blur-2xl opacity-20 dark:opacity-30 animate-pulse"></div>
                <div className="absolute bottom-[20%] left-[15%] w-24 h-24 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full blur-2xl opacity-20 dark:opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[640px] mx-4">
                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-[#7900c5] rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    
                    <div className="relative bg-white/70 dark:bg-[#121212]/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[1.75rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] p-8 sm:p-10">
                        
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#7900c5] to-[#9f5fd6] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 transform transition-transform group-hover:scale-110 duration-500">
                                <span className="text-white text-2xl font-bold">M</span>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                                {title || 'Bem-vindo(a)'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[280px]">
                                {subtitle || 'Acesse sua conta para continuar.'}
                            </p>
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100/50 dark:border-white/5 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-medium">
                                Microspace
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};