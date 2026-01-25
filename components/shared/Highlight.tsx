import React from 'react';

interface HighlightProps {
    text: string | React.ReactNode;
    term?: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, term }) => {
    if (typeof text !== 'string' || !term || !term.trim()) {
        return <>{text}</>;
    }

    const trimmedTerm = term.trim();
    const escapedTerm = trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const parts = text.split(new RegExp(`(${escapedTerm})`, 'gi'));

    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === trimmedTerm.toLowerCase() ? (
                    <span 
                        key={i} 
                        className="text-[#7900c5] bg-purple-100 dark:bg-purple-900/50 font-bold px-0.5 rounded box-decoration-clone transition-colors"
                    >
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};