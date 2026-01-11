import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RichTextProps {
  text: string;
  className?: string;
}

export const RichTextRenderer: React.FC<RichTextProps> = ({ text, className }) => {
  const navigate = useNavigate();

  if (!text) return null;

  const parts = text.split(/(\s+)/);

  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          const username = part.substring(1).replace(/[^a-zA-Z0-9_]/g, '');
          const punctuation = part.substring(1 + username.length);
          return (
            <span key={index} className="text-[#7900c5] font-bold cursor-pointer hover:underline">
              {part}
            </span>
          );
        } else if (part.startsWith('@')) {
          return (
            <span key={index} className="text-blue-600 font-bold cursor-pointer hover:underline bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
              {part}
            </span>
          );
        } else {
          return <span key={index}>{part}</span>;
        }
      })}
    </p>
  );
};