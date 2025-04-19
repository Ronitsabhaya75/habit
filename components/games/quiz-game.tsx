"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GameWrapper } from "./game-wrapper"
import { toast } from "@/components/ui/use-toast"

const quizQuestions = [
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

export function QuizGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const handleStartGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer("")
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNextQuestion = () => {
    // Check if answer is correct
    if (selectedAnswer === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }

    const nextQuestion = currentQuestion + 1
    if (nextQuestion < quizQuestions.length) {
      setCurrentQuestion(nextQuestion)
      setSelectedAnswer("")
    } else {
      setGameOver(true)
      setGameStarted(false)

      // Award XP
      const earnedXP = Math.min(score * 2, 10)
      toast({
        title: "Quiz Complete!",
        description: `You earned ${earnedXP} XP!`,
      })
    }
  }

  const customControls = (
    <div className="mt-4 flex justify-between">
      <div className="flex items-center">
        <Badge className="bg-[#2a3343]">
          Question {currentQuestion + 1}/{quizQuestions.length}
        </Badge>
      </div>
      <Button
        className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black"
        onClick={handleNextQuestion}
        disabled={!selectedAnswer}
      >
        {currentQuestion === quizQuestions.length - 1 ? "Finish" : "Next"}
      </Button>
    </div>
  )

  return (
    <GameWrapper
      title="Quiz Game"
      description="Test your knowledge with this quiz!"
      gameStarted={gameStarted}
      gameOver={gameOver}
      score={score}
      onStart={handleStartGame}
      onEnd={() => {
        setGameOver(true)
        setGameStarted(false)
      }}
      customControls={customControls}
    >
      <Card className="bg-[#2a3343] border-[#3a4353]">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium text-white mb-4">{quizQuestions[currentQuestion].question}</h3>

          <RadioGroup value={selectedAnswer} className="space-y-3">
            {quizQuestions[currentQuestion].options.map((option, index) => (
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
    </GameWrapper>
  )
}
