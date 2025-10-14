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

// Import PDF libraries
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

// Generate PDF Report
const generatePDF = async (type) => {
  try {
    setLoading(true);
    toast.loading(`Generating ${type} PDF report...`);

    const pdf = new jsPDF();
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const formattedTime = currentDate.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).replace(':', '-');

    // Function to add header to each page
    const addHeader = (pdf, pageNum, totalPages) => {
      const pageWidth = pdf.internal.pageSize.width;
      
      // Try to add logo with reduced height
      try {
        // If logo is in public/assets folder
        const logoUrl = `${window.location.origin}/dist/logo.jpg`;
        pdf.addImage(logoUrl, 'JPEG', 20, 15, 25, 25); // Reduced from 30x30 to 25x25
      } catch (e) {
        console.warn('Logo not found, using text header only');
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 128);
        pdf.text("DF", 25, 30);
      }

      // Company Info
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 128);
      pdf.text("Dhanushka Fisheries", 55, 25);
      
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Owner: Mr. Nipun Thanushka", 55, 32);
      pdf.text("Matara Road, Magalle, Galle", 55, 37);
      pdf.text("Phone: 0768660219", 55, 42);

      // Report Info
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${formattedDate} ${formattedTime.replace('-', ':')}`, pageWidth - 70, 25);
      pdf.text(`Timezone: Asia/Colombo`, pageWidth - 70, 30);
      
      if (pageNum > 1) {
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 70, 35);
      }

      // Separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 48, pageWidth - 20, 48);
    };

    // Add header to first page
    addHeader(pdf, 1, 1);

    // Report Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${type === 'expenses' ? 'Expenses' : 'Orders'} Report`, 20, 65);

    // Summary Section
    pdf.setFontSize(11);
    if (type === 'expenses') {
      pdf.text(`Total Expenses: ${expenses.length} | Total Amount: Rs. ${totalExpenses.toFixed(2)}`, 20, 77);
    } else {
      pdf.text(`Total Orders: ${incomeData.length} | Total Amount: Rs. ${totalIncome.toFixed(2)}`, 20, 77);
    }

    // Table Headers
    let yPosition = 90;
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(0, 0, 128);
    
    if (type === 'expenses') {
      // Expenses Table Headers
      pdf.rect(20, yPosition, 170, 8, 'F');
      pdf.text("Date", 22, yPosition + 6);
      pdf.text("Title", 45, yPosition + 6);
      pdf.text("Category", 90, yPosition + 6);
      pdf.text("Amount (LKR)", 130, yPosition + 6);
      pdf.text("Description", 160, yPosition + 6);
      
      yPosition += 15;
      
      // Expenses Table Data
      pdf.setTextColor(0, 0, 0);
      expenses.forEach((expense) => {
        // Check if we need a new page
        if (yPosition > 270) {
          pdf.addPage();
          const newPageNum = pdf.internal.getNumberOfPages();
          addHeader(pdf, newPageNum, newPageNum);
          yPosition = 90; // Reset Y position for new page
        }
        
        const dateStr = new Date(expense.date).toLocaleDateString();
        const titleStr = expense.title.length > 20 ? expense.title.substring(0, 20) + '...' : expense.title;
        const descStr = expense.description ? 
          (expense.description.length > 20 ? expense.description.substring(0, 20) + '...' : expense.description) : 'N/A';
        
        pdf.text(dateStr, 22, yPosition);
        pdf.text(titleStr, 45, yPosition);
        pdf.text(expense.category, 90, yPosition);
        pdf.text(expense.amount.toFixed(2), 130, yPosition);
        pdf.text(descStr, 160, yPosition);
        
        yPosition += 8;
      });
    } else {
      // Income Table Headers
        pdf.rect(20, yPosition, 170, 8, 'F');
  pdf.text("Date", 22, yPosition + 6);
  pdf.text("Customer", 50, yPosition + 6); // Moved Customer to left
  pdf.text("Amount (LKR)", 120, yPosition + 6); // Adjusted position
  pdf.text("Status", 150, yPosition + 6); // Adjusted position
  pdf.text("Payment Method", 170, yPosition + 6); // Added Payment Method
  
  yPosition += 15;
  
  // Income Table Data (without Order ID)
  pdf.setTextColor(0, 0, 0);
  incomeData.forEach((income) => {
    // Check if we need a new page
    if (yPosition > 270) {
      pdf.addPage();
      const newPageNum = pdf.internal.getNumberOfPages();
      addHeader(pdf, newPageNum, newPageNum);
      yPosition = 90; // Reset Y position for new page
    }
    
    const dateStr = new Date(income.date).toLocaleDateString();
    const customerStr = income.customerName.length > 25 ? income.customerName.substring(0, 25) + '...' : income.customerName;
    
    pdf.text(dateStr, 22, yPosition);
    pdf.text(customerStr, 50, yPosition); // Customer name
    pdf.text(income.amount.toFixed(2), 120, yPosition); // Amount
    pdf.text(income.status, 150, yPosition); // Status
    pdf.text(income.paymentMethod || 'N/A', 170, yPosition); // Payment Method
    
    yPosition += 8;
      });
    }

    // Update all page headers with correct page numbers
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Clear existing header area
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdf.internal.pageSize.width, 50, 'F');
      
      // Redraw header with correct page numbers
      addHeader(pdf, i, pageCount);
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Dhanushka Fisheries - Confidential`, 20, 285);
      pdf.text(`Page ${i} of ${pageCount}`, 180, 285);
    }

    // Save PDF
    const filename = `${type === 'expenses' ? 'expenses' : 'orders'}-report_${formattedDate}.pdf`;
    pdf.save(filename);
    
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

      {/* Filter Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (activeTab === "expenses") fetchExpenses();
                    else fetchIncomeData();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
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