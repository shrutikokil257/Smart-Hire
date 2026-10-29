// Your deployed Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6MmDtvt6cawW58eG8BEe-oYrkyFoaon1lSgr9ttx0LTIB87hDFL8MMiLrSrFgBldJ/exec';

/**
 * 1. Retrieve Data from Google Sheet
 */
async function getSheetData() {
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Retrieved Data from Sheet:", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

/**
 * 2. Save Data to Google Sheet
 * @param {Array} rowData - An array of values representing a row, e.g., ["John Doe", "Developer", "john@email.com"]
 */
async function saveToSheet(rowData) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        // text/plain is required for Google Apps Script to handle CORS properly with POST requests
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify({ rowValues: rowData })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Save Status:", result);
    return result;
  } catch (error) {
    console.error("Error saving data:", error);
  }
}
