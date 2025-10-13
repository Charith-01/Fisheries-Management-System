// admin/fishermanTrips.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import {
  Ship, CalendarClock, MapPin, User2, Users, CalendarDays, LifeBuoy, Info, Download,
} from "lucide-react";

export default function FishermanTrips({ darkMode = false }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("total");

  const [boatsById, setBoatsById] = useState({});
  const [fishById, setFishById] = useState({});

  const idOf = (x) =>
    typeof x === "string" ? x : (x && (x._id || x.id)) ? String(x._id || x.id) : "";

  const boatNameOf = (boat) => {
    if (!boat) return "";
    if (typeof boat === "object") {
      return boat.name || boat.boatName || boat.boatNumber || boat.registrationNumber || idOf(boat);
    }
    return boatsById[boat]?.name || boatsById[boat]?.boatName || boatsById[boat]?.boatNumber || boat;
  };

  const personFirstOf = (p) => {
    if (!p) return "";
    if (typeof p === "object") {
      return p.firstName || p.name || p.email || idOf(p);
    }
    return fishById[p]?.firstName || fishById[p]?.name || fishById[p]?.email || p;
  };

  const peopleListFirstNames = (arr) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.map((v) => personFirstOf(v)).filter(Boolean).join(", ");
  };

  // Fetch ONLY the logged-in user's trips (server-side filtered)
  async function fetchTrips() {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/trip/my", {
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

  // Lookups for nicer labels
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

  // Grouping (on server-filtered `trips`)
  const { upcoming, ongoing, others, completed, overdue, cancelled, counts } = useMemo(() => {
    const src = trips || [];
    const u = [], o = [], ot = [], comp = [], over = [], can = [];
    const c = { total: 0, upcoming: 0, ongoing: 0, completed: 0, overdue: 0, cancelled: 0 };

    for (const t of src) {
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

  function exportCSV() {
    const list =
      filter === "total" ? trips :
      filter === "upcoming" ? upcoming :
      filter === "ongoing" ? ongoing :
      filter === "completed" ? completed :
      filter === "overdue" ? overdue : cancelled;

    const headers = [
      "tripId","status","destination","skipper","boat",
      "fishermenCount","fishermenNames","tripType",
      "departureDateTime","plannedReturnAt","specialNotes","createdAt"
    ];

    const rows = (list || []).map((t) => {
      const skipperName = personFirstOf(t.skipper ?? t.captain);
      const boatName = boatNameOf(t.boat);
      const fishermenNames = peopleListFirstNames(t.fishermen);

      return [
        csv(t.tripId), csv(t.status), csv(t.destination), csv(skipperName), csv(boatName),
        String(Array.isArray(t.fishermen) ? t.fishermen.length : 0),
        csv(fishermenNames), csv(t.tripType),
        csv(iso(t.departureDateTime)), csv(iso(t.plannedReturnAt)), csv(t.specialNotes),
        csv(iso(t.createdAt)),
      ];
    });

    const csvText = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip_report_${filter === "total" ? "all" : filter}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function csv(v){ if(v==null) return ""; const s=String(v); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
  function iso(dt){ if(!dt) return ""; const d=new Date(dt); return isNaN(d)?"":d.toISOString(); }

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
            <h1 className={`text-2xl font-bold ${headerTitle}`}>Trips</h1>
            <p className={`text-xs ${subtitleText}`}>Only your assigned trips</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              darkMode ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
            title="Export current view as CSV"
          >
            <Download className="h-4 w-4" />
            Report
          </button>
        </div>
      </div>

      <div className={`rounded-2xl p-4 ring-1 ${softPanel}`}>
        {showBlocks.includes("upcoming") && filter === "total" && (
          <Section darkMode={darkMode} title="Upcoming" subtitle="Trips that haven't started yet">
            {upcoming.length === 0 ? (
              <EmptyRow darkMode={darkMode} text="No upcoming trips" />
            ) : (
              <CardGrid>
                {upcoming.map((t) => (
                  <TripCard
                    key={t.tripId}
                    trip={t}
                    darkMode={darkMode}
                    boatNameOf={boatNameOf}
                    personFirstOf={personFirstOf}
                    peopleListFirstNames={peopleListFirstNames}
                  />
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
                  <TripCard
                    key={t.tripId}
                    trip={t}
                    darkMode={darkMode}
                    boatNameOf={boatNameOf}
                    personFirstOf={personFirstOf}
                    peopleListFirstNames={peopleListFirstNames}
                  />
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
                  <TripCard
                    key={t.tripId}
                    trip={t}
                    darkMode={darkMode}
                    boatNameOf={boatNameOf}
                    personFirstOf={personFirstOf}
                    peopleListFirstNames={peopleListFirstNames}
                  />
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
                  <TripCard
                    key={t.tripId}
                    trip={t}
                    darkMode={darkMode}
                    boatNameOf={boatNameOf}
                    personFirstOf={personFirstOf}
                    peopleListFirstNames={peopleListFirstNames}
                  />
                ))
              )}
            </CardGrid>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ---------------- small UI helpers ---------------- */

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

function TripCard({ trip, darkMode, boatNameOf, personFirstOf, peopleListFirstNames }) {
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
