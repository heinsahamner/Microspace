import React from 'react';
import { Icons } from '../components/Icons';

export const Backpack: React.FC = () => {
  return (
    <div className="p-6 md:max-w-4xl md:mx-auto min-h-screen">
       <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                <Icons.Backpack className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Mochila</h1>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center transition-colors">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-500">
                <Icons.Download className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Acesso Offline</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Arquivos que você salvar aparecerão aqui para acesso mesmo sem internet. 
                <br/><br/>
                <span className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">Em breve!</span>
            </p>
       </div>
    </div>
  );
};