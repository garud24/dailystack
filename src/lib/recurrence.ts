import { RRule } from 'rrule'
import type { Task } from '../types'

// Index = rrule weekday number (0 = Monday)
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

export type Repeat = 'once' | 'daily' | 'weekly'

// Local date as "2026-11-25"
export function ymd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// "09:30:00" -> "9:30 AM"
export function formatTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// Form choice -> rrule string (null for one-time tasks)
export function buildRule(repeat: Repeat, days: number[]): string | null {
  if (repeat === 'once') return null
  const rule =
    repeat === 'daily'
      ? new RRule({ freq: RRule.DAILY })
      : new RRule({ freq: RRule.WEEKLY, byweekday: days })
  return rule.toString()
}

// rrule string -> form choice (used when editing a task)
export function repeatOf(task: Task): Repeat {
  if (!task.rrule) return 'once'
  return task.rrule.includes('WEEKLY') ? 'weekly' : 'daily'
}

export function ruleDays(rruleStr: string): number[] {
  const bw = RRule.parseString(rruleStr).byweekday
  if (!bw) return []
  const list = Array.isArray(bw) ? bw : [bw]
  return list.map(w =>
    typeof w === 'number' ? w : typeof w === 'string' ? WEEKDAY_CODES.indexOf(w) : w.weekday
  )
}

// rrule.js does its math in UTC. We pass local clock values as if they were
// UTC ("floating time") and convert back, so 9:00 stays 9:00 in your time zone.
const toFloating = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()))
const fromFloating = (d: Date) =>
  new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes())

// Rule anchored a week before `date`, so that day is always covered
function anchored(rruleStr: string, date: Date, h = 0, m = 0) {
  const dtstart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() - 7, h, m))
  return new RRule({ ...RRule.parseString(rruleStr), dtstart })
}

// Does a repeating rule have an occurrence on this local day?
export function occursOn(rruleStr: string, date: Date): boolean {
  const start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const end = start + 24 * 60 * 60 * 1000 - 1
  return anchored(rruleStr, date).between(new Date(start), new Date(end), true).length > 0
}

// Is this task scheduled for this day?
export function isDueOn(task: Task, date: Date): boolean {
  return task.rrule ? occursOn(task.rrule, date) : task.due_date === ymd(date)
}

// Next exact date/time the task is due (used by reminders later)
export function nextDueFor(rrule: string | null, dueDate: string | null, time: string): Date | null {
  const [h, m] = time.split(':').map(Number)
  if (!rrule) {
    if (!dueDate) return null
    const [y, mo, d] = dueDate.split('-').map(Number)
    return new Date(y, mo - 1, d, h, m)
  }
  const now = new Date()
  const next = anchored(rrule, now, h, m).after(toFloating(now), true)
  return next ? fromFloating(next) : null
}