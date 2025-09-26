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
  Download,
} from "lucide-react";
import { exportTablePDF } from "../utils/pdfExporter"; // ✅ PDF exporter

export default function TripsManagement({ darkMode = false }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("total");
  const navigate = useNavigate();

  // NEW: lookup maps for names when API returns only IDs
  const [boatsById, setBoatsById] = useState({});
  const [fishById, setFishById] = useState({}); // fishermen + skippers share Fisherman model

  // ---------- helpers ----------
  const idOf = (x) =>
    typeof x === "string" ? x : (x && (x._id || x.id)) ? String(x._id || x.id) : "";

  const boatNameOf = (boat) => {
    if (!boat) return "";
    if (typeof boat === "object") {
      return boat.name || boat.boatName || boat.boatNumber || boat.registrationNumber || idOf(boat);
    }
    // string id → try map
    return boatsById[boat]?.name || boatsById[boat]?.boatName || boatsById[boat]?.boatNumber || boat;
  };

  const personFirstOf = (p) => {
    if (!p) return "";
    if (typeof p === "object") {
      return p.firstName || p.name || p.email || idOf(p);
    }
    // string id → try map
    return fishById[p]?.firstName || fishById[p]?.name || fishById[p]?.email || p;
  };

  const peopleListFirstNames = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list
      .map((v) => personFirstOf(v))
      .filter(Boolean)
      .join(", ");
  };

  // ---------- data fetching ----------
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

  // Fetch boats and fishermen/ skippers lists to resolve names when IDs only
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
      // not fatal
    }
  }

  useEffect(() => {
    fetchTrips();
    fetchLookups();
  }, []);

  async function handleDelete(tripId) {
    if (!window.confirm("Delete this trip?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/trip/${encodeURIComponent(tripId)}`, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success("Trip deleted");
      setTrips((prev) => prev.filter((t) => t.tripId !== tripId));
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Delete failed");
    }
  }

  const { upcoming, ongoing, others, completed, overdue, cancelled, counts } = useMemo(() => {
    const u = [], o = [], ot = [], comp = [], over = [], can = [];
    const c = { total: 0, upcoming: 0, ongoing: 0, completed: 0, overdue: 0, cancelled: 0 };

    for (const t of trips) {
      c.total++;
      const s = (t.status || "upcoming").toLowerCase();
      if (s === "upcoming") { c.upcoming++; u.push(t); }
      else if (s === "ongoing") { c.ongoing++; o.push(t); }
      else { ot.push(t); if (s === "completed") comp.push(t); if (s === "overdue") over.push(t); if (s === "cancelled") can.push(t); }
    }
    u.sort((a, b) => new Date(a.departureDateTime) - new Date(b.departureDateTime));
    o.sort((a, b) => new Date(a.plannedReturnAt) - new Date(b.plannedReturnAt));
    ot.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    comp.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    over.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    can.sort((a, b) => new Date(b.departureDateTime) - new Date(a.departureDateTime));
    return { upcoming: u, ongoing: o, others: ot, completed: comp, overdue: over, cancelled: can, counts: c };
  }, [trips]);

  // ✅ PDF Export replacing CSV
  async function handleExportPDF() {
    const list =
      filter === "total" ? trips :
      filter === "upcoming" ? upcoming :
      filter === "ongoing" ? ongoing :
      filter === "completed" ? completed :
      filter === "overdue" ? overdue : cancelled;

    if (!list || list.length === 0) {
      toast.error("No trips to export");
      return;
    }

    const columns = [
      { header: "Trip ID", get: (t) => t.tripId },
      { header: "Status", get: (t) => t.status || "-" },
      { header: "Destination", get: (t) => t.destination || "-" },
      { header: "Skipper", get: (t) => personFirstOf(t.skipper ?? t.captain) || "-" },
      { header: "Boat", get: (t) => boatNameOf(t.boat) || "-" },
      { header: "Crew Count", get: (t) => (Array.isArray(t.fishermen) ? t.fishermen.length : 0) },
      { header: "Fishermen", get: (t) => peopleListFirstNames(t.fishermen) || "-" },
      { header: "Trip Type", get: (t) => t.tripType || "-" },
      {
        header: "Departure",
        get: (t) =>
          t.departureDateTime
            ? `${new Date(t.departureDateTime).toLocaleDateString()} ${new Date(t.departureDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "-",
      },
      {
        header: "Planned Return",
        get: (t) =>
          t.plannedReturnAt
            ? `${new Date(t.plannedReturnAt).toLocaleDateString()} ${new Date(t.plannedReturnAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "-",
      },
      { header: "Notes", get: (t) => t.specialNotes || "-" },
      {
        header: "Created",
        get: (t) => (t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"),
      },
    ];

    await exportTablePDF({
      title: "Trips Report",
      meta: {
        Filter: filter === "total" ? "All" : capFirst(filter),
        "Total Trips": list.length,
      },
      columns,
      rows: list,
      orientation: "landscape",
      filename: `trip_report_${filter === "total" ? "all" : filter}_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  }

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

  const showBlocks = filter === "total" ? ["upcoming","ongoing","others"] : [filter];

  return (
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
          <button
            onClick={handleExportPDF}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            title="Export current view as PDF"
          >
            <Download className="h-4 w-4" />
            Report PDF
          </button>

          <button
            onClick={() => navigate("/admin/trip/add")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700"
          >
            <PlusCircle className="h-5 w-5" />
            Add Trip
          </button>
        </div>
      </div>

      {/* Filter cards */}
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

      {/* Content */}
      <div className={`rounded-2xl p-4 ring-1 ${softPanel}`}>
        {showBlocks.includes("upcoming") && filter === "total" && (
          <Section darkMode={darkMode} title="Upcoming" subtitle="Trips that haven't started yet">
            {upcoming.length === 0 ? (
              <EmptyRow darkMode={darkMode} text="No upcoming trips" />
            ) : (
              <CardGrid>
                {upcoming.map((t) => (
                  <TripCard key={t.tripId} trip={t} onDelete={handleDelete} darkMode={darkMode} boatNameOf={boatNameOf} personFirstOf={personFirstOf} peopleListFirstNames={peopleListFirstNames} />
                ))}
              </CardGrid>
            )}
          </Section>
        )}

        {showBlocks.includes("ongoing") && filter === "total" && (
          <Section darkMode={darkMode} title="Ongoing" subtitle="Boats currently at sea" className="mt-6">
            {ongoing.length === 0 ? (
              <EmptyRow darkMode={darkMode} text="No ongoing trips" />
            ) : (
              <CardGrid>
                {ongoing.map((t) => (
                  <TripCard key={t.tripId} trip={t} onDelete={handleDelete} darkMode={darkMode} boatNameOf={boatNameOf} personFirstOf={personFirstOf} peopleListFirstNames={peopleListFirstNames} />
                ))}
              </CardGrid>
            )}
          </Section>
        )}

        {showBlocks.includes("others") && filter === "total" && (
          <Section darkMode={darkMode} title="Other" subtitle="Completed, overdue, or cancelled" className="mt-6">
            {others.length === 0 ? (
              <EmptyRow darkMode={darkMode} text="No trips here yet" />
            ) : (
              <CardGrid>
                {others.map((t) => (
                  <TripCard key={t.tripId} trip={t} onDelete={handleDelete} darkMode={darkMode} boatNameOf={boatNameOf} personFirstOf={personFirstOf} peopleListFirstNames={peopleListFirstNames} />
                ))}
              </CardGrid>
            )}
          </Section>
        )}

        {filter !== "total" && (
          <Section
            darkMode={darkMode}
            title={capFirst(filter)}
            subtitle={
              filter === "upcoming" ? "Trips that haven't started yet"
                : filter === "ongoing" ? "Boats currently at sea"
                : filter === "completed" ? "Trips that are completed"
                : filter === "overdue" ? "Trips that exceeded planned return"
                : "Trips that were cancelled"
            }
          >
            <CardGrid>
              {(filter === "upcoming" ? upcoming
                : filter === "ongoing" ? ongoing
                : filter === "completed" ? completed
                : filter === "overdue" ? overdue
                : cancelled).length === 0 ? (
                <EmptyRow darkMode={darkMode} text={`No ${filter} trips`} />
              ) : (
                (filter === "upcoming" ? upcoming
                : filter === "ongoing" ? ongoing
                : filter === "completed" ? completed
                : filter === "overdue" ? overdue
                : cancelled).map((t) => (
                  <TripCard key={t.tripId} trip={t} onDelete={handleDelete} darkMode={darkMode} boatNameOf={boatNameOf} personFirstOf={personFirstOf} peopleListFirstNames={peopleListFirstNames} />
                ))
              )}
            </CardGrid>
          </Section>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color = "slate", active = false, onClick, darkMode }) {
  const map = {
    slate: darkMode ? "bg-slate-800/80 ring-slate-700 text-slate-200" : "bg-slate-50 ring-slate-200 text-slate-700",
    sky: darkMode ? "bg-sky-900/30 ring-sky-800 text-sky-200" : "bg-sky-50 ring-sky-200 text-sky-700",
    emerald: darkMode ? "bg-emerald-900/30 ring-emerald-800 text-emerald-200" : "bg-emerald-50 ring-emerald-200 text-emerald-700",
    amber: darkMode ? "bg-amber-900/30 ring-amber-800 text-amber-200" : "bg-amber-50 ring-amber-200 text-amber-800",
    rose: darkMode ? "bg-rose-900/30 ring-rose-800 text-rose-200" : "bg-rose-50 ring-rose-200 text-rose-700",
  };
  const activeRing = active ? "ring-2 ring-offset-0 ring-sky-400" : "ring-1";

  return (
    <button onClick={onClick} className={`rounded-xl p-4 shadow-sm text-left transition-all hover:translate-y-[-2px] focus:outline-none ${map[color]} ${activeRing}`}>
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
    <div className={`flex min-h-[140px] items-center justify-center rounded-xl border border-dashed ${darkMode ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white/70"}`}>
      <div className={`flex flex-col items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
        <LifeBuoy className="h-8 w-8" />
        <div className="text-sm">{text}</div>
      </div>
    </div>
  );
}

function TripCard({ trip, onDelete, darkMode, boatNameOf, personFirstOf, peopleListFirstNames }) {
  const boatLabel = boatNameOf(trip.boat);
  const skipperLabel = personFirstOf(trip.skipper ?? trip.captain);
  const fishermenLabel = peopleListFirstNames(trip.fishermen);
  const fishCount = Array.isArray(trip.fishermen) ? trip.fishermen.length : 0;

  const shell = darkMode ? "bg-slate-800/90 ring-slate-700 hover:ring-sky-700" : "bg-white/90 ring-slate-200 hover:ring-sky-200";
  const fadeFrom = darkMode ? "from-slate-900" : "from-white";

  return (
    <div className={`group relative overflow-hidden rounded-2xl p-5 ring-1 shadow-sm transition-all duration-300 hover:shadow-lg ${shell}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
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
          <InfoRow darkMode={darkMode} icon={<MapPin className="h-4 w-4 opacity-70" />} label="Destination" value={trip.destination} valueClass="break-words" />
          <DateRow dep={trip.departureDateTime} ret={trip.plannedReturnAt} darkMode={darkMode} />
        </div>

        <hr className={darkMode ? "border-slate-700" : "border-slate-200"} />

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow darkMode={darkMode} icon={<User2 className="h-4 w-4 opacity-70" />} label="Skipper" value={skipperLabel} valueClass="break-words" />
          <InfoRow darkMode={darkMode} icon={<Users className="h-4 w-4 opacity-70" />} label="Crew Count" value={fishCount} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow darkMode={darkMode} icon={<Ship className="h-4 w-4 opacity-70" />} label="Boat" value={boatLabel} valueClass="break-words" />
          <InfoRow darkMode={darkMode} icon={<CalendarDays className="h-4 w-4 opacity-70" />} label="Trip Type" value={trip.tripType} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          <InfoRow darkMode={darkMode} icon={<Info className="h-4 w-4 opacity-70" />} label="Notes" value={trip.specialNotes || "—"} valueClass="break-words" />
          <InfoRow darkMode={darkMode} icon={<Users className="h-4 w-4 opacity-70" />} label="Fishermen" value={fishermenLabel || "—"} valueClass="break-words" />
        </div>
      </div>

      <div className={`pointer-events-none absolute inset-x-0 bottom-14 h-8 bg-gradient-to-t ${fadeFrom} to-transparent opacity-0`} />

      <div className="mt-5 flex items-center justify-end gap-2">
        <Link
          to={`/admin/trip/edit/${encodeURIComponent(trip.tripId)}`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ring-1 transition
            ${darkMode ? "text-sky-300 ring-sky-800 hover:bg-sky-600/20 hover:text-white" : "text-blue-700 ring-blue-200 hover:bg-blue-600 hover:text-white"}`}
          title="Edit"
        >
          <EditIcon className="h-4 w-4" />
          Edit
        </Link>
        <button
          onClick={() => onDelete(trip.tripId)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ring-1 transition
            ${darkMode ? "text-rose-300 ring-rose-800 hover:bg-rose-600/20 hover:text-white" : "text-rose-700 ring-rose-200 hover:bg-rose-600 hover:text-white"}`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, valueClass = "", darkMode }) {
  return (
    <div className="min-w-0">
      <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        <span className={darkMode ? "text-slate-400" : "text-slate-400"}>{icon}</span>
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div className={`mt-1 text-sm font-medium ${darkMode ? "text-slate-100" : "text-slate-800"} ${valueClass}`} title={String(value ?? "")}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function DateRow({ dep, ret, darkMode }) {
  return (
    <div className="min-w-0">
      <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        <CalendarDays className="h-4 w-4 opacity-70" />
        <span className="whitespace-nowrap">Schedule</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs ring-1
          ${darkMode ? "bg-slate-800 text-slate-200 ring-slate-700" : "bg-slate-50 text-slate-700 ring-slate-200"}`}>
          <span className="font-medium">Dep:</span>
          <span>{formatDate(dep)} {formatTime(dep)}</span>
        </span>
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs ring-1
          ${darkMode ? "bg-slate-800 text-slate-200 ring-slate-700" : "bg-slate-50 text-slate-700 ring-slate-200"}`}>
          <span className="font-medium">Ret:</span>
          <span>{formatDate(ret)} {formatTime(ret)}</span>
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status, darkMode }) {
  const cls =
    status === "upcoming" ? (darkMode ? "bg-sky-900/40 text-sky-200 ring-sky-800" : "bg-sky-100 text-sky-700 ring-sky-200") :
    status === "ongoing"  ? (darkMode ? "bg-emerald-900/40 text-emerald-200 ring-emerald-800" : "bg-emerald-100 text-emerald-700 ring-emerald-200") :
    status === "completed"? (darkMode ? "bg-slate-800 text-slate-200 ring-slate-700" : "bg-slate-100 text-slate-700 ring-slate-200") :
    status === "overdue"  ? (darkMode ? "bg-amber-900/40 text-amber-200 ring-amber-800" : "bg-amber-100 text-amber-800 ring-amber-200") :
    status === "cancelled"? (darkMode ? "bg-rose-900/40 text-rose-200 ring-rose-800" : "bg-rose-100 text-rose-700 ring-rose-200") :
    (darkMode ? "bg-slate-800 text-slate-200 ring-slate-700" : "bg-slate-100 text-slate-700 ring-slate-200");
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ${cls}`}>{status || "—"}</span>;
}

function formatDate(dt){ if(!dt) return "—"; const d=new Date(dt); return isNaN(d)?"—":d.toLocaleDateString(); }
function formatTime(dt){ if(!dt) return ""; const d=new Date(dt); return isNaN(d)?"":d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}); }
function capFirst(s){ return (s||"").charAt(0).toUpperCase() + (s||"").slice(1); }
