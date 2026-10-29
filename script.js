const SCRIPT_URL = 'https://docs.google.com/spreadsheets/d/1hNWtIA2imiP49kxcn7-i7obR0OMLQhSyW_PzfQ_oE3s/edit?gid=0#gid=0';

// 1. Retrieve Data
async function getData() {
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    console.log("Retrieved Data:", data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// 2. Save Data
async function saveData(newDataArray) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Required for Apps Script POST requests
      },
      body: JSON.stringify({ rowValues: newDataArray })
    });
    const result = await response.json();
    console.log("Save Status:", result);
  } catch (error) {
    console.error("Error saving data:", error);
  }
}
