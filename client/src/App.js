import React, { useState, useEffect } from 'react';
import { testConnection, testDatabase } from './services/api';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [dbStatus, setDbStatus] = useState('Checking...');

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const backendRes = await testConnection();
      setBackendStatus(backendRes.message);
      
      const dbRes = await testDatabase();
      setDbStatus(`Connected! ${dbRes.timestamp}`);
    } catch (error) {
      setBackendStatus('Backend not connected');
      setDbStatus('Database not connected');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          Ride-Share Database App
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <p><strong>Backend:</strong> {backendStatus}</p>
            <p><strong>Database:</strong> {dbStatus}</p>
          </div>
          <button 
            onClick={checkConnections}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;