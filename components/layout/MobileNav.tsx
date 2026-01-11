import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../Icons';

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const activeClass = "text-[#7900c5] dark:text-[#9f5fd6]";
  const inactiveClass = "text-gray-400 dark:text-gray-500";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-900 px-6 py-4 flex justify-between items-center z-50 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
      <Link to="/" className={`flex flex-col items-center space-y-1 ${isActive('/') ? activeClass : inactiveClass}`}>
        <Icons.Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">Início</span>
      </Link>
      
      <Link to="/subjects" className={`flex flex-col items-center space-y-1 ${isActive('/subjects') ? activeClass : inactiveClass}`}>
        <Icons.BookOpen className="w-6 h-6" />
        <span className="text-[10px] font-medium">Matérias</span>
      </Link>

      <Link to="/official" className={`flex flex-col items-center space-y-1 ${isActive('/official') ? activeClass : inactiveClass}`}>
        <Icons.BadgeCheck className="w-6 h-6" />
        <span className="text-[10px] font-medium">Oficial</span>
      </Link>
      
      <Link to="/community" className={`flex flex-col items-center space-y-1 ${isActive('/community') ? activeClass : inactiveClass}`}>
        <Icons.Users className="w-6 h-6" />
        <span className="text-[10px] font-medium">Social</span>
      </Link>

      <Link to="/backpack" className={`flex flex-col items-center space-y-1 ${isActive('/backpack') ? activeClass : inactiveClass}`}>
        <Icons.Backpack className="w-6 h-6" />
        <span className="text-[10px] font-medium">Mochila</span>
      </Link>
    </nav>
  );
};