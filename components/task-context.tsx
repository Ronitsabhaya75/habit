"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the Task type
export interface Task {
  id: number | string
  title: string
  completed: boolean
  date?: Date
  isHabit?: boolean
  estimatedTime?: number
}

// Define the context type
interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, "id">) => void
  updateTask: (id: number | string, updates: Partial<Task>) => void
  removeTask: (id: number | string) => void
  getTasksForDate: (date: Date) => Task[]
}

// Create the context
const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Task provider component
export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Morning meditation", completed: false, date: new Date() },
    { id: 2, title: "Read for 30 minutes", completed: true, date: new Date() },
  ])

  // Add a new task
  const addTask = (task: Omit<Task, "id">) => {
    const newTask = {
      ...task,
      id: Date.now(),
    }
    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  // Update a task
  const updateTask = (id: number | string, updates: Partial<Task>) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? { ...task, ...updates } : task)))
  }

  // Remove a task
  const removeTask = (id: number | string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
  }

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => task.date && task.date.toDateString() === date.toDateString())
  }

  // In a real app, you would fetch tasks from the API here
  useEffect(() => {
    // Simulating API fetch
    const fetchTasks = async () => {
      try {
        // const response = await fetch('/api/tasks');
        // const data = await response.json();
        // if (data.success) {
        //   setTasks(data.data);
        // }
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
      }
    }

    fetchTasks()
  }, [])

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, removeTask, getTasksForDate }}>
      {children}
    </TaskContext.Provider>
  )
}

// Custom hook to use the task context
export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider")
  }
  return context
}
