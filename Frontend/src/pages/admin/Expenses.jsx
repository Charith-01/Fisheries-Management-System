import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Plus,
  Edit,
  Trash2,
  Filter,
  CreditCard,
  Receipt,
  Save,
  X,
  FileText
} from "lucide-react";

// Import your PDF exporter
import { exportTablePDF } from "../../utils/pdfExporter";

export default function FinancialManagement({ darkMode }) {
  const [expenses, setExpenses] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");

  // Form states for expenses
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const token = localStorage.getItem("token");

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let url = `${backendUrl}/api/expenses`;
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      const res = await axios.get(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error fetching expenses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch income data
  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      let url = `${backendUrl}/api/income`;
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      const response = await axios.get(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncomeData(response.data.incomes || []);
    } catch (err) {
      console.error('Error fetching income data:', err);
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  // Load both expenses and incomes when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load expenses
        let expensesUrl = `${backendUrl}/api/expenses`;
        const expensesParams = new URLSearchParams();
        if (startDate && endDate) {
          expensesParams.append('startDate', startDate);
          expensesParams.append('endDate', endDate);
        }
        
        const expensesResponse = await axios.get(`${expensesUrl}?${expensesParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExpenses(expensesResponse.data);
        
        // Load incomes
        let incomeUrl = `${backendUrl}/api/income`;
        const incomeParams = new URLSearchParams();
        if (startDate && endDate) {
          incomeParams.append('startDate', startDate);
          incomeParams.append('endDate', endDate);
        }
        
        const incomeResponse = await axios.get(`${incomeUrl}?${incomeParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIncomeData(incomeResponse.data.incomes || []);
        
      } catch (err) {
        console.error('Error loading initial data:', err);
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "expenses") {
      fetchExpenses();
    } else {
      fetchIncomeData();
    }
  }, [activeTab, startDate, endDate]);

  // Create or update expense
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
        toast.success("Expense updated successfully");
      } else {
        await axios.post(
          `${backendUrl}/api/expenses`,
          { title, amount, category, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Expense added successfully");
      }

      // Reset form
      setTitle("");
      setAmount("");
      setCategory("Other");
      setDescription("");
      setEditingId(null);

      // Refresh expenses
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error saving expense");
    }
  };

  // Delete expense
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`${backendUrl}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error deleting expense");
    }
  };

  // Set form for editing
  const handleEdit = (exp) => {
    setEditingId(exp._id);
    setTitle(exp.title);
    setAmount(exp.amount);
    setCategory(exp.category);
    setDescription(exp.description || "");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setCategory("Other");
    setDescription("");
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalIncome = incomeData.reduce((sum, income) => {
    const amount = parseFloat(income.amount);
    return sum + amount;
  }, 0);
  const netProfit = totalIncome - totalExpenses;

  // ✅ UPDATED: Generate PDF using your exporter
  const generatePDF = async (type) => {
    try {
      setLoading(true);
      toast.loading(`Generating ${type} PDF report...`);

      const data = type === 'expenses' ? expenses : incomeData;
      const title = type === 'expenses' ? 'Expenses Report' : 'Income Report';
      
      const meta = {
        "Total Records": data.length,
        "Total Amount": `Rs. ${(type === 'expenses' ? totalExpenses : totalIncome).toFixed(2)}`,
        "Date Range": startDate && endDate ? `${startDate} to ${endDate}` : 'All Time',
        "Generated By": "Admin"
      };

      if (type === 'expenses') {
        await exportTablePDF({
          title,
          meta,
          columns: [
            { header: "Date", get: (o) => new Date(o.date).toLocaleDateString(), width: 80 },
            { header: "Title", get: (o) => o.title },
            { header: "Category", get: (o) => o.category, width: 90 },
            { header: "Amount (LKR)", get: (o) => `Rs. ${parseFloat(o.amount).toFixed(2)}`, align: "right", width: 100 },
            { header: "Description", get: (o) => o.description || "N/A" }
          ],
          rows: data,
          orientation: "landscape"
        });
      } else {
        await exportTablePDF({
          title,
          meta,
          columns: [
            { header: "Date", get: (o) => new Date(o.date).toLocaleDateString(), width: 80 },
            { header: "Order ID", get: (o) => o.orderId, width: 100 },
            { header: "Customer", get: (o) => o.customerName },
            { header: "Email", get: (o) => o.customerEmail || "N/A" },
            { header: "Amount (LKR)", get: (o) => `Rs. ${o.amount.toFixed(2)}`, align: "right", width: 100 },
            { header: "Payment Method", get: (o) => o.paymentMethod || "N/A", width: 90 },
            { header: "Status", get: (o) => o.status, width: 80 }
          ],
          rows: data,
          orientation: "landscape"
        });
      }

      toast.dismiss();
      toast.success(`PDF report downloaded successfully`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF report');
    } finally {
      setLoading(false);
    }
  };

  // Export data (CSV - keeping for backward compatibility)
  const handleExport = async (type) => {
    try {
      let csvContent = '';
      let filename = '';
      
      if (type === 'expenses') {
        csvContent = [
          ['Date', 'Title', 'Category', 'Amount (LKR)', 'Description'],
          ...expenses.map(expense => [
            new Date(expense.date).toLocaleDateString(),
            expense.title,
            expense.category,
            expense.amount.toFixed(2),
            expense.description || ''
          ])
        ].map(row => row.join(',')).join('\n');
        
        filename = `expenses-report-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        csvContent = [
          ['Date', 'Order ID', 'Customer', 'Amount (LKR)', 'Status', 'Items'],
          ...incomeData.map(income => [
            new Date(income.date).toLocaleDateString(),
            income.orderId,
            income.customerName,
            income.amount.toFixed(2),
            income.status,
            income.items?.map(item => `${item.productName} (x${item.quantity})`).join('; ') || ''
          ])
        ].map(row => row.join(',')).join('\n');
        
        filename = `income-report-${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type === 'expenses' ? 'Expenses' : 'Income'} CSV report downloaded successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Financial Management</h2>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-700">
                Rs. {totalIncome.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                Rs. {totalExpenses.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          netProfit >= 0 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Net Profit</p>
              <p className={`text-2xl font-bold ${
                netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                Rs. {netProfit.toFixed(2)}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${
              netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'
            }`} />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "expenses"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("expenses")}
        >
          Expenses
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "income"
              ? "border-b-2 border-green-500 text-green-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("income")}
        >
          Income
        </button>
      </div>

     

        

      {activeTab === "expenses" ? (
        <>
          {/* Expenses Form */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Expense" : "Add New Expense"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="Expense title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Amount (LKR) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="Fuel">Fuel</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Salary">Salary</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? "Update Expense" : "Add Expense"}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Expenses List</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExport('expenses')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => generatePDF('expenses')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No expenses found</p>
                <p className="text-sm text-gray-500 mt-1">Add your first expense using the form above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{exp.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-red-600">Rs. {parseFloat(exp.amount).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">{exp.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(exp)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(exp._id)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="1" className="px-6 py-4 text-right font-bold">Total:</td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        Rs. {totalExpenses.toFixed(2)}
                      </td>
                      <td colSpan="4" className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Income Table */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-semibold">Income Records</h3>
            <div className="flex gap-3">
              <button
                onClick={fetchIncomeData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={() => handleExport('income')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => generatePDF('income')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading income data...</p>
            </div>
          ) : incomeData.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No income records found</p>
              <p className="text-sm text-gray-500 mt-1">Income from successful payments will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomeData.map((income) => (
                    <tr key={income._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {income.orderId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{income.customerName}</div>
                        <div className="text-sm text-gray-600">{income.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-green-600">Rs. {income.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {income.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          income.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : income.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {income.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(income.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-green-50">
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-right font-bold">Total:</td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      Rs. {totalIncome.toFixed(2)}
                    </td>
                    <td colSpan="3" className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}