import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Label, Priority, Task } from '../types'
import { WEEKDAYS, buildRule, nextDueFor, repeatOf, ruleDays, ymd, type Repeat } from '../lib/recurrence'
import Modal from './Modal'

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'med', label: 'Med' },
  { value: 'low', label: 'Low' },
]

const REPEATS: { value: Repeat; label: string }[] = [
  { value: 'once', label: 'One time' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Specific days' },
]

// Segmented button group (High / Med / Low, One time / Every day / ...)
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 rounded-md text-sm ${
            value === o.value ? 'bg-white shadow-sm text-indigo-600 font-medium' : 'text-gray-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Create a new task, or edit an existing one
export default function TaskModal({
  task,
  categories,
  labels,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  task: Task | null
  categories: Category[]
  labels: Label[]
  defaultCategoryId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [categoryId, setCategoryId] = useState(task?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? '')
  const [labelId, setLabelId] = useState(task?.label_id ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'med')
  const [repeat, setRepeat] = useState<Repeat>(task ? repeatOf(task) : 'once')
  const [days, setDays] = useState<number[]>(task?.rrule ? ruleDays(task.rrule) : [0, 2, 4])
  const [dueDate, setDueDate] = useState(task?.due_date ?? ymd(new Date()))
  const [time, setTime] = useState(task?.start_time?.slice(0, 5) ?? '09:00')
  const [duration, setDuration] = useState(task?.duration_min ?? 30)
  const [error, setError] = useState('')

  function toggleDay(d: number) {
    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Enter a task name')
    if (!categoryId) return setError('Pick a category')
    if (repeat === 'weekly' && days.length === 0) return setError('Pick at least one day')

    const rrule = buildRule(repeat, days)
    const due = repeat === 'once' ? dueDate : null
    const values = {
      title: title.trim(),
      category_id: categoryId,
      label_id: labelId || null,
      priority,
      duration_min: duration,
      rrule,
      due_date: due,
      start_time: time,
      next_due: nextDueFor(rrule, due, time)?.toISOString() ?? null,
    }
    const { error } = task
      ? await supabase.from('tasks').update(values).eq('id', task.id)
      : await supabase.from('tasks').insert(values)
    if (error) return setError(error.message)
    onSaved()
  }

  const field = 'w-full border border-gray-200 rounded-lg p-2.5 bg-white'

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          className={field}
        />

        <div className="grid grid-cols-2 gap-2">
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={field}>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={labelId} onChange={e => setLabelId(e.target.value)} className={field}>
            <option value="">No label</option>
            {labels.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-500">Priority</p>
          <Segmented options={PRIORITIES} value={priority} onChange={setPriority} />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">Repeat</p>
          <Segmented options={REPEATS} value={repeat} onChange={setRepeat} />
          {repeat === 'once' && (
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={field} />
          )}
          {repeat === 'weekly' && (
            <div className="flex flex-wrap gap-1">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-11 py-1.5 rounded-lg border text-sm ${
                    days.includes(i) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-sm text-gray-500">Time</span>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={field} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-500">Duration (min)</span>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className={field}
            />
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium">
          {task ? 'Save changes' : 'Add task'}
        </button>
      </form>
    </Modal>
  )
}