import Trip from "../models/trip.js";

export async function createTrip(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to login first"
    });
    return;
  }

  if (req.user.role != "admin") {
    res.status(403).json({
      message: "You are not authorized to create trip"
    });
    return;
  }

  const trip = new Trip(req.body);

  try {
    await trip.save();
    res.json({
      message: "Trip saved successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: "Trip not saved"
    });
  }
}

export function getTrip(req, res) {
  Trip.find()
    .then((trips) => {
      res.json(trips);
    })
    .catch((err) => {
      res.status(500).json({
        message: "Trips not found"
      });
    });
}

export function deleteTrip(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to login first"
    });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      message: "You are not authorized to delete trip"
    });
    return;
  }

  Trip.findOneAndDelete({
    tripId: req.params.tripId
  })
    .then(() => {
      res.json({
        message: "Trip deleted successfully"
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Trip not deleted"
      });
    });
}

export function updateTrip(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need to login first"
    });
    return;
  }

  if (req.user.role != "admin") {
    res.status(403).json({
      message: "You are not authorized to update trip"
    });
    return;
  }

  Trip.findOneAndUpdate(
    {
      tripId: req.params.tripId
    },
    req.body
  )
    .then(() => {
      res.json({
        message: "Trip updated successfully"
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Trip not updated"
      });
    });
}
