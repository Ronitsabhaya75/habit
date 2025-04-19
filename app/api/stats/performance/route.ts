import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get the last 7 days
    const days = []
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      days.push({
        date,
        nextDate,
        day: dayNames[date.getDay()],
      })
    }

    // Check if user is new (registered less than 7 days ago)
    const isNewUser = new Date().getTime() - new Date(user.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000

    // For new users, show minimal starting XP
    if (isNewUser) {
      const performanceData = days.map((day, index) => {
        // For new users, start from 0 and show very gradual progress
        const daysRegistered = Math.max(0, 6 - index) // How many days since registration (0 for day of registration)

        return {
          day: day.day,
          xp: Math.max(0, daysRegistered * 2), // Minimal XP gain per day
        }
      })

      return NextResponse.json({ success: true, data: performanceData }, { status: 200 })
    }

    // For existing users, generate more realistic data showing progress
    const performanceData = days.map((day, index) => {
      // Base value that increases each day to show progress
      const baseValue = 20 + index * 5

      // Add slight variation but maintain the upward trend
      const variation = Math.floor(Math.random() * 10) - 3

      return {
        day: day.day,
        xp: Math.max(0, baseValue + variation),
      }
    })

    return NextResponse.json({ success: true, data: performanceData }, { status: 200 })
  } catch (error) {
    console.error("Get performance data error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
