import { Check, Clock, X } from 'lucide-react'
import type { Category, Label, Priority, Task } from '../types'
import { formatTime } from '../lib/recurrence'

const PRIORITY: Record<Priority, { text: string; className: string }> = {
  high: { text: 'High', className: 'bg-red-50 text-red-600' },
  med: { text: 'Med', className: 'bg-amber-50 text-amber-600' },
  low: { text: 'Low', className: 'bg-gray-100 text-gray-500' },
}

const chip = 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium'

export default function TaskCard({
  task,
  category,
  label,
  done,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  category?: Category
  label?: Label
  done: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  // Left stripe: label color, else category color
  const accent = label?.color ?? category?.color ?? '#9ca3af'
  const p = PRIORITY[task.priority]

  return (
    <div
      className={`bg-white border border-gray-200 border-l-4 rounded-xl p-3 flex gap-3 ${done ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: accent }}
    >
      <button
        onClick={onToggle}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center ${
          done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0 space-y-2">
        <button
          onClick={onEdit}
          className={`block text-left font-semibold leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}
        >
          {task.title}
        </button>
        <div className="flex flex-wrap gap-1.5">
          {task.start_time && (
            <span className={`${chip} bg-gray-100 text-gray-600`}>
              <Clock size={12} /> {formatTime(task.start_time)}
            </span>
          )}
          {label && (
            <span className={chip} style={{ background: `${label.color}1a`, color: label.color }}>
              ● {label.name}
            </span>
          )}
          <span className={`${chip} ${p.className}`}>● {p.text}</span>
        </div>
      </div>

      <button onClick={onDelete} aria-label="Delete task" className="h-fit text-gray-300 hover:text-gray-500">
        <X size={16} />
      </button>
    </div>
  )
}