import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import {
  Save, Loader, ChevronLeft, CalendarClock, Ship, UserCircle2, Users, MapPin, CalendarRange, ClipboardList,
} from "lucide-react";

export default function EditTripForm({ darkMode = false }) {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [boats, setBoats] = useState([]);
  const [skippers, setSkippers] = useState([]);
  const [fishermen, setFishermen] = useState([]);

  const [status, setStatus] = useState("upcoming");

  const [form, setForm] = useState({
    tripId: "",
    boat: "",
    skipper: "",
    fishermen: [],
    departureDateTime: "",
    plannedReturnAt: "",
    destination: "",
    tripType: "Fishing Trip",
    specialNotes: "",
    actualReturnAt: "",
  });

  const idOf = (x) =>
    typeof x === "string" ? x : (x && (x._id || x.id)) ? String(x._id || x.id) : "";

  const nameOfFisherman = (u) => {
    if (!u || typeof u !== "object") return String(u || "");
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return full || u.email || idOf(u) || "";
  };

  // ensure current selected value exist in dropdown lists
  const ensureSkipperPresent = (list, skipperId, skipperObj) => {
    if (!skipperId) return list;
    const exists = list.some((u) => String(u._id) === String(skipperId));
    if (exists) return list;
    const label = skipperObj ? nameOfFisherman(skipperObj) : skipperId;
    return [{ _id: skipperId, firstName: label }, ...list];
  };

  const ensureFishermenPresent = (list, ids, objs) => {
    const set = new Set(list.map((u) => String(u._id)));
    const inject = [];
    ids.forEach((fid, i) => {
      if (!fid) return;
      if (!set.has(String(fid))) {
        const obj = objs?.[i];
        inject.push({ _id: fid, firstName: obj ? nameOfFisherman(obj) : String(fid) });
      }
    });
    if (inject.length === 0) return list;
    return [...inject, ...list];
  };

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: "Bearer " + token };

    (async () => {
      try {
        // 1) Load trip
        const t = await axios.get(`/api/trip/${encodeURIComponent(tripId)}`, { headers });
        
        const trip = t.data?.trip || t.data;
        if (!trip) {
          toast.error("Trip not found");
          setLoading(false);
          return;
        }

        setStatus(trip.status || "upcoming");

        // Support both new (skipper) and legacy (captain) fields
        const skipperObj = trip.skipper || trip.captain || null;
        const skipperId = idOf(skipperObj);

        // fishermen could be Fisherman
        const fishermenObjs = Array.isArray(trip.fishermen) ? trip.fishermen : [];
        const fishermenIds = fishermenObjs.map(idOf).filter(Boolean);

        setForm({
          tripId: trip.tripId,
          boat: idOf(trip.boat),
          skipper: skipperId,
          fishermen: fishermenIds,
          departureDateTime: toInputDT(trip.departureDateTime),
          plannedReturnAt: toInputDT(trip.plannedReturnAt),
          destination: trip.destination || "",
          tripType: trip.tripType || "Fishing Trip",
          specialNotes: trip.specialNotes || "",
          actualReturnAt: toInputDT(trip.actualReturnAt) || "",
        });

        // Load dropdown sources
        const [boatsRes, skRes, fishRes] = await Promise.allSettled([
          axios.get("/api/boat", { headers }),
          axios.get("/api/fisherman?position=skipper", { headers }),
          axios.get("/api/fisherman?position=crew", { headers }),
        ]);

        let boatsList = [];
        let skipperList = [];
        let fishermanList = [];

        if (boatsRes.status === "fulfilled") boatsList = boatsRes.value.data || [];
        else toast.error("Failed to load boats");

        if (skRes.status === "fulfilled") skipperList = skRes.value.data || [];
        else toast.error("Failed to load skippers");

        if (fishRes.status === "fulfilled") fishermanList = fishRes.value.data || [];
        else toast.error("Failed to load fishermen");

        // 3) Ensure current values exist in lists even if not returned by filters
        skipperList = ensureSkipperPresent(skipperList, skipperId, skipperObj);
        fishermanList = ensureFishermenPresent(fishermanList, fishermenIds, fishermenObjs);

        setBoats(boatsList);
        setSkippers(skipperList);
        setFishermen(fishermanList);
      } catch (e) {
        console.error(e?.response || e);
        toast.error(e?.response?.data?.message || "Failed to load trip");
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  // ---------- handlers ----------
  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }
  function onFishermenChange(e) {
    const values = Array.from(e.target.selectedOptions).map((o) => String(o.value));
    setForm((prev) => ({ ...prev, fishermen: values }));
  }

  function validate() {
    if (!form.boat) return "Select a boat";
    if (!form.skipper) return "Select a skipper";
    if (!form.fishermen.length) return "Choose at least one fisherman";
    if (!form.departureDateTime) return "Departure date/time is required";
    if (!form.plannedReturnAt) return "Planned return is required";
    if (new Date(form.plannedReturnAt) <= new Date(form.departureDateTime)) return "Return must be after departure";
    if (!form.destination.trim()) return "Destination is required";
    if (!form.tripType.trim()) return "Trip type is required";
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: "Bearer " + token };

      const payload = {
        ...form,
        // make sure ids are plain strings
        boat: String(form.boat),
        skipper: String(form.skipper),
        fishermen: form.fishermen.map(String),
        departureDateTime: new Date(form.departureDateTime).toISOString(),
        plannedReturnAt: new Date(form.plannedReturnAt).toISOString(),
        actualReturnAt: form.actualReturnAt ? new Date(form.actualReturnAt).toISOString() : undefined,
      };

      await axios.put(`/api/trip/${encodeURIComponent(tripId)}`, payload, { headers });
      toast.success("Trip updated");
      navigate("/admin/trip");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? "border-cyan-400" : "border-blue-500"}`} />
      </div>
    );
  }

  const inputBase = `${
    darkMode
      ? "border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus:ring-cyan-400 focus:border-cyan-400"
      : "border-slate-200 bg-white/60 text-slate-800 placeholder:text-slate-400 focus:ring-cyan-500 focus:border-cyan-500"
  } w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none transition`;
  const labelBase = `text-sm font-medium mb-1 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-700"}`;
  const cardWrap = `rounded-2xl border p-6 shadow-xl backdrop-blur ${darkMode ? "border-slate-700 bg-slate-800/90" : "border-slate-200 bg-white/80"}`;
  const pageWrap = `flex justify-center mt-10 px-4 ${darkMode ? "text-slate-100" : "text-slate-800"}`;
  const backBtn = `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm ${
    darkMode ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
  }`;
  const statusPill = `text-xs rounded-full px-2.5 py-1 font-medium shadow ${darkMode ? "bg-sky-900/50 text-sky-200" : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"}`;
  const h2Cls = `text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`;
  const subCls = `text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`;
  const sectionTitle = `text-base font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`;
  const divider = `${darkMode ? "border-slate-700" : "border-slate-200"}`;
  const cancelBtn = `rounded-xl border px-4 py-2 text-sm font-medium shadow-sm ${
    darkMode ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;
  const submitBtn = `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow ${
    darkMode ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-600" : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
  } disabled:cursor-not-allowed disabled:opacity-60`;

  return (
    <div className={pageWrap}>
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/admin/trip" className={backBtn}><ChevronLeft size={16} /> Back to Trips</Link>
          <span className={statusPill}>Status: {status || "—"}</span>
        </div>

        <div className={cardWrap}>
          <div className="mb-6">
            <h2 className={h2Cls}>Edit Trip <span className={`font-mono text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{tripId}</span></h2>
            <p className={subCls}>Update the details below and save your changes.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            {/* Trip Details */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Trip Details</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelBase} htmlFor="tripId">Trip ID</label>
                  <input id="tripId" name="tripId" value={form.tripId} readOnly className={`${inputBase} ${darkMode ? "bg-slate-900/40" : "bg-slate-50"} font-mono`} />
                </div>

                <div>
                  <label className={labelBase} htmlFor="tripType">Trip Type</label>
                  <select id="tripType" name="tripType" value={form.tripType} onChange={onChange} className={inputBase}>
                    <option>Fishing Trip</option>
                    <option>Sightseeing</option>
                    <option>Private Charter</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelBase} htmlFor="destination">
                    <MapPin className={`h-4 w-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                    Destination
                  </label>
                  <input id="destination" name="destination" placeholder="e.g., Offshore Zone 4B" value={form.destination} onChange={onChange} className={inputBase} />
                </div>
              </div>
            </section>

            <hr className={divider} />

            {/* Crew */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Crew</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelBase} htmlFor="boat">
                    <Ship className={`h-4 w-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                    Boat
                  </label>
                  <select id="boat" name="boat" value={form.boat} onChange={onChange} className={inputBase}>
                    <option value="">Select a boat…</option>
                    {boats.map((b) => (
                      <option key={b._id} value={b._id}>{b.boatNumber} — {b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelBase} htmlFor="skipper">
                    <UserCircle2 className={`h-4 w-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                    Skipper
                  </label>
                  <select id="skipper" name="skipper" value={form.skipper} onChange={onChange} className={inputBase}>
                    <option value="">Select a skipper…</option>
                    {skippers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {nameOfFisherman(u)}{u.email ? ` — ${u.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelBase} htmlFor="fishermen">Fishermen</label>
                  <select id="fishermen" multiple value={form.fishermen} onChange={onFishermenChange} className={`${inputBase} h-40`}>
                    {fishermen.map((u) => (
                      <option key={u._id} value={u._id}>
                        {nameOfFisherman(u)}{u.email ? ` — ${u.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Hold <span className="font-medium">Ctrl</span> (Windows) or <span className="font-medium">Cmd</span> (Mac) to select multiple.
                  </p>
                </div>
              </div>
            </section>

            <hr className={divider} />

            {/* Schedule */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CalendarRange className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Schedule</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelBase} htmlFor="departureDateTime">Departure</label>
                  <input id="departureDateTime" type="datetime-local" name="departureDateTime" value={form.departureDateTime} onChange={onChange} className={inputBase} />
                </div>
                <div>
                  <label className={labelBase} htmlFor="plannedReturnAt">Planned Return</label>
                  <input id="plannedReturnAt" type="datetime-local" name="plannedReturnAt" value={form.plannedReturnAt} onChange={onChange} className={inputBase} />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelBase} htmlFor="actualReturnAt">Actual Return (optional)</label>
                  <input id="actualReturnAt" type="datetime-local" name="actualReturnAt" value={form.actualReturnAt} onChange={onChange} className={inputBase} />
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    Set this when the boat returns. The backend will derive status.{" "}
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={12} /> Current status: {status || "—"}
                    </span>
                  </p>
                </div>
              </div>
            </section>

            <hr className={divider} />

            {/* Notes */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Notes</h3>
              </div>
              <textarea name="specialNotes" placeholder="Any special instructions or notes…" value={form.specialNotes} onChange={onChange} className={`${inputBase} min-h-[120px]`} />
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => navigate("/admin/trip")} className={cancelBtn}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className={submitBtn}>
                {isSubmitting ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {isSubmitting ? "Saving…" : "Update Trip"}
              </button>
            </div>
          </form>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

function toInputDT(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
