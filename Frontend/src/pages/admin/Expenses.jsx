import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const token = localStorage.getItem("token");

  // fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error fetching expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // create or update expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!title || !amount) {
        return toast.error("Title and amount are required");
      }

      if (editingId) {
        await axios.put(
          `${backendUrl}/api/expenses/${editingId}`,
          { title, amount, category, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Expense updated");
      } else {
        await axios.post(
          `${backendUrl}/api/expenses`,
          { title, amount, category, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Expense added");
      }

      setTitle("");
      setAmount("");
      setCategory("Other");
      setDescription("");
      setEditingId(null);

      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error saving expense");
    }
  };

  // delete expense
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`${backendUrl}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error deleting expense");
    }
  };

  // set form for editing
  const handleEdit = (exp) => {
    setEditingId(exp._id);
    setTitle(exp.title);
    setAmount(exp.amount);
    setCategory(exp.category);
    setDescription(exp.description || "");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Expenses Management</h2>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col gap-3 w-full max-w-lg"
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="Fuel">Fuel</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Salary">Salary</option>
          <option value="Other">Other</option>
        </select>
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {editingId ? "Update Expense" : "Add Expense"}
        </button>
      </form>

      {/* Expenses Table */}
      <div className="w-full max-w-[calc(100vw-320px)] mx-auto bg-white rounded-lg shadow-md overflow-x-auto">
        <h3 className="text-lg font-semibold p-4 border-b">Expenses List</h3>
        {loading ? (
          <p className="p-4">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="p-4">No expenses found</p>
        ) : (
          <table className="w-full text-sm text-left border">
            <thead className="bg-blue-200">
              <tr>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Category</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-gray-50">
                  <td className="p-2 border">{exp.title}</td>
                  <td className="p-2 border">${exp.amount}</td>
                  <td className="p-2 border">{exp.category}</td>
                  <td className="p-2 border">{exp.description}</td>
                  <td className="p-2 border">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border flex gap-2">
                    <button
                      onClick={() => handleEdit(exp)}
                      className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
