/**
 * Smart-Hire Local Storage Script
 * Stores, retrieves, and manages candidate data locally in the browser.
 */

// ==========================================
// CONFIGURATION & STORAGE KEY
// ==========================================
const STORAGE_KEY = 'smart_hire_candidates';

// ==========================================
// CORE LOCAL STORAGE FUNCTIONS
// ==========================================

/**
 * Retrieves candidate data from localStorage.
 * @returns {Array} Array of candidate records.
 */
function getLocalData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
}

/**
 * Saves a new candidate record to localStorage.
 * @param {Array} rowValues - [Name, Email, Position, Experience, Skills, Status, Date]
 * @returns {boolean} True if successful, false otherwise.
 */
function saveLocalData(rowValues) {
  try {
    if (!Array.isArray(rowValues) || rowValues.length === 0) {
      console.error("Invalid row data provided.");
      return false;
    }

    const currentData = getLocalData();
    currentData.push(rowValues);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    console.log("Data saved to localStorage successfully.");
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
}

/**
 * Clears all candidate data from localStorage.
 */
function clearLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Local storage cleared.");
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

// ==========================================
// DOM INITIALIZATION & EVENT BINDINGS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("Smart-Hire LocalStorage script initialized.");

  // 1. Initial Data Load on Page Load
  const storedCandidates = getLocalData();
  console.log("Loaded existing candidates from storage:", storedCandidates);
  // TODO: Render your table or UI with `storedCandidates` here if needed

  // 2. Form Submission Handler
  const candidateForm = document.querySelector("#candidateForm");

  if (candidateForm) {
    candidateForm.addEventListener("submit", (event) => {
      event.preventDefault();

      // Safely extract values with fallback checks
      const nameInput = document.querySelector("#nameInput");
      const emailInput = document.querySelector("#emailInput");
      const positionInput = document.querySelector("#positionInput");
      const experienceInput = document.querySelector("#experienceInput");
      const skillsInput = document.querySelector("#skillsInput");

      // Validate required fields
      if (!nameInput || !nameInput.value.trim() || !emailInput || !emailInput.value.trim()) {
        alert("Please fill in all required fields (Name and Email).");
        return;
      }

      // Construct row data matching your columns
      const rowData = [
        nameInput.value.trim(),
        emailInput.value.trim(),
        positionInput ? positionInput.value.trim() : "",
        experienceInput ? experienceInput.value.trim() : "",
        skillsInput ? skillsInput.value.trim() : "",
        "New", // Default Status
        new Date().toLocaleString() // Timestamp
      ];

      // Save locally
      const success = saveLocalData(rowData);

      if (success) {
        alert("Candidate saved locally!");
        candidateForm.reset();
        
        // Refresh or view updated list
        const updatedList = getLocalData();
        console.log("Updated candidate list:", updatedList);
      } else {
        alert("An error occurred while saving locally.");
      }
    });
  }
});
