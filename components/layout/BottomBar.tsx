import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../Icons';

export const BottomBar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
      <Link to="/" className={`flex flex-col items-center space-y-1 ${isActive('/') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <Icons.Home className="w-6 h-6" />
        <span className="text-xs font-medium">Início</span>
      </Link>
      
      <Link to="/upload" className={`flex flex-col items-center space-y-1 ${isActive('/upload') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <Icons.Upload className="w-6 h-6" />
        <span className="text-xs font-medium">Postar</span>
      </Link>

      <Link to="/backpack" className={`flex flex-col items-center space-y-1 ${isActive('/backpack') ? 'text-indigo-600' : 'text-gray-500'}`}>
        <Icons.Backpack className="w-6 h-6" />
        <span className="text-xs font-medium">Mochila</span>
      </Link>
      
      <div className="flex flex-col items-center space-y-1 text-gray-500">
        <Icons.User className="w-6 h-6" />
        <span className="text-xs font-medium">Perfil</span>
      </div>
    </nav>
  );
};
