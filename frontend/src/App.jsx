import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Header from './components/Header';
import GameCard from './components/GameCard';
import Controls from './components/Controls';
import { Loader2 } from 'lucide-react';

// Configure Axios
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const MAX_POKEMON_ID = 151; // Keeping to Gen 1 for now based on context, or 1025 if all

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState(null);
  const [pokemon, setPokemon] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch Pokemon when ID changes
  useEffect(() => {
    if (user && currentId) {
      fetchPokemon(currentId);
    }
  }, [user, currentId]);

  const checkAuth = async () => {
    try {
      const res = await axios.get('/api/username/');
      setUser({ username: res.data.username });
      // Upon auth, fetch starting ID
      fetchStartingId();
    } catch (err) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const fetchStartingId = async () => {
    try {
      const res = await axios.get('/api/start/');
      setCurrentId(res.data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPokemon = async (id) => {
    try {
      const res = await axios.get(`/api/pokemon/${id}/`);
      setPokemon(res.data);
    } catch (err) {
      console.error('Failed to fetch pokemon', err);
      // Fallback or error state?
    }
  };

  const handleLogin = async (username) => {
    const res = await axios.post('/api/login/', { username });
    if (res.data.status === 'success') {
      setUser({ username: res.data.username });
      fetchStartingId();
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/logout/');
    setUser(null);
    setPokemon(null);
    setCurrentId(null);
  };

  const handleVote = async (action) => {
    if (!pokemon || voteLoading) return;
    setVoteLoading(true);

    try {
      await axios.post(`/api/vote/${pokemon.id}/`, { action });
      // Optimistic update or wait?
      // Move to next pokemon automatically after a slight delay
      setTimeout(() => {
        handleNext(); // Move to next
        setVoteLoading(false);
      }, 200);
    } catch (err) {
      console.error('Vote failed', err);
      setVoteLoading(false);
    }
  };

  const handleNext = () => {
    if (currentId < MAX_POKEMON_ID) {
      setCurrentId(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentId > 1) {
      setCurrentId(prev => prev - 1);
    }
  };

  const handleJump = (id) => {
    setCurrentId(id);
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-bg text-white"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text font-outfit relative overflow-hidden flex flex-col items-center">
      {/* Background Blobs */}
      <div className="background-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {!user && <Login onLogin={handleLogin} />}

      {user && (
        <>
          <Header
            username={user.username}
            currentId={currentId}
            onLogout={handleLogout}
            onJumpToId={handleJump}
          />

          <main className="flex-1 w-full max-w-xl mx-auto flex flex-col items-center justify-center px-6 pt-20 pb-10">
            <div className="w-full flex justify-center mb-4 min-h-[500px]">
              {pokemon && pokemon.id === currentId ? (
                <GameCard
                  pokemon={pokemon}
                  onVote={handleVote}
                  onSwipeProgress={setSwipeX}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-white/30" size={48} />
                </div>
              )}
            </div>

            <Controls
              onVote={handleVote}
              onPrev={handlePrev}
              onNext={handleNext}
              swipeX={swipeX}
              voteLoading={voteLoading}
            />
          </main>
        </>
      )}
    </div>
  );
}
