// ==========================================
// CONFIGURATION
// ==========================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6MmDtvt6cawW58eG8BEe-oYrkyFoaon1lSgr9ttx0LTIB87hDFL8MMiLrSrFgBldJ/exec';

// ==========================================
// GOOGLE SHEETS API FUNCTIONS
// ==========================================

/**
 * 1. Retrieve Data from Google Sheet
 * @returns {Array} Array of rows from your Google Sheet
 */
async function getSheetData() {
  try {
    console.log("Fetching data from Google Sheet...");
    const response = await fetch(SCRIPT_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Retrieved Data Successfully:", result);
    
    // Returns the data array (result.data contains the rows)
    return result.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("Failed to load data from Google Sheet.");
  }
}

/**
 * 2. Save Data to Google Sheet
 * @param {Array} rowData - An array of values representing a single row, e.g., ["John", "john@email.com", "Developer"]
 */
async function saveToSheet(rowData) {
  try {
    console.log("Saving data to Google Sheet...", rowData);
    
    // Using 'no-cors' mode bypasses Google Apps Script browser redirection restrictions for POST requests
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ rowValues: rowData })
    });
    
    console.log("Data sent successfully!");
    alert("Data saved to Google Sheet successfully!");
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    alert("Failed to save data. Check console for details.");
    return false;
  }
}

// ==========================================
// APPLICATION EVENT LISTENERS & UI HOOKS
// ==========================================

// Run when the HTML document has fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Smart-Hire app initialized. Connecting to Google Sheets...");
  
  // Example: Fetch existing data on page load (e.g., to populate a table or list)
  const sheetData = await getSheetData();
  if (sheetData) {
    // TODO: Call your UI rendering function here, e.g., renderTable(sheetData);
  }

  // Example: Handle form submission if you have a submission form in your HTML
  // Replace '#candidateForm' with the actual ID or CSS selector of your form
  const candidateForm = document.querySelector("#candidateForm"); 
  
  if (candidateForm) {
    candidateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Example fields — update these IDs to match your actual HTML input fields
      const nameField = document.querySelector("#nameInput");
      const emailField = document.querySelector("#emailInput");
      const roleField = document.querySelector("#roleInput");
      
      if (!nameField || !emailField) {
        console.error("Form input fields not found. Check your HTML selectors.");
        return;
      }

      // Construct the row array matching your Google Sheet column order
      const rowData = [
        nameField.value,
        emailField.value,
        roleField ? roleField.value : "",
        new Date().toLocaleString() // Timestamp
      ];

      // Disable button or show loading state if desired here
      
      // Save to Google Sheet
      await saveToSheet(rowData);
      
      // Clear the form after saving
      candidateForm.reset();
      
      // Refresh data grid/table
      await getSheetData();
    });
  }
});
