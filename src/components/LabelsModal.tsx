import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Label } from '../types'
import Modal, { COLORS, ColorSwatches } from './Modal'

// "Edit Legend": add, rename, recolor and delete labels
export default function LabelsModal({
  labels,
  onClose,
  onChanged,
}: {
  labels: Label[]
  onClose: () => void
  onChanged: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const { error } = await supabase.from('labels').insert({ name: name.trim(), color })
    if (error) return setError(error.message)
    setName('')
    onChanged()
  }

  async function update(id: string, values: { name?: string; color?: string }) {
    const { error } = await supabase.from('labels').update(values).eq('id', id)
    if (error) return setError(error.message)
    onChanged()
  }

  async function remove(l: Label) {
    if (!confirm(`Delete label "${l.name}"? Tasks keep working, they just lose this label.`)) return
    const { error } = await supabase.from('labels').delete().eq('id', l.id)
    if (error) return setError(error.message)
    onChanged()
  }

  return (
    <Modal title="Edit color key" onClose={onClose}>
      <ul className="space-y-2">
        {labels.map(l => (
          <li key={l.id} className="flex items-center gap-2">
            <input
              type="color"
              defaultValue={l.color}
              onChange={e => update(l.id, { color: e.target.value })}
              className="h-9 w-10 rounded border border-gray-200"
              aria-label={`Color for ${l.name}`}
            />
            <input
              defaultValue={l.name}
              onBlur={e => e.target.value.trim() && e.target.value !== l.name && update(l.id, { name: e.target.value.trim() })}
              className="flex-1 border border-gray-200 rounded-lg p-2 text-sm"
            />
            <button onClick={() => remove(l)} aria-label={`Delete ${l.name}`} className="text-gray-400 hover:text-red-600 p-1">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {labels.length === 0 && <p className="text-sm text-gray-500">No labels yet. Add one below.</p>}
      </ul>

      <form onSubmit={add} className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">New label</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Urgent Deadline"
          className="w-full border border-gray-200 rounded-lg p-2.5"
        />
        <ColorSwatches value={color} onChange={setColor} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium">Add label</button>
      </form>
    </Modal>
  )
}