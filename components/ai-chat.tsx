"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Task {
  id: number | string
  title: string
  completed: boolean
  isHabit?: boolean
  estimatedTime?: number
  isEditing?: boolean
}

interface Message {
  id: string
  text: string
  sender: "user" | "ai" | "system"
  isTaskSuggestion?: boolean
  suggestedTask?: string
  hasDate?: boolean
}

interface AIChatProps {
  user?: any
  tasks?: Task[]
  onTaskUpdate?: (taskId: string | number, completed: boolean, type?: string) => void
  onAddTaskWithDate?: (date: Date, task: Task) => void
}

export function AIChat({ user, tasks = [], onTaskUpdate, onAddTaskWithDate }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: `Hi${user?.username ? ` ${user.username}` : ""}! I'm your Habit Coach. I'm here to help you build positive habits and achieve your goals. Would you like me to help you set up a task for today?`,
      sender: "ai",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTasks, setActiveTasks] = useState<Task[]>(tasks)
  const [editingTaskId, setEditingTaskId] = useState<string | number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [apiError, setApiError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeTasks])

  useEffect(() => {
    setActiveTasks(tasks)
  }, [tasks])

  const handleTaskToggle = (taskId: string | number) => {
    const taskToToggle = activeTasks.find((task) => task.id === taskId)
    if (!taskToToggle) return

    const updatedTasks = activeTasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    )
    setActiveTasks(updatedTasks)

    if (onTaskUpdate) {
      onTaskUpdate(taskId, !taskToToggle.completed)
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: `Marked task "${taskToToggle.title}" as ${!taskToToggle.completed ? "completed" : "not completed"}`,
        sender: "system",
      },
    ])
  }

  const startEditTask = (taskId: string | number) => {
    const task = activeTasks.find((t) => t.id === taskId)
    if (task) {
      setEditingTaskId(taskId)
      setEditValue(task.title)
    }
  }

  const saveEditTask = () => {
    if (editingTaskId && editValue.trim()) {
      const updatedTasks = activeTasks.map((task) =>
        task.id === editingTaskId ? { ...task, title: editValue.trim() } : task,
      )

      setActiveTasks(updatedTasks)

      if (onTaskUpdate) {
        const updatedTask = updatedTasks.find((t) => t.id === editingTaskId)
        if (updatedTask) {
          onTaskUpdate(editingTaskId, updatedTask.completed, "edit")
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Updated task: "${editValue.trim()}"`,
          sender: "system",
        },
      ])

      setEditingTaskId(null)
      setEditValue("")
    }
  }

  const cancelEditTask = () => {
    setEditingTaskId(null)
    setEditValue("")
  }

  const handleKeyPressForEdit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditTask()
    } else if (e.key === "Escape") {
      cancelEditTask()
    }
  }

  const removeTask = (taskId: string | number) => {
    const taskToRemove = activeTasks.find((t) => t.id === taskId)
    if (!taskToRemove) return

    const updatedTasks = activeTasks.filter((task) => task.id !== taskId)
    setActiveTasks(updatedTasks)

    if (onTaskUpdate) {
      onTaskUpdate(taskId, false, "remove")
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: `Removed task: "${taskToRemove.title}"`,
        sender: "system",
      },
    ])
  }

  const extractDateFromText = (text: string): Date | null => {
    const today = new Date()
    const lowerText = text.toLowerCase()

    if (lowerText.includes("today")) {
      return today
    } else if (lowerText.includes("tomorrow")) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }

    return null
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsLoading(true)
    setApiError(null)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: inputValue,
          activeTasks: activeTasks,
          messages: messages,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.response) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: data.response,
          sender: "ai",
        }

        setMessages((prev) => [...prev, aiMessage])
      } else {
        setApiError("Failed to get a response from the AI.")
      }
    } catch (error) {
      console.error("AI API Error:", error)
      setApiError("Failed to connect to the AI service.")
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  return (
    <div className="flex flex-col h-[400px] bg-[#2a3343] rounded-lg border border-[#3a4353] overflow-hidden">
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-start space-x-2 max-w-[80%] ${
                message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={message.sender === "user" ? "bg-[#4cc9f0]" : "bg-purple-500"}>
                  {message.sender === "user" ? "U" : "AI"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 ${
                  message.sender === "user" ? "bg-[#4cc9f0] text-black" : "bg-[#1a2332] text-white"
                }`}
              >
                {message.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#3a4353] flex space-x-2">
        <Input
          placeholder="Ask me anything..."
          className="bg-[#1a2332] border-[#3a4353] text-white"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage()
            }
          }}
        />
        <Button
          className="bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          Send
        </Button>
      </div>
    </div>
  )
}

export default AIChat
