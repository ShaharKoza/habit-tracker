import { useEffect, useState } from 'react'

// Returns today's date as a YYYY-MM-DD string
function getToday() {
  return new Date().toISOString().split('T')[0]
}

// Counts how many consecutive days ending today were completed
function getStreak(completedDates) {
  let streak = 0
  const today = new Date()

  while (true) {
    const dateStr = today.toISOString().split('T')[0]
    if (completedDates.includes(dateStr)) {
      streak++
      today.setDate(today.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

// Calculates completed days / total days since creation, as a percentage
function getCompletionRate(completedDates, createdAt) {
  const start = new Date(createdAt)
  const today = new Date(getToday())
  const totalDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.round((completedDates.length / totalDays) * 100)
}

// Ensures every habit has all frequency fields.
// Old habits saved before this change will get daily defaults.
function normalizeHabit(habit) {
  return {
    frequencyType: 'daily',
    targetCount: 1,
    targetPeriodValue: 1,
    targetPeriodUnit: 'day',
    ...habit,
  }
}

// Returns a short readable label describing a habit's frequency
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

function App() {
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

  // Updates frequency state with sensible defaults when the user switches type
  function handleFrequencyTypeChange(type) {
    setFrequencyType(type)
    if (type === 'daily') {
      setTargetCount(1)
      setTargetPeriodValue(1)
      setTargetPeriodUnit('day')
    } else if (type === 'weekly') {
      setTargetCount(3)
      setTargetPeriodValue(1)
      setTargetPeriodUnit('week')
    } else if (type === 'monthly') {
      setTargetCount(5)
      setTargetPeriodValue(1)
      setTargetPeriodUnit('month')
    } else if (type === 'custom') {
      setTargetCount(3)
      setTargetPeriodValue(7)
      setTargetPeriodUnit('day')
    }
  }

  function handleAddHabit(e) {
    e.preventDefault()

    if (!habitName.trim()) return

    const newHabit = {
      id: Date.now(),
      name: habitName,
      createdAt: getToday(),
      completedDates: [],
      frequencyType,
      targetCount,
      targetPeriodValue,
      targetPeriodUnit,
    }

    setHabits([...habits, newHabit])

    // Reset form to defaults
    setHabitName('')
    setFrequencyType('daily')
    setTargetCount(1)
    setTargetPeriodValue(1)
    setTargetPeriodUnit('day')
  }

  function handleDeleteHabit(id) {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  function handleToggleDone(id) {
    const today = getToday()
    setHabits(
      habits.map((habit) => {
        if (habit.id !== id) return habit

        const alreadyDone = habit.completedDates.includes(today)
        const updatedDates = alreadyDone
          ? habit.completedDates.filter((d) => d !== today)
          : [...habit.completedDates, today]

        return { ...habit, completedDates: updatedDates }
      })
    )
  }

  const today = getToday()
  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length
  const bestStreak = habits.length > 0 ? Math.max(...habits.map((h) => getStreak(h.completedDates))) : 0
  const avgRate =
    habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h.completedDates, h.createdAt), 0) / habits.length)
      : 0

  const filteredHabits = habits.filter((h) => {
    if (filter === 'done') return h.completedDates.includes(today)
    if (filter === 'notDone') return !h.completedDates.includes(today)
    return true
  })

  return (
    <div className="app">
      <header className="header">
        <h1>Habit Tracker</h1>
        <p>Track your daily habits in a simple way.</p>
      </header>

      <div className="dashboard">
        <div className="stat-card">
          <span className="stat-value">{habits.length}</span>
          <span className="stat-label">Total Habits</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{completedToday}</span>
          <span className="stat-label">Completed Today</span>
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
        <form className="habit-form" onSubmit={handleAddHabit}>
          {/* Row 1: habit name + submit button */}
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

          {/* Row 2: frequency configuration */}
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
                <input
                  id="target-count-weekly"
                  type="number"
                  min="1"
                  max="7"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                />
              </div>
            )}

            {frequencyType === 'monthly' && (
              <div className="frequency-options">
                <label htmlFor="target-count-monthly">Times per month</label>
                <input
                  id="target-count-monthly"
                  type="number"
                  min="1"
                  max="31"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                />
              </div>
            )}

            {frequencyType === 'custom' && (
              <div className="frequency-options">
                <label htmlFor="target-count-custom">Times</label>
                <input
                  id="target-count-custom"
                  type="number"
                  min="1"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                />
                <label htmlFor="target-period-value">every</label>
                <input
                  id="target-period-value"
                  type="number"
                  min="1"
                  value={targetPeriodValue}
                  onChange={(e) => setTargetPeriodValue(Number(e.target.value))}
                />
                <select
                  id="target-period-unit"
                  value={targetPeriodUnit}
                  onChange={(e) => setTargetPeriodUnit(e.target.value)}
                >
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
              <button
                type="button"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'done' ? 'active' : ''}`}
                aria-pressed={filter === 'done'}
                onClick={() => setFilter('done')}
              >
                Completed Today
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'notDone' ? 'active' : ''}`}
                aria-pressed={filter === 'notDone'}
                onClick={() => setFilter('notDone')}
              >
                Not Completed
              </button>
            </div>
          </div>

          {habits.length === 0 ? (
            <p className="empty-message">No habits yet. Add your first one.</p>
          ) : filteredHabits.length === 0 ? (
            <p className="empty-message">No habits match this filter.</p>
          ) : (
            filteredHabits.map((habit) => {
              const doneToday = habit.completedDates.includes(today)
              const streak = getStreak(habit.completedDates)
              const rate = getCompletionRate(habit.completedDates, habit.createdAt)
              const frequencyLabel = getFrequencyLabel(habit)

              return (
                <div
                  key={habit.id}
                  className={`habit-card ${doneToday ? 'done' : ''}`}
                >
                  <div className="habit-info" dir="auto">
                    <p className="habit-name">{habit.name}</p>
                    <p className="habit-stats" dir="ltr">
                      {frequencyLabel} &nbsp;·&nbsp; Streak: {streak} day{streak !== 1 ? 's' : ''} &nbsp;·&nbsp; Completion: {rate}%
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

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteHabit(habit.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}

export default App
