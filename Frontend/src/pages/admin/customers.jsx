import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Download, X, CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { exportTablePDF } from "../../utils/pdfExporter";

const VERIFY_FILTERS = ["all", "verified", "unverified"];
const STATUS = ["all", "active", "disabled"];

export default function AdminCustomersPage({ darkMode }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const url = import.meta.env.VITE_BACKEND_URL + "/api/customer/all";
    const token = localStorage.getItem("token");
    axios
      .get(url, token ? { headers: { Authorization: "Bearer " + token } } : undefined)
      .then((res) => {
        const rows = Array.isArray(res.data?.customers) ? res.data.customers : [];
        setCustomers(rows);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Failed to load customers";
        setError(msg);
        if (err?.response?.status === 401) {
          toast.error("Unauthorized. Please sign in.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = Array.isArray(customers) ? customers : [];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter((c) => {
        const hay = [
          c?.firstName,
          c?.lastName,
          c?.email,
          c?.phone,
          c?.address,
          c?.role,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (verifyFilter !== "all") {
      const want = verifyFilter === "verified";
      list = list.filter((c) => Boolean(c?.isEmailVerified) === want);
    }

    if (status !== "all") {
      const want = status === "active" ? false : true;
      list = list.filter((c) => Boolean(c?.isDisabled) === want);
    }

    return list;
  }, [customers, query, verifyFilter, status]);

  const exportPDF = () => {
    exportTablePDF({
      title: "Customers Report",
      meta: {
        "Total Customers": filtered.length,
      },
      columns: [
        {
          header: "Full name",
          get: (c) =>
            ((c.firstName || "") + (c.lastName ? " " + c.lastName : "")).trim() || "-",
        },
        { header: "Email", get: (c) => c.email || "-" },
        { header: "Phone", get: (c) => c.phone || "-" },
        { header: "Address", get: (c) => c.address || "-" },
        {
          header: "Verification",
          get: (c) => (c.isEmailVerified ? "Verified" : "Unverified"),
        },
        { header: "Status", get: (c) => (c.isDisabled ? "Disabled" : "Active") },
        { header: "Role", get: (c) => c.role || "customer" },
        { header: "Created", get: (c) => fmtDate(c.createdAt) },
        { header: "Last login", get: (c) => fmtDate(c.lastLogin) },
      ],
      rows: filtered,
    });
  };

  const handleDelete = (customer) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer? This action cannot be undone."
    );

    if (confirmDelete) {
      const url = import.meta.env.VITE_BACKEND_URL + "/api/customer/" + customer._id;
      const token = localStorage.getItem("token");

      axios
        .delete(url, { headers: { Authorization: "Bearer " + token } })
        .then((res) => {
          toast.success("Customer deleted successfully");
          setCustomers(customers.filter((c) => c._id !== customer._id));
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || "Failed to delete customer";
          toast.error(msg);
        });
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-6 shadow ring-1 backdrop-blur ${
        darkMode ? "bg-slate-800/90 ring-slate-700" : "bg-white/80 ring-slate-100"
      }`}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
              Customers
            </h3>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              View and filter registered users
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={exportPDF}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            title="Export current view as PDF"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div
        className={`mb-4 grid gap-2 rounded-xl p-3 ring-1 ${
          darkMode ? "ring-slate-700 bg-slate-900/20" : "ring-slate-200 bg-slate-50"
        } md:grid-cols-[1fr_200px_160px_auto]`}
      >
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, address…"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
              darkMode
                ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400"
                : "border-slate-300 bg-white placeholder:text-slate-400"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${
                darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
              }`}
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={verifyFilter}
          onChange={(e) => setVerifyFilter(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-800"
          }`}
        >
          {VERIFY_FILTERS.map((v) => (
            <option key={v} value={v}>
              {v === "all" ? "All verification" : v === "verified" ? "Verified" : "Unverified"}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`rounded-lg border px-3 py-2 text-sm ${
            darkMode ? "border-slate-700 bg-slate-800 text-white" : "border-slate-300 bg-white text-slate-800"
          }`}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s === "active" ? "Active" : "Disabled"}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-end text-sm">
          <span className={darkMode ? "text-slate-300" : "text-slate-600"}>
            Showing <strong>{filtered.length}</strong> of <strong>{customers.length}</strong>
          </span>
        </div>
      </div>

      {loading && (
        <div className={`rounded-xl ${darkMode ? "bg-slate-900/30" : "bg-slate-50"}`}>
          <TableSkeleton darkMode={darkMode} />
        </div>
      )}

      {!loading && error && (
        <div
          className={`mb-2 rounded-xl border p-3 text-sm ${
            darkMode ? "border-red-700/40 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className={`grid place-items-center rounded-xl p-10 text-center ${darkMode ? "bg-slate-900/30" : "bg-slate-50"}`}>
          <ShieldAlert className={`mb-2 h-8 w-8 ${darkMode ? "text-slate-300" : "text-slate-500"}`} />
          <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            No matching customers. Adjust filters or try a different search.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div
          className={`overflow-x-auto rounded-xl ring-1 ${
            darkMode ? "ring-slate-700" : "ring-slate-200"
          }`}
        >
          <table className={`min-w-full text-sm ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
            <thead className={darkMode ? "bg-slate-900/40" : "bg-slate-50"}>
              <tr>
                <Th>Full name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Address</Th>
                <Th>Verification</Th>
                <Th>Status</Th>
                <Th>Role</Th>
                <Th>Created</Th>
                <Th>Last login</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className={darkMode ? "divide-y divide-slate-700" : "divide-y divide-slate-200"}>
              {filtered.map((c) => (
                <tr key={c._id || c.email} className={darkMode ? "hover:bg-slate-900/30" : "hover:bg-slate-50"}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {(c.firstName || "") + (c.lastName ? " " + c.lastName : "")}
                      </span>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">{c.email}</Td>
                  <Td className="whitespace-nowrap">{c.phone || "-"}</Td>
                  <Td className="max-w-[320px]">
                    <span className="line-clamp-2">{c.address || "-"}</span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.isEmailVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {c.isEmailVerified ? "Verified" : "Unverified"}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.isDisabled ? "bg-slate-400 text-white" : "bg-blue-600 text-white"
                      }`}
                    >
                      {c.isDisabled ? "Disabled" : "Active"}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">{c.role || "customer"}</Td>
                  <Td className="whitespace-nowrap">{fmtDate(c.createdAt)}</Td>
                  <Td className="whitespace-nowrap">{fmtDate(c.lastLogin)}</Td>

                  <Td className="whitespace-nowrap">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all
                          ${darkMode ? "bg-red-700/80 text-white hover:bg-red-600" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                        title="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

function TableSkeleton({ darkMode }) {
  const row = (
    <tr>
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className={`h-4 w-full rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-transparent">
      <table className="min-w-full">
        <thead>
          <tr>
            {Array.from({ length: 10 }).map((_, i) => (
              <th key={i} className="px-3 py-2">
                <div className={`h-3 w-24 rounded ${darkMode ? "bg-slate-700" : "bg-slate-200"}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{Array.from({ length: 8 }).map((_, i) => <FragmentLike key={i}>{row}</FragmentLike>)}</tbody>
      </table>
    </div>
  );
}

function FragmentLike({ children }) {
  return children;
}

function fmtDate(v) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "-";
  }
}
