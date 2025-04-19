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

// Define board initialization function
function initializeBoard() {
  const initialBoard = Array(8)
    .fill()
    .map(() => Array(8).fill(null))
  // White pieces (bottom, row 6 and 7)
  for (let col = 0; col < 8; col++) {
    initialBoard[6][col] = { type: "pawn", color: "white", hasMoved: false }
  }
  initialBoard[7][0] = { type: "rook", color: "white", hasMoved: false }
  initialBoard[7][7] = { type: "rook", color: "white", hasMoved: false }
  initialBoard[7][1] = { type: "knight", color: "white" }
  initialBoard[7][6] = { type: "knight", color: "white" }
  initialBoard[7][2] = { type: "bishop", color: "white" }
  initialBoard[7][5] = { type: "bishop", color: "white" }
  initialBoard[7][3] = { type: "queen", color: "white" }
  initialBoard[7][4] = { type: "king", color: "white", hasMoved: false }

  // Black pieces (top, row 0 and 1)
  for (let col = 0; col < 8; col++) {
    initialBoard[1][col] = { type: "pawn", color: "black", hasMoved: false }
  }
  initialBoard[0][0] = { type: "rook", color: "black", hasMoved: false }
  initialBoard[0][7] = { type: "rook", color: "black", hasMoved: false }
  initialBoard[0][1] = { type: "knight", color: "black" }
  initialBoard[0][6] = { type: "knight", color: "black" }
  initialBoard[0][2] = { type: "bishop", color: "black" }
  initialBoard[0][5] = { type: "bishop", color: "black" }
  initialBoard[0][3] = { type: "queen", color: "black" }
  initialBoard[0][4] = { type: "king", color: "black", hasMoved: false }

  return initialBoard
}


export function ChessGame() {
  const [board, setBoard] = useState(initializeBoard)
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [isWhiteTurn, setIsWhiteTurn] = useState(true)
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })
  const [newCapturedPiece, setNewCapturedPiece] = useState(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [scoreChange, setScoreChange] = useState(null)
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
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const color = piece.color;
  
  // For pawn movement direction
  const isWhite = color === "white";
  const direction = isWhite ? -1 : 1; // White moves up (decreasing row), black moves down (increasing row)

  const addMoveIfValid = (r, c) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const targetPiece = board[r][c];
    if (!targetPiece) {
      moves.push([r, c]);
      return true;
    } else if (targetPiece.color !== color) {
      moves.push([r, c]);
      return false;
    }
    return false;
  };

  if (piece.type === "pawn") {
    // Forward movement
    if (row + direction >= 0 && row + direction <= 7 && !board[row + direction][col]) {
      moves.push([row + direction, col]);
      // Double move from starting position
      const startingRow = isWhite ? 6 : 1;
      if (row === startingRow && !board[row + 2 * direction][col]) {
        moves.push([row + 2 * direction, col]);
      }
    }
    
    // Diagonal captures
    if (col > 0) {
      const leftDiag = board[row + direction][col - 1];
      if (leftDiag && leftDiag.color !== color) {
        moves.push([row + direction, col - 1]);
      }
    }
    if (col < 7) {
      const rightDiag = board[row + direction][col + 1];
      if (rightDiag && rightDiag.color !== color) {
        moves.push([row + direction, col + 1]);
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

      setNewCapturedPiece({
        piece: capturedPiece,
        timestamp: Date.now()
      })

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
      setScoreChange({ value: `+${scoreBonus}`, timestamp: Date.now() })
    }

    if (movingPiece.type === "pawn" || movingPiece.type === "king" || movingPiece.type === "rook") {
      movingPiece.hasMoved = true
    }

    // Add move to history
    addMoveToHistory(fromRow, fromCol, toRow, toCol, movingPiece, !!capturedPiece)

    // Pawn promotion
    if (movingPiece.type === "pawn" && (toRow === 7 || toRow === 0)) {
      const promotionOptions = ['queen', 'rook', 'bishop', 'knight']
      const promotionChoice = window.prompt(
        "⭐ Promote your pawn! Choose: queen, rook, bishop, knight", 
        "queen"
      )
      
      movingPiece.type = promotionOptions.includes(promotionChoice) ? promotionChoice : 'queen'

      // Bonus for promotion
      if (movingPiece.color === "white") {
        setPlayerScore((prevScore) => prevScore + 2)
        setScoreChange({ value: '+2', timestamp: Date.now() })
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
    return;
  }

  if (!selectedPiece) {
    const piece = board[row][col]; // This is correct because we're using displayRow for rendering
    if (piece && piece.color === "white") {
      setSelectedPiece([row, col]);
      setValidMoves(calculateValidMoves(row, col));
    }else {
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
    setNewCapturedPiece(null)
    setScoreChange(null)
    setGameStarted(true)
  }

  const getCurrentRank = () => {
    if (playerScore >= 50) return "Astro Grandmaster"
    if (playerScore >= 30) return "Space Commander"
    if (playerScore >= 20) return "Cosmic Strategist"
    if (playerScore >= 10) return "Star Captain"
    return "Space Cadet"
  }

  const renderCapturedPieces = (color) => {
    return capturedPieces[color].map((piece, index) => {
      const isNew = newCapturedPiece && 
                   newCapturedPiece.piece.color === piece.color && 
                   index === capturedPieces[color].length - 1
      
      return (
        <span 
          key={index}
          className={`text-lg ${isNew ? "animate-pulse" : ""} ${piece.color === "white" ? "text-white" : "text-amber-400"}`}
        >
          {getPieceSymbol(piece)}
        </span>
      )
    })
  }

  const renderMovesHistory = () => {
    if (movesHistory.length === 0) return null
    
    return (
      <div className="absolute top-16 right-2 bg-[#1a2332]/90 border border-[#4cc9f0]/30 rounded-lg p-2 text-xs w-32 max-h-40 overflow-y-auto">
        {movesHistory.slice(-8).map((move, index) => (
          <div key={index} className="flex justify-between py-1 border-b border-[#4cc9f0]/10 last:border-0">
            <span>{Math.floor(index/2) + 1}.</span>
            <span className={move.color === "white" ? "text-white" : "text-amber-400"}>{move.move}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0B1A2C] via-[#142943] to-[#1D3A54] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTExIDE4YzMuODY2IDAgNy0zLjEzNCA3LTdzLTMuMTM0LTctNy03LTcgMy4xMzQtNyA3IDMuMTM0IDcgNyA3em00OCAyNWMzLjg2NiAwIDctMy4xMzQgNy03cy0zLjEzNC03LTctNy03IDMuMTM0LTcgNyAzLjEzNCA3IDcgN3ptLTQzLTdjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6bTYzIDMxYzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzek0zNCA5MGMxLjY1NyAwIDMtMS4zNDMgMy0zcy0xLjM0My0zLTMtMy0zIDEuMzQzLTMgMyAxLjM0MyAzIDMgM3ptNTYtNzZjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6TTEyIDg2YzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMjgtNjVjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0yMy0xMWMyLjc2IDAgNS0yLjI0IDUtNXMtMi4yNC01LTUtNS01IDIuMjQtNSA1IDIuMjQgNSA1IDV6bS02IDYwYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMjkgMjJjMi43NiAwIDUtMi4yNCA1LTVzLTIuMjQtNS01LTUtNSAyLjI0LTUgNSAyLjI0IDUgNSA1ek0zMiA2M2MyLjc2IDAgNS0yLjI0IDUtNXMtMi4yNC01LTUtNS01IDIuMjQtNSA1IDIuMjQgNSA1IDV6bTU3LTEzYzIuNzYgMCA1LTIuMjQgNS01cy0yLjI0LTUtNS01LTUgMi4yNC01IDUgMi4yNCA1IDUgNXptLTktMjFjMS4xMDUgMCAyLS44OTUgMi0ycy0uODk1LTItMi0yLTIgLjg5NS0yIDIgLjg5NSAyIDIgMnpNNjAgOTFjMS4xMDUgMCAyLS44OTUgMi0ycy0uODk1LTItMi0yLTIgLjg5NS0yIDIgLjg5NSAyIDIgMnptLTI1LTUwYzEuMTA1IDAgMi0uODk1IDItMnMtLjg5NS0yLTItMi0yIC44OTUtMiAyIC44OTUgMiAyIDJ6TTEyIDYwYzEuMTA1IDAgMi0uODk1IDItMnMtLjg5NS0yLTItMi0yIC44OTUtMiAyIC44OTUgMiAyIDJ6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBmaWxsLW9wYWNpdHk9IjAuMDUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-20"></div>
      <div className="absolute inset-0 bg-radial-gradient(circle_at_30%_50%,_rgba(0,_255,_198,_0.1)_0%,_transparent_70%)"></div>
      <div className="absolute inset-0 bg-radial-gradient(circle_at_70%_70%,_rgba(74,_144,_226,_0.1)_0%,_transparent_60%)"></div>

      {/* Stars */}
      <div className="absolute top-[10%] left-[10%] w-5 h-5 bg-radial-gradient(circle,_rgba(255,_223,_108,_0.9)_0%,_rgba(255,_255,_255,_0)_70%) rounded-full animate-pulse opacity-70"></div>
      <div className="absolute top-[25%] left-[25%] w-4 h-4 bg-radial-gradient(circle,_rgba(0,_255,_198,_0.9)_0%,_rgba(255,_255,_255,_0)_70%) rounded-full animate-pulse opacity-70"></div>
      <div className="absolute top-[15%] right-[30%] w-6 h-6 bg-radial-gradient(circle,_rgba(74,_144,_226,_0.9)_0%,_rgba(255,_255,_255,_0)_70%) rounded-full animate-pulse opacity-70"></div>

      {!gameStarted ? (
        <div className="text-center space-y-4 z-10">
          <h1 className="text-4xl font-bold text-[#4cc9f0] font-orbitron tracking-wider animate-glow">
            Cosmic Chess
          </h1>
          <p className="text-gray-300">Galactic Strategy Arena</p>
          <Button 
            className="bg-gradient-to-r from-[#4cc9f0] to-[#4a90e2] text-black font-bold hover:opacity-90 transition-opacity"
            onClick={() => setGameStarted(true)}
          >
            Start Game
          </Button>
        </div>
      ) : (
        <>
          {/* Win streak */}
          {winStreak > 0 && (
            <div className={`absolute top-4 right-4 bg-[#0B1A2C]/90 border rounded-lg px-3 py-2 flex items-center gap-2 ${
              winStreak >= 3 ? "border-amber-400 text-amber-400 animate-pulse" : "border-[#4cc9f0]/30 text-white"
            }`}>
              <span>🔥</span>
              <span>Win Streak: {winStreak}</span>
            </div>
          )}

          {/* Moves history */}
          {renderMovesHistory()}

          {/* Turn indicator */}
          <div className={`mb-4 px-4 py-3 rounded-xl bg-[#0B1A2C]/90 border ${
            isWhiteTurn && !isComputerTurn ? "border-[#4cc9f0] animate-glow-text" : "border-[#4cc9f0]/30"
          } relative overflow-hidden`}>
            {isComputerTurn ? (
              <span className="flex items-center">
                Computer is thinking
                <span className="ml-1 text-2xl leading-none animate-blink">•</span>
              </span>
            ) : (
              <span className="flex items-center">
                <span className="mr-2">🛰️</span> Your Move, Commander
              </span>
            )}
          </div>

          {/* Captured pieces */}
          <div className="flex justify-between w-full max-w-md mb-4">
            <div className="bg-[#0B1A2C]/70 px-3 py-2 rounded-lg border border-[#4cc9f0]/20 relative">
              <span className="absolute -top-2 left-2 bg-[#0B1A2C] px-1 text-xs text-[#4cc9f0]">Captured</span>
              <div className="flex gap-1">
                {renderCapturedPieces('black')}
              </div>
            </div>
            <div className="bg-[#0B1A2C]/70 px-3 py-2 rounded-lg border border-[#4cc9f0]/20 relative">
              <span className="absolute -top-2 left-2 bg-[#0B1A2C] px-1 text-xs text-amber-400">Lost</span>
              <div className="flex gap-1">
                {renderCapturedPieces('white')}
              </div>
            </div>
          </div>

          {/* Chess board */}
{/* Chess board */}
<div className="grid grid-cols-8 gap-0 w-full max-w-md border border-[#4cc9f0]/30 rounded-lg overflow-hidden bg-[#0e1a40]/80 backdrop-blur-sm shadow-lg shadow-[#4cc9f0]/10 relative">
  {board.map((row, rowIndex) =>
    row.map((piece, colIndex) => {
      // Render rows in reverse order (0 = top, 7 = bottom)
      const displayRow = 7 - rowIndex;
      const isEven = (displayRow + colIndex) % 2 === 0;
      const isSelected = selectedPiece && selectedPiece[0] === rowIndex && selectedPiece[1] === colIndex;
      const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
      const isLastMoveSquare = lastMove && 
        ((rowIndex === lastMove[0] && colIndex === lastMove[1]) || 
         (rowIndex === lastMove[2] && colIndex === lastMove[3]));
      const isAnimated = animatedSquare && rowIndex === animatedSquare[0] && colIndex === animatedSquare[1];

      return (
        <div
          key={`${rowIndex}-${colIndex}`}
          className={`
            aspect-square flex items-center justify-center text-4xl cursor-pointer relative
            ${isEven ? 
              "bg-gradient-to-br from-[#1D3A54]/60 to-[#142943]/60" : 
              "bg-gradient-to-br from-[#0B1A2C]/90 to-[#0D1E34]/90"}
            ${isSelected ? "ring-2 ring-[#4cc9f0] ring-opacity-70" : ""}
            ${isLastMoveSquare ? 
              (isEven ? 
                "bg-gradient-to-br from-[#1D3A54]/80 to-[#00f9ff]/15" : 
                "bg-gradient-to-br from-[#0B1A2C]/90 to-[#00f9ff]/20") : ""}
            ${isAnimated ? "animate-pulse-scale" : ""}
            hover:bg-[#4cc9f0]/20 transition-all duration-200
          `}
          onClick={() => handleSquareClick(rowIndex, colIndex)}
        >
          <span className={`
            ${piece?.color === "white" ? "text-white drop-shadow-glow-white" : "text-amber-400 drop-shadow-glow-amber"}
            ${isAnimated ? "scale-110 transition-transform duration-300" : ""}
          `}>
            {getPieceSymbol(piece)}
          </span>

          {isValidMove && !isComputerTurn && gameStatus === null && (
            <div className="absolute w-5 h-5 rounded-full bg-[#4cc9f0]/30 border border-[#4cc9f0]/60 shadow-glow animate-pulse"></div>
          )}

          {/* Coordinates */}
          {colIndex === 0 && (
            <span className="absolute bottom-1 left-1 text-xs text-gray-400 font-bold">{8 - rowIndex}</span>
          )}
          {rowIndex === 7 && (
            <span className="absolute top-1 right-1 text-xs text-gray-400 font-bold">
              {String.fromCharCode(97 + colIndex)}
            </span>
          )}
        </div>
      );
    })
  )}
</div>


          {/* Game info */}
          <div className="flex justify-between w-full max-w-md mt-4">
            <div className="bg-[#0B1A2C]/90 px-4 py-2 rounded-xl border border-[#4cc9f0]/30">
              {isWhiteTurn ? "White's Turn" : "Black's Turn"}
            </div>
            <div className="bg-[#0B1A2C]/90 px-4 py-2 rounded-xl border border-[#4cc9f0]/30 flex items-center">
              <span className="mr-2">✦</span>
              Score: <span className="ml-1 text-amber-400 font-bold">{playerScore}</span>
              {scoreChange && (
                <span className="ml-2 text-[#4cc9f0] animate-score-change">
                  {scoreChange.value}
                </span>
              )}
            </div>
          </div>

          {/* Game over modal */}
          {gameStatus && (
            <div className={`absolute inset-0 flex items-center justify-center bg-black/50 z-50 ${
              gameStatus === "victory" ? "animate-fade-in" : "animate-fade-in"
            }`}>
              <div className={`bg-[#0B1A2C]/90 p-8 rounded-2xl border ${
                gameStatus === "victory" ? 
                "border-[#4cc9f0] shadow-[0_0_20px_#4cc9f0/50]" : 
                "border-amber-400 shadow-[0_0_20px_#f59e0b/50]"
              } text-center max-w-sm w-full`}>
                <h2 className={`text-3xl font-bold mb-4 ${
                  gameStatus === "victory" ? "text-[#4cc9f0]" : "text-amber-400"
                } animate-glow`}>
                  {gameStatus === "victory" ? "Victory!" : "Defeat!"}
                </h2>
                
                {gameStatus === "victory" && (
                  <>
                    <div className="mb-6">
                      <p className="text-lg text-amber-400 flex items-center justify-center">
                        <span className="mr-2">✦</span>
                        {winStreak >= 3 ? "15" : "10"} Points Earned
                      </p>
                      <div className="mt-4 bg-[#4cc9f0]/10 border border-[#4cc9f0] rounded-lg px-4 py-2 inline-flex items-center">
                        <span className="mr-2">🏆</span>
                        {getCurrentRank()}
                      </div>
                    </div>
                  </>
                )}
                
                <Button 
                  className={`w-full ${
                    gameStatus === "victory" ? 
                    "bg-gradient-to-r from-[#4cc9f0] to-[#4a90e2]" : 
                    "bg-gradient-to-r from-amber-400 to-amber-500"
                  } text-black font-bold hover:opacity-90 transition-opacity`}
                  onClick={resetBoard}
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}

          {/* Buttons */}
{/*           <div className="flex gap-4 mt-6">
            <Button 
              variant="outline"
              className="bg-[#0B1A2C] hover:bg-[#1a2332] text-white border-[#4cc9f0]/30 hover:border-[#4cc9f0]/50"
              onClick={resetBoard}
            >
              Reset Game
            </Button>
          </div>
        </>
      )} */}

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes glow {
          0% { text-shadow: 0 0 5px #4cc9f0, 0 0 10px #4cc9f0; }
          50% { text-shadow: 0 0 20px #4cc9f0, 0 0 30px #4cc9f0; }
          100% { text-shadow: 0 0 5px #4cc9f0, 0 0 10px #4cc9f0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pulse-scale {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes score-change {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-glow {
          animation: glow 3s infinite ease-in-out;
        }
        .animate-glow-text {
          animation: glow 6s infinite linear;
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        .animate-pulse-scale {
          animation: pulse-scale 0.3s ease-out;
        }
        .animate-score-change {
          animation: score-change 1.5s forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .drop-shadow-glow-white {
          filter: drop-shadow(0 0 6px rgba(184, 255, 249, 0.7));
        }
        .drop-shadow-glow-amber {
          filter: drop-shadow(0 0 6px rgba(255, 213, 128, 0.7));
        }
        .shadow-glow {
          box-shadow: 0 0 12px #4cc9f0;
        }
      `}</style>
    </div>
  )
}
