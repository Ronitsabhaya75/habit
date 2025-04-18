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

// Space theme colors
const spaceTheme = {
  deepSpace: '#0B1A2C',
  deepSpaceAlt: '#142943',
  deepSpaceLight: '#1D3A54',
  accentGlow: '#00FFC6',
  accentGold: '#FFD580',
  accentOrange: '#FF7F50',
  textPrimary: '#D0E7FF',
  highlight: '#FFFA81',
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
    <div className="flex flex-col items-center space-y-6 min-h-screen bg-gradient-to-br from-[#0B1A2C] to-[#142943] text-[#D0E7FF] p-4 relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {!gameStarted ? (
        <div className="text-center space-y-4 z-10">
          <h3 className="text-3xl font-bold text-[#00FFC6] font-orbitron tracking-wider">
            Cosmic Chess
          </h3>
          <p className="text-gray-400 max-w-md">
            Challenge your strategic thinking with a game of chess against our AI opponent.
            Control the white pieces and aim for victory!
          </p>
          <Button 
            className="bg-gradient-to-r from-[#00FFC6] to-[#4A90E2] hover:from-[#00FFC6]/90 hover:to-[#4A90E2]/90 text-black font-bold py-3 px-6 rounded-lg transition-all hover:scale-105 shadow-lg"
            onClick={() => setGameStarted(true)}
          >
            Start Game
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between w-full max-w-md mb-2 z-10">
            <div className="flex items-center gap-2">
              <div className="bg-[#0B1A2C] border border-[#00FFC6]/30 rounded-lg px-4 py-2">
                <span className="text-[#00FFC6]">Score:</span>{" "}
                <span className="text-[#FFD580] font-bold">{playerScore}</span>
              </div>
              {winStreak > 0 && (
                <div className="bg-[#0B1A2C] border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-1">
                  <span className="text-amber-500">🔥</span>
                  <span className="text-amber-500">Streak: {winStreak}</span>
                </div>
              )}
            </div>
            {isComputerTurn && (
              <div className="bg-[#0B1A2C] border border-[#FF7F50]/30 rounded-lg px-4 py-2 animate-pulse">
                Computer thinking...
              </div>
            )}
          </div>

          <div className="flex justify-between w-full max-w-md mb-2 z-10">
            <div className="flex gap-1 bg-[#0B1A2C]/80 border border-[#00FFC6]/20 rounded-lg px-3 py-2">
              {capturedPieces.black.map((piece, i) => (
                <span key={i} className="text-[#FFD580] text-xl">
                  {getPieceSymbol(piece)}
                </span>
              ))}
            </div>
            <div className="flex gap-1 bg-[#0B1A2C]/80 border border-[#00FFC6]/20 rounded-lg px-3 py-2">
              {capturedPieces.white.map((piece, i) => (
                <span key={i} className="text-white text-xl">
                  {getPieceSymbol(piece)}
                </span>
              ))}
            </div>
          </div>

          <div
            className="grid grid-cols-8 gap-0 w-full max-w-md border border-[#00FFC6]/30 rounded-md overflow-hidden shadow-lg relative z-10"
            ref={boardRef}
            style={{
              background: "rgba(14, 26, 64, 0.8)",
              backdropFilter: "blur(8px)",
            }}
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
                const isAnimated = animatedSquare && 7 - rowIndex === animatedSquare[0] && colIndex === animatedSquare[1]

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square flex items-center justify-center text-3xl cursor-pointer relative
                      ${isEven ? "bg-[#1D3A54]/60" : "bg-[#0B1A2C]/90"}
                      ${isSelected ? "ring-2 ring-[#00FFC6] ring-opacity-70 shadow-inner shadow-[#00FFC6]/30" : ""}
                      ${isLastMoveSquare ? "bg-[#00FFC6]/10" : ""}
                      ${isValidMove ? "after:absolute after:w-4 after:h-4 after:rounded-full after:bg-[#00FFC6]/30 after:border after:border-[#00FFC6]/60" : ""}
                      transition-all duration-200
                      ${!isComputerTurn && gameStatus === null ? "hover:bg-[#00FFC6]/20" : ""}
                      ${isAnimated ? "scale-105" : ""}
                    `}
                    onClick={() => handleSquareClick(7 - rowIndex, colIndex)}
                  >
                    <span 
                      className={`
                        ${piece?.color === "white" ? "text-white drop-shadow-[0_0_6px_rgba(184,255,249,0.7)]" : "text-[#FFD580] drop-shadow-[0_0_6px_rgba(255,213,128,0.7)]"}
                        ${isAnimated ? "animate-pulse" : ""}
                      `}
                    >
                      {getPieceSymbol(piece)}
                    </span>

                    {/* Coordinates */}
                    {colIndex === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs text-[#D0E7FF]/60 font-bold">
                        {8 - rowIndex}
                      </span>
                    )}
                    {rowIndex === 7 && (
                      <span className="absolute top-1 right-1 text-xs text-[#D0E7FF]/60 font-bold">
                        {String.fromCharCode(97 + colIndex)}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-between w-full max-w-md z-10">
            <div className="bg-[#0B1A2C]/80 border border-[#00FFC6]/30 rounded-lg px-4 py-2">
              {isWhiteTurn ? "White's Turn" : "Black's Turn"}
            </div>
            <div className="bg-[#0B1A2C]/80 border border-[#00FFC6]/30 rounded-lg px-4 py-2 flex items-center gap-1">
              <span className="text-[#FFD580]">✦</span>
              <span>Rank:</span>
              <span className="text-[#00FFC6] font-bold">{getCurrentRank()}</span>
            </div>
          </div>

          {gameStatus && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#0B1A2C] border border-[#00FFC6]/30 rounded-xl p-6 text-center max-w-md w-full mx-4">
                <h3 className="text-3xl font-bold mb-4 text-[#00FFC6]">
                  {gameStatus === "victory" ? "Victory!" : "Defeat!"}
                </h3>
                {gameStatus === "victory" && (
                  <>
                    <p className="text-[#D0E7FF] mb-2">Rank: {getCurrentRank()}</p>
                    <p className="text-[#FFD580] text-xl mb-6">
                      +{10 + (winStreak >= 3 ? 5 : 0)} XP earned
                    </p>
                  </>
                )}
                <Button 
                  className="bg-gradient-to-r from-[#00FFC6] to-[#4A90E2] hover:from-[#00FFC6]/90 hover:to-[#4A90E2]/90 text-black font-bold py-3 px-6 rounded-lg transition-all hover:scale-105 shadow-lg w-full"
                  onClick={resetBoard}
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {!gameStatus && (
            <div className="flex space-x-4 z-10">
              <Button
                className="bg-[#0B1A2C] hover:bg-[#142943] text-[#D0E7FF] border border-[#00FFC6]/30 rounded-lg px-6 py-2 transition-all"
                onClick={resetBoard}
              >
                Restart
              </Button>
            </div>
          )}

          {/* Moves history */}
          {movesHistory.length > 0 && (
            <div className="absolute top-20 right-4 bg-[#0B1A2C]/80 border border-[#00FFC6]/30 rounded-lg p-3 text-sm max-h-40 overflow-y-auto w-32 z-10">
              <div className="font-bold text-[#00FFC6] mb-2 text-center">Moves</div>
              {movesHistory.slice(-8).map((move, index) => (
                <div key={index} className="flex justify-between py-1 border-b border-[#00FFC6]/10 last:border-0">
                  <span>{Math.floor(index/2) + 1}.</span>
                  <span className={move.color === "white" ? "text-white" : "text-[#FFD580]"}>
                    {move.move}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
