import { useEffect, useState } from 'react'

// ============================================
// DATE HELPERS
// ============================================

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getWeekBounds(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z')
  const day = date.getUTCDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const monMs = date.getTime() + diffToMon * 864e5
  const sunMs = monMs + 6 * 864e5
  return {
    start: new Date(monMs).toISOString().split('T')[0],
    end: new Date(sunMs).toISOString().split('T')[0],
  }
}

function getPeriodLengthMs(habit) {
  const days =
    habit.targetPeriodUnit === 'day' ? habit.targetPeriodValue :
    habit.targetPeriodUnit === 'week' ? habit.targetPeriodValue * 7 :
    habit.targetPeriodValue * 30
  return days * 864e5
}

function getCurrentCustomPeriodStart(habit) {
  const createdMs = new Date(habit.createdAt + 'T00:00:00Z').getTime()
  const todayMs = new Date(getToday() + 'T00:00:00Z').getTime()
  const lengthMs = getPeriodLengthMs(habit)
  const periodsElapsed = Math.floor((todayMs - createdMs) / lengthMs)
  return new Date(createdMs + periodsElapsed * lengthMs).toISOString().split('T')[0]
}

function getCustomPeriodEnd(startStr, habit) {
  const startMs = new Date(startStr + 'T00:00:00Z').getTime()
  return new Date(startMs + getPeriodLengthMs(habit) - 864e5).toISOString().split('T')[0]
}

// ============================================
// HABIT HELPERS
// ============================================

function normalizeHabit(habit) {
  return {
    frequencyType: 'daily',
    targetCount: 1,
    targetPeriodValue: 1,
    targetPeriodUnit: 'day',
    ...habit,
  }
}

function getFrequencyLabel(habit) {
  if (habit.frequencyType === 'daily') return 'Daily'
  if (habit.frequencyType === 'weekly') return `${habit.targetCount}× / week`
  if (habit.frequencyType === 'monthly') return `${habit.targetCount}× / month`
  if (habit.frequencyType === 'custom') {
    const unit = habit.targetPeriodUnit + (habit.targetPeriodValue > 1 ? 's' : '')
    return `${habit.targetCount}× every ${habit.targetPeriodValue} ${unit}`
  }
  return 'Daily'
}

function getPeriodName(habit) {
  if (habit.frequencyType === 'daily') return 'today'
  if (habit.frequencyType === 'weekly') return 'this week'
  if (habit.frequencyType === 'monthly') return 'this month'
  return 'this period'
}

function getStreakUnit(habit) {
  if (habit.frequencyType === 'daily') return 'day'
  if (habit.frequencyType === 'weekly') return 'week'
  if (habit.frequencyType === 'monthly') return 'month'
  return 'period'
}

function getPeriodProgress(habit) {
  const today = getToday()
  if (habit.frequencyType === 'daily') {
    return { count: habit.completedDates.includes(today) ? 1 : 0, target: habit.targetCount }
  }
  if (habit.frequencyType === 'weekly') {
    const { start, end } = getWeekBounds(today)
    return { count: habit.completedDates.filter((d) => d >= start && d <= end).length, target: habit.targetCount }
  }
  if (habit.frequencyType === 'monthly') {
    const ym = today.slice(0, 7)
    return { count: habit.completedDates.filter((d) => d.slice(0, 7) === ym).length, target: habit.targetCount }
  }
  if (habit.frequencyType === 'custom') {
    const start = getCurrentCustomPeriodStart(habit)
    const end = getCustomPeriodEnd(start, habit)
    return { count: habit.completedDates.filter((d) => d >= start && d <= end).length, target: habit.targetCount }
  }
  return { count: 0, target: 1 }
}

function isOnTrack(habit) {
  const { count, target } = getPeriodProgress(habit)
  return count >= target
}

function getStreak(habit) {
  const today = getToday()
  if (habit.frequencyType === 'daily') {
    let streak = 0, cursor = today
    while (habit.completedDates.includes(cursor)) {
      streak++
      const d = new Date(cursor + 'T00:00:00Z')
      d.setUTCDate(d.getUTCDate() - 1)
      cursor = d.toISOString().split('T')[0]
    }
    return streak
  }
  if (habit.frequencyType === 'weekly') {
    let streak = 0, cursor = today
    while (true) {
      const { start, end } = getWeekBounds(cursor)
      if (habit.completedDates.filter((d) => d >= start && d <= end).length >= habit.targetCount) {
        streak++
        const d = new Date(start + 'T00:00:00Z')
        d.setUTCDate(d.getUTCDate() - 1)
        cursor = d.toISOString().split('T')[0]
      } else break
    }
    return streak
  }
  if (habit.frequencyType === 'monthly') {
    let streak = 0, cursor = today
    while (true) {
      const ym = cursor.slice(0, 7)
      if (habit.completedDates.filter((d) => d.slice(0, 7) === ym).length >= habit.targetCount) {
        streak++
        const [y, m] = cursor.split('-').map(Number)
        cursor = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`
      } else break
    }
    return streak
  }
  if (habit.frequencyType === 'custom') {
    let streak = 0, periodStart = getCurrentCustomPeriodStart(habit)
    const lengthMs = getPeriodLengthMs(habit)
    while (true) {
      const periodEnd = getCustomPeriodEnd(periodStart, habit)
      if (habit.completedDates.filter((d) => d >= periodStart && d <= periodEnd).length >= habit.targetCount) {
        streak++
        periodStart = new Date(new Date(periodStart + 'T00:00:00Z').getTime() - lengthMs).toISOString().split('T')[0]
      } else break
    }
    return streak
  }
  return 0
}

function getCompletionRate(habit) {
  const today = getToday()
  const created = habit.createdAt
  if (habit.frequencyType === 'daily') {
    const total = Math.floor((new Date(today + 'T00:00:00Z') - new Date(created + 'T00:00:00Z')) / 864e5) + 1
    return Math.round((habit.completedDates.length / total) * 100)
  }
  if (habit.frequencyType === 'weekly') {
    const cws = getWeekBounds(created).start
    const nws = getWeekBounds(today).start
    const total = Math.round((new Date(nws + 'T00:00:00Z') - new Date(cws + 'T00:00:00Z')) / (7 * 864e5)) + 1
    let done = 0, cursor = cws
    for (let i = 0; i < total; i++) {
      const { start, end } = getWeekBounds(cursor)
      if (habit.completedDates.filter((d) => d >= start && d <= end).length >= habit.targetCount) done++
      const d = new Date(end + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)
      cursor = d.toISOString().split('T')[0]
    }
    return Math.round((done / total) * 100)
  }
  if (habit.frequencyType === 'monthly') {
    const [sy, sm] = created.split('-').map(Number)
    const [ey, em] = today.split('-').map(Number)
    const total = (ey - sy) * 12 + (em - sm) + 1
    let done = 0, y = sy, m = sm
    for (let i = 0; i < total; i++) {
      const ym = `${y}-${String(m).padStart(2, '0')}`
      if (habit.completedDates.filter((d) => d.slice(0, 7) === ym).length >= habit.targetCount) done++
      m++; if (m > 12) { m = 1; y++ }
    }
    return Math.round((done / total) * 100)
  }
  if (habit.frequencyType === 'custom') {
    const lengthMs = getPeriodLengthMs(habit)
    const total = Math.max(1, Math.ceil((new Date(today + 'T00:00:00Z') - new Date(created + 'T00:00:00Z') + 864e5) / lengthMs))
    let done = 0, ps = created
    for (let i = 0; i < total; i++) {
      const pe = getCustomPeriodEnd(ps, habit)
      if (habit.completedDates.filter((d) => d >= ps && d <= pe).length >= habit.targetCount) done++
      ps = new Date(new Date(ps + 'T00:00:00Z').getTime() + lengthMs).toISOString().split('T')[0]
    }
    return Math.round((done / total) * 100)
  }
  return 0
}

// ============================================
// APP
// ============================================

function App() {
  // ---- Habit state ----
  const [habitName, setHabitName] = useState('')
  const [frequencyType, setFrequencyType] = useState('daily')
  const [targetCount, setTargetCount] = useState(1)
  const [targetPeriodValue, setTargetPeriodValue] = useState(1)
  const [targetPeriodUnit, setTargetPeriodUnit] = useState('day')
  const [filter, setFilter] = useState('all')

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits')
    return saved ? JSON.parse(saved).map(normalizeHabit) : []
  })

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  // ---- Schedule state ----
  const [schedItems, setSchedItems] = useState(() => {
    const saved = localStorage.getItem('scheduleItems')
    return saved ? JSON.parse(saved) : []
  })
  const [schedTitle, setSchedTitle] = useState('')
  const [schedStart, setSchedStart] = useState('')
  const [schedEnd, setSchedEnd] = useState('')
  const [schedCategory, setSchedCategory] = useState('')
  const [schedNote, setSchedNote] = useState('')
  const [schedError, setSchedError] = useState('')

  useEffect(() => {
    localStorage.setItem('scheduleItems', JSON.stringify(schedItems))
  }, [schedItems])

  // ---- Habit handlers ----
  function handleFrequencyTypeChange(type) {
    setFrequencyType(type)
    if (type === 'daily') {
      setTargetCount(1); setTargetPeriodValue(1); setTargetPeriodUnit('day')
    } else if (type === 'weekly') {
      setTargetCount(3); setTargetPeriodValue(1); setTargetPeriodUnit('week')
    } else if (type === 'monthly') {
      setTargetCount(5); setTargetPeriodValue(1); setTargetPeriodUnit('month')
    } else if (type === 'custom') {
      setTargetCount(3); setTargetPeriodValue(7); setTargetPeriodUnit('day')
    }
  }

  function handleAddHabit(e) {
    e.preventDefault()
    if (!habitName.trim()) return
    setHabits([...habits, {
      id: Date.now(),
      name: habitName,
      createdAt: getToday(),
      completedDates: [],
      frequencyType,
      targetCount,
      targetPeriodValue,
      targetPeriodUnit,
    }])
    setHabitName('')
    setFrequencyType('daily')
    setTargetCount(1); setTargetPeriodValue(1); setTargetPeriodUnit('day')
  }

  function handleDeleteHabit(id) {
    setHabits(habits.filter((h) => h.id !== id))
  }

  function handleToggleDone(id) {
    const today = getToday()
    setHabits(habits.map((habit) => {
      if (habit.id !== id) return habit
      const alreadyDone = habit.completedDates.includes(today)
      const updatedDates = alreadyDone
        ? habit.completedDates.filter((d) => d !== today)
        : [...habit.completedDates, today]
      return { ...habit, completedDates: updatedDates }
    }))
  }

  // ---- Schedule handlers ----
  function handleAddSchedItem(e) {
    e.preventDefault()
    if (!schedTitle.trim()) { setSchedError('Title is required.'); return }
    if (!schedStart) { setSchedError('Start time is required.'); return }
    if (!schedEnd) { setSchedError('End time is required.'); return }
    if (schedEnd <= schedStart) { setSchedError('End time must be after start time.'); return }

    setSchedItems([...schedItems, {
      id: Date.now(),
      title: schedTitle.trim(),
      startTime: schedStart,
      endTime: schedEnd,
      category: schedCategory.trim(),
      note: schedNote.trim(),
      completed: false,
      scheduledDate: getToday(),
    }])
    setSchedTitle(''); setSchedStart(''); setSchedEnd('')
    setSchedCategory(''); setSchedNote(''); setSchedError('')
  }

  function handleDeleteSchedItem(id) {
    setSchedItems(schedItems.filter((item) => item.id !== id))
  }

  function handleToggleSchedItem(id) {
    setSchedItems(schedItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  // ---- Computed values ----
  const today = getToday()

  // Habit stats
  const onTrackCount = habits.filter(isOnTrack).length
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(getStreak)) : 0
  const avgRate = habits.length > 0
    ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h), 0) / habits.length)
    : 0

  const filteredHabits = habits.filter((h) => {
    if (filter === 'done') return h.completedDates.includes(today)
    if (filter === 'notDone') return !h.completedDates.includes(today)
    return true
  })

  // Schedule stats — only today's items, sorted by start time
  const todaySchedItems = schedItems
    .filter((item) => item.scheduledDate === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const completedSchedCount = todaySchedItems.filter((item) => item.completed).length
  const remainingSchedCount = todaySchedItems.length - completedSchedCount

  // Human-readable date for the schedule header
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // ---- Render ----
  return (
    <div className="app">
      <header className="header">
        <h1>Habit Tracker</h1>
        <p>Track your habits and plan your day.</p>
      </header>

      {/* Habit dashboard */}
      <div className="dashboard">
        <div className="stat-card">
          <span className="stat-value">{habits.length}</span>
          <span className="stat-label">Total Habits</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{onTrackCount}</span>
          <span className="stat-label">On Track</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{bestStreak}</span>
          <span className="stat-label">Best Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{avgRate}%</span>
          <span className="stat-label">Avg Completion</span>
        </div>
      </div>

      <main className="container">

        {/* ---- HABITS SECTION ---- */}
        <form className="habit-form" onSubmit={handleAddHabit}>
          <div className="form-row">
            <input
              dir="auto"
              type="text"
              placeholder="Enter a new habit..."
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
            />
            <button type="submit">Add Habit</button>
          </div>

          <div className="form-frequency">
            <div className="frequency-tabs">
              {['daily', 'weekly', 'monthly', 'custom'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`freq-tab ${frequencyType === type ? 'active' : ''}`}
                  onClick={() => handleFrequencyTypeChange(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {frequencyType === 'weekly' && (
              <div className="frequency-options">
                <label htmlFor="target-count-weekly">Times per week</label>
                <input id="target-count-weekly" type="number" min="1" max="7" value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))} />
              </div>
            )}
            {frequencyType === 'monthly' && (
              <div className="frequency-options">
                <label htmlFor="target-count-monthly">Times per month</label>
                <input id="target-count-monthly" type="number" min="1" max="31" value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))} />
              </div>
            )}
            {frequencyType === 'custom' && (
              <div className="frequency-options">
                <label htmlFor="target-count-custom">Times</label>
                <input id="target-count-custom" type="number" min="1" value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))} />
                <label htmlFor="target-period-value">every</label>
                <input id="target-period-value" type="number" min="1" value={targetPeriodValue}
                  onChange={(e) => setTargetPeriodValue(Number(e.target.value))} />
                <select id="target-period-unit" value={targetPeriodUnit}
                  onChange={(e) => setTargetPeriodUnit(e.target.value)}>
                  <option value="day">day(s)</option>
                  <option value="week">week(s)</option>
                  <option value="month">month(s)</option>
                </select>
              </div>
            )}
          </div>
        </form>

        <section className="habit-list">
          <div className="list-header">
            <h2>Your Habits</h2>
            <div className="filters">
              {[
                { value: 'all', label: 'All' },
                { value: 'done', label: 'Completed Today' },
                { value: 'notDone', label: 'Not Completed' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`filter-btn ${filter === value ? 'active' : ''}`}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {habits.length === 0 ? (
            <p className="empty-message">No habits yet. Add your first one.</p>
          ) : filteredHabits.length === 0 ? (
            <p className="empty-message">No habits match this filter.</p>
          ) : (
            filteredHabits.map((habit) => {
              const doneToday = habit.completedDates.includes(today)
              const { count: periodCount, target: periodTarget } = getPeriodProgress(habit)
              const streak = getStreak(habit)
              const rate = getCompletionRate(habit)

              return (
                <div key={habit.id} className={`habit-card ${doneToday ? 'done' : ''}`}>
                  <div className="habit-info" dir="auto">
                    <p className="habit-name">{habit.name}</p>
                    <p className="habit-stats" dir="ltr">
                      {getFrequencyLabel(habit)}
                      &nbsp;·&nbsp;
                      {periodCount} / {periodTarget} {getPeriodName(habit)}
                      &nbsp;·&nbsp;
                      {streak} {getStreakUnit(habit)}{streak !== 1 ? 's' : ''} streak
                      &nbsp;·&nbsp;
                      {rate}%
                    </p>
                  </div>
                  <div className="habit-actions">
                    <button
                      type="button"
                      className={doneToday ? 'undo-btn' : 'toggle-btn'}
                      onClick={() => handleToggleDone(habit.id)}
                    >
                      {doneToday ? 'Undo' : 'Done Today'}
                    </button>
                    <button type="button" className="delete-btn" onClick={() => handleDeleteHabit(habit.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* ---- DAILY SCHEDULE SECTION ---- */}
        <section className="schedule-section">

          {/* Section header: title + date + mini-stats */}
          <div className="schedule-section-header">
            <div>
              <h2 className="schedule-title">Today's Schedule</h2>
              <p className="schedule-date">{todayFormatted}</p>
            </div>
            <div className="schedule-stats">
              <div className="sched-stat">
                <span className="sched-stat-value">{todaySchedItems.length}</span>
                <span className="sched-stat-label">Planned</span>
              </div>
              <div className="sched-stat">
                <span className="sched-stat-value">{completedSchedCount}</span>
                <span className="sched-stat-label">Done</span>
              </div>
              <div className="sched-stat">
                <span className="sched-stat-value">{remainingSchedCount}</span>
                <span className="sched-stat-label">Left</span>
              </div>
            </div>
          </div>

          {/* Schedule add form */}
          <form className="schedule-form" onSubmit={handleAddSchedItem}>
            {/* Row 1: task title */}
            <input
              className="sched-text-input"
              type="text"
              placeholder="What are you planning?"
              value={schedTitle}
              onChange={(e) => setSchedTitle(e.target.value)}
            />

            {/* Row 2: start time, end time, category */}
            <div className="schedule-form-times">
              <div className="time-field">
                <label htmlFor="sched-start">From</label>
                <input
                  id="sched-start"
                  type="time"
                  value={schedStart}
                  onChange={(e) => setSchedStart(e.target.value)}
                />
              </div>
              <div className="time-field">
                <label htmlFor="sched-end">To</label>
                <input
                  id="sched-end"
                  type="time"
                  value={schedEnd}
                  onChange={(e) => setSchedEnd(e.target.value)}
                />
              </div>
              <input
                className="sched-text-input sched-category-input"
                type="text"
                placeholder="Category (optional)"
                value={schedCategory}
                onChange={(e) => setSchedCategory(e.target.value)}
              />
            </div>

            {/* Row 3: note + submit */}
            <div className="schedule-form-submit-row">
              <input
                className="sched-text-input"
                type="text"
                placeholder="Note (optional)"
                value={schedNote}
                onChange={(e) => setSchedNote(e.target.value)}
              />
              <button type="submit">Add Block</button>
            </div>

            {schedError && <p className="form-error">{schedError}</p>}
          </form>

          {/* Schedule list */}
          <div className="schedule-list">
            {todaySchedItems.length === 0 ? (
              <p className="empty-message">No blocks planned yet. Add your first one above.</p>
            ) : (
              todaySchedItems.map((item) => (
                <div
                  key={item.id}
                  className={`schedule-item ${item.completed ? 'completed' : ''}`}
                >
                  <div className="time-block">
                    {item.startTime} – {item.endTime}
                  </div>

                  <div className="schedule-item-info">
                    <p className="schedule-item-title">{item.title}</p>
                    {(item.category || item.note) && (
                      <p className="schedule-item-meta">
                        {[item.category, item.note].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="schedule-item-actions">
                    <button
                      type="button"
                      className={item.completed ? 'undo-btn' : 'toggle-btn'}
                      onClick={() => handleToggleSchedItem(item.id)}
                    >
                      {item.completed ? 'Undo' : 'Done'}
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteSchedItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  )
}

export default App
