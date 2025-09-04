import Expense from "../models/expenseModel.js";

//  Create Expense (Admin only)
export const createExpense = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const { title, amount, category, description } = req.body;

    const expense = new Expense({
      title,
      amount,
      category,
      description,
      createdBy: req.user.sub, // userId from JWT
    });

    await expense.save();
    res.status(201).json({ message: "Expense created successfully", expense });
  } catch (err) {
    res.status(500).json({ message: "Error creating expense", error: err.message });
  }
};

//  Get All Expenses (Admin only)
export const getExpenses = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Remove populate for now
    const expenses = await Expense.find().sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err.message);
    res.status(500).json({ message: "Error fetching expenses", error: err.message });
  }
};


//  Update Expense (Admin only)
export const updateExpense = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.status(200).json({ message: "Expense updated successfully", expense });
  } catch (err) {
    res.status(500).json({ message: "Error updating expense", error: err.message });
  }
};

//  Delete Expense (Admin only)
export const deleteExpense = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting expense", error: err.message });
  }
};
