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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Notification Management
          </h2>
          <p className="text-sm text-gray-500">
            Create, edit (when unread), delete, and view all notifications.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="px-4 h-[40px] rounded-lg bg-gray-200 hover:bg-gray-300"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={openCreate}
            className="px-4 h-[40px] rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
          >
            + New Notification
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-[40px] px-3 border border-gray-300 rounded-lg outline-none"
        >
          <option value="all">All roles</option>
          <option value="customer">Customers</option>
          <option value="fisherman">Fishermen</option>
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or message"
          className="h-[40px] px-3 border border-gray-300 rounded-lg outline-none min-w-[260px] flex-1"
          type="text"
        />
      </div>

      {/* Table */}
      <div className="w-full bg-white rounded-lg shadow p-3 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2 pr-2">Title</th>
              <th className="py-2 pr-2">Role</th>
              <th className="py-2 pr-2">Scope</th>
              <th className="py-2 pr-2">Readers</th>
              <th className="py-2 pr-2">Created</th>
              <th className="py-2 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  {loading ? "Loading..." : "No notifications found"}
                </td>
              </tr>
            )}

            {filtered.map((n) => {
              const canEdit = (n.isReadBy ?? 0) === 0; // only when unread
              return (
                <tr key={n._id} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-gray-800">{n.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[520px]">
                      {n.message}
                    </div>
                  </td>
                  <td className="py-2 pr-2 capitalize">{n.role}</td>
                  <td className="py-2 pr-2">{scopeLabel(n)}</td>
                  <td className="py-2 pr-2">{n.isReadBy ?? 0}</td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    {fmtDate(n.createdAt)}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(n)}
                        className={`px-3 h-[36px] rounded-lg ${
                          canEdit
                            ? "bg-yellow-400 hover:bg-yellow-500 text-gray-800"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={!canEdit}
                        title={
                          canEdit
                            ? "Edit notification"
                            : "Cannot edit: already read by at least one user"
                        }
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(n._id)}
                        className="px-3 h-[36px] rounded-lg bg-red-500 hover:bg-red-600 text-white"
                        title="Delete notification"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
