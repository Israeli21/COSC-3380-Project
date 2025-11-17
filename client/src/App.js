import React, { useState, useEffect } from "react";
import { testConnection, testDatabase } from "./services/api";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [activeTab, setActiveTab] = useState("home");
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form state for ride request
  const [rideForm, setRideForm] = useState({
    pickupLocationId: "",
    destinationLocationId: "",
    driverId: "",
    rideDate: "",
    rideTime: "",
  });

  // Dropdown data from database
  const [pickupLocations, setPickupLocations] = useState([]);
  const [destinationLocations, setDestinationLocations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // User account management
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [startingBalance, setStartingBalance] = useState("1000");
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [userBalance, setUserBalance] = useState(null);

  useEffect(() => {
    checkConnections();
    fetchDropdownData();
    fetchUsers();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [pickupRes, destRes, driverRes] = await Promise.all([
        fetch("http://localhost:5001/api/pickup-locations"),
        fetch("http://localhost:5001/api/destination-locations"),
        fetch("http://localhost:5001/api/drivers"),
      ]);

      const pickupData = await pickupRes.json();
      const destData = await destRes.json();
      const driverData = await driverRes.json();

      if (pickupData.success) setPickupLocations(pickupData.data);
      if (destData.success) setDestinationLocations(destData.data);
      if (driverData.success) setDrivers(driverData.data);
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowAccountDropdown(false);
    fetchUserBalance(user.user_id);
  };

  const fetchUserBalance = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/user-balance/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch user balance:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      setMessage("Please enter a name");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:5001/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          startingBalance: parseFloat(startingBalance) || 1000,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`User created successfully! Welcome ${data.user.name}!`);
        setNewUserName("");
        setStartingBalance("1000");
        fetchUsers(); // Refresh user list
        // Auto-select the new user
        setSelectedUser(data.user);
        setUserBalance(data.balance);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleAdjustBalance = async (operation) => {
    if (!selectedUser) {
      setMessage("Please select a user first");
      return;
    }
    const amount = parseFloat(balanceAdjustment);
    if (!amount || amount <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:5001/api/adjust-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          amount: operation === "add" ? amount : -amount,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`Balance ${operation === "add" ? "added" : "subtracted"} successfully! New balance: $${data.newBalance.toFixed(2)}`);
        setBalanceAdjustment("");
        fetchUserBalance(selectedUser.user_id); // Refresh balance
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };

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

  // Fetch balance when user is selected or tab changes to manage
  useEffect(() => {
    if (selectedUser && activeTab === "manage") {
      fetchUserBalance(selectedUser.user_id);
    }
  }, [selectedUser, activeTab]);

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

  const handleRideSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validate user is selected
    if (!selectedUser) {
      setMessage("Please select an account from the top-right menu first");
      setLoading(false);
      return;
    }

    // Validate form
    if (!rideForm.pickupLocationId || !rideForm.destinationLocationId || 
        !rideForm.driverId || !rideForm.rideDate || !rideForm.rideTime) {
      setMessage("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/book-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          pickup_location_id: parseInt(rideForm.pickupLocationId),
          destination_location_id: parseInt(rideForm.destinationLocationId),
          driver_id: parseInt(rideForm.driverId),
          ride_date: rideForm.rideDate,
          ride_time: rideForm.rideTime,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage(`${data.message} Transaction time: ${data.executionTime}ms`);
        // Reset form
        setRideForm({
          pickupLocationId: "",
          destinationLocationId: "",
          driverId: "",
          rideDate: "",
          rideTime: "",
        });
        // Refresh user balance
        if (selectedUser) {
          fetchUserBalance(selectedUser.user_id);
        }
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white text-gray-800">
      {/* Navbar */}
      <header className="bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-md p-5 pb-8 flex justify-between items-center rounded-b-3xl">
        <h1 className="text-3xl font-bold tracking-wide pl-2">CarConnect</h1>
        <div className="flex items-center gap-8">
          <nav className="space-x-6">
            {[
              ["home", "Home"],
              ["manage", "Account"],
              ["reports", "Analytics"],
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
          
          {/* Account Circle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="Select Account"
            >
              {selectedUser ? (
                <span className="text-sm font-semibold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Dropdown Menu */}
            {showAccountDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 py-2 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">Select Account</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleUserSelect(user)}
                        className={`w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors ${
                          selectedUser?.user_id === user.user_id ? 'bg-purple-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">User ID: {user.user_id}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No users found. Create a ride to add users.
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setShowAccountDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto mt-10 bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8">
        {/* HOME: REQUEST A RIDE */}
        {activeTab === "home" && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Request a Ride
            </h2>

            <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl">
              <form className="space-y-5" onSubmit={handleRideSubmit}>
                {/* Pickup & Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <select
                    value={rideForm.pickupLocationId}
                    onChange={(e) => setRideForm({...rideForm, pickupLocationId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="">Select pickup location</option>
                    {pickupLocations.map((loc) => (
                      <option key={loc.pickup_location_id} value={loc.pickup_location_id}>
                        {loc.address} - {loc.city}, {loc.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <select
                    value={rideForm.destinationLocationId}
                    onChange={(e) => setRideForm({...rideForm, destinationLocationId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {destinationLocations.map((loc) => (
                      <option key={loc.destination_location_id} value={loc.destination_location_id}>
                        {loc.address} - {loc.city}, {loc.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Choose Your Driver
                  </label>
                  <select 
                    value={rideForm.driverId}
                    onChange={(e) => setRideForm({...rideForm, driverId: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  >
                    <option value="">Select driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.driver_id} value={driver.driver_id}>
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
                      value={rideForm.rideDate}
                      onChange={(e) => setRideForm({...rideForm, rideDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={rideForm.rideTime}
                      onChange={(e) => setRideForm({...rideForm, rideTime: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? "Processing..." : "Book Ride"}
                </button>
              </form>

              {/* SYSTEM CONNECTIVITY STATUS: WILL DELETE THIS IN THE FUTURE */}
              <div>
                <h2 className="text-2xl font-semibold text-black mb-4 pt-10">
                  System Connectivity
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                      Server Connection
                    </span>
                    <span className="text-sm">{backendStatus}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">
                      Database Link
                    </span>
                    <span className="text-sm">{dbStatus}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    checkConnections();
                    fetchDropdownData();
                  }}
                  className="mt-6 w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Refresh All Data
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MANAGE - ACCOUNT */}
        {activeTab === "manage" && (
          <div>
            <h2 className="text-2xl font-semibold text-black mb-6">
              Account Management
            </h2>

            {/* Current User Info */}
            {selectedUser && (
              <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Account</h3>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-purple-600 text-white flex items-center justify-center text-3xl font-bold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h4>
                    <p className="text-gray-500">User ID: {selectedUser.user_id}</p>
                    <p className="text-2xl font-semibold text-green-600 mt-2">
                      Balance: ${userBalance !== null ? userBalance.toFixed(2) : "Loading..."}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Adjust Balance</h4>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        value={balanceAdjustment}
                        onChange={(e) => setBalanceAdjustment(e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <button
                      onClick={() => handleAdjustBalance("add")}
                      disabled={loading}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => handleAdjustBalance("subtract")}
                      disabled={loading}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Subtract
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!selectedUser && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <p className="text-yellow-800">
                  Please select an account from the top-right menu to view and manage balance.
                </p>
              </div>
            )}

            {/* Create New User Section */}
            <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Balance ($)
                  </label>
                  <input
                    type="number"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <button
                  onClick={handleCreateUser}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>

            {/* System Configuration */}
            <h2 className="text-2xl font-semibold text-black mb-4 mt-12">
              System Configuration
            </h2>
            <p className="text-gray-600 mb-6">
              Initialize or refresh your database schema and load demo data.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="font-semibold text-black mb-3">
                  Step 1: Initialize Schema
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Drops existing tables and rebuilds structure from scratch.
                </p>
                <button
                  onClick={handleInitDatabase}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading ? "Processing…" : "Initialize Schema"}
                </button>
              </div>

              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="font-semibold text-black mb-3">
                  Step 2: Load Demo Data
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Populates tables with sample users, drivers, and rides.
                </p>
                <button
                  onClick={handleInsertData}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
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
            <h2 className="text-2xl font-semibold text-black mb-4">
              Analytics
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
                  className="p-5 bg-purple-600 text-white rounded-xl hover:bg-purple-00 disabled:bg-gray-400 text-left shadow-sm"
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
          <div className="mt-6 bg-gray-50 text-black border border-purple-200 p-4 rounded-xl">
            {message}
          </div>
        )}

        {/* QUERY RESULTS DISPLAY */}
        {queryResults && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-black mb-4">Query Results</h3>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      {queryResults.length > 0 && Object.keys(queryResults[0]).map((key) => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
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