import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DepthSensor({ darkMode }) {
  const [depthData, setDepthData] = useState([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  // Use port 3000 for backend
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Fetch depth data from your backend
  const fetchDepthData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/depth/latest`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentDepth(data.depth);
        setIsConnected(data.isConnected);
        setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
        
        // Add to historical data for chart
        const newDataPoint = {
          time: new Date().toLocaleTimeString(),
          depth: data.depth,
          timestamp: new Date()
        };
        
        setDepthData(prev => {
          const updated = [...prev, newDataPoint];
          return updated.slice(-20);
        });
      }
    } catch (error) {
      console.error('Error fetching depth data:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    fetchDepthData();
    const interval = setInterval(fetchDepthData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/depth/test`);
      const data = await response.json();
      console.log('Backend test:', data);
      alert(`Backend connection: ${data.message}`);
    } catch (error) {
      console.error('Backend connection failed:', error);
      alert('Backend connection failed. Check if server is running.');
    }
  };

  // Calculate depth status
  const getDepthStatus = (depth) => {
    if (depth < 50) return { status: 'Shallow', color: 'text-green-500' };
    if (depth < 100) return { status: 'Moderate', color: 'text-yellow-500' };
    return { status: 'Deep', color: 'text-red-500' };
  };

  const depthStatus = getDepthStatus(currentDepth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Depth Sensor Monitoring
          </h2>
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Real-time water depth measurements from ultrasonic sensor
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={testBackendConnection}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 text-sm"
          >
            Test Backend
          </button>
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Depth Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${
          darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Current Depth
            </h3>
            <div className={`text-2xl font-bold ${depthStatus.color}`}>
              {currentDepth.toFixed(1)} cm
            </div>
          </div>
          <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Status: <span className={depthStatus.color}>{depthStatus.status}</span>
          </p>
          {lastUpdate && (
            <p className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Updated: {lastUpdate}
            </p>
          )}
        </div>

        <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${
          darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
        }`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Backend Status
          </h3>
          <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {BACKEND_URL}
          </p>
          <button 
            onClick={fetchDepthData}
            disabled={loading}
            className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${
          darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
        }`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Data Points
          </h3>
          <p className={`mt-2 text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {depthData.length}
          </p>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            readings in memory
          </p>
        </div>
      </div>

      {/* Depth Chart */}
      <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${
        darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Real-time Depth Chart
        </h3>
        <div className="h-80">
          {depthData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={depthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="depthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="time" 
                  stroke={darkMode ? '#cbd5e1' : '#64748b'}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={darkMode ? '#cbd5e1' : '#64748b'}
                  label={{ 
                    value: 'Depth (cm)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: darkMode ? '#cbd5e1' : '#64748b' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: darkMode ? '#1e293b' : '#fff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#e2e8f0' : '#000'
                  }}
                  formatter={(value) => [`${value} cm`, 'Depth']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="depth" 
                  stroke="#06b6d4" 
                  fill="url(#depthGradient)" 
                  name="Depth (cm)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No depth data available yet. Waiting for sensor data...
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className={`rounded-2xl p-6 shadow ring-1 backdrop-blur ${
        darkMode ? 'bg-slate-800/90 ring-slate-700' : 'bg-white/80 ring-slate-100'
      }`}>
      
        
      </div>
    </div>
  );
}