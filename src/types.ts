export type Category = {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  color: string
  created_at: string
}

export type Label = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type Priority = 'high' | 'med' | 'low'

export type Task = {
  id: string
  user_id: string
  category_id: string
  label_id: string | null
  title: string
  duration_min: number
  rrule: string | null       // null = one-time task
  due_date: string | null    // "2026-11-25", only for one-time tasks
  start_time: string | null  // "09:00:00"
  priority: Priority
  reminder_enabled: boolean
  next_due: string | null
  active: boolean
  created_at: string
}