import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTasks } from '@/app/actions/tasks'
import { TaskBoard } from '@/components/tasks/task-board'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tasks' }

interface TasksPageProps {
  searchParams: Promise<{ status?: string; assignedTo?: string }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const tasks = await getTasks({ status: params.status, assignedTo: params.assignedTo })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and track team tasks</p>
      </div>
      <TaskBoard tasks={tasks} currentUserId={user.id} />
    </div>
  )
}
