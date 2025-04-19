"use client"
import { useState, useEffect } from "react"
import { Line, Bar, LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ChartData {
  day: string
  xp: number
}

interface PerformanceChartProps {
  type: "line" | "bar"
  userData?: {
    completedTasks: number[]
    completedHabits: number[]
    playedGames: number[]
  }
}

export function PerformanceChart({ type, userData }: PerformanceChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true)
        setError(false)

        // Fetch performance data from API
        const response = await fetch("/api/stats/performance")

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setChartData(
            data.data.map((item: any) => ({
              day: item.day,
              xp: item.xp,
            })),
          )
        } else {
          throw new Error(data.message || "Failed to fetch performance data")
        }
      } catch (error) {
        console.error("Failed to fetch performance data:", error)
        setError(true)

        // Generate fallback data
        const days = []
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

        const today = new Date()
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          days.push({
            date,
            day: dayNames[date.getDay()],
          })
        }

        // Generate fallback data
        const fallbackData = days.map((day, index) => {
          // For new users, start from 0 and show gradual small progress
          // Base value starts very low and increases slightly each day
          const baseValue = index * 3

          // Add minimal variation to keep the trend upward but realistic for beginners
          const variation = Math.floor(Math.random() * 3)

          return {
            day: day.day,
            xp: Math.max(0, baseValue + variation),
          }
        })

        setChartData(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [userData])

  if (loading) {
    return <div className="h-[300px] w-full bg-[#1a2332]/50 animate-pulse rounded-md"></div>
  }

  if (error || chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Unable to load performance data.</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-[#4cc9f0] hover:underline">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3343" />
            <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af" }}
              label={{ value: "XP", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a2332", borderColor: "#2a3343", color: "#fff" }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => [`${value} XP`, "XP"]}
            />
            <Line
              type="monotone"
              dataKey="xp"
              stroke="#4cc9f0"
              strokeWidth={2}
              dot={{ fill: "#4cc9f0", r: 4 }}
              activeDot={{ r: 6, fill: "#4cc9f0" }}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3343" />
            <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af" }}
              label={{ value: "XP", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a2332", borderColor: "#2a3343", color: "#fff" }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => [`${value} XP`, "XP"]}
            />
            <Bar dataKey="xp" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
