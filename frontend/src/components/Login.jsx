import React, { useState } from 'react';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');

        try {
            await onLogin(username);
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 rounded-3xl bg-surface border border-white/10 shadow-2xl backdrop-blur-md transform transition-all">
                <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Welcome to PokeSmash!
                </h2>
                <p className="text-center text-white/50 mb-8">Enter your username to start playing</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full px-6 py-4 rounded-xl bg-black/20 border border-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg"
                        required
                        autoFocus
                    />

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Joining...' : 'Start Playing'}
                    </button>
                </form>
            </div>
        </div>
    );
}
