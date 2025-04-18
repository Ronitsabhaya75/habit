"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
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

// Initialize board correctly
function initializeBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null))

  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: "pawn", color: "black", hasMoved: false }
    board[6][col] = { type: "pawn", color: "white", hasMoved: false }
  }

  const backRank = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: "black", hasMoved: false }
    board[7][col] = { type: backRank[col], color: "white", hasMoved: false }
  }

  return board
}

// Algebraic notation
const toAlgebraic = (row, col) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
  return `${files[col]}${8 - row}`
}

export function ChessGame() {
  const [board, setBoard] = useState(initializeBoard)
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [isWhiteTurn, setIsWhiteTurn] = useState(true)
  const [isComputerTurn, setIsComputerTurn] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerScore, setPlayerScore] = useState(0)
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [gameStatus, setGameStatus] = useState(null)
  const animationTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
    }
  }, [])

  const getPieceSymbol = (piece) => {
    if (!piece) return ""
    return pieces[`${piece.color}${piece.type.charAt(0).toUpperCase()}${piece.type.slice(1)}`]
  }

  const calculateValidMoves = (row, col) => {
    const piece = board[row][col]
    if (!piece) return []
    const moves = []
    const color = piece.color
    const isWhite = color === "white"

    const addMove = (r, c) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return false
      const target = board[r][c]
      if (!target) {
        moves.push([r, c])
        return true
      } else if (target.color !== color) {
        moves.push([r, c])
        return false
      }
      return false
    }

    if (piece.type === "pawn") {
      const dir = isWhite ? -1 : 1
      if (board[row + dir]?.[col] == null) {
        moves.push([row + dir, col])
        if (!piece.hasMoved && board[row + 2 * dir]?.[col] == null) {
          moves.push([row + 2 * dir, col])
        }
      }
      if (col > 0 && board[row + dir]?.[col - 1]?.color !== color) moves.push([row + dir, col - 1])
      if (col < 7 && board[row + dir]?.[col + 1]?.color !== color) moves.push([row + dir, col + 1])
    }

    if (["rook", "queen"].includes(piece.type)) {
      for (let r = row - 1; r >= 0; r--) if (!addMove(r, col)) break
      for (let r = row + 1; r <= 7; r++) if (!addMove(r, col)) break
      for (let c = col - 1; c >= 0; c--) if (!addMove(row, c)) break
      for (let c = col + 1; c <= 7; c++) if (!addMove(row, c)) break
    }

    if (["bishop", "queen"].includes(piece.type)) {
      for (let dr = -1; dr <= 1; dr += 2) {
        for (let dc = -1; dc <= 1; dc += 2) {
          let r = row + dr, c = col + dc
          while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
            if (!addMove(r, c)) break
            r += dr
            c += dc
          }
        }
      }
    }

    if (piece.type === "knight") {
      const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
      knightMoves.forEach(([dr, dc]) => {
        const r = row + dr, c = col + dc
        if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && (!board[r][c] || board[r][c].color !== color))
          moves.push([r, c])
      })
    }

    if (piece.type === "king") {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            const r = row + dr, c = col + dc
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && (!board[r][c] || board[r][c].color !== color))
              moves.push([r, c])
          }
        }
      }
    }
    return moves
  }

  const makeMove = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol]
    const newBoard = board.map(r => [...r])

    if (board[toRow][toCol]) {
      capturedPieces[piece.color === "white" ? "black" : "white"].push(board[toRow][toCol])
      setPlayerScore(score => score + 1)
    }

    newBoard[toRow][toCol] = { ...piece, hasMoved: true }
    newBoard[fromRow][fromCol] = null
    setBoard(newBoard)
    setSelectedPiece(null)
    setValidMoves([])
  }

  const handleSquareClick = (row, col) => {
    if (!gameStarted || isComputerTurn || gameStatus) return

    if (!selectedPiece) {
      const piece = board[row][col]
      if (piece && piece.color === "white") {
        setSelectedPiece([row, col])
        setValidMoves(calculateValidMoves(row, col))
      }
    } else {
      const [selRow, selCol] = selectedPiece
      if (validMoves.some(([r, c]) => r === row && c === col)) {
        makeMove(selRow, selCol, row, col)
        setIsWhiteTurn(false)
        setIsComputerTurn(true)
      } else {
        setSelectedPiece(null)
        setValidMoves([])
      }
    }
  }

  useEffect(() => {
    if (isComputerTurn && !gameStatus && gameStarted) {
      setTimeout(() => {
        const moves = []
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const piece = board[r][c]
            if (piece && piece.color === "black") {
              const valid = calculateValidMoves(r, c)
              valid.forEach(([tr, tc]) => moves.push([r, c, tr, tc]))
            }
          }
        }
        if (moves.length) {
          const [fr, fc, tr, tc] = moves[Math.floor(Math.random() * moves.length)]
          makeMove(fr, fc, tr, tc)
          setIsWhiteTurn(true)
          setIsComputerTurn(false)
        } else {
          setGameStatus("Victory")
        }
      }, 800)
    }
  }, [isComputerTurn, board])

  const startNewGame = () => {
    setBoard(initializeBoard())
    setSelectedPiece(null)
    setValidMoves([])
    setIsWhiteTurn(true)
    setIsComputerTurn(false)
    setGameStatus(null)
    setPlayerScore(0)
    setCapturedPieces({ white: [], black: [] })
    setGameStarted(true)
  }

  return (
    <div className="flex flex-col items-center p-4">
      {!gameStarted ? (
        <Button onClick={startNewGame}>Start Game</Button>
      ) : (
        <div className="grid grid-cols-8 gap-0 w-96">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1
              const isSelected = selectedPiece && selectedPiece[0] === rowIndex && selectedPiece[1] === colIndex
              const isValid = validMoves.some(([r, c]) => r === rowIndex && c === colIndex)

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={`h-12 w-12 flex items-center justify-center cursor-pointer
                  ${isDark ? "bg-[#0B1A2C]" : "bg-[#1D3A54]"}
                  ${isSelected ? "ring-2 ring-[#00FFC6]" : ""}
                  ${isValid ? "bg-[#00FFC6]/30" : ""}
                  `}
                >
                  <span className="text-xl">{getPieceSymbol(piece)}</span>
                  {rowIndex === 7 && (
                    <span className="absolute bottom-0 right-0 text-xs text-white">{String.fromCharCode(97 + colIndex)}</span>
                  )}
                  {colIndex === 0 && (
                    <span className="absolute top-0 left-0 text-xs text-white">{8 - rowIndex}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
