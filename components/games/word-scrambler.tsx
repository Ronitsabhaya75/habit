"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GameWrapper } from "./game-wrapper"
import { toast } from "@/components/ui/use-toast"

const wordList = [
  "HABIT",
  "QUEST",
  "TRACK",
  "GOALS",
  "FOCUS",
  "DAILY",
  "TASKS",
  "LEVEL",
  "SCORE",
  "BADGE",
  "GAMES",
  "CHESS",
  "BRAIN",
  "LEARN",
  "SKILL",
]

export function WordScrambler() {
  const [gameStarted, setGameStarted] = useState(false)
  const [currentWord, setCurrentWord] = useState("")
  const [scrambledWord, setScrambledWord] = useState("")
  const [userGuess, setUserGuess] = useState("")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameOver, setGameOver] = useState(false)

  const scrambleWord = (word: string) => {
    const wordArray = word.split("")
    for (let i = wordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]]
    }
    return wordArray.join("")
  }

  const getNewWord = () => {
    const randomIndex = Math.floor(Math.random() * wordList.length)
    const word = wordList[randomIndex]
    setCurrentWord(word)

    let scrambled = scrambleWord(word)
    // Make sure the scrambled word is different from the original
    while (scrambled === word) {
      scrambled = scrambleWord(word)
    }

    setScrambledWord(scrambled)
    setUserGuess("")
  }

  const handleStartGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setTimeLeft(30)
    getNewWord()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (userGuess.toUpperCase() === currentWord) {
      setScore(score + 1)
      getNewWord()
    }
  }

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (gameStarted && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setGameOver(true)
            setGameStarted(false)

            // Award XP
            const earnedXP = Math.min(score, 10)
            toast({
              title: "Game Complete!",
              description: `You earned ${earnedXP} XP!`,
            })

            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [gameStarted, gameOver, score])

  const customControls = (
    <div className="flex justify-between items-center mt-4">
      <Badge className={timeLeft <= 10 ? "bg-red-500" : "bg-[#2a3343]"}>Time: {timeLeft}s</Badge>
    </div>
  )

  return (
    <GameWrapper
      title="Word Scrambler"
      description="Unscramble as many words as you can in 30 seconds!"
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
          <div className="text-center mb-6">
            <h3 className="text-lg text-gray-400 mb-2">Unscramble this word:</h3>
            <div className="text-3xl font-bold tracking-wider text-white">{scrambledWord}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              placeholder="Enter your guess"
              className="bg-[#1a2332] border-[#3a4353] text-white text-center text-xl"
              autoComplete="off"
              autoFocus
            />

            <Button type="submit" className="w-full bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </GameWrapper>
  )
}
