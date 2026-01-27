import React, { useState, useEffect } from 'react';
import { LogOut, ArrowRight } from 'lucide-react';

export default function Header({ username, currentId, onLogout, onJumpToId }) {
    const [inputVal, setInputVal] = useState(currentId || '');

    useEffect(() => {
        setInputVal(currentId || '');
    }, [currentId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const id = parseInt(inputVal);
        if (!isNaN(id) && id > 0 && id <= 1025) { // Cap at reasonable max
            onJumpToId(id);
        } else {
            setInputVal(currentId); // Reset on invalid
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-40 bg-gradient-to-b from-bg/80 to-transparent">
            <div className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PokeSmash
            </div>

            <div className="flex items-center gap-4">
                {username && (
                    <form onSubmit={handleSubmit} className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">#</span>
                        <input
                            type="number"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            className="w-20 pl-6 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-mono text-center focus:outline-none focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </form>
                )}

                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                    <span className="hidden sm:block text-sm font-medium text-white/70">{username}</span>
                    <button
                        onClick={onLogout}
                        className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
