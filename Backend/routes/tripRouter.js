import express from 'express';
import userAuth from "../middleware/userAuth.js";
import verifyJWT from '../middleware/auth.js';
import {
  createTrip,
  deleteTrip,
  getTrip,
  getTripById,
  updateTrip,
  getMyTrips,
  checkTripAvailability
} from '../controllers/tripController.js';

const tripRouter = express.Router();

tripRouter.post('/check-availability', verifyJWT, checkTripAvailability);
tripRouter.get("/my", userAuth, getMyTrips);

// /api/trip
tripRouter.post('/', verifyJWT, createTrip);
tripRouter.get('/', verifyJWT, getTrip);

// /api/trip/:tripId
tripRouter.get('/:tripId', verifyJWT, getTripById);
tripRouter.put('/:tripId', verifyJWT, updateTrip);
tripRouter.delete('/:tripId', verifyJWT, deleteTrip)

export default tripRouter;
