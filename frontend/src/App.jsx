import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/todos';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load todos.');
        setLoading(false);
      });
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });

      if (!res.ok) {
        throw new Error('Failed to create todo');
      }

      const newTodo = await res.json();
      setTodos((current) => [...current, newTodo]);
      setTitle('');
    } catch (err) {
      setError(err.message || 'Unable to add todo.');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });

      if (!res.ok) {
        throw new Error('Unable to update todo');
      }

      setTodos((current) =>
        current.map((todo) =>
          todo.id === id ? { ...todo, completed: !currentStatus } : todo
        )
      );
    } catch (err) {
      setError(err.message || 'Unable to toggle status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        throw new Error('Unable to delete todo');
      }

      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to delete todo.');
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h1>My Todos</h1>

        <form className="todo-form" onSubmit={handleAdd}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            aria-label="New todo title"
          />
          <button type="submit">Add</button>
        </form>

        {error ? <div className="error-box">{error}</div> : null}

        {loading ? (
          <p>Loading todos...</p>
        ) : todos.length === 0 ? (
          <p>No todos yet. Add one above.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className="todo-item">
                <label className="todo-label">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo.id, todo.completed)}
                  />
                  <a
                    href={`/todo?id=${todo.id}`}
                    className={todo.completed ? 'completed-link' : ''}
                  >
                    {todo.title}
                  </a>
                </label>
                <button className="delete-button" onClick={() => handleDelete(todo.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TodoDetail() {
  const [todo, setTodo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      setError('No ID provided in query parameters');
      return;
    }

    fetch(`${API_URL}/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Todo not found');
        }
        return res.json();
      })
      .then(setTodo)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="page-shell">
        <div className="card">
          <a href="/" className="back-link">
            ← Back to List
          </a>
          <div className="error-box">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="page-shell">
        <div className="card">Loading todo details...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="card">
        <a href="/" className="back-link">
          ← Back to List
        </a>
        <h1>Todo Details</h1>
        <div className="detail-row">
          <strong>ID:</strong> <span>{todo.id}</span>
        </div>
        <div className="detail-row">
          <strong>Title:</strong> <span>{todo.title}</span>
        </div>
        <div className="detail-row">
          <strong>Status:</strong>{' '}
          <span>{todo.completed ? '✅ Completed' : '⏳ Pending'}</span>
        </div>
        <div className="detail-row">
          <strong>Created:</strong>{' '}
          <span>{new Date(todo.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const path = window.location.pathname;

  if (path === '/todo') {
    return <TodoDetail />;
  }

  return <TodoList />;
}

export default App;
