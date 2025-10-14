import mongoose from 'mongoose';

const fishStockSchema = new mongoose.Schema({
  stockId: {
    type: Number,
    unique: true,
    required: false
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["fish", "crab", "shellfish", "prawn", "lobster", "squid", "other"],
    default: 'fish'
  },
  weight: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    default: "kg",
    enum: ["kg", "g", "lbs", "pieces"]
  },
  quality: {
    type: String,
    required: true,
    enum: ['Premium', 'Grade A', 'Grade B', 'Grade C'],
    default: 'Grade A'
  },
  catchDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'addedByModel'
  },
  addedByModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Fisherman']
  },
  // New fields for soft updates
  isActive: {
    type: Boolean,
    default: true
  },
  updateHistory: [{
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'updateHistory.updatedByModel'
    },
    updatedByModel: {
      type: String,
      required: true,
      enum: ['Admin', 'Fisherman']
    },
    updateComment: {
      type: String,
      required: true,
      trim: true
    },
    previousData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed // Use Map instead of fixed fields
    },
    newData: {
      type: Map, 
      of: mongoose.Schema.Types.Mixed // Use Map instead of fixed fields
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Alternative schema if Map doesn't work - use Mixed type
// updateHistory: [{
//   updatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     refPath: 'updateHistory.updatedByModel'
//   },
//   updatedByModel: {
//     type: String,
//     required: true,
//     enum: ['Admin', 'Fisherman']
//   },
//   updateComment: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   previousData: mongoose.Schema.Types.Mixed, // Use Mixed type
//   newData: mongoose.Schema.Types.Mixed, // Use Mixed type
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// }]

// auto-increment stockId
fishStockSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const FishStockModel = mongoose.model('FishStock');
      const lastStock = await FishStockModel.findOne().sort({ stockId: -1 }).exec();
      this.stockId = lastStock ? lastStock.stockId + 1 : 1;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const FishStock = mongoose.model('FishStock', fishStockSchema);

export default FishStock;