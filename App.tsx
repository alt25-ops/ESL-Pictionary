
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Lobby from './components/Lobby';
import DrawingBoard from './components/DrawingBoard';
import { GameState, Player, ChatMessage, Difficulty, GameWord } from './types';
// Fix: Added MAX_ROUNDS to the import list from constants
import { PLAYER_COLORS, ROUND_TIME, CATEGORIES, MAX_ROUNDS } from './constants';
import { generateWord } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [me, setMe] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    roomId: '',
    players: [],
    currentDrawerId: null,
    currentWord: null,
    status: 'Lobby',
    round: 0,
    timeLeft: 0,
    messages: []
  });

  const [brushColor, setBrushColor] = useState(PLAYER_COLORS[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [guess, setGuess] = useState('');
  const timerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  const addMessage = (text: string, isSystem = false, isCorrect = false, sender?: Player) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: sender?.id || 'system',
      senderName: sender?.name || 'System',
      text,
      timestamp: Date.now(),
      isSystem,
      isCorrect
    };
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  };

  const handleCreateRoom = (name: string) => {
    const newPlayer: Player = {
      id: 'p1',
      name: name || 'Host',
      score: 0,
      isHost: true,
      color: PLAYER_COLORS[0]
    };
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    setMe(newPlayer);
    setGameState(prev => ({
      ...prev,
      roomId: roomCode,
      players: [newPlayer],
      status: 'Lobby'
    }));
    setView('game');
  };

  const handleJoinRoom = (roomCode: string, name: string) => {
    // In a real online game, we'd fetch room data here. 
    // Simulating joining with a few fake players.
    const newPlayer: Player = {
      id: 'p2',
      name: name || 'Player',
      score: 0,
      isHost: false,
      color: PLAYER_COLORS[1]
    };
    const fakeHost: Player = {
      id: 'p1',
      name: 'Host-Sensei',
      score: 10,
      isHost: true,
      color: PLAYER_COLORS[0]
    };
    setMe(newPlayer);
    setGameState(prev => ({
      ...prev,
      roomId: roomCode,
      players: [fakeHost, newPlayer],
      status: 'Lobby'
    }));
    setView('game');
  };

  const startNextTurn = async () => {
    if (!gameState.players.length) return;

    // Pick next drawer
    const nextIdx = gameState.currentDrawerId 
      ? (gameState.players.findIndex(p => p.id === gameState.currentDrawerId) + 1) % gameState.players.length
      : 0;
    const nextDrawer = gameState.players[nextIdx];

    // Get word from Gemini
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const wordObj = await generateWord('Beginner', randomCategory);

    setGameState(prev => ({
      ...prev,
      status: 'Playing',
      currentDrawerId: nextDrawer.id,
      currentWord: wordObj,
      timeLeft: ROUND_TIME,
      round: prev.round + 1
    }));

    addMessage(`${nextDrawer.name} is drawing!`, true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current!);
          return { ...prev, timeLeft: 0, status: 'Review' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess || !me || gameState.status !== 'Playing' || me.id === gameState.currentDrawerId) return;

    const isCorrect = guess.toLowerCase().trim() === gameState.currentWord?.word.toLowerCase();
    
    if (isCorrect) {
      addMessage(`GUESS CORRECT! The word was: ${gameState.currentWord?.word}`, true, true, me);
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === me.id ? { ...p, score: p.score + 10 } : p),
        status: 'Review'
      }));
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      addMessage(guess, false, false, me);
    }
    setGuess('');
  };

  const isMyTurn = me?.id === gameState.currentDrawerId;

  return (
    <div className="min-h-screen bg-sky-50 text-gray-800">
      {view === 'lobby' ? (
        <Lobby onCreate={handleCreateRoom} onJoin={handleJoinRoom} />
      ) : (
        <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar: Players */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100">
              <h3 className="font-game text-sky-600 text-lg mb-4 flex items-center gap-2">
                <span className="p-2 bg-sky-100 rounded-lg">🏫</span>
                Room: {gameState.roomId}
              </h3>
              <div className="space-y-3">
                {gameState.players.map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-xl transition-colors bg-gray-50">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: player.color }}>
                      {player.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-sm">{player.name} {player.id === me?.id && '(You)'}</p>
                      <p className="text-xs text-gray-500">{player.score} points</p>
                    </div>
                    {gameState.currentDrawerId === player.id && (
                      <span className="text-xl">✏️</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {gameState.status === 'Lobby' && me?.isHost && (
              <button 
                onClick={startNextTurn}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg transition-all"
              >
                Start Game
              </button>
            )}
          </div>

          {/* Main Content: Drawing Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100 relative h-[500px] flex flex-col">
              {/* Header inside Game Area */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-sky-500 text-white px-4 py-1 rounded-full font-bold text-lg min-w-[60px] text-center">
                    {gameState.timeLeft}s
                  </div>
                  <div className="text-sm font-semibold text-sky-400">
                    Round {gameState.round}/{MAX_ROUNDS}
                  </div>
                </div>
                
                {gameState.status === 'Playing' && (
                  <div className="text-center">
                    {isMyTurn ? (
                      <div className="animate-bounce">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Draw this word:</span>
                        <h2 className="text-2xl font-game text-sky-600 uppercase">{gameState.currentWord?.word}</h2>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Category:</span>
                        <span className="font-bold text-sky-500">{gameState.currentWord?.category}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* The Board */}
              <div className="flex-1">
                <DrawingBoard 
                  isReadOnly={!isMyTurn || gameState.status !== 'Playing'} 
                  brushColor={brushColor}
                  brushSize={brushSize}
                />
              </div>

              {/* Controls if Drawer */}
              {isMyTurn && gameState.status === 'Playing' && (
                <div className="mt-4 flex flex-wrap gap-4 items-center justify-center p-2 bg-gray-50 rounded-xl">
                   <div className="flex gap-2">
                     {PLAYER_COLORS.slice(0, 5).map(c => (
                       <button 
                        key={c}
                        onClick={() => setBrushColor(c)}
                        className={`w-8 h-8 rounded-full border-4 ${brushColor === c ? 'border-sky-300' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                       />
                     ))}
                   </div>
                   <div className="flex items-center gap-2 text-gray-500">
                     <span className="text-xs font-bold">SIZE</span>
                     <input 
                       type="range" min="1" max="20" 
                       value={brushSize} 
                       onChange={(e) => setBrushSize(parseInt(e.target.value))}
                       className="w-24 h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer"
                     />
                   </div>
                </div>
              )}

              {/* Overlay for state changes */}
              {gameState.status === 'Review' && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl animate-fade-in">
                  <h2 className="text-4xl font-game text-sky-600 mb-2">Round Over!</h2>
                  <p className="text-xl text-gray-600 mb-6">The word was: <span className="font-bold text-green-500 uppercase">{gameState.currentWord?.word}</span></p>
                  {me?.isHost && (
                    <button 
                      onClick={startNextTurn}
                      className="px-8 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 shadow-lg"
                    >
                      Next Player 🚀
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* ESL Hint Area */}
            {gameState.status === 'Playing' && (
              <div className="bg-sky-100 p-4 rounded-xl border-l-4 border-sky-500 flex items-start gap-4">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">Teacher's Hint (English Only)</h4>
                  <p className="text-sky-800 font-medium italic">"{gameState.currentWord?.hint}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Chat */}
          <div className="lg:col-span-1 h-[600px] flex flex-col bg-white rounded-2xl shadow-sm border border-sky-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                💬 Chat & Guesses
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {gameState.messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}
                >
                  {msg.isSystem ? (
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${msg.isCorrect ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                      {msg.text}
                    </div>
                  ) : (
                    <div className="flex gap-2 max-w-[90%]">
                      <div 
                        className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] text-white font-bold mt-1"
                        style={{ backgroundColor: gameState.players.find(p => p.id === msg.senderId)?.color || '#999' }}
                      >
                        {msg.senderName[0].toUpperCase()}
                      </div>
                      <div className="bg-gray-50 px-3 py-2 rounded-2xl rounded-tl-none border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 mb-0.5">{msg.senderName}</p>
                        <p className="text-sm text-gray-700 font-medium">{msg.text}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleGuessSubmit} className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={isMyTurn || gameState.status !== 'Playing'}
                  placeholder={isMyTurn ? "You're drawing!" : "Type your guess..."}
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!guess || isMyTurn || gameState.status !== 'Playing'}
                  className="bg-sky-500 text-white p-2 rounded-xl hover:bg-sky-600 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
      <Analytics />
    </div>
  );
};

export default App;
