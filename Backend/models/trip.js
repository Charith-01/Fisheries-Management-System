// models/trip.js
import mongoose from 'mongoose';

   
function deriveStatus({ departureDateTime, plannedReturnAt, actualReturnAt }) {
  const now = Date.now();
  const dep  = departureDateTime ? new Date(departureDateTime).getTime() : null;
  const plan = plannedReturnAt   ? new Date(plannedReturnAt).getTime()   : null;
  const act  = actualReturnAt    ? new Date(actualReturnAt).getTime()    : null;

  if (act) return 'completed';
  if (dep == null || plan == null) return 'upcoming';
  if (now < dep) return 'upcoming';
  if (now >= dep && now <= plan) return 'ongoing';
  return 'overdue';
}

const tripSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, unique: true },

    boat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Boat',
      required: true,
    },

    
    skipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fisherman',
      required: true,
    },

    
    fishermen: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fisherman',
        required: true,
      },
    ],

    departureDateTime: { type: Date, required: true },
    plannedReturnAt:   { type: Date, required: true },
    actualReturnAt:    { type: Date }, // optional

    destination: { type: String, required: true },
    tripType:    { type: String, required: true },
    specialNotes:{ type: String },

    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'overdue', 'cancelled'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

tripSchema.statics.deriveStatus = deriveStatus;

tripSchema.pre('save', function (next) {
  if (this.status === 'cancelled' || this.status === 'completed') return next();
  this.status = deriveStatus(this);
  next();
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
