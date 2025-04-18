// chess-game.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { updateUserXP } from "@/lib/xp-utils"

// Piece type
interface Piece {
  type: string
  color: "white" | "black"
  hasMoved: boolean
}

// Chess pieces (Unicode)
const pieces: Record<string, string> = {
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

// Space theme classes
const spaceTheme = {
  deep: "bg-[#0B1A2C]",
  light: "bg-[#1D3A54]",
  accent: "#00FFC6",
  gold: "#FFD580",
}

// Initialize board: black at top, white at bottom
function initializeBoard(): (Piece | null)[][] {
  const backRank = ["rook","knight","bishop","queen","king","bishop","knight","rook"]
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null))
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: backRank[i], color: "black", hasMoved: false }
    board[1][i] = { type: "pawn", color: "black", hasMoved: false }
    board[6][i] = { type: "pawn", color: "white", hasMoved: false }
    board[7][i] = { type: backRank[i], color: "white", hasMoved: false }
  }
  return board
}

export const ChessGame: React.FC = () => {
  const [board, setBoard] = useState<(Piece | null)[][]>(initializeBoard)
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [validMoves, setValidMoves] = useState<[number, number][]>([])
  const [isWhiteTurn, setIsWhiteTurn] = useState(true)
  const [promotionColor, setPromotionColor] = useState<"white" | "black" | null>(null)
  const [promoPos, setPromoPos] = useState<[number, number] | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  // Get symbol
  const getSymbol = (p: Piece | null) =>
    p ? pieces[p.color + p.type.charAt(0).toUpperCase() + p.type.slice(1)] : ""

  // Calculate moves
  const calcMoves = (r: number, c: number): [number, number][] => {
    const p = board[r][c]
    if (!p) return []
    const moves: [number, number][] = []
    const dir = p.color === "white" ? -1 : 1
    const add = (dr: number, dc: number) => {
      const nr = r + dr,
        nc = c + dc
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false
      const t = board[nr][nc]
      if (!t) moves.push([nr, nc])
      else if (t.color !== p.color) {
        moves.push([nr, nc])
        return false
      }
      return !t
    }
    if (p.type === "pawn") {
      if (!board[r + dir]?.[c]) moves.push([r + dir, c])
      if (!p.hasMoved && !board[r + 2 * dir]?.[c]) moves.push([r + 2 * dir, c])
      ;[[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
        const t = board[r + dr]?.[c + dc]
        if (t && t.color !== p.color) moves.push([r + dr, c + dc])
      })
    }
    if (["rook", "queen"].includes(p.type)) {
      for (let i = 1; i < 8; i++) if (!add(i, 0)) break
      for (let i = 1; i < 8; i++) if (!add(-i, 0)) break
      for (let i = 1; i < 8; i++) if (!add(0, i)) break
      for (let i = 1; i < 8; i++) if (!add(0, -i)) break
    }
    if (["bishop", "queen"].includes(p.type)) {
      for (let i = 1; i < 8; i++) if (!add(i, i)) break
      for (let i = 1; i < 8; i++) if (!add(i, -i)) break
      for (let i = 1; i < 8; i++) if (!add(-i, i)) break
      for (let i = 1; i < 8; i++) if (!add(-i, -i)) break
    }
    if (p.type === "knight") {
      ;[
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ].forEach(([dr, dc]) => {
        const nr = r + dr,
          nc = c + dc
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const t = board[nr][nc]
          if (!t || t.color !== p.color) moves.push([nr, nc])
        }
      })
    }
    if (p.type === "king") {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(dr, dc)
    }
    return moves
  }

  // Move and handle promotion
  const makeMove = (fr: number, fc: number, tr: number, tc: number) => {
    const p = board[fr][fc]
    if (!p) return
    const nb = board.map((r) => [...r])
    nb[tr][tc] = { ...p, hasMoved: true }
    nb[fr][fc] = null
    setBoard(nb)
    setSelected(null)
    setValidMoves([])
    setIsWhiteTurn((w) => !w)
    if (p.type === "pawn" && (tr === 0 || tr === 7)) {
      setPromoPos([tr, tc])
      setPromotionColor(p.color)
    }
  }

  // Handle promotion choice
  const promotePawn = (type: string) => {
    if (!promoPos || !promotionColor) return
    const [r, c] = promoPos
    const nb = board.map((r) => [...r])
    nb[r][c] = { type, color: promotionColor, hasMoved: true }
    setBoard(nb)
    setPromotionColor(null)
    setPromoPos(null)
  }

  const handleClick = (r: number, c: number) => {
    if (!gameStarted || promotionColor) return
    if (selected) {
      if (validMoves.some(([rr, cc]) => rr === r && cc === c)) {
        makeMove(selected[0], selected[1], r, c)
      } else setSelected(null)
    } else {
      const p = board[r][c]
      if (p && p.color === (isWhiteTurn ? "white" : "black")) {
        setSelected([r, c])
        setValidMoves(calcMoves(r, c))
      }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-[#0B1A2C] to-[#142943] text-[#D0E7FF] p-4">
      {!gameStarted ? (
        <Button className="bg-gradient-to-r from-[#00FFC6] to-[#4A90E2] text-black" onClick={() => setGameStarted(true)}>
          Start Game
        </Button>
      ) : (
        <div className="grid grid-cols-8 border border-[#00FFC6]/30">
          {board.map((row, r) =>
            row.map((p, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className={`w-12 h-12 flex items-center justify-center cursor-pointer text-2xl ${
                  (r + c) % 2 ? spaceTheme.light : spaceTheme.deep
                } ${
                  selected?.[0] === r && selected[1] === c
                    ? `ring-2 ring-[${spaceTheme.accent}]`
                    : ""
                } ${
                  validMoves.some(([rr, cc]) => rr === r && cc === c)
                    ? `bg-[${spaceTheme.accent}]/30`
                    : ""
                }`}
              >
                {getSymbol(p)}
              </div>
            ))
          )}
        </div>
      )}

      {promotionColor && (
        <Dialog open>
          <DialogContent className="bg-[#1D3A54] text-white text-center">
            <h3 className="text-lg mb-2">Promote Pawn</h3>
            <div className="flex space-x-4 justify-center">
              {["queen", "rook", "bishop", "knight"].map((type) => (
                <Button
                  key={type}
                  className="bg-[#FFD580] text-black"
                  onClick={() => promotePawn(type)}
                >
                  {pieces[promotionColor + type.charAt(0).toUpperCase() + type.slice(1)]}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
