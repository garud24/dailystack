import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import Modal, { COLORS, ColorSwatches } from './Modal'

// Add a new column, or edit an existing one
export default function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? COLORS[1])
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a name')
    const values = { name: name.trim(), color }
    const { error } = category
      ? await supabase.from('categories').update(values).eq('id', category.id)
      : await supabase.from('categories').insert(values)
    if (error) return setError(error.message)
    onSaved()
  }

  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. University & Study, Cooking"
          className="w-full border border-gray-200 rounded-lg p-2.5"
        />
        <ColorSwatches value={color} onChange={setColor} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-medium">
          {category ? 'Save' : 'Add category'}
        </button>
      </form>
    </Modal>
  )
}