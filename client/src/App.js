import React, { useState, useEffect } from "react";
import { testConnection, testDatabase } from "./services/api";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [activeTab, setActiveTab] = useState("home");
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
  const [message, setMessage] = useState("");
=======
  const [message, setMessage] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

>>>>>>> 4cbf8c7 (Save current progress)

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const backendRes = await testConnection();
      setBackendStatus(backendRes.message);
      const dbRes = await testDatabase();
      setDbStatus(`Connected! ${new Date(dbRes.timestamp).toLocaleString()}`);
    } catch {
      setBackendStatus("Server not connected");
      setDbStatus("Database not connected");
    }
  };

  const handleInitDatabase = async () => {
    if (!window.confirm("This will reset all tables. Continue?")) return;
    setLoading(true);
    setMessage("");
    try {
<<<<<<< HEAD
      const response = await fetch("http://localhost:5001/api/init-database", {
        method: "POST",
=======
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/init-database`, {
      method: 'POST'
>>>>>>> 4cbf8c7 (Save current progress)
      });
      const data = await response.json();
      setMessage(data.success ? data.message : data.error);
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleInsertData = async () => {
    setLoading(true);
    setMessage("");
    try {
<<<<<<< HEAD
      const response = await fetch("http://localhost:5001/api/insert-data", {
        method: "POST",
      });
=======
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/insert-data`, {
      method: 'POST'
    });
>>>>>>> 4cbf8c7 (Save current progress)
      const data = await response.json();
      setMessage(data.success ? data.message : data.error);
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleAddUser = async () => {
  if (!newUserName || !newUserEmail || !newUserPhone) {
    setMessage('Please fill in all fields.');
    return;
  }

  setLoading(true);
  setMessage('');
  
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone
      })
    });
    // log raw response first
    const text = await response.text();
    console.log('Raw response:', text);

    // then parse JSON
    const data = JSON.parse(text);

    if (data.success) {
      setMessage(`User added! ID: ${data.user.user_id}`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
    } else {
      setMessage('Error: ' + data.error);
    }
  } catch (err) {
    setMessage('Error: ' + err.message);
  }

  setLoading(false);
};


  const handleRunTransaction = async () => {
    setLoading(true);
    setMessage("");
    try {
<<<<<<< HEAD
      const response = await fetch("http://localhost:5001/api/book-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
=======
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/book-ride`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
>>>>>>> 4cbf8c7 (Save current progress)
        body: JSON.stringify({
          user_id: 1,
          driver_id: 2,
          category_id: 2,
          pickup_location_id: 4,
          dropoff_location_id: 12,
          price: 42.0,
          ride_time_minutes: 32,
        }),
      });
      const data = await response.json();
      setMessage(data.success ? data.message : data.error);
      if (data.success && data.result) setQueryResults(data.result);
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleRunQuery = async (queryType) => {
    setLoading(true);
    setMessage("");
    setQueryResults(null);
    try {
<<<<<<< HEAD
      const response = await fetch(
        `http://localhost:5001/api/query/${queryType}`
      );
=======
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/query/${queryType}`);
>>>>>>> 4cbf8c7 (Save current progress)
      const data = await response.json();
      if (data.success) {
        setQueryResults(data.results);
        setMessage(`Returned ${data.results.length} rows`);
      } else setMessage(data.error);
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };
  

  // Hardcoded drivers for selection (frontend only)
  const drivers = [
    { id: 1, name: "Sarah Martinez" },
    { id: 2, name: "David Kim" },
    { id: 3, name: "John Lee" },
    { id: 4, name: "Maria Gonzalez" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white text-gray-800">
      {/* Navbar */}
      <header className="bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md p-5 flex justify-between items-center rounded-b-3xl">
        <h1 className="text-3xl font-bold tracking-wide">CarConnect</h1>
        <nav className="space-x-6">
          {[
            ["home", "Home"],
            ["book", "Request a Ride"],
            ["manage", "Manage System"],
            ["reports", "Analytics Dashboard"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`capitalize font-medium ${
                activeTab === key
                  ? "underline underline-offset-8"
                  : "hover:opacity-80"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto mt-10 bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8">
        {/* HOME */}
        {activeTab === "home" && (
          <div>
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">
              System Connectivity
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Server Connection
                </span>
                <span className="text-sm">{backendStatus}</span>
              </div>
              <div className="flex justify-between p-4 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Database Link
                </span>
                <span className="text-sm">{dbStatus}</span>
              </div>
            </div>
            <button
              onClick={checkConnections}
              className="mt-6 w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Refresh Connection
            </button>
          </div>
        )}

        {/* REQUEST A RIDE */}
        {activeTab === "book" && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Request a Ride
            </h2>

            <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl">
              <form className="space-y-5">
                {/* User Info */}
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                  </div>
                </div>

<<<<<<< HEAD
                {/* Pickup & Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
=======
            {/* Setup Tab */}
            {activeTab === 'setup' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Database Setup</h2>
                <p className="text-gray-600 mb-6">
                  Initialize your database schema and populate it with test data.
                </p>
                
                <div className="space-y-4">
                  {/* Step 1 */}
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

                  {/* Step 2 */}
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

                  {/* Step 3 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Step 3: Add New User</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Add a new user to the app_user table.
                    </p>

                    {/* Input fields */}
                    <input 
                      type="text"
                      placeholder="Name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input 
                      type="email"
                      placeholder="Email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input 
                      type="text"
                      placeholder="Phone"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full p-2 mb-4 border rounded"
                    />

                    <button
                      onClick={handleAddUser}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Processing...' : 'Add New User'}
                    </button>
                  </div>
>>>>>>> 4cbf8c7 (Save current progress)
                </div>

<<<<<<< HEAD
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Enter destination"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                </div>

                {/* Driver Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Choose Your Driver
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent">
                    <option value="">Select driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time */}
                <div className="flex items-center justify-between space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
=======

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
>>>>>>> 4cbf8c7 (Save current progress)
                </div>

                <button
                  type="button"
                  onClick={handleRunTransaction}
                  disabled={loading}
                  className="mt-4 w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
                >
                  {loading ? "Processing..." : "Book Ride"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MANAGE */}
        {activeTab === "manage" && (
          <div>
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">
              System Configuration
            </h2>
            <p className="text-gray-600 mb-6">
              Initialize or refresh your database schema and load demo data.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3">
                  Step 1: Initialize Schema
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Drops existing tables and rebuilds structure from scratch.
                </p>
                <button
                  onClick={handleInitDatabase}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
                >
                  {loading ? "Processing…" : "Initialize Schema"}
                </button>
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-3">
                  Step 2: Load Demo Data
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Populates tables with sample users, drivers, and rides.
                </p>
                <button
                  onClick={handleInsertData}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
                >
                  {loading ? "Processing…" : "Load Demo Data"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS */}
        {activeTab === "reports" && (
          <div>
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              Generate system reports and analyze ride, user, and driver data.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["ride-history", "Ride History (Transactions)", "View all rides with users, drivers, and locations."],
                ["user-spending", "User Spending", "Total spending and balance per user."],
                ["driver-earnings", "Driver Performance", "Earnings and performance data per driver."],
                ["payment-audit", "Payment Audit", "Full payment transaction logs and summaries."]
              ].map(([query, title, desc]) => (
                <button
                  key={query}
                  onClick={() => handleRunQuery(query)}
                  disabled={loading}
                  className="p-5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:bg-gray-400 text-left shadow-sm"
                >
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-sm mt-1 opacity-90">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES + RESULTS */}
        {message && (
          <div className="mt-6 bg-purple-50 text-purple-800 border border-purple-200 p-4 rounded-xl">
            {message}
          </div>
        )}

        {/* QUERY RESULTS DISPLAY */}
        {queryResults && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-purple-700 mb-4">Query Results</h3>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      {queryResults.length > 0 && Object.keys(queryResults[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-purple-100">
                    {queryResults.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-25'}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {typeof value === 'number' && value % 1 !== 0 
                              ? parseFloat(value).toFixed(2) 
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-600">
        © 2025 CarConnect — Prototype Demo
      </footer>
    </div>
  );
}

export default App;
