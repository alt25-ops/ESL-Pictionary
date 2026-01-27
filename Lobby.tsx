
import React, { useState } from 'react';
import { Player } from '../types';

interface LobbyProps {
  onJoin: (roomCode: string, name: string) => void;
  onCreate: (name: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin, onCreate }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'initial' | 'join' | 'create'>('initial');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="text-5xl font-game text-sky-600 mb-2 drop-shadow-sm">ESL Quest</h1>
      <p className="text-sky-400 mb-8 font-medium">Draw, Guess, and Learn English!</p>

      {mode === 'initial' && (
        <div className="space-y-4 w-full max-w-xs">
          <button 
            onClick={() => setMode('create')}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 transition-all transform hover:scale-105"
          >
            Create Game Room
          </button>
          <button 
            onClick={() => setMode('join')}
            className="w-full py-4 bg-white hover:bg-sky-50 text-sky-500 border-2 border-sky-500 rounded-2xl font-bold transition-all"
          >
            Join Existing Room
          </button>
        </div>
      )}

      {(mode === 'create' || mode === 'join') && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-sky-100 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            {mode === 'create' ? 'Host a New Game' : 'Join a Room'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-left text-sm font-semibold text-gray-500 mb-1 ml-1">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Student-A"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-sky-400 outline-none transition-all"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-left text-sm font-semibold text-gray-500 mb-1 ml-1">Room Code</label>
                <input 
                  type="text" 
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-sky-400 outline-none transition-all"
                />
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => setMode('initial')}
                className="flex-1 py-3 text-gray-400 font-semibold hover:text-gray-600"
              >
                Back
              </button>
              <button 
                onClick={() => mode === 'create' ? onCreate(name) : onJoin(roomCode, name)}
                disabled={!name || (mode === 'join' && !roomCode)}
                className="flex-[2] py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {mode === 'create' ? 'Create' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
