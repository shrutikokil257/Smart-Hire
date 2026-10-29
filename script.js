const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

// 1. Worker Signup Endpoint
app.post('/api/worker/signup', async (req, res) => {
  try {
    const { name, email, contact, location, pincode, experience, salary } = req.body;
    
    // JSON Payload formatted for Google Sheets
    const payload = {
      sheetName: "Workers",
      row: [
        "W-" + Date.now(), // Unique ID
        name,
        email,
        contact,
        location,
        pincode,
        experience,
        salary,
        "Available",
        "Signup",
        new Date().toLocaleString()
      ]
    };

    // Sending JSON data to Google Sheets Web App
    await axios.post(GOOGLE_SCRIPT_URL, payload);

    res.status(200).json({ success: true, message: "Worker registered and saved to Google Sheet!" });
  } catch (error) {
    console.error("Error saving worker:", error);
    res.status(500).json({ success: false, message: "Failed to save data" });
  }
});

// 2. Client Signup Endpoint
app.post('/api/client/signup', async (req, res) => {
  try {
    const { name, email, contact, location, pincode } = req.body;
    
    // JSON Payload formatted for Google Sheets
    const payload = {
      sheetName: "Clients",
      row: [
        "C-" + Date.now(), // Unique ID
        name,
        email,
        contact,
        location,
        pincode,
        "Signup",
        new Date().toLocaleString()
      ]
    };

    // Sending JSON data to Google Sheets Web App
    await axios.post(GOOGLE_SCRIPT_URL, payload);

    res.status(200).json({ success: true, message: "Client registered and saved to Google Sheet!" });
  } catch (error) {
    console.error("Error saving client:", error);
    res.status(500).json({ success: false, message: "Failed to save data" });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Smart Hire backend server running on port 3000');
});
