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

function App() {
  const [habitName, setHabitName] = useState('')
  const [filter, setFilter] = useState('all')

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits))
  }, [habits])

  function handleAddHabit(e) {
    e.preventDefault()

    if (!habitName.trim()) return

    const newHabit = {
      id: Date.now(),
      name: habitName,
      createdAt: getToday(),
      completedDates: [],
    }

    setHabits([...habits, newHabit])
    setHabitName('')
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
          <input
            dir="auto"
            type="text"
            placeholder="Enter a new habit..."
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
          />
          <button type="submit">Add Habit</button>
        </form>

        <section className="habit-list">
          <div className="list-header">
            <h2>Your Habits</h2>
            <div className="filters">
              <button
                type="button"
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'done' ? 'active' : ''}`}
                onClick={() => setFilter('done')}
              >
                Completed Today
              </button>
              <button
                type="button"
                className={`filter-btn ${filter === 'notDone' ? 'active' : ''}`}
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

              return (
                <div
                  key={habit.id}
                  className={`habit-card ${doneToday ? 'done' : ''}`}
                >
                  <div className="habit-info" dir="auto">
                    <p className="habit-name">{habit.name}</p>
                    <p className="habit-stats" dir="ltr">
                      Streak: {streak} day{streak !== 1 ? 's' : ''} &nbsp;·&nbsp; Completion: {rate}%
                    </p>
                  </div>

                  <div className="habit-actions">
                    <button type="button" onClick={() => handleToggleDone(habit.id)}>
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
