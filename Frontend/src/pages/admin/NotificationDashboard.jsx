import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000");

export default function NotificationDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [roleFilter, setRoleFilter] = useState("all"); // all | customer | fisherman
  const [search, setSearch] = useState("");

  // Add/Edit modal state
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null); // existing item or null
  const [form, setForm] = useState({
    title: "",
    message: "",
    role: "customer",
    targetEmailsStr: "", // comma separated; only when role === 'customer'
  });

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  function resetForm() {
    setForm({
      title: "",
      message: "",
      role: "customer",
      targetEmailsStr: "",
    });
    setEditing(null);
  }

  async function fetchAll() {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/notifications/admin`, {
        headers: authHeaders,
      });
      setItems(res.data?.notifications || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    resetForm();
    setOpenForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || "",
      message: item.message || "",
      role: item.role || "customer",
      targetEmailsStr:
        item.role === "customer" && Array.isArray(item.targetEmails)
          ? item.targetEmails.join(", ")
          : "",
    });
    setOpenForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim() || !form.role) {
      toast.error("Title, message and role are required.");
      return;
    }

    let payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      role: form.role,
    };

    if (form.role === "customer") {
      const emails =
        form.targetEmailsStr
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0) || [];
      payload.targetEmails = emails;
    }

    try {
      if (editing) {
        // Only allowed when unread (backend enforces; we also disable in UI)
        await axios.put(
          `${BASE_URL}/api/notifications/${editing._id}`,
          payload,
          { headers: authHeaders }
        );
        toast.success("Notification updated");
      } else {
        await axios.post(`${BASE_URL}/api/notifications`, payload, {
          headers: authHeaders,
        });
        toast.success("Notification created");
      }
      setOpenForm(false);
      resetForm();
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await axios.delete(`${BASE_URL}/api/notifications/${deletingId}`, {
        headers: authHeaders,
      });
      toast.success("Notification deleted");
      setDeletingId(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items || [])
      .filter((it) => (roleFilter === "all" ? true : it.role === roleFilter))
      .filter((it) => {
        if (!q) return true;
        return (
          it.title?.toLowerCase().includes(q) ||
          it.message?.toLowerCase().includes(q)
        );
      });
  }, [items, roleFilter, search]);

  function scopeLabel(n) {
    if (n.role === "fisherman") return "All fishermen";
    const count = Array.isArray(n.targetEmails) ? n.targetEmails.length : 0;
    return count > 0 ? `Targeted (${count})` : "Broadcast";
    // targetEmails empty/absent = broadcast to all customers
  }

  function fmtDate(d) {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  return (
    <div className="w-full max-w-[calc(100vw-320px)] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Notification Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit (when unread), delete, and view all notifications.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAll}
            className="px-4 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={openCreate}
            className="px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Notification
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3 items-center p-4 bg-white rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 pl-10 pr-8 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="all">All roles</option>
            <option value="customer">Customers</option>
            <option value="fisherman">Fishermen</option>
          </select>
        </div>

        <div className="relative flex-1 min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or message"
            className="h-10 w-full pl-10 pr-4 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="py-4 px-4 text-left font-medium">Title</th>
                <th className="py-4 px-4 text-left font-medium">Role</th>
                <th className="py-4 px-4 text-left font-medium">Scope</th>
                <th className="py-4 px-4 text-left font-medium">Readers</th>
                <th className="py-4 px-4 text-left font-medium">Created</th>
                <th className="py-4 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {loading ? (
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading notifications...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        No notifications found
                      </div>
                    )}
                  </td>
                </tr>
              )}

              {filtered.map((n) => {
                const canEdit = (n.isReadBy ?? 0) === 0; // only when unread
                return (
                  <tr key={n._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {n.role === "customer" ? (
                            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="p-2 rounded-full bg-green-100 text-green-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{n.title}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-md">
                            {n.message}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
                        {n.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {n.role === "customer" && Array.isArray(n.targetEmails) && n.targetEmails.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Targeted ({n.targetEmails.length})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                          Broadcast
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-sm font-medium">{n.isReadBy ?? 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(n.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(n)}
                          className={`p-2 rounded-lg flex items-center justify-center ${
                            canEdit
                              ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
                              : "text-gray-400 bg-gray-100 cursor-not-allowed"
                          } transition-colors`}
                          disabled={!canEdit}
                          title={
                            canEdit
                              ? "Edit notification"
                              : "Cannot edit: already read by at least one user"
                          }
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingId(n._id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                          title="Delete notification"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[95%] max-w-[720px] bg-white rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">
                {editing ? "Edit Notification" : "New Notification"}
              </h3>
              <button
                onClick={() => {
                  setOpenForm(false);
                  resetForm();
                }}
                className="px-3 h-[36px] rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>

            {editing && (editing.isReadBy ?? 0) > 0 && (
              <div className="mb-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-900">
                This notification has readers. Server will reject edits.
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm text-gray-700">Title</label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="h-[44px] px-3 border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none rounded-lg"
                  placeholder="Enter a clear title"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm text-gray-700">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  rows={4}
                  className="p-3 border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none rounded-lg"
                  placeholder="Type the notification message"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm text-gray-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="h-[44px] px-3 border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none rounded-lg"
                >
                  <option value="customer">Customer</option>
                  <option value="fisherman">Fisherman</option>
                </select>
                <p className="text-xs text-gray-500">
                  • Customers: broadcast when no emails provided; targeted when
                  emails provided. • Fisherman: always broadcast to all
                  fishermen.
                </p>
              </div>

              {form.role === "customer" && (
                <div className="grid gap-1">
                  <label className="text-sm text-gray-700">
                    Target Emails (optional)
                  </label>
                  <textarea
                    value={form.targetEmailsStr}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, targetEmailsStr: e.target.value }))
                    }
                    rows={3}
                    className="p-3 border border-blue-500 focus:ring-1 focus:ring-blue-700 outline-none rounded-lg"
                    placeholder="Comma separated: alice@example.com, bob@example.com"
                  />
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenForm(false);
                    resetForm();
                  }}
                  className="px-4 h-[44px] rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-[44px] rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {editing ? "Save Changes" : "Create Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[95%] max-w-[520px] bg-white rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Notification
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 h-[40px] rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 h-[40px] rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}