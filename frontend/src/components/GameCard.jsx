import React, { useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

export default function GameCard({ pokemon, onVote, onSwipeProgress }) {
    const [{ x, rotate, opacity }, api] = useSpring(() => ({
        x: 0,
        rotate: 0,
        opacity: 1,
        config: { tension: 300, friction: 20 }
    }));

    // Reset spring when pokemon changes
    useEffect(() => {
        api.start({ x: 0, rotate: 0, opacity: 1, immediate: true });
    }, [pokemon, api]);

    const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
        const trigger = Math.abs(mx) > 150; // Threshold
        const dir = xDir < 0 ? -1 : 1; // -1 for left (pass), 1 for right (smash)

        // Notify parent about swipe progress for button highlights
        if (onSwipeProgress) {
            onSwipeProgress(active ? mx : 0);
        }

        if (!active && trigger) {
            // Swiped far enough
            const action = dir === 1 ? 'smash' : 'pass';
            api.start({
                x: (200 + window.innerWidth) * dir,
                rotate: mx / 10, // More rotation
                opacity: 0,
                config: { friction: 50, tension: 200 }
            });
            onVote(action);
        } else {
            // Return to center or follow finger
            api.start({
                x: active ? mx : 0,
                rotate: active ? mx / 20 : 0,
                opacity: active ? Math.max(1 - Math.abs(mx) / 500, 0.8) : 1,
                immediate: active
            });
        }
    });

    if (!pokemon) return null;

    return (
        <div className="relative w-full max-w-sm aspect-[3/4] perspective-1000">
            <animated.div
                {...bind()}
                style={{ x, rotate, opacity, touchAction: 'none' }}
                className="w-full h-full absolute cursor-grab active:cursor-grabbing will-change-transform"
            >
                <div className="w-full h-full bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md relative transform-style-3d transition-shadow hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {/* Card Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 select-none">
                        <div className="relative w-64 h-64 mb-8">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-2xl animate-pulse"></div>
                            <img
                                src={pokemon.image_url}
                                alt={pokemon.name}
                                className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                                draggable="false"
                            />
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                            {pokemon.name}
                        </h1>
                        <div className="mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 tracking-widest font-mono">
                            #{String(pokemon.id).padStart(3, '0')}
                        </div>
                    </div>

                    {/* User Vote Overlay */}
                    {pokemon.user_vote && (
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md z-20"
                            style={{
                                backgroundColor: pokemon.user_vote === 'smash' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                borderColor: pokemon.user_vote === 'smash' ? '#10b981' : '#ef4444',
                                color: pokemon.user_vote === 'smash' ? '#10b981' : '#ef4444',
                            }}
                        >
                            voted {pokemon.user_vote}
                        </div>
                    )}
                </div>
            </animated.div>
        </div>
    );
}
