import { useEffect, useState } from 'react'
import { FolderPlus, Paintbrush, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Category, Label, Task } from '../types'
import { isDueOn, ymd } from '../lib/recurrence'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import CategoryModal from './CategoryModal'
import LabelsModal from './LabelsModal'

export default function Board() {
  const [cats, setCats] = useState<Category[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  // filters
  const [labelFilter, setLabelFilter] = useState<string | null>(null)
  const [mobileCat, setMobileCat] = useState('all')

  // popups
  const [taskModal, setTaskModal] = useState<{ task: Task | null; categoryId?: string } | null>(null)
  const [catModal, setCatModal] = useState<{ category: Category | null } | null>(null)
  const [labelsOpen, setLabelsOpen] = useState(false)

  const today = new Date()
  const todayStr = ymd(today)

  async function load() {
    const [c, l, t, s] = await Promise.all([
      supabase.from('categories').select('*').is('parent_id', null).order('created_at'),
      supabase.from('labels').select('*').order('created_at'),
      supabase.from('tasks').select('*').eq('active', true),
      supabase.from('sessions').select('task_id').eq('for_date', todayStr).eq('status', 'completed'),
    ])
    const err = c.error ?? l.error ?? t.error ?? s.error
    if (err) setError(err.message)
    setCats(c.data ?? [])
    setLabels(l.data ?? [])
    setTasks(t.data ?? [])
    setDoneIds(new Set((s.data ?? []).map(r => r.task_id as string)))
    setLoaded(true)
  }

  useEffect(() => { load() }, [])

  // Today's tasks, sorted by time
  const todayAll = tasks
    .filter(t => isDueOn(t, today))
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
  const visible = labelFilter ? todayAll.filter(t => t.label_id === labelFilter) : todayAll
  const doneCount = todayAll.filter(t => doneIds.has(t.id)).length

  const catById = (id: string) => cats.find(c => c.id === id)
  const labelById = (id: string | null) => labels.find(l => l.id === id)

  // Checkbox: done today = one "completed" row in sessions (your log)
  async function toggle(t: Task) {
    const wasDone = doneIds.has(t.id)
    setDoneIds(prev => {
      const next = new Set(prev)
      if (wasDone) next.delete(t.id)
      else next.add(t.id)
      return next
    })
    const now = new Date().toISOString()
    const { error } = wasDone
      ? await supabase.from('sessions').delete().eq('task_id', t.id).eq('for_date', todayStr).eq('status', 'completed')
      : await supabase.from('sessions').insert({
          task_id: t.id,
          category_id: t.category_id,
          for_date: todayStr,
          status: 'completed',
          started_at: now,
          ended_at: now,
        })
    if (error) {
      setError(error.message)
      load()
    }
  }

  async function deleteTask(t: Task) {
    const repeatNote = t.rrule ? ' It repeats, so this removes it from every day.' : ''
    if (!confirm(`Delete "${t.title}"?${repeatNote} Your logs are kept.`)) return
    const { error } = await supabase.from('tasks').delete().eq('id', t.id)
    if (error) return setError(error.message)
    load()
  }

  async function deleteCategory(c: Category) {
    const count = tasks.filter(t => t.category_id === c.id).length
    if (!confirm(`Delete "${c.name}" and its ${count} task(s)? Your logs are kept.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return setError(error.message)
    if (mobileCat === c.id) setMobileCat('all')
    load()
  }

  function newTask(categoryId?: string) {
    if (cats.length === 0) setCatModal({ category: null })
    else setTaskModal({ task: null, categoryId })
  }

  if (!loaded) return <p className="text-gray-500">Loading...</p>

  const dateLabel = today.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
  const pill = 'shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm'

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            <span className="md:hidden">My Tasks</span>
            <span className="hidden md:inline">My Workspace</span>
          </h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">
            {dateLabel} • {doneCount} of {todayAll.length} tasks completed
          </p>
        </div>

        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setCatModal({ category: null })}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-4 py-2.5 font-medium"
          >
            <Plus size={18} /> Add Category
          </button>
          <button
            onClick={() => newTask()}
            className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 font-medium"
          >
            <Plus size={18} /> New Task
          </button>
        </div>

        <div className="flex md:hidden gap-2">
          <button
            onClick={() => setCatModal({ category: null })}
            aria-label="Add category"
            className="h-10 w-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center"
          >
            <FolderPlus size={18} />
          </button>
          <button
            onClick={() => setLabelsOpen(true)}
            aria-label="Edit color key"
            className="h-10 w-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center"
          >
            <Paintbrush size={18} />
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Color key (tap a label to filter) */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:flex-wrap md:bg-white md:border md:border-gray-200 md:rounded-2xl md:p-3">
        <span className="hidden md:inline text-xs font-semibold tracking-wider text-gray-400 mr-1">COLOR KEY:</span>
        {labels.map(l => {
          const active = labelFilter === l.id
          return (
            <button
              key={l.id}
              onClick={() => setLabelFilter(active ? null : l.id)}
              className={`${pill} ${active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              {l.name}
            </button>
          )
        })}
        {labels.length === 0 && <span className="text-sm text-gray-400">No labels yet</span>}
        <button
          onClick={() => setLabelsOpen(true)}
          className="hidden md:flex ml-auto items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <Pencil size={14} /> Edit Legend
        </button>
      </div>

      {/* Phone: category tabs */}
      {cats.length > 0 && (
        <div className="flex md:hidden gap-2 overflow-x-auto -mx-4 px-4">
          {[{ id: 'all', name: `All (${cats.length})` }, ...cats].map(c => (
            <button
              key={c.id}
              onClick={() => setMobileCat(c.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
                mobileCat === c.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Columns (desktop) / stacked sections (phone) */}
      {cats.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-gray-600">Start by adding a category, like Study, Exercise or Cooking.</p>
          <button onClick={() => setCatModal({ category: null })} className="bg-indigo-600 text-white rounded-xl px-4 py-2.5">
            Add Category
          </button>
        </div>
      ) : (
        <div className="grid gap-5 items-start md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {cats.map(c => {
            const colTasks = visible.filter(t => t.category_id === c.id)
            const hiddenOnPhone = mobileCat !== 'all' && mobileCat !== c.id
            return (
              <section
                key={c.id}
                className={`bg-white border border-gray-200 rounded-2xl ${hiddenOnPhone ? 'hidden md:block' : ''}`}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                    <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <button onClick={() => newTask(c.id)} aria-label={`Add task to ${c.name}`} className="hover:text-indigo-600">
                      <Plus size={18} />
                    </button>
                    <button onClick={() => setCatModal({ category: c })} aria-label={`Edit ${c.name}`} className="hover:text-indigo-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteCategory(c)} aria-label={`Delete ${c.name}`} className="hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {colTasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      category={catById(t.category_id)}
                      label={labelById(t.label_id)}
                      done={doneIds.has(t.id)}
                      onToggle={() => toggle(t)}
                      onEdit={() => setTaskModal({ task: t })}
                      onDelete={() => deleteTask(t)}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">Nothing scheduled today</p>
                  )}
                  <button
                    onClick={() => newTask(c.id)}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-3 text-gray-500 hover:text-indigo-600 hover:border-indigo-300"
                  >
                    <Plus size={16} /> Add Task
                  </button>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Phone: floating + button */}
      <button
        onClick={() => newTask()}
        aria-label="New task"
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-indigo-600 text-white shadow-lg flex items-center justify-center"
      >
        <Plus size={28} />
      </button>

      {/* Popups */}
      {taskModal && (
        <TaskModal
          task={taskModal.task}
          categories={cats}
          labels={labels}
          defaultCategoryId={taskModal.categoryId}
          onClose={() => setTaskModal(null)}
          onSaved={() => { setTaskModal(null); load() }}
        />
      )}
      {catModal && (
        <CategoryModal
          category={catModal.category}
          onClose={() => setCatModal(null)}
          onSaved={() => { setCatModal(null); load() }}
        />
      )}
      {labelsOpen && <LabelsModal labels={labels} onClose={() => setLabelsOpen(false)} onChanged={load} />}
    </div>
  )
}