"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { GameProps, GameScore, GameState } from "./game-interfaces"
import { toast } from "@/components/ui/use-toast"

export default function BaseGame({ onGameEnd, initialLevel = 1, maxTime, difficulty = "medium" }: GameProps) {
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    gameOver: false,
    score: 0,
    timeLeft: maxTime,
    level: initialLevel,
    isPaused: false,
  })

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver && !gameState.isPaused && gameState.timeLeft) {
      const timer = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft && prev.timeLeft <= 1) {
            clearInterval(timer)
            handleGameEnd(prev.score)
            return { ...prev, timeLeft: 0, gameOver: true }
          }
          return { ...prev, timeLeft: prev.timeLeft ? prev.timeLeft - 1 : undefined }
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [gameState.gameStarted, gameState.gameOver, gameState.isPaused, gameState.timeLeft])

  const handleGameStart = () => {
    setGameState({
      gameStarted: true,
      gameOver: false,
      score: 0,
      timeLeft: maxTime,
      level: initialLevel,
      isPaused: false,
    })
  }

  const handleGameEnd = (finalScore: number) => {
    // Calculate XP based on difficulty and score
    const difficultyMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.5 : 1
    const earnedXP = Math.min(Math.ceil(finalScore * 0.1 * difficultyMultiplier), 10)

    const gameScore: GameScore = {
      score: finalScore,
      level: gameState.level,
      completed: true,
    }

    if (onGameEnd) {
      onGameEnd(gameScore)
    }

    // Show toast notification for XP earned
    toast({
      title: "Game Complete!",
      description: `You earned ${earnedXP} XP!`,
    })
  }

  const pauseGame = () => {
    setGameState((prev) => ({ ...prev, isPaused: true }))
  }

  const resumeGame = () => {
    setGameState((prev) => ({ ...prev, isPaused: false }))
  }

  const updateScore = (points: number) => {
    setGameState((prev) => ({ ...prev, score: prev.score + points }))
  }

  const updateLevel = (newLevel: number) => {
    setGameState((prev) => ({ ...prev, level: newLevel }))
  }

  // TO BE IMPLEMENTED BY CHILD COMPONENTS
  const renderGameContent = () => (
    <div className="flex flex-col items-center justify-center h-[300px] bg-[#1a2332] rounded-lg border border-[#2a3343]">
      <p className="text-white">Game content goes here</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {!gameState.gameStarted || gameState.gameOver ? (
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Game Title</h3>
          <p className="text-gray-400">Game description goes here</p>

          {gameState.gameOver && (
            <div className="my-4">
              <h4 className="text-lg font-bold text-white">Game Over!</h4>
              <p className="text-[#4cc9f0] text-2xl font-bold">{gameState.score} points</p>
              {/* Calculate XP based on difficulty and score */}
              <p className="text-white">You earned XP based on your performance</p>
            </div>
          )}

          <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={handleGameStart}>
            {gameState.gameOver ? "Play Again" : "Start Game"}
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <Badge className="bg-[#4cc9f0] text-black">Score: {gameState.score}</Badge>
            {gameState.timeLeft !== undefined && (
              <Badge className={gameState.timeLeft <= 10 ? "bg-red-500" : "bg-[#2a3343]"}>
                Time: {gameState.timeLeft}s
              </Badge>
            )}
            <Badge className="bg-[#2a3343]">Level: {gameState.level}</Badge>
          </div>

          {gameState.isPaused ? (
            <div className="relative w-full bg-[#1a2332]/90 rounded-lg border border-[#2a3343] flex flex-col items-center justify-center h-[300px]">
              <h3 className="text-xl font-bold text-white mb-4">Game Paused</h3>
              <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={resumeGame}>
                Resume
              </Button>
            </div>
          ) : (
            renderGameContent()
          )}

          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
              onClick={pauseGame}
              disabled={gameState.isPaused}
            >
              Pause
            </Button>

            <Button
              variant="outline"
              className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
              onClick={() => {
                setGameState((prev) => ({ ...prev, gameOver: true }))
                handleGameEnd(gameState.score)
              }}
            >
              End Game
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
