"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface GameWrapperProps {
  title: string
  description: string
  children: React.ReactNode
  gameStarted: boolean
  gameOver: boolean
  score: number
  onStart: () => void
  onEnd: () => void
  showScore?: boolean
  customControls?: React.ReactNode
}

export function GameWrapper({
  title,
  description,
  children,
  gameStarted,
  gameOver,
  score,
  onStart,
  onEnd,
  showScore = true,
  customControls,
}: GameWrapperProps) {
  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {!gameStarted || gameOver ? (
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-400">{description}</p>

          {gameOver && (
            <div className="my-4">
              <h4 className="text-lg font-bold text-white">Game Over!</h4>
              <p className="text-[#4cc9f0] text-2xl font-bold">{score} points</p>
              <p className="text-white">You earned {Math.min(Math.floor(score * 0.2), 10)} XP</p>
            </div>
          )}

          <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={onStart}>
            {gameOver ? "Play Again" : "Start Game"}
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          {showScore && (
            <div className="flex justify-between items-center mb-4">
              <Badge className="bg-[#4cc9f0] text-black">Score: {score}</Badge>
            </div>
          )}

          {children}

          {customControls ? (
            customControls
          ) : (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
                onClick={onEnd}
              >
                End Game
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
