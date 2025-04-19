"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { GameProps, GameState } from "./game-interfaces"
import { toast } from "@/components/ui/use-toast"

// Quiz question interface
interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
}

// Sample quiz questions
const quizQuestions: QuizQuestion[] = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
  },
  {
    question: "What is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctAnswer: "Blue Whale",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: "Au",
  },
]

export function QuizGame({ onGameEnd, initialLevel = 1, maxTime = 60, difficulty = "medium" }: GameProps) {
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    gameOver: false,
    score: 0,
    timeLeft: maxTime,
    level: initialLevel,
    isPaused: false,
  })
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>([...quizQuestions])

  // Timer effect
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

  // Shuffle questions based on difficulty
  useEffect(() => {
    if (gameState.gameStarted) {
      // Shuffle the questions
      const shuffledQuestions = [...quizQuestions].sort(() => Math.random() - 0.5)

      // Select different number of questions based on difficulty
      const questionCount = difficulty === "easy" ? 3 : difficulty === "hard" ? 7 : 5

      setQuestions(shuffledQuestions.slice(0, questionCount))
      setCurrentQuestion(0)
      setSelectedAnswer("")
    }
  }, [gameState.gameStarted, difficulty])

  const handleStartGame = () => {
    setGameState({
      gameStarted: true,
      gameOver: false,
      score: 0,
      timeLeft: maxTime,
      level: initialLevel,
      isPaused: false,
    })
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    // Check if answer is correct
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      // Award points based on difficulty
      const pointMultiplier = difficulty === "easy" ? 1 : difficulty === "hard" ? 3 : 2
      setGameState((prev) => ({ ...prev, score: prev.score + 10 * pointMultiplier }))
    }

    // Move to next question or end game
    const nextQuestion = currentQuestion + 1
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion)
      setSelectedAnswer("")
    } else {
      handleGameEnd(gameState.score + (selectedAnswer === questions[currentQuestion].correctAnswer ? 10 : 0))
    }
  }

  const handleGameEnd = (finalScore: number) => {
    setGameState((prev) => ({ ...prev, gameOver: true }))

    // Calculate XP based on difficulty and score
    const difficultyMultiplier = difficulty === "easy" ? 0.8 : difficulty === "hard" ? 1.5 : 1
    const maxPossibleScore = questions.length * 10 * (difficulty === "easy" ? 1 : difficulty === "hard" ? 3 : 2)
    const scorePercentage = maxPossibleScore > 0 ? finalScore / maxPossibleScore : 0

    // Calculate XP (max 10)
    const earnedXP = Math.min(Math.ceil(scorePercentage * 10 * difficultyMultiplier), 10)

    // Call onGameEnd callback
    if (onGameEnd) {
      onGameEnd({
        score: finalScore,
        level: gameState.level,
        completed: true,
      })
    }

    // Show toast notification
    toast({
      title: "Quiz Complete!",
      description: `You earned ${earnedXP} XP!`,
    })
  }

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {!gameState.gameStarted || gameState.gameOver ? (
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Quiz Game</h3>
          <p className="text-gray-400">Test your knowledge with this quiz!</p>

          {gameState.gameOver && (
            <div className="my-4">
              <h4 className="text-lg font-bold text-white">Quiz Complete!</h4>
              <p className="text-[#4cc9f0] text-2xl font-bold">{gameState.score} points</p>
              <p className="text-white">
                {gameState.score >= questions.length * 20
                  ? "Excellent!"
                  : gameState.score >= questions.length * 10
                    ? "Good job!"
                    : "Keep practicing!"}
              </p>
            </div>
          )}

          <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={handleStartGame}>
            {gameState.gameOver ? "Play Again" : "Start Quiz"}
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <Badge className="bg-[#4cc9f0] text-black">
              Question {currentQuestion + 1}/{questions.length}
            </Badge>
            {gameState.timeLeft !== undefined && (
              <Badge className={gameState.timeLeft <= 10 ? "bg-red-500" : "bg-[#2a3343]"}>
                Time: {gameState.timeLeft}s
              </Badge>
            )}
            <Badge className="bg-[#4cc9f0]">Score: {gameState.score}</Badge>
          </div>

          {gameState.isPaused ? (
            <div className="relative w-full bg-[#1a2332]/90 rounded-lg border border-[#2a3343] flex flex-col items-center justify-center h-[300px]">
              <h3 className="text-xl font-bold text-white mb-4">Quiz Paused</h3>
              <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={togglePause}>
                Resume
              </Button>
            </div>
          ) : (
            <Card className="bg-[#2a3343] border-[#3a4353]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-white mb-4">{questions[currentQuestion]?.question}</h3>

                <RadioGroup value={selectedAnswer} className="space-y-3">
                  {questions[currentQuestion]?.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`option-${index}`}
                        className="text-[#4cc9f0]"
                        onClick={() => handleAnswerSelect(option)}
                      />
                      <Label htmlFor={`option-${index}`} className="text-white">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
              onClick={togglePause}
            >
              {gameState.isPaused ? "Resume" : "Pause"}
            </Button>

            <Button
              className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black"
              onClick={handleNextQuestion}
              disabled={!selectedAnswer || gameState.isPaused}
            >
              {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
