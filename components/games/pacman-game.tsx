"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { GameWrapper } from "./game-wrapper"
import { toast } from "@/components/ui/use-toast"

export function PacmanGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (gameStarted && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Simple Pacman rendering
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw maze
        ctx.fillStyle = "#2a3343"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw dots
        ctx.fillStyle = "#ffffff"
        for (let x = 30; x < canvas.width; x += 40) {
          for (let y = 30; y < canvas.height; y += 40) {
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
    }
  }, [gameStarted])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameStarted) {
      // Simple score increment for demo
      setScore((prev) => prev + 10)
    }
  }

  const handleStartGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
  }

  const handleEndGame = () => {
    setGameStarted(false)
    setGameOver(true)

    // Award XP
    const earnedXP = Math.min(Math.floor(score * 0.2), 10)
    toast({
      title: "Game Complete!",
      description: `You earned ${earnedXP} XP!`,
    })
  }

  const customControls = (
    <div className="mt-4 flex flex-col gap-2">
      <div className="text-gray-400 text-sm text-center">Use arrow keys to move Pacman</div>
      <Button
        variant="outline"
        className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
        onClick={handleEndGame}
      >
        End Game
      </Button>
    </div>
  )

  return (
    <GameWrapper
      title="Pacman"
      description="Classic arcade game. Eat all the dots while avoiding ghosts!"
      gameStarted={gameStarted}
      gameOver={gameOver}
      score={score}
      onStart={handleStartGame}
      onEnd={handleEndGame}
      customControls={customControls}
    >
      <div onKeyDown={handleKeyDown} tabIndex={0}>
        <canvas ref={canvasRef} width={400} height={300} className="border border-[#4cc9f0] rounded-md" />
      </div>
    </GameWrapper>
  )
}
