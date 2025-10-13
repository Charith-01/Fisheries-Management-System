import express from 'express';

const router = express.Router();

// In-memory storage
let currentDepth = 0;
let lastUpdate = new Date();

// Test route to verify it's working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Depth sensor API is working!',
    timestamp: new Date()
  });
});

// Get latest depth reading
router.get('/latest', (req, res) => {
  res.json({ 
    success: true, 
    depth: currentDepth,
    timestamp: lastUpdate,
    isConnected: currentDepth > 0
  });
});

// Receive depth data from ESP32
router.post('/data', (req, res) => {
  try {
    const { depth } = req.body;
    
    console.log('Received depth data:', depth);
    
    if (depth === undefined || depth === null) {
      return res.status(400).json({ success: false, error: 'Depth value is required' });
    }

    // Store in memory
    currentDepth = parseFloat(depth);
    lastUpdate = new Date();
    
    console.log(`Depth updated: ${currentDepth} cm at ${lastUpdate}`);
    
    res.json({ 
      success: true, 
      message: 'Depth data received',
      depth: currentDepth
    });
  } catch (error) {
    console.error('Error processing depth data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export as ES6 module
export default router;