"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { GameProps, GameState } from "./game-interfaces"
import { toast } from "@/components/ui/use-toast"

export function PacmanGame({ onGameEnd, initialLevel = 1, maxTime = 60, difficulty = "medium" }: GameProps) {
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    gameOver: false,
    score: 0,
    timeLeft: maxTime,
    level: initialLevel,
    isPaused: false,
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestIdRef = useRef<number | null>(null)

  // Initialize game
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver && !gameState.isPaused) {
      // Set up game timer
      const timer = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft && prev.timeLeft <= 1) {
            clearInterval(timer)
            endGame(prev.score)
            return { ...prev, timeLeft: 0, gameOver: true }
          }
          return { ...prev, timeLeft: prev.timeLeft ? prev.timeLeft - 1 : undefined }
        })
      }, 1000)

      // Start game loop
      startGameLoop()

      return () => {
        clearInterval(timer)
        if (requestIdRef.current) {
          cancelAnimationFrame(requestIdRef.current)
          requestIdRef.current = null
        }
      }
    }
  }, [gameState.gameStarted, gameState.gameOver, gameState.isPaused])

  // Game loop
  const startGameLoop = () => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)

      // Draw game elements
      drawGame(ctx)

      // Continue the loop
      requestIdRef.current = requestAnimationFrame(gameLoop)
    }

    // Start the loop
    requestIdRef.current = requestAnimationFrame(gameLoop)
  }

  // Draw game
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    // Draw maze background
    ctx.fillStyle = "#2a3343"
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)

    // Draw dots
    ctx.fillStyle = "#ffffff"
    for (let x = 30; x < canvasRef.current!.width; x += 40) {
      for (let y = 30; y < canvasRef.current!.height; y += 40) {
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw Pacman
    ctx.fillStyle = "#ffff00"
    ctx.beginPath()
    ctx.arc(100, 100, 15, 0.2 * Math.PI, 1.8 * Math.PI)
    ctx.lineTo(100, 100)
    ctx.fill()

    // Draw ghost
    ctx.fillStyle = "#ff0000"
    ctx.beginPath()
    ctx.arc(200, 100, 15, Math.PI, 2 * Math.PI)
    ctx.fillRect(185, 100, 30, 15)
    ctx.fill()

    // Draw wavy bottom for ghost
    ctx.beginPath()
    ctx.moveTo(185, 115)
    ctx.lineTo(185, 120)
    ctx.lineTo(190, 115)
    ctx.lineTo(195, 120)
    ctx.lineTo(200, 115)
    ctx.lineTo(205, 120)
    ctx.lineTo(210, 115)
    ctx.lineTo(215, 120)
    ctx.lineTo(215, 115)
    ctx.fill()

    // Draw ghost eyes
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(195, 100, 4, 0, Math.PI * 2)
    ctx.arc(205, 100, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#0000ff"
    ctx.beginPath()
    ctx.arc(195, 100, 2, 0, Math.PI * 2)
    ctx.arc(205, 100, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Handle user input (key presses)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameState.gameStarted && !gameState.gameOver && !gameState.isPaused) {
      // Handle key inputs and update score
      updateScore(10)
    }
  }

  // Update the score
  const updateScore = (points: number) => {
    setGameState((prev) => ({ ...prev, score: prev.score + points }))
  }

  // End the game
  const endGame = (finalScore: number) => {
    // Cancel the animation frame
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current)
      requestIdRef.current = null
    }

    // Calculate XP based on difficulty and score
    const difficultyMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.5 : 1
    const earnedXP = Math.min(Math.ceil(finalScore * 0.1 * difficultyMultiplier), 10)

    // Call the onGameEnd callback
    if (onGameEnd) {
      onGameEnd({
        score: finalScore,
        level: gameState.level,
        completed: true,
      })
    }

    // Show toast notification for XP earned
    toast({
      title: "Game Complete!",
      description: `You earned ${earnedXP} XP!`,
    })
  }

  // Start the game
  const startGame = () => {
    setGameState({
      gameStarted: true,
      gameOver: false,
      score: 0,
      timeLeft: maxTime,
      level: initialLevel,
      isPaused: false,
    })
  }

  // Pause or resume the game
  const togglePause = () => {
    setGameState((prev) => {
      if (prev.isPaused) {
        // Resume game
        startGameLoop()
        return { ...prev, isPaused: false }
      } else {
        // Pause game
        if (requestIdRef.current) {
          cancelAnimationFrame(requestIdRef.current)
          requestIdRef.current = null
        }
        return { ...prev, isPaused: true }
      }
    })
  }

  return (
    <div className="flex flex-col items-center space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      {!gameState.gameStarted || gameState.gameOver ? (
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Pacman</h3>
          <p className="text-gray-400">Classic arcade game. Eat all the dots while avoiding ghosts!</p>

          {gameState.gameOver && (
            <div className="my-4">
              <h4 className="text-lg font-bold text-white">Game Over!</h4>
              <p className="text-[#4cc9f0] text-2xl font-bold">{gameState.score} points</p>
              {/* Calculate XP based on difficulty and score */}
              <p className="text-white">You earned XP based on your performance</p>
            </div>
          )}

          <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={startGame}>
            {gameState.gameOver ? "Play Again" : "Start Game"}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center w-full max-w-md mb-4">
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
              <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={togglePause}>
                Resume
              </Button>
            </div>
          ) : (
            <canvas ref={canvasRef} width={400} height={300} className="border border-[#4cc9f0] rounded-md" />
          )}

          <div className="text-gray-400 text-sm">Use arrow keys to move Pacman</div>

          <div className="flex justify-between w-full max-w-md">
            <Button
              variant="outline"
              className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
              onClick={togglePause}
            >
              {gameState.isPaused ? "Resume" : "Pause"}
            </Button>

            <Button
              variant="outline"
              className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
              onClick={() => {
                setGameState((prev) => ({ ...prev, gameOver: true }))
                endGame(gameState.score)
              }}
            >
              End Game
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
