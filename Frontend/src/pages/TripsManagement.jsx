// src/pages/TripsManagement.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import {
  Ship,
  PlusCircle,
  Trash2,
  Edit as EditIcon,
  CalendarClock,
  MapPin,
  User2,
  Users,
  CalendarDays,
  LifeBuoy,
  Info,
  Download,      // ✅ use Download icon for the PDF button
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { exportTablePDF } from "../utils/pdfExporter"; // ✅ PDF util

export default function TripsManagement({ darkMode = false, readOnly = false }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("total");
  const navigate = useNavigate();

  const [boatsById, setBoatsById] = useState({});
  const [fishById, setFishById] = useState({});

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    action: "",
    tripId: "",
    onConfirm: null,
  });

  const idOf = (x) =>
    typeof x === "string" ? x : (x && (x._id || x.id)) ? String(x._id || x.id) : "";

  const boatNameOf = (boat) => {
    if (!boat) return "";
    if (typeof boat === "object") {
      return boat.name || boat.boatName || boat.boatNumber || boat.registrationNumber || idOf(boat);
    }
    const b = boatsById[boat];
    return b?.name || b?.boatName || b?.boatNumber || b?.registrationNumber || boat;
  };

  const personFirstOf = (p) => {
    if (!p) return "";
    if (typeof p === "object") {
      return p.firstName || p.name || p.email || idOf(p);
    }
    const u = fishById[p];
    return u?.firstName || u?.name || u?.email || p;
  };

  const peopleListFirstNames = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.map((v) => personFirstOf(v)).filter(Boolean).join(", ");
  };

  async function fetchTrips() {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/trip", {
        headers: { Authorization: "Bearer " + token },
      });
      setTrips(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLookups() {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: "Bearer " + token };

      const [boatsRes, skippersRes, crewRes] = await Promise.allSettled([
        axios.get("/api/boat", { headers }),
        axios.get("/api/fisherman?position=skipper", { headers }),
        axios.get("/api/fisherman?position=crew", { headers }),
      ]);

      if (boatsRes.status === "fulfilled") {
        const list = Array.isArray(boatsRes.value.data) ? boatsRes.value.data : [];
        const map = {};
        list.forEach((b) => (map[idOf(b)] = b));
        setBoatsById(map);
      }

      const fishMap = {};
      if (skippersRes.status === "fulfilled") {
        const list = Array.isArray(skippersRes.value.data) ? skippersRes.value.data : [];
        list.forEach((u) => (fishMap[idOf(u)] = u));
      }
      if (crewRes.status === "fulfilled") {
        const list = Array.isArray(crewRes.value.data) ? crewRes.value.data : [];
        list.forEach((u) => (fishMap[idOf(u)] = u));
      }
      setFishById(fishMap);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchTrips();
    fetchLookups();
  }, []);

  // Show confirmation modal
  function showConfirmation(tripId, action) {
    const trip = trips.find((t) => t.tripId === tripId);
    const tripName = trip?.tripId || "this trip";

    if (action === "cancel") {
      setModalConfig({
        title: "Cancel Trip",
        message: `Are you sure you want to cancel trip "${tripName}"? This action cannot be undone.`,
        action: "cancel",
        tripId,
        onConfirm: () => handleCancel(tripId),
      });
    } else if (action === "delete") {
      setModalConfig({
        title: "Delete Trip",
        message: `Are you sure you want to permanently delete trip "${tripName}"? This action cannot be undone.`,
        action: "delete",
        tripId,
        onConfirm: () => handleDelete(tripId),
      });
    }
    setShowConfirmModal(true);
  }

  // Close confirmation modal
  function closeModal() {
    setShowConfirmModal(false);
    setModalConfig({
      title: "",
      message: "",
      action: "",
      tripId: "",
      onConfirm: null,
    });
  }

  async function handleDelete(tripId) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/trip/${encodeURIComponent(tripId)}`, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success("Trip deleted successfully");
      setTrips((prev) => prev.filter((t) => t.tripId !== tripId));
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Delete failed");
    } finally {
      closeModal();
    }
  }

  async function handleCancel(tripId) {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: "Bearer " + token };

      // Try PATCH, then PUT fallback, then POST /cancel
      let response;
      try {
        response = await axios.patch(
          `/api/trip/${encodeURIComponent(tripId)}`,
          { status: "cancelled" },
          { headers }
        );
      } catch {
        try {
          const trip = trips.find((t) => t.tripId === tripId);
          if (trip) {
            response = await axios.put(
              `/api/trip/${encodeURIComponent(tripId)}`,
              { ...trip, status: "cancelled" },
              { headers }
            );
          }
        } catch {
          response = await axios.post(
            `/api/trip/${encodeURIComponent(tripId)}/cancel`,
            {},
            { headers }
          );
        }
      }

      const updatedTrip = response?.data;
      setTrips((prev) =>
        prev.map((t) =>
          t.tripId === tripId ? { ...t, ...(updatedTrip || {}), status: "cancelled" } : t
        )
      );

      toast.success("Trip cancelled successfully");
    } catch (e) {
      console.error("Cancel error:", e);
      const errorMessage =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Cancel failed. Please check console for details.";
      toast.error(errorMessage);
    } finally {
      closeModal();
    }
  }

  const { upcoming, ongoing, completed, overdue, cancelled, counts } = useMemo(() => {
    const u = [],
      o = [],
      comp = [],
      over = [],
      can = [];
    const c = { total: 0, upcoming: 0, ongoing: 0, completed: 0, overdue: 0, cancelled: 0 };

    for (const t of trips) {
      c.total++;
      const s = (t.status || "upcoming").toLowerCase();
      if (s === "upcoming") {
        c.upcoming++;
        u.push(t);
      } else if (s === "ongoing") {
        c.ongoing++;
        o.push(t);
      } else if (s === "completed") {
        c.completed++;
        comp.push(t);
      } else if (s === "overdue") {
        c.overdue++;
        over.push(t);
      } else if (s === "cancelled") {
        c.cancelled++;
        can.push(t);
      }
    }
    u.sort((a, b) => new Date(a.departureDateTime) - new Date(b.departureDateTime));
    o.sort((a, b) => new Date(a.plannedReturnAt) - new Date(b.plannedReturnAt));
    comp.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    over.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    can.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    return { upcoming: u, ongoing: o, completed: comp, overdue: over, cancelled: can, counts: c };
  }, [trips]);

  /* ---------------- Export PDF (only) ---------------- */
  function exportPDF() {
    // Export ALL trips (your report spec)
    const all = [...trips].sort(
      (a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime)
    );

    if (!all.length) return toast.error("No trips to export");

    exportTablePDF({
      title: "Fisheries Trips Report",
      // These two props cover both implementations of your util
      summary: `Total Trips: ${all.length}`,       // ✅ common name used in some projects
      summaryLine: `Total Trips: ${all.length}`,   // ✅ if your util expects this key
      meta: {
        "Generated": new Date().toLocaleString(),
        "Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "-",
      },
      columns: [
        { header: "Trip ID", get: (t) => t.tripId || "-" },
        { header: "Status", get: (t) => (t.status || "-").toString() },
        { header: "Destination", get: (t) => t.destination || "-" },
        { header: "Trip Type", get: (t) => t.tripType || "-" },
        { header: "Boat", get: (t) => boatNameOf(t.boat) || "-" },
        { header: "Skipper", get: (t) => personFirstOf(t.skipper ?? t.captain) || "-" },
        {
          header: "Fishermen",
          get: (t) => {
            const names = peopleListFirstNames(t.fishermen);
            const count = Array.isArray(t.fishermen) ? t.fishermen.length : 0;
            return names ? `${names} (${count})` : count ? `${count}` : "-";
          },
        },
        {
          header: "Departure",
          get: (t) => `${formatDate(t.departureDateTime)} ${formatTime(t.departureDateTime)}`,
        },
        {
          header: "Planned Return",
          get: (t) => `${formatDate(t.plannedReturnAt)} ${formatTime(t.plannedReturnAt)}`,
        },
        {
          header: "Actual Return",
          get: (t) =>
            t.actualReturnAt ? `${formatDate(t.actualReturnAt)} ${formatTime(t.actualReturnAt)}` : "-",
        },
        { header: "Notes", get: (t) => t.specialNotes || "-" },
      ],
      rows: all,
    });
  }

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    );
  }

  const pageBg = darkMode ? "bg-slate-900" : "bg-transparent";
  const pageText = darkMode ? "text-slate-100" : "text-slate-800";
  const softPanel = darkMode ? "bg-slate-800/70 ring-slate-700" : "bg-sky-50/40 ring-sky-100";
  const headerTitle = darkMode ? "text-white" : "text-slate-900";
  const subtitleText = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <>
      <div className={`space-y-6 p-6 ${pageBg} ${pageText}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-sky-500" />
            <div>
              <h1 className={`text-2xl font-bold ${headerTitle}`}>Trip Schedule</h1>
              <p className={`text-xs ${subtitleText}`}>Manage and review your trips</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ Only one export button now, with Download icon */}
            <button
              onClick={exportPDF}
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              }`}
              title="Export all trips as PDF"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>

            {!readOnly && (
              <button
                onClick={() => navigate("/admin/trip/add")}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700"
              >
                <PlusCircle className="h-5 w-5" />
                Add Trip
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["total", "Total", counts.total, "slate"],
            ["upcoming", "Upcoming", counts.upcoming, "sky"],
            ["ongoing", "Ongoing", counts.ongoing, "emerald"],
            ["completed", "Completed", counts.completed, "slate"],
            ["overdue", "Overdue", counts.overdue, "amber"],
            ["cancelled", "Cancelled", counts.cancelled, "rose"],
          ].map(([key, label, val, color]) => (
            <SummaryCard
              key={key}
              label={label}
              value={val}
              color={color}
              active={filter === key}
              onClick={() => setFilter(key)}
              darkMode={darkMode}
            />
          ))}
        </div>

        <div className={`rounded-2xl p-4 ring-1 ${softPanel}`}>
          {/* CARDS: Upcoming & Ongoing */}
          {filter === "total" && (
            <>
              <Section darkMode={darkMode} title="Upcoming" subtitle="Trips that haven't started yet">
                {upcoming.length === 0 ? (
                  <EmptyRow darkMode={darkMode} text="No upcoming trips" />
                ) : (
                  <CardGrid>
                    {upcoming.map((t) => (
                      <TripCard
                        key={t.tripId}
                        trip={t}
                        onShowConfirmation={showConfirmation}
                        darkMode={darkMode}
                        boatNameOf={boatNameOf}
                        personFirstOf={personFirstOf}
                        peopleListFirstNames={peopleListFirstNames}
                        readOnly={readOnly}
                      />
                    ))}
                  </CardGrid>
                )}
              </Section>

              <Section darkMode={darkMode} title="Ongoing" subtitle="Boats currently at sea" className="mt-6">
                {ongoing.length === 0 ? (
                  <EmptyRow darkMode={darkMode} text="No ongoing trips" />
                ) : (
                  <CardGrid>
                    {ongoing.map((t) => (
                      <TripCard
                        key={t.tripId}
                        trip={t}
                        onShowConfirmation={showConfirmation}
                        darkMode={darkMode}
                        boatNameOf={boatNameOf}
                        personFirstOf={personFirstOf}
                        peopleListFirstNames={peopleListFirstNames}
                        readOnly={readOnly}
                      />
                    ))}
                  </CardGrid>
                )}
              </Section>
            </>
          )}

          {/* TABLE: Completed / Overdue / Cancelled (and in Total view) */}
          {(filter === "total" || filter === "completed" || filter === "overdue" || filter === "cancelled") && (
            <Section
              darkMode={darkMode}
              title={
                filter === "completed" || filter === "overdue" || filter === "cancelled"
                  ? capFirst(filter)
                  : "Other Trips"
              }
              subtitle={
                filter === "completed"
                  ? "Trips that are completed"
                  : filter === "overdue"
                  ? "Trips that exceeded planned return"
                  : filter === "cancelled"
                  ? "Trips that were cancelled"
                  : "Completed, overdue, and cancelled trips"
              }
              className={filter === "total" ? "mt-6" : ""}
            >
              <TripsTable
                darkMode={darkMode}
                rows={
                  filter === "completed"
                    ? completed
                    : filter === "overdue"
                    ? overdue
                    : filter === "cancelled"
                    ? cancelled
                    : [...completed, ...overdue, ...cancelled]
                }
                boatNameOf={boatNameOf}
                personFirstOf={personFirstOf}
                peopleListFirstNames={peopleListFirstNames}
                onShowConfirmation={showConfirmation}
                readOnly={readOnly}
              />
            </Section>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`mx-4 w-full max-w-md rounded-2xl p-6 shadow-2xl ${
              darkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"
            }`}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  modalConfig.action === "delete"
                    ? darkMode
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-rose-100 text-rose-600"
                    : darkMode
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                {modalConfig.title}
              </h3>
            </div>

            <p className={`${darkMode ? "text-slate-300" : "text-slate-600"} mb-6`}>{modalConfig.message}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  darkMode ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={modalConfig.onConfirm}
                className={`rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                  modalConfig.action === "delete" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {modalConfig.action === "delete" ? "Delete" : "Cancel Trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Subcomponents ---------------- */

function SummaryCard({ label, value, color = "slate", active = false, onClick, darkMode }) {
  const map = {
    slate: darkMode
      ? "bg-slate-800/80 ring-slate-700 text-slate-200"
      : "bg-slate-50 ring-slate-200 text-slate-700",
    sky: darkMode ? "bg-sky-900/30 ring-sky-800 text-sky-200" : "bg-sky-50 ring-sky-200 text-sky-700",
    emerald: darkMode
      ? "bg-emerald-900/30 ring-emerald-800 text-emerald-200"
      : "bg-emerald-50 ring-emerald-200 text-emerald-700",
    amber: darkMode ? "bg-amber-900/30 ring-amber-800 text-amber-200" : "bg-amber-50 ring-amber-200 text-amber-800",
    rose: darkMode ? "bg-rose-900/30 ring-rose-800 text-rose-200" : "bg-rose-50 ring-rose-200 text-rose-700",
  };
  const activeRing = active ? "ring-2 ring-offset-0 ring-sky-400" : "ring-1";

  return (
    <button
      onClick={onClick}
      className={`text-left transition-all hover:-translate-y-0.5 focus:outline-none rounded-xl p-4 shadow-sm ${map[color]} ${activeRing}`}
    >
      <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </button>
  );
}

function Section({ title, subtitle, children, className = "", darkMode }) {
  return (
    <section className={`space-y-3 ${className}`}>
      <div>
        <h2 className={`text-lg font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{title}</h2>
        <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function CardGrid({ children }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function EmptyRow({ text, darkMode }) {
  return (
    <div
      className={`flex min-h-[140px] items-center justify-center rounded-xl border border-dashed ${
        darkMode ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white/70"
      }`}
    >
      <div className={`flex flex-col items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
        <LifeBuoy className="h-8 w-8" />
        <div className="text-sm">{text}</div>
      </div>
    </div>
  );
}

function TripCard({
  trip,
  onShowConfirmation,
  darkMode,
  boatNameOf,
  personFirstOf,
  peopleListFirstNames,
  readOnly = false,
}) {
  const boatLabel = boatNameOf(trip.boat);
  const skipperLabel = personFirstOf(trip.skipper ?? trip.captain);
  const fishermenLabel = peopleListFirstNames(trip.fishermen);
  const fishCount = Array.isArray(trip.fishermen) ? trip.fishermen.length : 0;

  const shell = darkMode ? "bg-slate-800/90 ring-slate-700 hover:ring-sky-700" : "bg-white/90 ring-slate-200 hover:ring-sky-200";
  const fadeFrom = darkMode ? "from-slate-900" : "from-white";

  const status = (trip.status || "").toLowerCase();

  // Buttons rule:
  // - Edit: upcoming/ongoing only
  // - Cancel: upcoming only
  // - Delete: cancelled only
  const showEditButton = !readOnly && (status === "upcoming" || status === "ongoing");
  const showCancelButton = !readOnly && status === "upcoming";
  const showDeleteButton = !readOnly && status === "cancelled";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-5 ring-1 shadow-sm transition-all duration-300 hover:shadow-lg ${shell}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-blue-500 text-white shadow">
            <Ship className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Trip</div>
            <div className={`truncate font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`} title={trip.tripId}>
              {trip.tripId}
            </div>
          </div>
        </div>
        <StatusBadge status={trip.status} darkMode={darkMode} />
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            darkMode={darkMode}
            icon={<MapPin className="h-4 w-4 opacity-70" />}
            label="Destination"
            value={trip.destination}
            valueClass="break-words"
          />
        </div>

        <hr className={darkMode ? "border-slate-700" : "border-slate-200"} />

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            darkMode={darkMode}
            icon={<User2 className="h-4 w-4 opacity-70" />}
            label="Skipper"
            value={skipperLabel}
            valueClass="break-words"
          />
          <InfoRow darkMode={darkMode} icon={<Users className="h-4 w-4 opacity-70" />} label="Crew Count" value={fishCount} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            darkMode={darkMode}
            icon={<Ship className="h-4 w-4 opacity-70" />}
            label="Boat"
            value={boatLabel}
            valueClass="break-words"
          />
          <InfoRow darkMode={darkMode} icon={<CalendarDays className="h-4 w-4 opacity-70" />} label="Trip Type" value={trip.tripType} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          <InfoRow
            darkMode={darkMode}
            icon={<CalendarDays className="h-4 w-4 opacity-70" />}
            label="Schedule"
            value={`${formatDate(trip.departureDateTime)} ${formatTime(trip.departureDateTime)} → ${formatDate(
              trip.plannedReturnAt
            )} ${formatTime(trip.plannedReturnAt)}`}
            valueClass="break-words"
          />
          <InfoRow
            darkMode={darkMode}
            icon={<Info className="h-4 w-4 opacity-70" />}
            label="Notes"
            value={trip.specialNotes || "—"}
            valueClass="break-words"
          />
          <InfoRow
            darkMode={darkMode}
            icon={<Users className="h-4 w-4 opacity-70" />}
            label="Fishermen"
            value={fishermenLabel || "—"}
            valueClass="break-words"
          />
        </div>
      </div>

      <div className={`pointer-events-none absolute inset-x-0 bottom-14 h-8 bg-gradient-to-t ${fadeFrom} to-transparent opacity-0`} />

      {!readOnly && (
        <div className="mt-5 flex items-center justify-end gap-2">
          {showEditButton && (
            <Link
              to={`/admin/trip/edit/${encodeURIComponent(trip.tripId)}`}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ring-1 transition
              ${darkMode ? "text-sky-300 ring-sky-800 hover:bg-sky-600/20 hover:text-white" : "text-blue-700 ring-blue-200 hover:bg-blue-600 hover:text-white"}`}
              title="Edit"
            >
              <EditIcon className="h-4 w-4" />
              Edit
            </Link>
          )}

          {showCancelButton && (
            <button
              onClick={() => onShowConfirmation(trip.tripId, "cancel")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ring-1 transition
              ${darkMode ? "text-amber-300 ring-amber-800 hover:bg-amber-600/20 hover:text-white" : "text-amber-700 ring-amber-200 hover:bg-amber-500 hover:text-white"}`}
              title="Cancel trip"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          )}

          {showDeleteButton && (
            <button
              onClick={() => onShowConfirmation(trip.tripId, "delete")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ring-1 transition
              ${darkMode ? "text-rose-300 ring-rose-800 hover:bg-rose-600/20 hover:text-white" : "text-rose-700 ring-rose-200 hover:bg-rose-600 hover:text-white"}`}
              title="Delete (cancelled only)"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TripsTable({
  rows,
  darkMode,
  boatNameOf,
  personFirstOf,
  peopleListFirstNames,
  onShowConfirmation,
  readOnly,
}) {
  const hasRows = Array.isArray(rows) && rows.length > 0;

  return (
    <div className={`overflow-x-auto rounded-xl ring-1 ${darkMode ? "ring-slate-700" : "ring-slate-200"}`}>
      <table className={`min-w-full text-sm ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
        <thead className={darkMode ? "bg-slate-900/40" : "bg-slate-50"}>
          <tr>
            <Th>Trip ID</Th>
            <Th>Status</Th>
            <Th>Destination</Th>
            <Th>Skipper</Th>
            <Th>Boat</Th>
            <Th>Fishermen</Th>
            <Th>Type</Th>
            <Th>Departure</Th>
            <Th>Planned Return</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody className={darkMode ? "divide-y divide-slate-700" : "divide-y divide-slate-200"}>
          {!hasRows && (
            <tr>
              <Td colSpan={10}>
                <div className={`py-6 text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No trips to show</div>
              </Td>
            </tr>
          )}
          {hasRows &&
            rows.map((t) => {
              const status = (t.status || "").toLowerCase();
              const deletable = status === "cancelled" && !readOnly;

              return (
                <tr key={t.tripId} className={darkMode ? "hover:bg-slate-900/30" : "hover:bg-slate-50"}>
                  <Td className="font-semibold">{t.tripId}</Td>
                  <Td>
                    <StatusBadge status={t.status} darkMode={darkMode} />
                  </Td>
                  <Td className="max-w-[260px]">
                    <span className="line-clamp-2">{t.destination || "—"}</span>
                  </Td>
                  <Td className="whitespace-nowrap">{personFirstOf(t.skipper ?? t.captain) || "—"}</Td>
                  <Td className="whitespace-nowrap">{boatNameOf(t.boat) || "—"}</Td>
                  <Td className="max-w-[260px]">
                    <span className="line-clamp-2">{peopleListFirstNames(t.fishermen) || "—"}</span>
                  </Td>
                  <Td className="whitespace-nowrap">{t.tripType || "—"}</Td>
                  <Td className="whitespace-nowrap">
                    {formatDate(t.departureDateTime)} {formatTime(t.departureDateTime)}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatDate(t.plannedReturnAt)} {formatTime(t.plannedReturnAt)}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* No edit here; only deletion when cancelled */}
                      {deletable && (
                        <button
                          type="button"
                          onClick={() => onShowConfirmation(t.tripId, "delete")}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all
                          ${
                            darkMode
                              ? "bg-rose-700/80 text-white hover:bg-rose-600"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          }`}
                          title="Delete cancelled trip"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- tiny UI helpers ---------- */

function InfoRow({ icon, label, value, valueClass = "", darkMode }) {
  return (
    <div className="min-w-0">
      <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        <span className={darkMode ? "text-slate-400" : "text-slate-400"}>{icon}</span>
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div
        className={`mt-1 text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-800"} ${valueClass}`}
        title={String(value ?? "")}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function StatusBadge({ status, darkMode }) {
  const cls =
    status === "upcoming"
      ? darkMode
        ? "bg-sky-900/40 text-sky-200 ring-sky-800"
        : "bg-sky-100 text-sky-700 ring-sky-200"
      : status === "ongoing"
      ? darkMode
        ? "bg-emerald-900/40 text-emerald-200 ring-emerald-800"
        : "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : status === "completed"
      ? darkMode
        ? "bg-slate-800 text-slate-200 ring-slate-700"
        : "bg-slate-100 text-slate-700 ring-slate-200"
      : status === "overdue"
      ? darkMode
        ? "bg-amber-900/40 text-amber-200 ring-amber-800"
        : "bg-amber-100 text-amber-800 ring-amber-200"
      : status === "cancelled"
      ? darkMode
        ? "bg-rose-900/40 text-rose-200 ring-rose-800"
        : "bg-rose-100 text-rose-700 ring-rose-200"
      : darkMode
      ? "bg-slate-800 text-slate-200 ring-slate-700"
      : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ${cls}`}>
      {status || "—"}
    </span>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "", colSpan }) {
  return (
    <td className={`px-3 py-2 align-top ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

/* ---------- utils ---------- */

function formatDate(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return isNaN(d) ? "—" : d.toLocaleDateString();
}
function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function capFirst(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}
