import { useState, useEffect } from "react";

const STORAGE_KEY = "inventory_todos";

export default function TodoPanel() {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const add = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([{ id: Date.now(), text: input.trim(), done: false, createdAt: new Date().toLocaleDateString() }, ...todos]);
    setInput("");
  };

  const toggle = (id) => setTodos(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTodos(todos.filter((t) => t.id !== id));
  const clearDone = () => setTodos(todos.filter((t) => !t.done));

  const filtered = todos.filter((t) =>
    filter === "all" ? true : filter === "pending" ? !t.done : t.done
  );

  const pendingCount = todos.filter((t) => !t.done).length;

  return (
    <>
      {/* Floating toggle button */}
      <button className="todo-fab" onClick={() => setOpen(!open)}>
        <span className="todo-fab-icon">📝</span>
        <span className="todo-fab-label">Tasks for the Day</span>
        {pendingCount > 0 && <span className="todo-fab-badge">{pendingCount}</span>}
      </button>

      {/* Backdrop */}
      {open && <div className="todo-backdrop" onClick={() => setOpen(false)} />}

      {/* Slide-in panel */}
      <div className={`todo-panel ${open ? "open" : ""}`}>
        <div className="todo-panel-header">
          <div>
            <h3>My Notes & ToDos</h3>
            <span className="todo-subtitle">{pendingCount} pending · {todos.length} total</span>
          </div>
          <button className="todo-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <form onSubmit={add} className="todo-form">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a note or task..."
            className="todo-input"
          />
          <button type="submit" className="todo-add-btn">Add</button>
        </form>

        <div className="todo-filters">
          {["all", "pending", "done"].map((f) => (
            <button key={f} className={`todo-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {todos.some((t) => t.done) && (
            <button className="todo-clear-btn" onClick={clearDone}>Clear Done</button>
          )}
        </div>

        <div className="todo-list">
          {filtered.length === 0 && (
            <div className="todo-empty">
              {filter === "done" ? "No completed tasks yet." : "No tasks yet. Add one above!"}
            </div>
          )}
          {filtered.map((t) => (
            <div key={t.id} className={`todo-item ${t.done ? "done" : ""}`}>
              <button className="todo-check" onClick={() => toggle(t.id)}>
                {t.done ? "✅" : "⬜"}
              </button>
              <div className="todo-text-wrap">
                <span className="todo-text">{t.text}</span>
                <span className="todo-date">{t.createdAt}</span>
              </div>
              <button className="todo-delete" onClick={() => remove(t.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
