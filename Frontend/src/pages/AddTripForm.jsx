import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import {
  Save, Loader, CalendarClock, ChevronLeft, Ship, UserCircle2, Users, MapPin, CalendarRange, ClipboardList
} from "lucide-react";

export default function AddTripForm({ darkMode = false }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boats, setBoats] = useState([]);
  const [skippers, setSkippers] = useState([]);   
  const [fishermen, setFishermen] = useState([]);  

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
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: "Bearer " + token };

    (async () => {
      try {
        const [b, s, f] = await Promise.allSettled([
          axios.get("/api/boat", { headers }),
          axios.get("/api/fisherman?position=skipper", { headers }),
          axios.get("/api/fisherman?position=crew", { headers }),
        ]);
        if (b.status === "fulfilled") setBoats(b.value.data || []);
        if (s.status === "fulfilled") setSkippers(s.value.data || []);
        if (f.status === "fulfilled") setFishermen(f.value.data || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load dropdowns");
      }
    })();
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }
  function onFishermenChange(e) {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setForm((prev) => ({ ...prev, fishermen: values }));
  }

  function validate() {
    if (!form.tripId.trim()) return "Trip ID is required";
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

  const statusPreview = useMemo(() => {
    const dep = form.departureDateTime ? new Date(form.departureDateTime).getTime() : null;
    const ret = form.plannedReturnAt ? new Date(form.plannedReturnAt).getTime() : null;
    const now = Date.now();
    if (!dep || !ret) return "—";
    if (now < dep) return "upcoming";
    if (now >= dep && now <= ret) return "ongoing";
    if (now > ret) return "overdue";
    return "upcoming";
  }, [form.departureDateTime, form.plannedReturnAt]);

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
        departureDateTime: new Date(form.departureDateTime).toISOString(),
        plannedReturnAt: new Date(form.plannedReturnAt).toISOString(),
      };
      await axios.post("/api/trip", payload, { headers });
      toast.success("Trip created");
      navigate("/admin/trip");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || "Create failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase = `${
    darkMode
      ? "border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus:ring-cyan-400 focus:border-cyan-400"
      : "border-slate-200 bg-white/60 text-slate-800 placeholder:text-slate-400 focus:ring-cyan-500 focus:border-cyan-500"
  } w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none transition`;
  const labelBase = `text-sm font-medium mb-1 flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-700"}`;
  const pageWrap = `flex justify-center mt-10 px-4 ${darkMode ? "text-slate-100" : "text-slate-800"}`;
  const cardWrap = `rounded-2xl border p-6 shadow-xl backdrop-blur ${darkMode ? "border-slate-700 bg-slate-800/90" : "border-slate-200 bg-white/80"}`;
  const backBtn = `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm ${
    darkMode ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white/70 text-slate-700 hover:bg-white"
  }`;
  const statusPill = `text-xs rounded-full px-2.5 py-1 font-medium shadow ${
    darkMode ? "bg-sky-900/50 text-sky-200" : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
  }`;
  const h2Cls = `text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`;
  const subCls = `text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`;
  const sectionTitle = `text-base font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`;
  const infoBar = `mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
    darkMode ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"
  }`;
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
          <Link to="/admin/trip" className={backBtn}>
            <ChevronLeft size={16} /> Back to Trips
          </Link>
          <div className="flex items-center gap-2">
            <span className={statusPill}>Status preview: {statusPreview}</span>
          </div>
        </div>

        <div className={cardWrap}>
          <div className="mb-6">
            <h2 className={h2Cls}>Create Trip</h2>
            <p className={subCls}>Fill in the details below to schedule a new trip.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Trip Details</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelBase} htmlFor="tripId">Trip ID</label>
                  <input id="tripId" name="tripId" placeholder="e.g., TRIP-2025-0004" value={form.tripId} onChange={onChange} className={`${inputBase} font-mono uppercase`} />
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Use a unique identifier you can look up later.</p>
                </div>

                <div>
                  <label className={labelBase} htmlFor="tripType">Trip Type</label>
                  <select id="tripType" name="tripType" value={form.tripType} onChange={onChange} className={inputBase}>
                    <option>Fishing Trip</option><option>Sightseeing</option><option>Private Charter</option><option>Other</option>
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
                        {[u.firstName, u.lastName].filter(Boolean).join(" ")} {u.email ? `— ${u.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelBase} htmlFor="fishermen">Fishermen</label>
                  <select id="fishermen" multiple value={form.fishermen} onChange={onFishermenChange} className={`${inputBase} h-40`}>
                    {fishermen.map((u) => (
                      <option key={u._id} value={u._id}>
                        {[u.firstName, u.lastName].filter(Boolean).join(" ")} {u.email ? `— ${u.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Hold <span className="font-medium">Ctrl</span> (Windows) or <span className="font-medium">Cmd</span> (Mac) to select multiple.
                  </p>
                </div>
              </div>
            </section>

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

              <div className={infoBar}>
                <CalendarClock size={14} className="shrink-0" />
                Status is automatically derived from the dates you pick.
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Notes</h3>
              </div>
              <textarea name="specialNotes" placeholder="Any special instructions or notes…" value={form.specialNotes} onChange={onChange} className={`${inputBase} min-h-[120px]`} />
            </section>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => navigate("/admin/trip")} className={cancelBtn}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className={submitBtn}>
                {isSubmitting ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {isSubmitting ? "Saving…" : "Create Trip"}
              </button>
            </div>
          </form>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
