import React from 'react';
import { X, Heart, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function Controls({ onVote, onPrev, onNext, swipeX, voteLoading }) {
    const isPassActive = swipeX < -50;
    const isSmashActive = swipeX < -50;

    return (
        <div className="w-full max-w-sm mt-8 grid grid-rows-2 gap-4">
            {/* Main Actions */}
            <div className="grid grid-cols-2 gap-6">
                <button
                    onClick={() => onVote('pass')}
                    disabled={voteLoading}
                    className={`group relative flex items-center justify-center h-16 rounded-2xl border-2 transition-all duration-200 ${isPassActive
                        ? 'bg-pass border-pass text-white scale-105 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                        : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:border-pass/50 hover:text-pass active:scale-95'
                        }`}
                >
                    <X size={32} strokeWidth={3} className={`transition-transform duration-200 ${isPassActive ? 'rotate-90' : 'group-hover:rotate-90'}`} />
                    <span className="ml-2 font-bold tracking-wider">PASS</span>
                </button>

                <button
                    onClick={() => onVote('smash')}
                    disabled={voteLoading}
                    className={`group relative flex items-center justify-center h-16 rounded-2xl border-2 transition-all duration-200 ${isSmashActive
                        ? 'bg-smash border-smash text-white scale-105 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                        : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5 hover:border-smash/50 hover:text-smash active:scale-95'
                        }`}
                >
                    <Heart size={32} strokeWidth={3} className={`transition-transform duration-200 ${isSmashActive ? 'scale-125 fill-current' : 'group-hover:scale-125'}`} />
                    <span className="ml-2 font-bold tracking-wider">SMASH</span>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center px-4">
                <button
                    onClick={onPrev}
                    className="p-3 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all active:scale-90"
                    title="Previous Pokémon"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="text-white/20 text-xs font-mono tracking-widest uppercase">
                    Swipe or Click
                </div>

                <button
                    onClick={onNext}
                    className="p-3 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-all active:scale-90"
                    title="Next Pokémon"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}
