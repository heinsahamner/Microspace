import React, { useState, useEffect } from 'react';
import { Flashcard } from '../../types';
import { Icons } from '../Icons';

interface FlashcardGameProps {
    cards: Flashcard[];
    onClose: () => void;
}

export const FlashcardGame: React.FC<FlashcardGameProps> = ({ cards, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    useEffect(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [cards]);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            if (currentIndex < cards.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setCurrentIndex(0);
            }
        }, 200); 
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
        }, 200);
    };

    const currentCard = cards[currentIndex];

    if (!currentCard) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            
            <div className="w-full max-w-2xl flex justify-between items-center text-white mb-8">
                <span className="font-bold text-lg">{currentIndex + 1} / {cards.length}</span>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Icons.X className="w-6 h-6" />
                </button>
            </div>

            <div 
                className="relative w-full max-w-xl aspect-[5/3] cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    <div 
                        className="absolute inset-0 bg-white dark:bg-[#121212] rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden border-2 border-white/10"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pergunta</span>
                        <p className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white leading-tight">
                            {currentCard.front}
                        </p>
                        <p className="text-xs text-gray-400 mt-8 animate-pulse">Toque para ver a resposta</p>
                    </div>

                    <div 
                        className="absolute inset-0 bg-[#7900c5] rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 border-2 border-white/10"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Resposta</span>
                        <p className="text-xl md:text-2xl font-medium text-center text-white leading-relaxed">
                            {currentCard.back}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button 
                    onClick={handlePrev} 
                    disabled={currentIndex === 0}
                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                >
                    <Icons.ArrowLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNext}
                    className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-all flex items-center gap-2"
                >
                    {currentIndex === cards.length - 1 ? 'Recomeçar' : 'Próximo'}
                    <Icons.Dynamic name="chevron-right" className="w-4 h-4" />
                </button>
            </div>

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};
