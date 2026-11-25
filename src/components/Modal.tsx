import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'

export const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#eab308', '#ec4899', '#14b8a6']

// Popup: a bottom sheet on phones, a centered dialog on desktop
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Row of color circles to pick from
export function ColorSwatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          className="h-8 w-8 rounded-full flex items-center justify-center text-white"
          style={{ background: c }}
        >
          {value === c && <Check size={16} />}
        </button>
      ))}
    </div>
  )
}