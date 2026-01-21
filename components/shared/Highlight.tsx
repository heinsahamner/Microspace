import React from 'react';

interface HighlightProps {
    text: string | React.ReactNode;
    term?: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, term }) => {
    // If text is not a string (e.g., nested React nodes) or no term, return as is
    if (typeof text !== 'string' || !term || !term.trim()) {
        return <>{text}</>;
    }

    const trimmedTerm = term.trim();
    // Escape regex special characters to prevent crashes
    const escapedTerm = trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Split by the term, capturing the delimiter (the term itself)
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