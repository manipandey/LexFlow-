'use client'

import { useState } from 'react'
import { updateTaskStatusAction, deleteTaskAction } from '@/app/actions/tasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, formatDate, getStatusColor, getPriorityColor, formatStatusLabel } from '@/lib/utils'
import {
  MoreHorizontal, Calendar, Briefcase, Flag, Trash2, CheckCircle, Circle, Clock,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
  { id: 'overdue', label: 'Overdue', color: 'bg-red-500' },
] as const

interface TaskBoardProps {
  tasks: any[]
  currentUserId: string
}

export function TaskBoard({ tasks, currentUserId }: TaskBoardProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleStatusChange(taskId: string, newStatus: string) {
    setLoadingId(taskId)
    await updateTaskStatusAction(taskId, newStatus)
    setLoadingId(null)
    router.refresh()
  }

  async function handleDelete(taskId: string) {
    setLoadingId(taskId)
    await deleteTaskAction(taskId)
    setLoadingId(null)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id)
        return (
          <div key={col.id} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center gap-2 px-1">
              <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {colTasks.length}
              </span>
            </div>

            {/* Task cards */}
            <div className="space-y-2 min-h-[100px]">
              {colTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-xs text-muted-foreground">No {col.label.toLowerCase()} tasks</p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border bg-card p-3 space-y-2 transition-all hover:shadow-sm hover:border-border/80"
                  >
                    {/* Title + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 -mt-1" />}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                            <DropdownMenuItem key={c.id} onClick={() => handleStatusChange(task.id, c.id)}>
                              Move to {c.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.cases && (
                        <span className="flex items-center gap-1 truncate">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[80px]">{task.cases.case_number}</span>
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${getPriorityColor(task.priority)}`}>
                        <Flag className="inline h-3 w-3 mr-0.5" />
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      {task.profiles && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.profiles.avatar_url} />
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {getInitials(task.profiles.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
