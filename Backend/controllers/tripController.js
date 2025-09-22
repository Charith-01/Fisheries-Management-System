import Trip from "../models/trip.js";


export async function createTrip(req, res) {
  if (!req.user) return res.status(403).json({ message: "You need to login first" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "You are not authorized to create trip" });

  try {
    const body = req.body || {};

    
    if (body.status !== 'cancelled' && body.status !== 'completed') {
      body.status = Trip.deriveStatus({
        departureDateTime: body.departureDateTime,
        plannedReturnAt:   body.plannedReturnAt,
        actualReturnAt:    body.actualReturnAt,
      });
    }

    const trip = new Trip(body);
    await trip.save();
    res.json({ message: "Trip saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Trip not saved" });
  }
}


export async function getTrip(req, res) {
  try {
    try {
      const trips = await Trip.find()
        .populate('boat')
        .populate('skipper')
        .populate('fishermen')
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
        .populate('boat')
        .populate('skipper')
        .populate('fishermen')
        .lean();
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      return res.json(trip);
    } catch (populateErr) {
      const trip = await Trip.findOne({ tripId }).lean();
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      return res.json(trip);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || 'Error fetching trip' });
  }
}


export async function updateTrip(req, res) {
  if (!req.user) return res.status(403).json({ message: "You need to login first" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "You are not authorized to update trip" });

  try {
    const { tripId } = req.params;
    const existing = await Trip.findOne({ tripId });
    if (!existing) return res.status(404).json({ message: "Trip not found" });

    const nextDoc = {
      departureDateTime: req.body.departureDateTime ?? existing.departureDateTime,
      plannedReturnAt:   req.body.plannedReturnAt   ?? existing.plannedReturnAt,
      actualReturnAt:    req.body.actualReturnAt    ?? existing.actualReturnAt,
    };

    let nextStatus = req.body.status;
    if (nextStatus !== 'cancelled' && nextStatus !== 'completed') {
      nextStatus = Trip.deriveStatus(nextDoc);
    }

    const update = { ...req.body, status: nextStatus };

    await Trip.findOneAndUpdate({ tripId }, update, { runValidators: true });
    res.json({ message: "Trip updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Trip not updated" });
  }
}

export async function deleteTrip(req, res) {
  if (!req.user) return res.status(403).json({ message: "You need to login first" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "You are not authorized to delete trip" });

  try {
    await Trip.findOneAndDelete({ tripId: req.params.tripId });
    res.json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Trip not deleted" });
  }
}
