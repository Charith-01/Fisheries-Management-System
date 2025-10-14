// controllers/tripController.js
import Trip from "../models/trip.js";
import Notification from "../models/notification.js";
import mongoose from "mongoose";

/* ---------------- Broadcast notification helper ---------------- */
const createTripNotification = async (trip) => {
  try {
    const boatName =
      trip.boat?.name ||
      trip.boat?.boatName ||
      trip.boat?.boatNumber ||
      trip.boat?.registrationNumber ||
      trip.boat ||
      "Unknown Boat";

    const departureDate = trip.departureDateTime
      ? new Date(trip.departureDateTime).toLocaleDateString()
      : "TBD";
    const returnDate = trip.plannedReturnAt
      ? new Date(trip.plannedReturnAt).toLocaleDateString()
      : "To be determined";

    const notificationData = {
      title: `New Fishing Trip Scheduled - ${boatName}`,
      message: `New fishing trip on boat ${boatName} scheduled for ${departureDate}. Planned return: ${returnDate}. Trip ID: ${trip.tripId || trip._id}`,
      role: "fisherman",
      isReadBy: [],
    };

    await Notification.create(notificationData);
    console.log("Broadcast trip notification created for all fishermen");
  } catch (error) {
    console.error("Error creating trip notification:", error);
  }
};

/* ---------------- Scheduling conflict helpers ---------------- */

function overlaps(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  
  return aS < bE && bS < aE;
}

async function findConflictingTrips({
  boat,
  skipper,
  fishermen = [],
  dep,
  ret,
  excludeTripId = null,
}) {
  // Only consider active-ish trips (not completed/cancelled)
  const baseQuery = {
    status: { $nin: ["completed", "cancelled"] },
    $or: [
      { boat },                             
      { skipper },                         
      { fishermen: { $in: fishermen || [] } }, 
    ],
  };

  if (excludeTripId) {
    baseQuery.tripId = { $ne: excludeTripId };
  }

  // Coarse pre-filter by time window to shrink results
  const preFilter = {
    ...baseQuery,
    departureDateTime: { $lt: new Date(ret) },
    plannedReturnAt: { $gt: new Date(dep) },
  };

  const rows = await Trip.find(preFilter)
    .select(
      "tripId boat skipper fishermen departureDateTime plannedReturnAt status"
    )
    .populate("boat", "name boatName boatNumber registrationNumber")
    .populate("skipper", "firstName lastName email")
    .populate("fishermen", "firstName lastName email")
    .lean();

  // Precise overlap check
  return rows.filter((t) =>
    overlaps(t.departureDateTime, t.plannedReturnAt, dep, ret)
  );
}

/* ---------------- Availability endpoint ---------------- */

export async function checkTripAvailability(req, res) {
  try {
    const {
      boat,
      skipper,
      fishermen = [],
      departureDateTime,
      plannedReturnAt,
      excludeTripId,
    } = req.body || {};
    if (!boat || !skipper || !departureDateTime || !plannedReturnAt) {
      return res.status(400).json({
        message:
          "boat, skipper, departureDateTime and plannedReturnAt are required",
      });
    }

    const conflicts = await findConflictingTrips({
      boat,
      skipper,
      fishermen,
      dep: departureDateTime,
      ret: plannedReturnAt,
      excludeTripId: excludeTripId || null,
    });

    return res.json({
      ok: conflicts.length === 0,
      conflicts,
    });
  } catch (err) {
    console.error("checkTripAvailability error:", err);
    return res.status(500).json({ message: "Availability check failed" });
  }
}

/* ---------------- CRUD ---------------- */

export async function createTrip(req, res) {
  if (!req.user)
    return res.status(403).json({ message: "You need to login first" });
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "You are not authorized to create trip" });

  try {
    const body = req.body || {};
    const {
      boat,
      skipper,
      fishermen = [],
      departureDateTime,
      plannedReturnAt,
    } = body;

    // Basic required fields (skipper is required by schema as well)
    if (!boat || !skipper || !departureDateTime || !plannedReturnAt) {
      return res.status(400).json({
        message:
          "boat, skipper, departureDateTime and plannedReturnAt are required",
      });
    }

    // Conflict check (boat + skipper + any fisherman)
    const conflicts = await findConflictingTrips({
      boat,
      skipper,
      fishermen,
      dep: departureDateTime,
      ret: plannedReturnAt,
      excludeTripId: null,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message:
          "Boat, skipper or one/more fishermen are already assigned to another overlapping trip.",
        conflicts,
      });
    }

    // Derive status unless explicitly set to cancelled/completed
    if (body.status !== "cancelled" && body.status !== "completed") {
      body.status = Trip.deriveStatus({
        departureDateTime: body.departureDateTime,
        plannedReturnAt: body.plannedReturnAt,
        actualReturnAt: body.actualReturnAt,
      });
    }

    const trip = new Trip(body);
    await trip.save();

    // Fire-and-forget notification
    createTripNotification(trip).catch((e) =>
      console.error("Notification error:", e)
    );

    res.json({ message: "Trip saved successfully", trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Trip not saved" });
  }
}

export async function getTrip(req, res) {
  try {
    try {
      const trips = await Trip.find()
        .populate("boat")
        .populate("skipper")
        .populate("fishermen")
        .sort({ departureDateTime: -1 })
        .lean();
      return res.json(trips);
    } catch (populateErr) {
      const trips = await Trip.find().sort({ departureDateTime: -1 }).lean();
      return res.json(trips);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Trips not found" });
  }
}

export async function getTripById(req, res) {
  try {
    const { tripId } = req.params;
    try {
      const trip = await Trip.findOne({ tripId })
        .populate("boat")
        .populate("skipper")
        .populate("fishermen")
        .lean();
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      return res.json(trip);
    } catch (populateErr) {
      const trip = await Trip.findOne({ tripId }).lean();
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      return res.json(trip);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Error fetching trip" });
  }
}

export async function updateTrip(req, res) {
  if (!req.user)
    return res.status(403).json({ message: "You need to login first" });
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "You are not authorized to update trip" });

  try {
    const { tripId } = req.params;
    const existing = await Trip.findOne({ tripId });
    if (!existing) return res.status(404).json({ message: "Trip not found" });

    // Determine intended next values
    const nextDoc = {
      departureDateTime:
        req.body.departureDateTime ?? existing.departureDateTime,
      plannedReturnAt: req.body.plannedReturnAt ?? existing.plannedReturnAt,
      actualReturnAt: req.body.actualReturnAt ?? existing.actualReturnAt,
      boat: req.body.boat ?? existing.boat,
      skipper: req.body.skipper ?? existing.skipper,
      fishermen: req.body.fishermen ?? existing.fishermen,
    };

    // Conflict check excluding this trip
    const conflicts = await findConflictingTrips({
      boat: nextDoc.boat,
      skipper: nextDoc.skipper,
      fishermen: Array.isArray(nextDoc.fishermen) ? nextDoc.fishermen : [],
      dep: nextDoc.departureDateTime,
      ret: nextDoc.plannedReturnAt,
      excludeTripId: tripId,
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message:
          "Boat, skipper or one/more fishermen are already assigned to another overlapping trip.",
        conflicts,
      });
    }

    let nextStatus = req.body.status;
    if (nextStatus !== "cancelled" && nextStatus !== "completed") {
      nextStatus = Trip.deriveStatus(nextDoc);
    }

    const update = { ...req.body, status: nextStatus };

    const updated = await Trip.findOneAndUpdate({ tripId }, update, {
      runValidators: true,
      new: true,
    }).lean();

    res.json({ message: "Trip updated successfully", trip: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Trip not updated" });
  }
}

export async function deleteTrip(req, res) {
  if (!req.user)
    return res.status(403).json({ message: "You need to login first" });
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "You are not authorized to delete trip" });

  try {
    await Trip.findOneAndDelete({ tripId: req.params.tripId });
    res.json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Trip not deleted" });
  }
}

/* ---------------- Current user's trips ---------------- */

export async function getMyTrips(req, res) {
  if (!req.user)
    return res.status(403).json({ message: "You need to login first" });

  try {
    const rawId = req.user._id || req.user.id || req.user.sub;
    const userId = mongoose.Types.ObjectId.isValid(rawId)
      ? new mongoose.Types.ObjectId(rawId)
      : rawId;

    const query = {
      $or: [
        { skipper: userId },
        { captain: userId }, 
        { fishermen: userId },
        { assignedTo: userId }, 
        { createdBy: userId }, 
      ],
    };

    try {
      const trips = await Trip.find(query)
        .populate("boat")
        .populate("skipper")
        .populate("fishermen")
        .sort({ departureDateTime: -1 })
        .lean();

      return res.json(trips);
    } catch (populateErr) {
      const trips = await Trip.find(query).sort({ departureDateTime: -1 }).lean();
      return res.json(trips);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Error fetching your trips" });
  }
}
