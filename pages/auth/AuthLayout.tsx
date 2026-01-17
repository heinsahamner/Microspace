import React from 'react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black p-6 transition-colors duration-200">
            <div className="w-full max-w-sm mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-[#7900c5] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-200 dark:shadow-purple-900/30">
                     <span className="text-white text-4xl font-bold">M</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Microspace</h1>
                <p className="text-center text-gray-500 dark:text-gray-400">
                    Central de materiais acadêmicos.
                </p>
            </div>
            
            <div className="w-full max-w-sm bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 animate-in zoom-in-95 duration-300">
                {children}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                &copy; 2026 Microspace App
            </div>
        </div>
    );
};