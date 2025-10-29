import React, { useState, useEffect } from 'react';
import { testConnection, testDatabase } from './services/api';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [activeTab, setActiveTab] = useState('status');
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const backendRes = await testConnection();
      setBackendStatus(backendRes.message);
      
      const dbRes = await testDatabase();
      setDbStatus(`Connected! ${new Date(dbRes.timestamp).toLocaleString()}`);
    } catch (error) {
      setBackendStatus('Backend not connected');
      setDbStatus('Database not connected');
    }
  };

  const handleInitDatabase = async () => {
    if (!window.confirm('This will DROP all tables and recreate them. Continue?')) {
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/init-database', {
        method: 'POST'
      });
      const data = await response.json();
      setMessage(data.success ? + data.message : + data.error);
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleInsertData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/insert-data', {
        method: 'POST'
      });
      const data = await response.json();
      setMessage(data.success ? data.message : data.error);
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleRunTransaction = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 3,
          driver_id: 2,
          category_id: 2,
          pickup_location_id: 4,
          dropoff_location_id: 12,
          price: 42.00,
          ride_time_minutes: 32
        })
      });
      const data = await response.json();
      setMessage(data.success ? data.message : data.error);
      if (data.success && data.result) {
        setQueryResults(data.result);
      }
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleRunQuery = async (queryType) => {
    setLoading(true);
    setMessage('');
    setQueryResults(null);
    try {
      const response = await fetch(`http://localhost:5000/api/query/${queryType}`);
      const data = await response.json();
      if (data.success) {
        setQueryResults(data.results);
        setMessage(`Query returned ${data.results.length} rows`);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-black-600 mb-2">
            Car Connect
          </h1>
          <p className="text-gray-600">Your Ride Sharing App</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            {['status', 'setup', 'transaction', 'queries'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Status Tab */}
            {activeTab === 'status' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">System Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Backend Server:</span>
                    <span className="text-sm">{backendStatus}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">PostgreSQL Database:</span>
                    <span className="text-sm">{dbStatus}</span>
                  </div>
                </div>
                <button
                  onClick={checkConnections}
                  className="mt-6 w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Refresh Status
                </button>
              </div>
            )}

            {/* Setup Tab */}
            {activeTab === 'setup' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Database Setup</h2>
                <p className="text-gray-600 mb-6">
                  Initialize your database schema and populate it with test data.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">Step 1: Initialize Schema</h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      This will DROP all existing tables and recreate them. All data will be lost!
                    </p>
                    <button
                      onClick={handleInitDatabase}
                      disabled={loading}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Processing...' : 'Initialize Database'}
                    </button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Step 2: Insert Test Data</h3>
                    <p className="text-sm text-green-800 mb-3">
                      Populate tables with sample users, drivers, locations, and more.
                    </p>
                    <button
                      onClick={handleInsertData}
                      disabled={loading}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Processing...' : 'Insert Test Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Tab */}
            {activeTab === 'transaction' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Test Transaction</h2>
                <p className="text-gray-600 mb-6">
                  Book a ride and process payment (updates 3 tables: ride, payment, bank_account)
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Transaction Details:</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• <strong>User:</strong> James Wilson (ID: 3)</li>
                    <li>• <strong>Driver:</strong> Sarah Martinez (ID: 2)</li>
                    <li>• <strong>Category:</strong> Premium</li>
                    <li>• <strong>Route:</strong> Queensbury Ln → Fannin St</li>
                    <li>• <strong>Price:</strong> $42.00 + $3.36 tax = $45.36 total</li>
                    <li>• <strong>Duration:</strong> 32 minutes</li>
                  </ul>
                </div>

                <button
                  onClick={handleRunTransaction}
                  disabled={loading}
                  className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? 'Processing Transaction...' : 'Book Ride & Process Payment'}
                </button>
              </div>
            )}

            {/* Queries Tab */}
            {activeTab === 'queries' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Database Queries</h2>
                <p className="text-gray-600 mb-6">
                  Run queries with JOINs to view database information
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRunQuery('ride-history')}
                    disabled={loading}
                    className="p-4 bg-indigo-100 border border-indigo-300 rounded-lg hover:bg-indigo-200 disabled:bg-gray-200 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-indigo-900">Ride History</h3>
                    <p className="text-sm text-indigo-700 mt-1">Complete ride details with users, drivers, locations</p>
                  </button>

                  <button
                    onClick={() => handleRunQuery('user-spending')}
                    disabled={loading}
                    className="p-4 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:bg-gray-200 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-gray-900">User Spending</h3>
                    <p className="text-sm text-gray-700 mt-1">Total spending per user with balance info</p>
                  </button>

                  <button
                    onClick={() => handleRunQuery('driver-earnings')}
                    disabled={loading}
                    className="p-4 bg-indigo-100 border border-indigo-300 rounded-lg hover:bg-indigo-200 disabled:bg-gray-200 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-indigo-900">Driver Earnings</h3>
                    <p className="text-sm text-indigo-700 mt-1">Driver performance and earnings report</p>
                  </button>

                  <button
                    onClick={() => handleRunQuery('payment-audit')}
                    disabled={loading}
                    className="p-4 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:bg-gray-200 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-gray-900">Payment Audit</h3>
                    <p className="text-sm text-gray-700 mt-1">Detailed payment transaction history</p>
                  </button>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                message ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* Query Results Display */}
            {queryResults && queryResults.length > 0 && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <h3 className="font-semibold mb-3">Query Results ({queryResults.length} rows):</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      {Object.keys(queryResults[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-semibold">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-100">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-3 py-2">
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryResults.length > 10 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Showing first 10 of {queryResults.length} results
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-xl shadow-lg p-4 text-center text-sm text-gray-600">
          Phase 1
        </div>
      </div>
    </div>
  );
}

export default App;