import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import {
  Save, Loader, ChevronLeft, CalendarClock, Ship, UserCircle2, Users, MapPin, CalendarRange, ClipboardList, AlertTriangle,
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


  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState([]);

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

  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const headers = useMemo(() => ({ Authorization: "Bearer " + token }), [token]);

  const idOf = (x) =>
    typeof x === "string" ? x : (x && (x._id || x.id)) ? String(x._id || x.id) : "";

  const nameOfFisherman = (u) => {
    if (!u || typeof u !== "object") return String(u || "");
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return full || u.email || idOf(u) || "";
  };

  const isReadOnly = status === "completed" || status === "cancelled";
  const isOngoing = status === "ongoing";
  const isUpcoming = status === "upcoming";

  const ensureSkipperPresent = (list, skipperId, skipperObj) => {
    if (!skipperId) return list;
    const exists = list.some((u) => String(u._id) === String(skipperId));
    if (exists) return list;
    const label = skipperObj ? nameOfFisherman(skipperObj) : skipperId;
    return [{ _id: skipperId, firstName: label }, ...list];
    // minimal inject so the current value renders even if filtered out
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

  /*  load trip + lookups  */
  useEffect(() => {
    (async () => {
      try {
        const t = await axios.get(`/api/trip/${encodeURIComponent(tripId)}`, { headers });
        const trip = t.data?.trip || t.data;
        if (!trip) {
          toast.error("Trip not found");
          setLoading(false);
          return;
        }

        setStatus(trip.status || "upcoming");

        const skipperObj = trip.skipper || trip.captain || null;
        const skipperId = idOf(skipperObj);
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
  }, [tripId, headers]);

  /*  handlers & validation  */
  function onChange(e) {
    const { name, value } = e.target;

    if (isReadOnly) return;

    if (name === "departureDateTime") {
      if (!isUpcoming) {
        // departure edit only allowed in upcoming state
        return;
      }
      const departureDate = new Date(value);
      const now = new Date();
      if (departureDate < now) {
        toast.error("Departure date cannot be in the past");
        return;
      }
      const plannedReturnDate = new Date(departureDate);
      plannedReturnDate.setDate(plannedReturnDate.getDate() + 30);
      const formattedReturn = plannedReturnDate.toISOString().slice(0, 16);

      setForm((prev) => ({
        ...prev,
        departureDateTime: value,
        plannedReturnAt: formattedReturn,
      }));
    } else if (name === "actualReturnAt") {
      if (!isOngoing && status !== "completed") {
        // actual return is only meaningful while ongoing or viewing a completed trip
        return setForm((prev) => ({ ...prev, [name]: value }));
      }
      if (value) {
        const actualReturn = new Date(value);
        const departure = new Date(form.departureDateTime);
        if (actualReturn < departure) {
          toast.error("Actual return cannot be before departure date");
          return;
        }
      }
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      if (isOngoing) return; 
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function onFishermenChange(e) {
    if (isReadOnly || isOngoing) return;
    const values = Array.from(e.target.selectedOptions).map((o) => String(o.value));
    setForm((prev) => ({ ...prev, fishermen: values }));
  }

  function validate() {
    if (isReadOnly) return "Cannot edit completed or cancelled trips";

    if (isOngoing) {
      if (!form.actualReturnAt) return "Actual return date is required to complete the trip";
      const actualReturn = new Date(form.actualReturnAt);
      const departure = new Date(form.departureDateTime);
      if (actualReturn < departure) return "Actual return cannot be before departure date";
      return null;
    }

    // Upcoming/other editable cases
    if (!form.boat) return "Select a boat";
    if (!form.skipper) return "Select a skipper";
    if (!form.fishermen.length) return "Choose at least one fisherman";
    if (!form.departureDateTime) return "Departure date/time is required";
    if (!form.plannedReturnAt) return "Planned return is required";

    const departure = new Date(form.departureDateTime);
    const plannedReturn = new Date(form.plannedReturnAt);
    const now = new Date();

    if (departure < now) return "Departure date cannot be in the past";
    if (plannedReturn <= departure) return "Return must be after departure";

    const maxReturnDate = new Date(departure);
    maxReturnDate.setDate(maxReturnDate.getDate() + 30);
    if (plannedReturn > maxReturnDate) return "Return date cannot be more than 30 days after departure";

    if (!form.destination.trim()) return "Destination is required";
    if (!form.tripType.trim()) return "Trip type is required";

    if (conflicts.length > 0) return "Boat/crew not available for this time window";
    return null;
  }

  /* ---------------- LIVE AVAILABILITY (upcoming only) ---------------- */
  useEffect(() => {
    if (!isUpcoming) {
      setConflicts([]);
      return;
    }
    const { boat, skipper, fishermen, departureDateTime, plannedReturnAt } = form;
    if (!boat || !skipper || !departureDateTime || !plannedReturnAt) {
      setConflicts([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setChecking(true);
      try {
        const { data } = await axios.post(
          "/api/trip/check-availability",
          {
            boat,
            skipper,                 
            fishermen,
            departureDateTime,
            plannedReturnAt,
            excludeTripId: tripId,   
          },
          { headers }
        );
        if (!cancelled) setConflicts(Array.isArray(data?.conflicts) ? data.conflicts : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error("Availability check failed");
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    run();

    return () => { cancelled = true; };
  }, [
    isUpcoming,
    form.boat,
    form.skipper,
    form.fishermen,
    form.departureDateTime,
    form.plannedReturnAt,
    tripId,
    headers,
  ]);

  /* ---------------- submit ---------------- */
  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setIsSubmitting(true);
    try {
      // For upcoming edits: recheck availability on submit
      if (!isOngoing) {
        const { data: avail } = await axios.post(
          "/api/trip/check-availability",
          {
            boat: form.boat,
            skipper: form.skipper,
            fishermen: form.fishermen,
            departureDateTime: form.departureDateTime,
            plannedReturnAt: form.plannedReturnAt,
            excludeTripId: tripId,
          },
          { headers }
        );
        if (!avail?.ok) {
          setConflicts(Array.isArray(avail?.conflicts) ? avail.conflicts : []);
          throw new Error("Boat/crew not available for this time window");
        }
      }

      const payload = {
        ...form,
        boat: String(form.boat),
        skipper: String(form.skipper),
        fishermen: form.fishermen.map(String),
        departureDateTime: new Date(form.departureDateTime).toISOString(),
        plannedReturnAt: new Date(form.plannedReturnAt).toISOString(),
        actualReturnAt:
          isUpcoming ? undefined : (form.actualReturnAt ? new Date(form.actualReturnAt).toISOString() : undefined),
      };

      await axios.put(`/api/trip/${encodeURIComponent(tripId)}`, payload, { headers });
      toast.success("Trip updated successfully");
      navigate("/admin/trip");
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || e.message || "Update failed";
      toast.error(msg);
      if (e.response?.status === 409 && Array.isArray(e.response?.data?.conflicts)) {
        setConflicts(e.response.data.conflicts);
      }
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

  const readOnlyInputBase = `${inputBase} bg-opacity-50 cursor-not-allowed opacity-70`;
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
  const disabledSubmitBtn = `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow ${
    darkMode ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-slate-300 text-slate-500 cursor-not-allowed"
  }`;

  const minDepartureDate = new Date().toISOString().slice(0, 16);
  const minActualReturnDate = form.departureDateTime;

  return (
    <div className={pageWrap}>
      <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/admin/trip" className={backBtn}><ChevronLeft size={16} /> Back to Trips</Link>
          <span className={statusPill}>Status: {status || "—"}</span>
        </div>

        {isReadOnly && (
          <div className={`mb-4 p-4 rounded-xl border ${
            darkMode ? "bg-amber-900/20 border-amber-700 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <div className="flex items-center gap-2">
              <CalendarClock size={16} />
              <span className="font-medium">Read-only Mode</span>
            </div>
            <p className="text-sm mt-1">This trip is {status} and cannot be edited.</p>
          </div>
        )}

        {isOngoing && (
          <div className={`mb-4 p-4 rounded-xl border ${
            darkMode ? "bg-blue-900/20 border-blue-700 text-blue-200" : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            <div className="flex items-center gap-2">
              <CalendarClock size={16} />
              <span className="font-medium">Ongoing Trip</span>
            </div>
            <p className="text-sm mt-1">You can only update the actual return date. Setting this will mark the trip as completed.</p>
          </div>
        )}

        <div className={cardWrap}>
          <div className="mb-6">
            <h2 className={h2Cls}>Edit Trip <span className={`font-mono text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{tripId}</span></h2>
            <p className={subCls}>
              {isReadOnly ? "Viewing trip details (read-only)" :
               isOngoing ? "Update actual return date only" :
               "Update the details below and save your changes."}
            </p>
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
                  <input
                    id="tripId"
                    name="tripId"
                    value={form.tripId}
                    readOnly
                    className={`${inputBase} ${darkMode ? "bg-slate-900/40" : "bg-slate-50"} font-mono cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className={labelBase} htmlFor="tripType">Trip Type</label>
                  <select
                    id="tripType"
                    name="tripType"
                    value={form.tripType}
                    onChange={onChange}
                    disabled={isReadOnly || isOngoing}
                    className={isReadOnly || isOngoing ? readOnlyInputBase : inputBase}
                  >
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
                  <input
                    id="destination"
                    name="destination"
                    placeholder="e.g., Offshore Zone 4B"
                    value={form.destination}
                    onChange={onChange}
                    disabled={isReadOnly || isOngoing}
                    className={isReadOnly || isOngoing ? readOnlyInputBase : inputBase}
                  />
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
                  <select
                    id="boat"
                    name="boat"
                    value={form.boat}
                    onChange={onChange}
                    disabled={isReadOnly || isOngoing}
                    className={isReadOnly || isOngoing ? readOnlyInputBase : inputBase}
                  >
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
                  <select
                    id="skipper"
                    name="skipper"
                    value={form.skipper}
                    onChange={onChange}
                    disabled={isReadOnly || isOngoing}
                    className={isReadOnly || isOngoing ? readOnlyInputBase : inputBase}
                  >
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
                  <select
                    id="fishermen"
                    multiple
                    value={form.fishermen}
                    onChange={onFishermenChange}
                    disabled={isReadOnly || isOngoing}
                    className={`${isReadOnly || isOngoing ? readOnlyInputBase : inputBase} h-40`}
                  >
                    {fishermen.map((u) => (
                      <option key={u._id} value={u._id}>
                        {nameOfFisherman(u)}{u.email ? ` — ${u.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {isReadOnly || isOngoing
                      ? "Selection disabled for this trip status"
                      : "Hold Ctrl (Windows) or Cmd (Mac) to select multiple."}
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
                  <input
                    id="departureDateTime"
                    type="datetime-local"
                    name="departureDateTime"
                    value={form.departureDateTime}
                    onChange={onChange}
                    min={minDepartureDate}
                    disabled={isReadOnly || isOngoing}
                    className={isReadOnly || isOngoing ? readOnlyInputBase : inputBase}
                  />
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {isReadOnly || isOngoing ? "Cannot edit departure date" : "Cannot be in the past"}
                  </p>
                </div>
                <div>
                  <label className={labelBase} htmlFor="plannedReturnAt">Planned Return</label>
                  <input
                    id="plannedReturnAt"
                    type="datetime-local"
                    name="plannedReturnAt"
                    value={form.plannedReturnAt}
                    readOnly
                    className={`${inputBase} bg-opacity-50 cursor-not-allowed`}
                  />
                  <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Automatically set to 30 days after departure
                  </p>
                </div>
              </div>

              {/* Ongoing/Completed: actual return */}
              {(isOngoing || status === "completed") && (
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelBase} htmlFor="actualReturnAt">
                      Actual Return {isOngoing && <span className="text-blue-500">*</span>}
                    </label>
                    <input
                      id="actualReturnAt"
                      type="datetime-local"
                      name="actualReturnAt"
                      value={form.actualReturnAt}
                      onChange={onChange}
                      min={minActualReturnDate}
                      disabled={isReadOnly}
                      className={isReadOnly ? readOnlyInputBase : inputBase}
                    />
                    <p className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                      {isOngoing ? "Set the actual return date (must be after departure)" : "Actual return date (read-only)"}{" "}
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={12} /> Current status: {status || "—"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Availability result (only for upcoming & when inputs present) */}
              {isUpcoming && form.boat && form.skipper && form.departureDateTime && form.plannedReturnAt && (
                checking ? (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm ring-1 ${darkMode ? "bg-slate-800 text-slate-300 ring-slate-700" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                    Checking availability…
                  </div>
                ) : conflicts.length > 0 ? (
                  <div className={`mt-3 rounded-xl px-3 py-3 text-sm ring-1 ${darkMode ? "bg-rose-900/30 text-rose-200 ring-rose-800" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Conflicts found — cannot save these changes:
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {conflicts.map((c) => {
                        const boat = c.boat?.name || c.boat?.boatName || c.boat?.boatNumber || c.boat?.registrationNumber || c.boat || "Boat";
                        const skipper = c.skipper?.firstName || c.skipper?.lastName
                          ? `${c.skipper?.firstName || ""} ${c.skipper?.lastName || ""}`.trim()
                          : c.skipper?.email || "Skipper";
                        const dep = new Date(c.departureDateTime).toLocaleString();
                        const ret = new Date(c.plannedReturnAt).toLocaleString();
                        return (
                          <li key={c.tripId}>
                            Trip <b>{c.tripId}</b> — {boat}; Skipper: {skipper}; {dep} → {ret}; Status: {c.status}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm ring-1 ${darkMode ? "bg-emerald-900/30 text-emerald-200 ring-emerald-800" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
                    Boat, skipper & crew are available for this time window.
                  </div>
                )
              )}
            </section>

            {/* Notes */}
            <hr className={divider} />
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className={`h-5 w-5 ${darkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                <h3 className={sectionTitle}>Notes</h3>
              </div>
              <textarea
                name="specialNotes"
                placeholder="Any special instructions or notes…"
                value={form.specialNotes}
                onChange={onChange}
                disabled={isReadOnly || isOngoing}
                className={`${isReadOnly || isOngoing ? readOnlyInputBase : inputBase} min-h-[120px]`}
              />
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => navigate("/admin/trip")} className={cancelBtn}>Cancel</button>
              {isReadOnly ? (
                <button type="button" disabled className={disabledSubmitBtn}>
                  Read-only Mode
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || (isUpcoming && (checking || conflicts.length > 0))}
                  className={submitBtn}
                >
                  {isSubmitting ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                  {isSubmitting ? "Saving…" : isOngoing ? "Update Return Date" : "Update Trip"}
                </button>
              )}
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
