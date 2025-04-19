"use client"

import { Badge } from "@/components/ui/badge"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { PacmanGame } from "@/components/games/pacman-game"
import { QuizGame } from "@/components/games/quiz-game"
import { WordScrambler } from "@/components/games/word-scrambler"
import { SpinWheel } from "@/components/games/spin-wheel"
import { MemoryGame } from "@/components/games/memory-game"
import { ChessGame } from "@/components/games/chess-game"
import type { GameScore } from "@/components/games/game-interfaces"
import { toast } from "@/components/ui/use-toast"

// Define game information
const games = [
  {
    id: "pacman",
    name: "Pacman",
    description: "Classic arcade game. Eat dots, avoid ghosts!",
    component: PacmanGame,
    icon: "🟡",
    difficulty: "medium",
  },
  {
    id: "quiz",
    name: "Quiz Game",
    description: "Test your knowledge with trivia questions",
    component: QuizGame,
    icon: "❓",
    difficulty: "easy",
  },
  {
    id: "wordscrambler",
    name: "Word Scrambler",
    description: "Unscramble words against the clock",
    component: WordScrambler,
    icon: "🔤",
    difficulty: "medium",
  },
  {
    id: "spinwheel",
    name: "Spin Wheel",
    description: "Try your luck with the cosmic wheel",
    component: SpinWheel,
    icon: "🎡",
    difficulty: "easy",
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Find matching pairs of cosmic objects",
    component: MemoryGame,
    icon: "🧠",
    difficulty: "medium",
  },
  {
    id: "chess",
    name: "Cosmic Chess",
    description: "Strategic cosmic battle on the board",
    component: ChessGame,
    icon: "♟️",
    difficulty: "hard",
  },
]

export default function MiniGames() {
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  // Find the selected game component
  const selectedGame = activeGame ? games.find((game) => game.id === activeGame) : null
  const GameComponent = selectedGame?.component

  // Handle game end
  const handleGameEnd = (gameScore: GameScore) => {
    // Here you would typically save the score to the database
    // For now, we'll just show a toast notification
    console.log("Game ended with score:", gameScore)

    // Calculate XP based on score and difficulty
    const difficultyMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.5 : 1

    const earnedXP = Math.min(Math.ceil(gameScore.score * 0.1 * difficultyMultiplier), 10)

    // Show toast notification
    toast({
      title: "Game Complete!",
      description: `Score: ${gameScore.score} - You earned ${earnedXP} XP!`,
    })
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Mini Games</h1>
        <p className="text-gray-400">Play games to earn XP and break through your productivity limits</p>
      </div>

      {!activeGame ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              className="bg-[#1a2332]/80 border-[#2a3343] hover:border-[#4cc9f0]/50 transition-all cursor-pointer"
              onClick={() => setActiveGame(game.id)}
            >
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{game.icon}</span>
                  <CardTitle className="text-xl text-white">{game.name}</CardTitle>
                </div>
                <CardDescription className="text-gray-400">{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Difficulty:</span>
                  <Badge
                    className={
                      game.difficulty === "easy"
                        ? "bg-green-500"
                        : game.difficulty === "hard"
                          ? "bg-red-500"
                          : "bg-[#4cc9f0]"
                    }
                  >
                    {game.difficulty}
                  </Badge>
                </div>
                <Button className="w-full bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black">Play Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#1a2332]/80 border-[#2a3343]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{selectedGame?.icon}</span>
              <CardTitle className="text-xl text-white">{selectedGame?.name}</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Difficulty:</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                  className="bg-[#2a3343] border-[#3a4353] text-white rounded-md px-2 py-1 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <Button
                variant="outline"
                className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
                onClick={() => setActiveGame(null)}
              >
                Back to Games
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {GameComponent && (
              <GameComponent onGameEnd={handleGameEnd} difficulty={difficulty} maxTime={60} initialLevel={1} />
            )}
          </CardContent>
        </Card>
      )}
    </MainLayout>
  )
}
