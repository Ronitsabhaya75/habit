"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { updateUserXP } from "@/lib/xp-utils"

// Chess pieces (Unicode characters)
const pieces = {
  whitePawn: "♙",
  whiteRook: "♖",
  whiteKnight: "♘",
  whiteBishop: "♗",
  whiteQueen: "♕",
  whiteKing: "♔",
  blackPawn: "♟",
  blackRook: "♜",
  blackKnight: "♞",
  blackBishop: "♝",
  blackQueen: "♛",
  blackKing: "♚",
}

// Define board initialization function
function initializeBoard() {
  const initialBoard = Array(8)
    .fill()
    .map(() => Array(8).fill(null))
  for (let col = 0; col < 8; col++) {
    initialBoard[1][col] = { type: "pawn", color: "white", hasMoved: false }
    initialBoard[6][col] = { type: "pawn", color: "black", hasMoved: false }
  }
  initialBoard[0][0] = { type: "rook", color: "white", hasMoved: false }
  initialBoard[0][7] = { type: "rook", color: "white", hasMoved: false }
  initialBoard[7][0] = { type: "rook", color: "black", hasMoved: false }
  initialBoard[7][7] = { type: "rook", color: "black", hasMoved: false }
  initialBoard[0][1] = { type: "knight", color: "white" }
  initialBoard[0][6] = { type: "knight", color: "white" }
  initialBoard[7][1] = { type: "knight", color: "black" }
  initialBoard[7][6] = { type: "knight", color: "black" }
  initialBoard[0][2] = { type: "bishop", color: "white" }
  initialBoard[0][5] = { type: "bishop", color: "white" }
  initialBoard[7][2] = { type: "bishop", color: "black" }
  initialBoard[7][5] = { type: "bishop", color: "black" }
  initialBoard[0][3] = { type: "queen", color: "white" }
  initialBoard[7][3] = { type: "queen", color: "black" }
  initialBoard[0][4] = { type: "king", color: "white", hasMoved: false }
  initialBoard[7][4] = { type: "king", color: "black", hasMoved: false }
  return initialBoard
}

export function ChessGame() {
  const [board, setBoard] = useState(initializeBoard)
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [isWhiteTurn, setIsWhiteTurn] = useState(true)
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [playerScore, setPlayerScore] = useState(0)
  const [gameStatus, setGameStatus] = useState(null)
  const [isComputerTurn, setIsComputerTurn] = useState(false)
  const [lastMove, setLastMove] = useState(null)
  const [isThinking, setIsThinking] = useState(false)
  const [winStreak, setWinStreak] = useState(0)
  const [movesHistory, setMovesHistory] = useState([])
  const [animatedSquare, setAnimatedSquare] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const boardRef = useRef(null)
  const animationTimeoutRef = useRef(null)

  // Clean up on component mount/unmount
  useEffect(() => {
    setValidMoves([])
    setSelectedPiece(null)

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }

      setSelectedPiece(null)
      setValidMoves([])
      setAnimatedSquare(null)
    }
  }, [])

  // Clear selection when computer turns or game state changes
  useEffect(() => {
    if (gameStatus !== null || isComputerTurn) {
      setValidMoves([])
      setSelectedPiece(null)
    }
  }, [gameStatus, isComputerTurn])

  // Get piece symbol
  const getPieceSymbol = (piece) => {
    if (!piece) return null
    const pieceKey = `${piece.color}${piece.type.charAt(0).toUpperCase()}${piece.type.slice(1)}`
    return pieces[pieceKey] || "?"
  }

  // Convert board position to algebraic notation
  const toAlgebraic = (row, col) => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
    return `${files[col]}${8 - row}`
  }

  // Add move to history
  const addMoveToHistory = (fromRow, fromCol, toRow, toCol, piece, capture) => {
    const pieceSymbols = {
      pawn: "",
      knight: "N",
      bishop: "B",
      rook: "R",
      queen: "Q",
      king: "K",
    }

    const from = toAlgebraic(fromRow, fromCol)
    const to = toAlgebraic(toRow, toCol)
    const pieceSymbol = pieceSymbols[piece.type]
    const moveText = `${pieceSymbol}${capture ? "x" : ""}${to}`

    setMovesHistory((prev) => [
      ...prev,
      {
        move: moveText,
        color: piece.color,
      },
    ])
  }

  // Calculate valid moves for a piece
  function calculateValidMoves(row, col) {
    const piece = board[row][col]
    if (!piece) return []
    const moves = []
    const color = piece.color
    const isWhite = color === "white"

    const addMoveIfValid = (r, c) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return false
      const targetPiece = board[r][c]
      if (!targetPiece) {
        moves.push([r, c])
        return true
      } else if (targetPiece.color !== color) {
        moves.push([r, c])
        return false
      }
      return false
    }

    if (piece.type === "pawn") {
      const direction = isWhite ? 1 : -1
      if (row + direction >= 0 && row + direction <= 7 && !board[row + direction][col]) {
        moves.push([row + direction, col])
        if (
          !piece.hasMoved &&
          row + 2 * direction >= 0 &&
          row + 2 * direction <= 7 &&
          !board[row + 2 * direction][col]
        ) {
          moves.push([row + 2 * direction, col])
        }
      }
      if (col > 0 && row + direction >= 0 && row + direction <= 7) {
        const leftDiag = board[row + direction][col - 1]
        if (leftDiag && leftDiag.color !== color) {
          moves.push([row + direction, col - 1])
        }
      }
      if (col < 7 && row + direction >= 0 && row + direction <= 7) {
        const rightDiag = board[row + direction][col + 1]
        if (rightDiag && rightDiag.color !== color) {
          moves.push([row + direction, col + 1])
        }
      }
    }

    if (piece.type === "rook" || piece.type === "queen") {
      for (let r = row - 1; r >= 0; r--) if (!addMoveIfValid(r, col)) break
      for (let r = row + 1; r <= 7; r++) if (!addMoveIfValid(r, col)) break
      for (let c = col - 1; c >= 0; c--) if (!addMoveIfValid(row, c)) break
      for (let c = col + 1; c <= 7; c++) if (!addMoveIfValid(row, c)) break
    }

    if (piece.type === "bishop" || piece.type === "queen") {
      for (let r = row - 1, c = col - 1; r >= 0 && c >= 0; r--, c--) if (!addMoveIfValid(r, c)) break
      for (let r = row - 1, c = col + 1; r >= 0 && c <= 7; r--, c++) if (!addMoveIfValid(r, c)) break
      for (let r = row + 1, c = col - 1; r <= 7 && c >= 0; r++, c--) if (!addMoveIfValid(r, c)) break
      for (let r = row + 1, c = col + 1; r <= 7 && c <= 7; r++, c++) if (!addMoveIfValid(r, c)) break
    }

    if (piece.type === "knight") {
      const knightMoves = [
        [row - 2, col - 1],
        [row - 2, col + 1],
        [row - 1, col - 2],
        [row - 1, col + 2],
        [row + 1, col - 2],
        [row + 1, col + 2],
        [row + 2, col - 1],
        [row + 2, col + 1],
      ]
      knightMoves.forEach(([r, c]) => {
        if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          const targetPiece = board[r][c]
          if (!targetPiece || targetPiece.color !== color) moves.push([r, c])
        }
      })
    }

    if (piece.type === "king") {
      const kingMoves = [
        [row - 1, col - 1],
        [row - 1, col],
        [row - 1, col + 1],
        [row, col - 1],
        [row, col + 1],
        [row + 1, col - 1],
        [row + 1, col],
        [row + 1, col + 1],
      ]
      kingMoves.forEach(([r, c]) => {
        if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          const targetPiece = board[r][c]
          if (!targetPiece || targetPiece.color !== color) moves.push([r, c])
        }
      })
    }

    return moves
  }

  // Enhanced move function with effects
  function makeMove(fromRow, fromCol, toRow, toCol) {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    setSelectedPiece(null)
    setValidMoves([])

    const newBoard = [...board.map((row) => [...row])]
    const movingPiece = { ...newBoard[fromRow][fromCol] }
    const capturedPiece = newBoard[toRow][toCol]
    let scoreBonus = 0

    if (capturedPiece) {
      // Score values for different pieces
      const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 20,
      }

      scoreBonus = pieceValues[capturedPiece.type] || 0

      setCapturedPieces((prev) => ({
        ...prev,
        [capturedPiece.color === "white" ? "white" : "black"]: [
          ...prev[capturedPiece.color === "white" ? "white" : "black"],
          capturedPiece,
        ],
      }))

      if (capturedPiece.type === "king") {
        if (capturedPiece.color === "black") {
          setGameStatus("victory")
          scoreBonus += 10 // Bonus for winning
          setWinStreak((prev) => prev + 1)

          // Extra bonus for streak
          if (winStreak + 1 >= 3) {
            scoreBonus += 5
          }

          // Update XP in the system
          updateUserXP("", "GAME_COMPLETION")

          // Show toast notification
          toast({
            title: "Victory!",
            description: `You earned ${10 + scoreBonus} XP!`,
          })
        } else {
          setGameStatus("defeat")
          setWinStreak(0)

          toast({
            title: "Defeat",
            description: "Better luck next time!",
          })
        }
      }
    }

    if (scoreBonus > 0) {
      setPlayerScore((prevScore) => prevScore + scoreBonus)
    }

    if (movingPiece.type === "pawn" || movingPiece.type === "king" || movingPiece.type === "rook") {
      movingPiece.hasMoved = true
    }

    // Add move to history
    addMoveToHistory(fromRow, fromCol, toRow, toCol, movingPiece, !!capturedPiece)

    // Pawn promotion
    if (movingPiece.type === "pawn" && (toRow === 7 || toRow === 0)) {
      movingPiece.type = "queen" // Auto-promote to queen for simplicity

      // Bonus for promotion
      if (movingPiece.color === "white") {
        setPlayerScore((prevScore) => prevScore + 2)
        toast({
          title: "Pawn Promotion!",
          description: "Your pawn has been promoted to a Queen (+2 points)",
        })
      }
    }

    newBoard[toRow][toCol] = movingPiece
    newBoard[fromRow][fromCol] = null
    setBoard(newBoard)
    setLastMove([fromRow, fromCol, toRow, toCol])
    setAnimatedSquare([toRow, toCol])

    animationTimeoutRef.current = setTimeout(() => {
      setAnimatedSquare(null)
      animationTimeoutRef.current = null
    }, 300)

    return newBoard
  }

  function handleSquareClick(row, col) {
    if (isComputerTurn || gameStatus !== null || !gameStarted) {
      return
    }

    if (!selectedPiece) {
      const piece = board[row][col]
      if (piece && piece.color === "white") {
        setSelectedPiece([row, col])
        setValidMoves(calculateValidMoves(row, col))
      } else {
        setValidMoves([])
      }
    } else {
      const [selectedRow, selectedCol] = selectedPiece
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col)

      if (isValidMove) {
        makeMove(selectedRow, selectedCol, row, col)
        setIsWhiteTurn(false)
        setIsComputerTurn(true)
      } else if (board[row][col] && board[row][col].color === "white") {
        setSelectedPiece([row, col])
        setValidMoves(calculateValidMoves(row, col))
      } else {
        setSelectedPiece(null)
        setValidMoves([])
      }
    }
  }

  function makeComputerMove() {
    setIsThinking(true)
    setTimeout(() => {
      setSelectedPiece(null)
      setValidMoves([])

      const possibleMoves = []
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col]
          if (piece && piece.color === "black") {
            const moves = calculateValidMoves(row, col)
            moves.forEach(([toRow, toCol]) => {
              let score = 0
              const target = board[toRow][toCol]
              if (target) {
                switch (target.type) {
                  case "queen":
                    score += 9
                    break
                  case "rook":
                    score += 5
                    break
                  case "bishop":
                  case "knight":
                    score += 3
                    break
                  case "pawn":
                    score += 1
                    break
                  case "king":
                    score += 100
                    break
                }
              }

              // Add positional scoring
              if (piece.type === "pawn") {
                score += 0.1 * (7 - toRow)
              }

              // Center control bonus
              if ((toRow === 3 || toRow === 4) && (toCol === 3 || toCol === 4)) {
                score += 0.3
              }

              // Add randomness
              score += Math.random() * 0.5

              possibleMoves.push({ from: [row, col], to: [toRow, toCol], score })
            })
          }
        }
      }

      if (possibleMoves.length > 0) {
        possibleMoves.sort((a, b) => b.score - a.score)

        // Use a distribution that favors better moves but still has variety
        const moveIndex = Math.floor(Math.pow(Math.random(), 2) * Math.min(possibleMoves.length, 5))
        const move = possibleMoves[moveIndex]

        const [fromRow, fromCol] = move.from
        const [toRow, toCol] = move.to

        makeMove(fromRow, fromCol, toRow, toCol)
        setIsWhiteTurn(true)
        setIsComputerTurn(false)
        setIsThinking(false)
      } else {
        setGameStatus("victory")
        const bonusPoints = 15 // Higher bonus for checkmate
        setPlayerScore((prevScore) => prevScore + bonusPoints)
        setWinStreak((prev) => prev + 1)
        setIsThinking(false)
        setIsComputerTurn(false)

        // Update XP in the system
        updateUserXP("", "GAME_COMPLETION")

        toast({
          title: "Checkmate!",
          description: `You won by checkmate! (+${bonusPoints} XP)`,
        })
      }
    }, 800)
  }

  useEffect(() => {
    if (isComputerTurn && gameStatus === null && gameStarted) {
      makeComputerMove()
    }

    if (!isWhiteTurn || isComputerTurn) {
      setValidMoves([])
      setSelectedPiece(null)
    }
  }, [isComputerTurn, gameStatus, isWhiteTurn, gameStarted])

  function resetBoard() {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }

    setBoard(initializeBoard())
    setSelectedPiece(null)
    setValidMoves([])
    setIsWhiteTurn(true)
    setCapturedPieces({ white: [], black: [] })
    setIsComputerTurn(false)
    setGameStatus(null)
    setLastMove(null)
    setMovesHistory([])
    setAnimatedSquare(null)
    setGameStarted(true)
  }

  const getCurrentRank = () => {
    if (playerScore >= 50) return "Astro Grandmaster"
    if (playerScore >= 30) return "Space Commander"
    if (playerScore >= 20) return "Cosmic Strategist"
    if (playerScore >= 10) return "Star Captain"
    return "Space Cadet"
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {!gameStarted ? (
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Cosmic Chess</h3>
          <p className="text-gray-400">Challenge your strategic thinking with a game of chess.</p>
          <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={() => setGameStarted(true)}>
            Start Game
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between w-full max-w-md mb-2">
            <Badge className="bg-[#4cc9f0] text-black">Score: {playerScore}</Badge>
            {winStreak > 0 && <Badge className="bg-amber-500 text-black">🔥 Streak: {winStreak}</Badge>}
            {isComputerTurn && <Badge className="bg-[#2a3343] animate-pulse">Computer thinking...</Badge>}
          </div>

          <div className="flex justify-between w-full max-w-md mb-2">
            <div className="flex gap-1">
              {capturedPieces.black.map((piece, i) => (
                <span key={i} className="text-amber-400 text-lg">
                  {getPieceSymbol(piece)}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {capturedPieces.white.map((piece, i) => (
                <span key={i} className="text-white text-lg">
                  {getPieceSymbol(piece)}
                </span>
              ))}
            </div>
          </div>

          <div
            className="grid grid-cols-8 gap-0 w-full max-w-md border border-[#4cc9f0]/30 rounded-md overflow-hidden"
            ref={boardRef}
          >
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isEven = (rowIndex + colIndex) % 2 === 0
                const isSelected = selectedPiece && selectedPiece[0] === 7 - rowIndex && selectedPiece[1] === colIndex
                const isValidMove = validMoves.some(([r, c]) => r === 7 - rowIndex && c === colIndex)
                const isLastMoveSquare =
                  lastMove &&
                  ((7 - rowIndex === lastMove[0] && colIndex === lastMove[1]) ||
                    (7 - rowIndex === lastMove[2] && colIndex === lastMove[3]))

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square flex items-center justify-center text-2xl cursor-pointer relative
                      ${isEven ? "bg-[#3a4353]" : "bg-[#2a3343]"}
                      ${isSelected ? "ring-2 ring-[#4cc9f0] ring-opacity-70" : ""}
                      ${isLastMoveSquare ? "bg-[#4cc9f0]/10" : ""}
                      ${isValidMove ? "after:absolute after:w-3 after:h-3 after:rounded-full after:bg-[#4cc9f0]/30" : ""}
                      hover:bg-[#4cc9f0]/20 transition-colors
                    `}
                    onClick={() => handleSquareClick(7 - rowIndex, colIndex)}
                  >
                    <span className={piece?.color === "white" ? "text-white" : "text-amber-400"}>
                      {getPieceSymbol(piece)}
                    </span>

                    {/* Coordinates */}
                    {colIndex === 0 && (
                      <span className="absolute bottom-0.5 left-1 text-xs text-gray-400">{8 - rowIndex}</span>
                    )}
                    {rowIndex === 7 && (
                      <span className="absolute top-0.5 right-1 text-xs text-gray-400">
                        {String.fromCharCode(97 + colIndex)}
                      </span>
                    )}
                  </div>
                )
              }),
            )}
          </div>

          {gameStatus && (
            <div className="bg-[#1a2332]/90 border border-[#4cc9f0]/30 rounded-lg p-4 text-center">
              <h3 className="text-xl font-bold mb-2 text-[#4cc9f0]">
                {gameStatus === "victory" ? "Victory!" : "Defeat!"}
              </h3>
              {gameStatus === "victory" && (
                <>
                  <p className="text-white mb-2">Rank: {getCurrentRank()}</p>
                  <p className="text-amber-400 mb-4">+{10 + (winStreak >= 3 ? 5 : 0)} XP earned</p>
                </>
              )}
              <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={resetBoard}>
                Play Again
              </Button>
            </div>
          )}

          {!gameStatus && (
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
                onClick={resetBoard}
              >
                Restart
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
