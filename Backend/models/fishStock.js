import mongoose from 'mongoose';

const fishStockSchema = new mongoose.Schema({
  stockId: {
    type: Number,
    unique: true,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['Balaya', ' Tuna', 'Salaya', 'Bolla'],
    default: 'Balaya'
  },
  weight: {
    type: Number,
    required: true,
    min: 0
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
  }
}, {
  timestamps: true
});

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