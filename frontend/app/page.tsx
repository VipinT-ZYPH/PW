'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp,
  IndianRupee, LayoutDashboard, ListChecks, MapPin, Plus, Sparkles,
  Store, Users, X
} from 'lucide-react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
type View = 'Overview' | 'Budget' | 'Tasks' | 'Vendors'
type Event = { id: number; name: string; event_type: string; city: string; event_date?: string; guests: number; budget: number }
type BudgetItem = { id: number; category: string; planned: number; actual: number }
type Task = { id: number; title: string; due_date?: string; completed: boolean; priority: string }
type Summary = { event: Event; budget_items: BudgetItem[]; tasks: Task[]; spent: number; planned: number; task_completion: number }
type Vendor = { id: number; name: string; category: string; city: string; rating: number; price_band: string; description: string }
const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [active, setActive] = useState<View>('Overview')
  const [showCreate, setShowCreate] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [notice, setNotice] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', event_type: 'Wedding', city: 'Mumbai', event_date: '', guests: '150', budget: '1200000' })
  const [budgetForm, setBudgetForm] = useState({ category: '', planned: '' })
  const [taskTitle, setTaskTitle] = useState('')

  const selectEvent = useCallback(async (id: number) => {
    const response = await fetch(`${API}/api/events/${id}/summary`)
    if (!response.ok) throw new Error('Unable to load event')
    setSummary(await response.json())
    setAnswer('')
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/events`)
      if (!response.ok) throw new Error('Unable to load events')
      const data: Event[] = await response.json()
      setEvents(data)
      if (data[0]) await selectEvent(data[0].id)
    } catch { setNotice('Could not connect to the backend. Start FastAPI on port 8000.') }
  }, [selectEvent])

  useEffect(() => {
    void loadEvents()
    fetch(`${API}/api/vendors`).then(r => r.json()).then(setVendors).catch(() => setNotice('Could not load vendors. Is the backend running?'))
  }, [loadEvents])

  const createEvent = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API}/api/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, guests: Number(form.guests), budget: Number(form.budget), event_date: form.event_date || null })
      })
      if (!response.ok) throw new Error('Event could not be created')
      const created: Event = await response.json()
      setEvents(current => [created, ...current])
      await selectEvent(created.id)
      setShowCreate(false)
      setNotice('Event created successfully.')
    } catch { setNotice('Event could not be created. Check the form and backend.') }
  }

  const updateTask = async (task: Task) => {
    if (!summary) return
    const response = await fetch(`${API}/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed })
    })
    if (!response.ok) { setNotice('Task could not be updated.'); return }
    await selectEvent(summary.event.id)
  }

  const addBudgetItem = async (e: FormEvent) => {
    e.preventDefault()
    if (!summary) return
    const response = await fetch(`${API}/api/events/${summary.event.id}/budget`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: budgetForm.category, planned: Number(budgetForm.planned), actual: 0 })
    })
    if (!response.ok) { setNotice('Budget item could not be added.'); return }
    setBudgetForm({ category: '', planned: '' })
    await selectEvent(summary.event.id)
  }

  const addTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!summary || !taskTitle.trim()) return
    const response = await fetch(`${API}/api/events/${summary.event.id}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskTitle.trim(), priority: 'medium' })
    })
    if (!response.ok) { setNotice('Task could not be added.'); return }
    setTaskTitle('')
    await selectEvent(summary.event.id)
  }

  const askAI = async () => {
    if (!summary || !question.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`${API}/api/events/${summary.event.id}/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      if (!response.ok) throw new Error()
      setAnswer((await response.json()).answer)
    } catch { setNotice('The planning assistant is unavailable.') }
    finally { setLoading(false) }
  }

  const nav = [
    { name: 'Overview' as View, icon: LayoutDashboard },
    { name: 'Budget' as View, icon: IndianRupee },
    { name: 'Tasks' as View, icon: ListChecks },
    { name: 'Vendors' as View, icon: Store }
  ]
  const remaining = summary ? Math.max(summary.event.budget - summary.spent, 0) : 0

  return <div className={styles.app}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><div className={styles.logo}>✦</div><span>eventmind</span></div>
      <div className={styles.workspaceLabel}>WORKSPACE</div>
      <select className={styles.eventPicker} value={summary?.event.id || ''} onChange={e => e.target.value && void selectEvent(Number(e.target.value))}>
        {!events.length && <option value="">No events yet</option>}
        {events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}
      </select>
      <nav>{nav.map(({ name, icon: Icon }) => <button key={name} className={active === name ? styles.activeNav : ''} onClick={() => setActive(name)}><Icon size={18}/>{name}</button>)}</nav>
      <div className={styles.sidebarBottom}>
        <button onClick={() => setShowHelp(true)}><CircleHelp size={18}/>Help centre</button>
        <div className={styles.profile}><div className={styles.avatar}>AK</div><div><strong>Arjun Kapoor</strong><small>Personal workspace</small></div><ChevronRight size={16}/></div>
      </div>
    </aside>
    <main className={styles.main}>
      <header><div><p className={styles.eyebrow}>THURSDAY, 29 OCTOBER 2026</p><h1>Good morning, Arjun <span>✦</span></h1><p className={styles.subtitle}>Let&apos;s make your next celebration feel effortless.</p></div>
        <div className={styles.headerActions}><button className={styles.iconButton} onClick={() => setNotice('You have no new notifications.')}><Bell size={19}/><i/></button><button className={styles.createButton} onClick={() => setShowCreate(true)}><Plus size={18}/> New event</button></div>
      </header>
      {notice && <div className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
      {!summary ? <div className={styles.empty}><div className={styles.emptyIcon}>✦</div><h2>Start planning something memorable</h2><p>Create your first event to unlock your planning dashboard.</p><button className={styles.createButton} onClick={() => setShowCreate(true)}><Plus size={18}/> Create an event</button></div> :
        <>{active === 'Overview' && <Overview summary={summary} remaining={remaining} dueSoon={summary.tasks.filter(t => !t.completed).slice(0, 3)} onView={setActive} question={question} setQuestion={setQuestion} answer={answer} askAI={askAI} loading={loading} vendors={vendors}/>}
        {active === 'Budget' && <BudgetView summary={summary} remaining={remaining} form={budgetForm} setForm={setBudgetForm} addItem={addBudgetItem}/>}
        {active === 'Tasks' && <TasksView summary={summary} taskTitle={taskTitle} setTaskTitle={setTaskTitle} addTask={addTask} updateTask={updateTask}/>}
        {active === 'Vendors' && <VendorsView vendors={vendors}/>}</>}
    </main>
    {showCreate && <div className={styles.modalBackdrop}><form className={styles.modal} onSubmit={createEvent}><button type="button" className={styles.close} onClick={() => setShowCreate(false)}><X/></button><div className={styles.modalEyebrow}>NEW EVENT</div><h2>Bring it to life.</h2><p>Start with the basics. You can refine the details as you go.</p><label>Event name<input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Nisha & Rohan's wedding"/></label><div className={styles.formRow}><label>Event type<select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}><option>Wedding</option><option>Birthday</option><option>Community event</option><option>Other</option></select></label><label>City<input required value={form.city} onChange={e => setForm({...form, city: e.target.value})}/></label></div><div className={styles.formRow}><label>Date<input type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})}/></label><label>Guests<input type="number" min="1" value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}/></label></div><label>Total budget (INR)<input type="number" min="0" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}/></label><button className={styles.createButton} type="submit">Create event <ArrowUpRight size={17}/></button></form></div>}
    {showHelp && <div className={styles.modalBackdrop}><div className={styles.modal}><button className={styles.close} onClick={() => setShowHelp(false)}><X/></button><div className={styles.modalEyebrow}>HELP CENTRE</div><h2>Plan with confidence.</h2><p>Use Overview for your snapshot, Budget to track planned spend, Tasks to manage your checklist, and Vendors to browse partners. Your data is saved in the local backend.</p><button className={styles.createButton} onClick={() => setShowHelp(false)}>Got it</button></div></div>}
  </div>
}

function Overview({ summary, remaining, dueSoon, onView, question, setQuestion, answer, askAI, loading, vendors }: { summary: Summary; remaining: number; dueSoon: Task[]; onView: (view: View) => void; question: string; setQuestion: (value: string) => void; answer: string; askAI: () => void; loading: boolean; vendors: Vendor[] }) {
  return <><section className={styles.eventHero}><div><div className={styles.heroLabel}><span className={styles.liveDot}/> ACTIVE EVENT</div><h2>{summary.event.name}</h2><p><CalendarDays size={16}/> {summary.event.event_date ? new Date(summary.event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date to be confirmed'} <span>·</span><MapPin size={16}/> {summary.event.city} <span>·</span><Users size={16}/> {summary.event.guests} guests</p></div><button className={styles.linkButton} onClick={() => onView('Budget')}>View event <ArrowUpRight size={16}/></button></section>
    <div className={styles.stats}><div className={styles.statCard}><div className={styles.statTop}><span>Total budget</span><IndianRupee size={18}/></div><strong>{money(summary.event.budget)}</strong><div className={styles.progress}><span style={{ width: `${Math.min((summary.spent / Math.max(summary.event.budget, 1)) * 100, 100)}%` }}/></div><small>{money(summary.spent)} spent <b>·</b> {money(remaining)} remaining</small></div><div className={styles.statCard}><div className={styles.statTop}><span>Tasks complete</span><Check size={18}/></div><strong>{summary.task_completion}%</strong><small>{summary.tasks.filter(t => t.completed).length} of {summary.tasks.length} tasks done</small></div><div className={styles.statCard}><div className={styles.statTop}><span>Days to go</span><CalendarDays size={18}/></div><strong>{summary.event.event_date ? Math.max(0, Math.ceil((new Date(summary.event.event_date).getTime() - Date.now()) / 86400000)) : '—'}</strong><small className={styles.muted}>Keep the momentum going</small></div></div>
    <section className={styles.grid}><div className={styles.card}><div className={styles.cardHeader}><div><h3>Upcoming tasks</h3><p>The next small steps that move everything forward.</p></div><button className={styles.textButton} onClick={() => onView('Tasks')}>View all <ArrowUpRight size={15}/></button></div>{dueSoon.length ? dueSoon.map(t => <div className={styles.task} key={t.id}><div className={styles.checkbox}/><div><strong>{t.title}</strong><small>{t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'No due date'}</small></div><span className={`${styles.priority} ${styles[t.priority]}`}>{t.priority}</span></div>) : <p className={styles.muted}>You&apos;re all caught up.</p>}</div><div className={`${styles.card} ${styles.aiCard}`}><div className={styles.aiOrb}><Sparkles size={20}/></div><h3>Your planning co-pilot</h3><p>Ask anything about your event and get a practical next step.</p><div className={styles.ask}><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="e.g. How should I split my budget?"/><button onClick={askAI} disabled={loading}>{loading ? '…' : 'Ask'}</button></div>{answer && <div className={styles.answer}>{answer}</div>}</div></section>
    <section className={styles.card}><div className={styles.cardHeader}><div><h3>Recommended vendors</h3><p>India-first partners, ready for your shortlist.</p></div><button className={styles.textButton} onClick={() => onView('Vendors')}>Browse directory <ArrowUpRight size={15}/></button></div><VendorCards vendors={vendors.slice(0, 3)}/></section></>
}

function BudgetView({ summary, remaining, form, setForm, addItem }: { summary: Summary; remaining: number; form: { category: string; planned: string }; setForm: (form: { category: string; planned: string }) => void; addItem: (e: FormEvent) => void }) {
  return <section className={styles.card}><div className={styles.cardHeader}><div><h2>Budget</h2><p>{money(remaining)} remaining from your {money(summary.event.budget)} budget.</p></div></div><form className={styles.formRow} onSubmit={addItem}><label>Category<input required value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Venue"/></label><label>Planned amount<input required type="number" min="0" value={form.planned} onChange={e => setForm({...form, planned: e.target.value})}/></label><button className={styles.createButton} type="submit">Add item <Plus size={16}/></button></form><div className={styles.table}>{summary.budget_items.map(item => <div className={styles.task} key={item.id}><strong>{item.category}</strong><span>{money(item.planned)} planned · {money(item.actual)} actual</span></div>)}</div></section>
}

function TasksView({ summary, taskTitle, setTaskTitle, addTask, updateTask }: { summary: Summary; taskTitle: string; setTaskTitle: (value: string) => void; addTask: (e: FormEvent) => void; updateTask: (task: Task) => void }) {
  return <section className={styles.card}><div className={styles.cardHeader}><div><h2>Tasks</h2><p>{summary.task_completion}% complete.</p></div></div><form className={styles.ask} onSubmit={addTask}><input required value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Add a task"/><button type="submit"><Plus size={15}/></button></form>{summary.tasks.map(task => <button className={styles.taskButton} key={task.id} onClick={() => void updateTask(task)}><div className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}>{task.completed && <Check size={12}/>}</div><div><strong>{task.title}</strong><small>{task.completed ? 'Completed' : task.due_date ? `Due ${task.due_date}` : 'No due date'}</small></div><span className={`${styles.priority} ${styles[task.priority]}`}>{task.priority}</span></button>)}</section>
}

function VendorsView({ vendors }: { vendors: Vendor[] }) {
  return <section className={styles.card}><div className={styles.cardHeader}><div><h2>Vendor directory</h2><p>Browse India-first partners for your event.</p></div></div><VendorCards vendors={vendors}/></section>
}

function VendorCards({ vendors }: { vendors: Vendor[] }) {
  return <div className={styles.vendorGrid}>{vendors.map(v => <div className={styles.vendor} key={v.id}><div className={styles.vendorImage}>{v.category === 'Catering' ? '🍽️' : v.category === 'Photography' ? '📷' : v.category === 'Entertainment' ? '🎶' : '✿'}</div><div className={styles.vendorMeta}><span>{v.category}</span><h4>{v.name}</h4><p><MapPin size={13}/> {v.city} <b>·</b> ★ {v.rating}</p><small>{v.price_band}</small></div></div>)}</div>
}
