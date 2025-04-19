export interface GameScore {
  score: number
  timeSpent?: number // in seconds
  level?: number
  completed?: boolean
}

export interface GameProps {
  onGameEnd?: (score: GameScore) => void
  initialLevel?: number
  maxTime?: number // in seconds, optional
  difficulty?: "easy" | "medium" | "hard"
}

export interface GameState {
  gameStarted: boolean
  gameOver: boolean
  score: number
  timeLeft?: number
  level: number
  isPaused: boolean
}
