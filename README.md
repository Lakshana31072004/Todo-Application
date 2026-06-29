# Full-Stack Multi-Page Todo Application

A strictly Multi-Page Application (MPA) built with React and Node.js/Express. It uses full page reloads for navigation instead of client-side SPA routing, adhering to the challenge requirements.

## Features

### Frontend (React MPA)

- **Todo List Page (`/`)**:
  - View all todos fetched from the backend.
  - Create new todos.
  - Toggle completion status.
  - Delete todos.

- **Todo Detail Page (`/todo?id=...`)**:
  - Reads the `id` from the URL query parameters.
  - Fetches and displays specific details for a single todo (ID, title, completion status, and creation timestamp).

- **Navigation**: Uses standard `<a>` tags to force full document reloads, ensuring MPA behavior rather than SPA state hydration.

### Backend (Node.js + Express)

- **CRUD API**: Fully functional REST API for Todos.
- **File-based Database**: Data is persistently saved to `todos.json` using Node's native `fs` module. No external database setup required.

## API Endpoints

- `GET /api/todos` - Retrieve all todos
- `GET /api/todos/:id` - Retrieve a single todo by ID
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update an existing todo
- `DELETE /api/todos/:id` - Delete a todo

## Setup Instructions

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

*The server will run on http://localhost:5000*

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

*The React app will run on http://localhost:5173*

---

## 2. Backend Implementation (Node.js + Express)

Create a folder named `backend`. Run `npm init -y` and `npm install express cors`.

Save the following code as `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'todos.json');

// Helper to read/write from file
const getTodos = () => {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const saveTodos = (todos) => fs.writeFileSync(DB_FILE, JSON.stringify(todos, null, 2));

// Create
app.post('/api/todos', (req, res) => {
  const todos = getTodos();

  const newTodo = {
    id: Date.now().toString(),
    title: req.body.title,
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.push(newTodo);

  saveTodos(todos);

  res.status(201).json(newTodo);
});

// Read All
app.get('/api/todos', (req, res) => {
  res.json(getTodos());
});

// Read One
app.get('/api/todos/:id', (req, res) => {
  const todo = getTodos().find(t => t.id === req.params.id);

  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  res.json(todo);
});

// Update
app.put('/api/todos/:id', (req, res) => {
  const todos = getTodos();

  const index = todos.findIndex(t => t.id === req.params.id);

  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  todos[index] = { ...todos[index], ...req.body };

  saveTodos(todos);

  res.json(todos[index]);
});

// Delete
app.delete('/api/todos/:id', (req, res) => {
  let todos = getTodos();

  todos = todos.filter(t => t.id !== req.params.id);

  saveTodos(todos);

  res.status(204).send();
});

const PORT = 5000;

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

**3. Frontend Implementation (React)**

Create a folder named frontend using Vite (`npm create vite@latest frontend -- --template react`). Install no other dependencies to keep it lightweight.

Replace the contents of frontend/src/App.jsx with the following code. This file implements simple, raw URL parsing to render different components based on the path, ensuring no SPA routing library interferes with the requested MPA behavior.

```javascript
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/todos';

// ==========================================
// PAGE 1: Todo List
// ==========================================

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setTodos);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    const newTodo = await res.json();

    setTodos([...todos, newTodo]);

    setTitle('');
  };

  const handleToggle = async (id, currentStatus) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentStatus })
    });

    setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>My Todos</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          style={{ padding: '0.5rem', width: '70%', marginRight: '10px' }}
        />

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Add</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id, todo.completed)}
            />

            {/* Note the use of a standard <a> tag to force a full page reload (MPA behavior) */}
            <a href={`/todo?id=${todo.id}`} style={{ textDecoration: todo.completed ? 'line-through' : 'none', flexGrow: 1 }}>
              {todo.title}
            </a>

            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==========================================
// PAGE 2: Single Todo Detail
// ==========================================

function TodoDetail() {
  const [todo, setTodo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read the ID from the query parameters
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
      fetch(`${API_URL}/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Todo not found');
          return res.json();
        })
        .then(setTodo)
        .catch(err => setError(err.message));
    } else {
      setError('No ID provided in query parameters');
    }
  }, []);

  if (error) return <div style={{ color: 'red', margin: '2rem' }}>Error: {error}</div>;

  if (!todo) return <div style={{ margin: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif', padding: '20px', border: '1px solid #ccc' }}>
      <a href="/" style={{ display: 'inline-block', marginBottom: '20px' }}>← Back to List</a>

      <h2>Task Details</h2>
      <p><strong>ID:</strong> {todo.id}</p>
      <p><strong>Title:</strong> {todo.title}</p>
      <p><strong>Status:</strong> {todo.completed ? '✅ Completed' : '⏳ Pending'}</p>
      <p><strong>Created:</strong> {new Date(todo.createdAt).toLocaleString()}</p>
    </div>
  );
}

// ==========================================
// MAIN ENTRY: MPA Router
// ==========================================

function App() {
  const path = window.location.pathname;

  // Render different pages based on the raw URL path
  if (path === '/todo') {
    return <TodoDetail />;
  }

  return <TodoList />;
}

export default App;
```
