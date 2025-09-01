import express from 'express';
import { createTrip, deleteTrip, getTrip, updateTrip } from '../controllers/tripController.js';

const tripRouter = express.Router();

tripRouter.post('/', createTrip);
tripRouter.get("/",getTrip)
tripRouter.delete("/:tripId", deleteTrip)
tripRouter.put("/:tripId",updateTrip)

export default tripRouter;