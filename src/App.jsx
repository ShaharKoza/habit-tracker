import { useState } from 'react'

function App() {
  const [habitName, setHabitName] = useState('')
  const [habits, setHabits] = useState([])

  function handleAddHabit(e) {
    e.preventDefault()

    if (!habitName.trim()) return

    const newHabit = {
      id: Date.now(),
      name: habitName,
      doneToday: false,
    }

    setHabits([...habits, newHabit])
    setHabitName('')
  }

  function handleDeleteHabit(id) {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  function handleToggleDone(id) {
    setHabits(
      habits.map((habit) =>
        habit.id === id
          ? { ...habit, doneToday: !habit.doneToday }
          : habit
      )
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Habit Tracker</h1>
        <p>Track your daily habits in a simple way.</p>
      </header>

      <main className="container">
        <form className="habit-form" onSubmit={handleAddHabit}>
          <input
            type="text"
            placeholder="Enter a new habit..."
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
          />
          <button type="submit">Add Habit</button>
        </form>

        <section className="habit-list">
          <h2>Your Habits</h2>

          {habits.length === 0 ? (
            <p className="empty-message">No habits yet. Add your first one.</p>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className={`habit-card ${habit.doneToday ? 'done' : ''}`}
              >
                <span>{habit.name}</span>

                <div className="habit-actions">
                  <button onClick={() => handleToggleDone(habit.id)}>
                    {habit.doneToday ? 'Undo' : 'Done Today'}
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteHabit(habit.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}

export default App