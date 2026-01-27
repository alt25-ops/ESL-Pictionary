
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  color: string;
}

export interface GameWord {
  word: string;
  hint: string;
  level: Difficulty;
  category: string;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentDrawerId: string | null;
  currentWord: GameWord | null;
  status: 'Lobby' | 'Playing' | 'Review' | 'GameOver';
  round: number;
  timeLeft: number;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isCorrect?: boolean;
}

export interface DrawingAction {
  type: 'start' | 'draw' | 'end' | 'clear';
  x?: number;
  y?: number;
  color?: string;
  width?: number;
}
