"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GameWrapper } from "./game-wrapper"
import { toast } from "@/components/ui/use-toast"

export function MemoryGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)

  // Initialize game
  const initializeGame = () => {
    const emojis = ["🚀", "🌟", "🔥", "💎", "🎮", "🏆", "🎯", "🎲"]
    const cardPairs = [...emojis, ...emojis].map((emoji, index) => ({
      id: index,
      emoji,
      flipped: false,
      matched: false,
    }))

    // Shuffle cards
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]]
    }

    setCards(cardPairs)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setScore(0)
    setGameStarted(true)
    setGameOver(false)
  }

  const handleCardClick = (id: number) => {
    // Ignore if already flipped or matched
    if (cards[id].flipped || cards[id].matched || flippedCards.length >= 2) {
      return
    }

    // Flip the card
    const updatedCards = [...cards]
    updatedCards[id].flipped = true
    setCards(updatedCards)

    // Add to flipped cards
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    // If two cards are flipped, check for a match
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)

      const [firstId, secondId] = newFlippedCards
      const emojis = ["🚀", "🌟", "🔥", "💎", "🎮", "🏆", "🎯", "🎲"]
      if (cards[firstId].emoji === cards[secondId].emoji) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...cards]
          matchedCards[firstId].matched = true
          matchedCards[secondId].matched = true
          setCards(matchedCards)
          setFlippedCards([])
          setMatchedPairs(matchedPairs + 1)
          setScore(score + 10)

          // Check if game is over
          if (matchedPairs + 1 === emojis.length) {
            handleGameOver()
          }
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...cards]
          resetCards[firstId].flipped = false
          resetCards[secondId].flipped = false
          setCards(resetCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const handleGameOver = () => {
    setGameOver(true)
    setGameStarted(false)

    // Calculate final score based on moves
    const finalScore = Math.max(100 - moves * 5, 10)
    setScore(finalScore)

    // Award XP
    const earnedXP = Math.min(Math.floor(finalScore / 10), 10)
    toast({
      title: "Memory Game Complete!",
      description: `You earned ${earnedXP} XP!`,
    })
  }

  const customControls = (
    <div className="mt-4 flex justify-between">
      <Badge className="bg-[#2a3343]">Moves: {moves}</Badge>
      <Badge className="bg-[#4cc9f0] text-black">
        Pairs: {matchedPairs}/{cards.length / 2}
      </Badge>

      <Button
        variant="outline"
        className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
        onClick={handleGameOver}
      >
        End Game
      </Button>
    </div>
  )

  return (
    <GameWrapper
      title="Memory Match"
      description="Find all matching pairs with the fewest moves!"
      gameStarted={gameStarted}
      gameOver={gameOver}
      score={score}
      onStart={initializeGame}
      onEnd={handleGameOver}
      customControls={customControls}
    >
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <button
            key={card.id}
            className={`aspect-square flex items-center justify-center text-2xl rounded-md transition-all duration-300 ${
              card.flipped || card.matched ? "bg-[#4cc9f0] transform rotate-y-180" : "bg-[#2a3343] hover:bg-[#3a4353]"
            }`}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched}
          >
            {card.flipped || card.matched ? card.emoji : ""}
          </button>
        ))}
      </div>
    </GameWrapper>
  )
}
