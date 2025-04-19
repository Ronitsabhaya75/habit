"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTasks, type Task } from "./task-context"
import { useToast } from "@/components/ui/use-toast"

interface TaskListProps {
  date?: Date
}

export function TaskList({ date = new Date() }: TaskListProps) {
  const { tasks, addTask, updateTask, removeTask, getTasksForDate } = useTasks()
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<{ id: number | string; title: string } | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  // Filter tasks based on the selected date
  useEffect(() => {
    if (date) {
      setFilteredTasks(getTasksForDate(date))
    }
  }, [date, tasks, getTasksForDate])

  const toggleTask = (id: number | string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      updateTask(id, { completed: !task.completed })

      // Provide feedback on completed task
      if (!task.completed) {
        toast({
          title: "Task Completed!",
          description: "Great job on completing your task!",
        })
      }
    }
  }

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle,
        completed: false,
        date: date,
      })

      setNewTaskTitle("")
      setDialogOpen(false)

      toast({
        title: "Task Added",
        description: `New task "${newTaskTitle}" added for ${date.toLocaleDateString()}.`,
      })
    }
  }

  const deleteTask = (id: number | string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      removeTask(id)

      toast({
        title: "Task Deleted",
        description: `Task "${task.title}" has been removed.`,
      })
    }
  }

  const updateTaskTitle = (id: number | string, newTitle: string) => {
    if (newTitle.trim()) {
      updateTask(id, { title: newTitle })
      setEditingTask(null)

      toast({
        title: "Task Updated",
        description: "Your task has been updated successfully.",
      })
    }
  }

  return (
    <div className="space-y-4">
      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-[#2a3343] transition-colors"
            >
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="text-[#4cc9f0] border-[#4cc9f0]"
              />

              {editingTask && editingTask.id === task.id ? (
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="bg-[#2a3343] border-[#3a4353] text-white"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateTaskTitle(task.id, editingTask.title)}
                    className="h-8 w-8 p-0 text-green-500"
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingTask(null)}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-white flex-1 cursor-pointer ${task.completed ? "line-through text-gray-400" : ""}`}
                  >
                    {task.title}
                    {task.isHabit && <span className="text-sm opacity-80 ml-2">(daily habit)</span>}
                  </label>

                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => setEditingTask({ id: task.id, title: task.title })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">No tasks for this date. Add a task to get started!</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black">+ Add Task</Button>
        </DialogTrigger>
        <DialogContent className="bg-[#1a2332] border-[#2a3343] text-white">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Name</Label>
              <Input
                id="task-title"
                placeholder="Enter task name"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-[#2a3343] border-[#3a4353] text-white"
              />
            </div>
            <Button className="w-full bg-[#4cc9f0] hover:bg-[#4cc9f0]/80 text-black" onClick={handleAddTask}>
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
