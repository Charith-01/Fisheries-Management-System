import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    tripId: {
        type: String,
        required: true,
        unique: true
    },
    // Link to Boat model (reference)
    boat: {
        type: mongoose.Schema.Types.ObjectId, // Boat ID
        ref: 'Boat', // Boat model reference
        required: true
     },

    // Link to User model (Captain reference)
    captain: {
        type: mongoose.Schema.Types.ObjectId, // User (Captain) ID
        ref: 'User', // User model reference
        required: true
    },

    // Link to multiple User models (Fishermen references)
    fishermen: [{
        type: mongoose.Schema.Types.ObjectId, // User (Fisherman) ID
        ref: 'User', // User model reference
        required: true
    }],

    departureDateTime: {
        type: Date,
        required: true
    },
    plannedReturnAt:   { 
        type: Date, 
        required: true 
    }, 
    destination: {
        type: String,
        required: true
    },

    tripType: {
        type: String,
       // enum: ["Fishing Trip", "Sightseeing", "Private Charter"], // fixed values
        required: true
    },
    
    specialNotes: {
        type: String
    }
})

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;