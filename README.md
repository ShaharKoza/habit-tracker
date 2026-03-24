# Habit Tracker

A clean and simple habit tracking app built with React and Vite. Track your daily habits, monitor your streaks, and stay consistent over time.

---

## Features

- **Add & delete habits** — quickly manage your habit list
- **Done Today / Undo** — mark habits complete for the day and undo if needed
- **Streaks** — see how many consecutive days you've kept up each habit
- **Completion rate** — track your long-term consistency per habit as a percentage
- **Dashboard stats** — at-a-glance summary of total habits, completed today, best streak, and average completion
- **Filter habits** — view All, Completed Today, or Not Completed habits
- **Hebrew / RTL support** — habit names in Hebrew display correctly right-to-left
- **localStorage persistence** — your habits are saved in the browser and survive page refreshes

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI and state management |
| Vite | Build tool and dev server |
| JavaScript (ES6+) | App logic |
| CSS | Styling (no UI library) |
| localStorage | Client-side data persistence |

---

## Screenshots

> _Add screenshots here after deploying or running locally._

---

## How to Run Locally

**Requirements:** Node.js 18+ and npm

```bash
# 1. Clone the repository
git clone https://github.com/your-username/habit-tracker-app.git

# 2. Move into the project folder
cd habit-tracker-app

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Future Improvements

- Weekly and monthly progress charts
- Habit categories and color labels
- Reset "Done Today" automatically at midnight
- Export data as CSV or JSON
- PWA support for mobile home screen installation
- Notifications / reminders

---

## Why I Built This

I built this project to practice React fundamentals — state management, side effects with `useEffect`, and working with localStorage — in a real, useful app. I focused on keeping the code simple and readable, adding features step by step without over-engineering. It also gave me a chance to practice working with dates and streaks in plain JavaScript without any external libraries.
