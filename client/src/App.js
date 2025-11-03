import React, { useState, useEffect } from "react";
import { testConnection, testDatabase } from "./services/api";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [activeTab, setActiveTab] = useState("home");
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      setBackendStatus("Server not connected");
      setDbStatus("Database not connected");
    }
  };

  const handleInitDatabase = async () => {
    if (!window.confirm("This will reset all tables. Continue?")) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:5001/api/init-database", {
        method: "POST",
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
      const response = await fetch("http://localhost:5001/api/insert-data", {
        method: "POST",
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
    setMessage("");
    try {
      const response = await fetch("http://localhost:5001/api/book-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: 3,
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
      const response = await fetch(
        `http://localhost:5001/api/query/${queryType}`
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white text-gray-800">
      {/* Navbar */}
      <header className="bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md p-5 flex justify-between items-center rounded-b-3xl">
        <h1 className="text-3xl font-bold tracking-wide">CarConnect</h1>
        <nav className="space-x-6">
          {[
            ["home", "Home"],
            ["book", "Book Ride"],
            ["manage", "Manage System"],
            ["reports", "Reports"],
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
        {/* HOME TAB */}
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

        {/* BOOK TAB */}
        {activeTab === "book" && (
          <div>
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">
              Book a Demo Ride
            </h2>
            <p className="text-gray-600 mb-6">
              Simulate a real ride booking with instant payment processing.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-5">
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• User: James Wilson (ID 3)</li>
                <li>• Driver: Sarah Martinez (ID 2)</li>
                <li>• Category: Premium</li>
                <li>• Route: Queensbury Ln → Fannin St</li>
                <li>• Price: $42.00</li>
                <li>• Duration: 32 minutes</li>
              </ul>
            </div>
            <button
              onClick={handleRunTransaction}
              disabled={loading}
              className="w-full bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600 disabled:bg-gray-400"
            >
              {loading ? "Processing Transaction…" : "Confirm Ride"}
            </button>
          </div>
        )}

        {/* MANAGE TAB */}
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

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div>
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">
              Analytics Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              Generate system reports and analyze ride, user, and driver data.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleRunQuery("ride-history")}
                disabled={loading}
                className="p-5 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 text-left"
              >
                <h3 className="font-semibold text-purple-800">Ride History</h3>
                <p className="text-sm text-gray-700 mt-1">
                  Full list of all rides with users, drivers, and routes.
                </p>
              </button>
              <button
                onClick={() => handleRunQuery("user-spending")}
                disabled={loading}
                className="p-5 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 text-left"
              >
                <h3 className="font-semibold text-purple-800">User Spending</h3>
                <p className="text-sm text-gray-700 mt-1">
                  Total spending and balances by user.
                </p>
              </button>
              <button
                onClick={() => handleRunQuery("driver-earnings")}
                disabled={loading}
                className="p-5 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 text-left"
              >
                <h3 className="font-semibold text-purple-800">
                  Driver Performance
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  Earnings and performance reports per driver.
                </p>
              </button>
              <button
                onClick={() => handleRunQuery("payment-audit")}
                disabled={loading}
                className="p-5 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 text-left"
              >
                <h3 className="font-semibold text-purple-800">Payment Audit</h3>
                <p className="text-sm text-gray-700 mt-1">
                  Complete payment transaction logs.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <div className="mt-6 bg-purple-50 text-purple-800 border border-purple-200 p-4 rounded-xl">
            {message}
          </div>
        )}

        {/* Query Results Table */}
        {queryResults && queryResults.length > 0 && (
          <div className="mt-6 bg-white border border-purple-100 rounded-2xl p-4 overflow-x-auto">
            <h3 className="font-semibold text-purple-800 mb-2">
              Query Results ({queryResults.length})
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-purple-100">
                <tr>
                  {Object.keys(queryResults[0]).map((key) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left font-medium uppercase"
                    >
                      {key.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResults.slice(0, 10).map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-purple-50 hover:bg-purple-50"
                  >
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="px-3 py-2">
                        {val ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {queryResults.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 10 of {queryResults.length} rows
              </p>
            )}
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
