"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MainLayout } from "@/components/main-layout"
import AIChat from "@/components/ai-chat"
import { TaskList } from "@/components/task-list"
import { Plus, Send } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export default function TrackPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showAI, setShowAI] = useState(false)
  const [tasks, setTasks] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const { toast } = useToast()

  // Handle task creation from the AI
  const handleAddTaskWithDate = (taskDate, task) => {
    // Update tasks list
    setTasks((prev) => [
      ...prev,
      {
        ...task,
        date: taskDate,
      },
    ])

    // Show confirmation toast
    toast({
      title: "Task Scheduled",
      description: `Task "${task.title}" scheduled for ${taskDate.toLocaleDateString()}.`,
    })

    // If the task is for the currently selected date, update calendar view
    if (date && taskDate.toDateString() === date.toDateString()) {
      // The TaskList component will update automatically since we added to the tasks state
    }
  }

  // Handle AI message sending
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    // Here we would process the message with AI
    // For now we'll just add a simple confirmation
    toast({
      title: "Message Sent",
      description: "Your message was sent to the AI assistant.",
    })

    setInputMessage("")
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Calendar Tracker</h1>
        <p className="text-gray-400">Manage your tasks and track your habits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a2332]/80 border-[#2a3343]">
          <CardHeader>
            <CardTitle className="text-xl text-white">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border border-[#2a3343] bg-[#1a2332]"
            />
            <div className="mt-4 flex justify-between">
              <Button
                variant="outline"
                className="bg-[#2a3343] hover:bg-[#3a4353] text-white border-[#3a4353]"
                onClick={() => setShowAI(!showAI)}
              >
                {showAI ? "Hide AI Coach" : "Show AI Coach"}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black">
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a2332] border-[#2a3343] text-white">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Input placeholder="Task name" className="bg-[#2a3343] border-[#3a4353] text-white" />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="datetime-local"
                        className="bg-[#2a3343] border-[#3a4353] text-white"
                        defaultValue={date ? new Date(date.setHours(9, 0, 0, 0)).toISOString().substring(0, 16) : ""}
                      />
                    </div>
                    <Button className="w-full bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black">Save Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-[#1a2332]/80 border-[#2a3343]">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Tasks for {date?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showAI ? (
              <div className="space-y-4">
                <AIChat onAddTaskWithDate={handleAddTaskWithDate} />
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask your AI coach about tasks or habits..."
                    className="bg-[#2a3343] border-[#3a4353] text-white"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <Button className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <TaskList date={date} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
