
import { useState } from "react";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const addExpense = (e) => {
    e.preventDefault();

    const newExpense = {
      id: Date.now(),
      description,
      amount: Number(amount),
      category,
      date
    };

    setExpenses([...expenses, newExpense]);
    setDescription("");
    setAmount("");
    setCategory("Food");
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div className="app">
      <header>
        <h1>Personal Expense Tracker</h1>
        <p>Record, manage and analyze your spending</p>
      </header>

      <div className="summary">
        <h2>Total Expenses</h2>
        <h1>₹{total.toFixed(2)}</h1>
        <p>{expenses.length} transactions recorded</p>
      </div>

      <section className="card">
        <h2>Add New Expense</h2>

        <form onSubmit={addExpense}>
          <label>Description</label>
          <input
            type="text"
            placeholder="e.g. Lunch"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label>Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter amount"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Education</option>
            <option>Shopping</option>
            <option>Entertainment</option>
            <option>Other</option>
          </select>

          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <button type="submit">Add Expense</button>
        </form>
      </section>

      <section className="card">
        <h2>Expense Analysis</h2>

        {expenses.length === 0 ? (
          <p>No expenses recorded yet.</p>
        ) : (
          [...new Set(expenses.map((expense) => expense.category))].map(
            (item) => {
              const categoryTotal = expenses
                .filter((expense) => expense.category === item)
                .reduce((sum, expense) => sum + expense.amount, 0);

              const percentage = (categoryTotal / total) * 100;

              return (
                <div className="analysis" key={item}>
                  <div className="analysis-label">
                    <span>{item}</span>
                    <strong>₹{categoryTotal.toFixed(2)}</strong>
                  </div>
                  <div className="bar">
                    <div
                      className="bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <small>{percentage.toFixed(1)}% of spending</small>
                </div>
              );
            }
          )
        )}
      </section>

      <section className="card">
        <h2>Expense History</h2>

        {expenses.length === 0 ? (
          <p>Your expenses will appear here.</p>
        ) : (
          expenses.map((expense) => (
            <div className="expense-item" key={expense.id}>
              <div>
                <strong>{expense.description}</strong>
                <p>
                  {expense.category} | {expense.date}
                </p>
              </div>

              <div className="expense-actions">
                <strong>₹{expense.amount.toFixed(2)}</strong>
                <button
                  className="delete-btn"
                  onClick={() => deleteExpense(expense.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;
