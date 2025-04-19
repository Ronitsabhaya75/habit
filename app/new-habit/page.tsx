"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainLayout } from "@/components/main-layout"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isToday } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function NewHabit() {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Get form data
      const form = e.target as HTMLFormElement
      const habitName = (form.querySelector("#habit-name") as HTMLInputElement).value
      const frequency = (form.querySelector('[name="frequency"]') as HTMLInputElement)?.value || "daily"

      // Import the XP_VALUES from lib/xp-system
      const { XP_VALUES } = await import("@/lib/xp-system")

      // Create the habit locally
      const newHabit = {
        id: Date.now(),
        name: habitName,
        startDate: startDate,
        endDate: endDate,
        frequency: frequency,
        completed: false,
      }

      // In a real app, you would send this to your API
      // For now we'll simulate that with a toast notification
      toast({
        title: "Habit Created!",
        description: `You earned ${XP_VALUES.HABIT_CREATION} XP for creating a new habit.`,
      })

      // If the habit starts today, add it to today's tasks
      if (startDate && isToday(startDate)) {
        // In a real app, you would add this to your tasks API
        toast({
          title: "Added to Today's Tasks",
          description: `${habitName} has been added to your tasks for today.`,
        })
      }

      // Either way, add it to the calendar
      toast({
        title: "Added to Calendar",
        description: `${habitName} has been added to your calendar.`,
      })

      // Reset form
      form.reset()
      setStartDate(undefined)
      setEndDate(undefined)

      // Redirect to calendar after a short delay
      setTimeout(() => {
        router.push("/track")
      }, 2000)
    } catch (error) {
      console.error("Error creating habit:", error)
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Habit Creation</h1>
        <p className="text-gray-400">Create new habits to track and earn 30 XP for completing them</p>
      </div>

      <Card className="bg-[#1a2332]/80 border-[#2a3343]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Create New Habit</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="habit-name" className="text-white">
                Habit Name
              </Label>
              <Input
                id="habit-name"
                placeholder="e.g., Morning Meditation"
                className="bg-[#2a3343] border-[#3a4353] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="habit-description" className="text-white">
                Description
              </Label>
              <Textarea
                id="habit-description"
                placeholder="Describe your habit..."
                className="bg-[#2a3343] border-[#3a4353] text-white min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#2a3343] border-[#3a4353] text-white",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1a2332] border-[#2a3343]">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="rounded-md border border-[#2a3343] bg-[#1a2332]"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-white">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#2a3343] border-[#3a4353] text-white",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1a2332] border-[#2a3343]">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="rounded-md border border-[#2a3343] bg-[#1a2332]"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Frequency</Label>
              <Select name="frequency">
                <SelectTrigger className="bg-[#2a3343] border-[#3a4353] text-white">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2332] border-[#2a3343] text-white">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Reminder</Label>
              <RadioGroup defaultValue="yes" className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="reminder-yes" className="text-[#4cc9f0]" />
                  <Label htmlFor="reminder-yes" className="text-white">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="reminder-no" className="text-[#4cc9f0]" />
                  <Label htmlFor="reminder-no" className="text-white">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button className="w-full bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" type="submit">
              Create Habit
            </Button>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
