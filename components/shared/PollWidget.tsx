import React, { useState } from 'react';
import { Poll } from '../../types';
import { Service } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Icons } from '../Icons';

interface PollWidgetProps {
    poll: Poll;
}

export const PollWidget: React.FC<PollWidgetProps> = ({ poll: initialPoll }) => {
    const { user } = useAuth();
    const [poll, setPoll] = useState(initialPoll);
    const [loading, setLoading] = useState(false);

    const getPercentage = (votes: number) => {
        if (poll.total_votes === 0) return 0;
        return Math.round((votes / poll.total_votes) * 100);
    };

    const handleVote = async (optionId: string) => {
        if (poll.user_vote_option_id || loading || !user) return;
        setLoading(true);

        try {
            await Service.votePoll(poll.id, optionId, user.id);
            
            setPoll(prev => ({
                ...prev,
                total_votes: prev.total_votes + 1,
                user_vote_option_id: optionId,
                options: prev.options.map(opt => 
                    opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
                )
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const hasVoted = !!poll.user_vote_option_id;

    return (
        <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-[#7900c5] rounded-lg">
                    <Icons.Dynamic name="BarChart" className="w-4 h-4" />
                </div>
                {poll.question}
            </h4>
            
            <div className="space-y-2.5">
                {poll.options.map(option => {
                    const isSelected = poll.user_vote_option_id === option.id;
                    const percent = getPercentage(option.votes || 0);
                    
                    return (
                        <button
                            key={option.id}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted || loading}
                            className={`relative w-full text-left h-11 rounded-xl overflow-hidden transition-all border ${
                                hasVoted 
                                    ? 'cursor-default border-transparent bg-gray-100 dark:bg-gray-800' 
                                    : 'cursor-pointer hover:border-[#7900c5] hover:bg-purple-50 dark:hover:bg-purple-900/10 border-gray-200 dark:border-gray-700 bg-white dark:bg-black'
                            } ${isSelected ? 'ring-2 ring-[#7900c5] ring-offset-1 dark:ring-offset-gray-900 bg-purple-50 dark:bg-purple-900/10' : ''}`}
                        >
                            {hasVoted && (
                                <div 
                                    className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ease-out ${isSelected ? 'bg-[#7900c5]/20' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                <div className="flex items-center gap-2 truncate">
                                    <span className={`text-sm font-medium truncate ${hasVoted ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {option.text}
                                    </span>
                                    {isSelected && <Icons.BadgeCheck className="w-4 h-4 text-[#7900c5]" />}
                                </div>
                                {hasVoted && (
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{percent}%</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            
            <div className="mt-4 flex justify-between items-center text-xs text-gray-400 font-medium">
                <span>Votação anônima</span>
                <span>{poll.total_votes} {poll.total_votes === 1 ? 'voto' : 'votos'}</span>
            </div>
        </div>
    );
};
