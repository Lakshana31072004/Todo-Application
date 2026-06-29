const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'todos.json');

const getTodos = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
  }

  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const saveTodos = (todos) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(todos, null, 2));
};

app.post('/api/todos', (req, res) => {
  const title = req.body.title?.trim();

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const todos = getTodos();
  const newTodo = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.push(newTodo);
  saveTodos(todos);

  res.status(201).json(newTodo);
});

app.get('/api/todos', (req, res) => {
  res.json(getTodos());
});

app.get('/api/todos/:id', (req, res) => {
  const todo = getTodos().find((t) => t.id === req.params.id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const todos = getTodos();
  const index = todos.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos[index] = { ...todos[index], ...req.body };
  saveTodos(todos);

  res.json(todos[index]);
});

app.delete('/api/todos/:id', (req, res) => {
  let todos = getTodos();
  todos = todos.filter((t) => t.id !== req.params.id);
  saveTodos(todos);

  res.status(204).send();
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
