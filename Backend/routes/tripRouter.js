import express from 'express';
import {
  createTrip,
  deleteTrip,
  getTrip,
  getTripById,
  updateTrip
} from '../controllers/tripController.js';

const tripRouter = express.Router();

// /api/trip
tripRouter.post('/', createTrip);
tripRouter.get('/', getTrip);

// /api/trip/:tripId
tripRouter.get('/:tripId', getTripById);
tripRouter.put('/:tripId', updateTrip);
tripRouter.delete('/:tripId', deleteTrip);

export default tripRouter;
