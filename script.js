// Load users from browser storage
let usersDatabase = JSON.parse(localStorage.getItem('smartHireUsers')) || [];
let currentUser = null;

function saveUsers() {
  localStorage.setItem('smartHireUsers', JSON.stringify(usersDatabase));
}

function showSection(sectionId) {
  document.getElementById('clientAuth').classList.add('hidden');
  document.getElementById('workerAuth').classList.add('hidden');
  document.getElementById('clientDashboard').classList.add('hidden');
  document.getElementById('workerDashboard').classList.add('hidden');

  document.getElementById(sectionId).classList.remove('hidden');
}

function toggleAuthForm(role, type) {
  const loginForm = document.getElementById(`${role}LoginForm`);
  const signupForm = document.getElementById(`${role}SignupForm`);
  const loginTab = document.getElementById(`${role}LoginTab`);
  const signupTab = document.getElementById(`${role}SignupTab`);

  if (type === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
  }
}

function handleSignup(event, role) {
  event.preventDefault();

  let payload = { role: role };

  if (role === 'client') {
    const pass = document.getElementById('clientPass').value;
    const confirmPass = document.getElementById('clientConfirmPass').value;
    if (pass !== confirmPass) return alert("Passwords do not match!");

    payload.name = document.getElementById('clientName').value;
    payload.email = document.getElementById('clientEmail').value;
    payload.location = document.getElementById('clientLocation').value;
    payload.contact = document.getElementById('clientContact').value;
    payload.password = pass;
  } else {
    const pass = document.getElementById('workerPass').value;
    const confirmPass = document.getElementById('workerConfirmPass').value;
    if (pass !== confirmPass) return alert("Passwords do not match!");

    payload.name = document.getElementById('workerName').value;
    payload.email = document.getElementById('workerEmail').value;
    payload.category = document.getElementById('workerCategory').value;
    payload.location = document.getElementById('workerLocation').value;
    payload.contact = document.getElementById('workerContact').value;
    payload.salary = document.getElementById('workerSalary').value;
    payload.experience = document.getElementById('workerExperience').value;
    payload.password = pass;
    payload.status = 'Available'; // Default status
    payload.photo = ''; // Default empty photo
  }

  // Check if email already exists
  const existing = usersDatabase.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
  if (existing) {
    return alert("An account with this email already exists!");
  }

  usersDatabase.push(payload);
  saveUsers();

  alert("Registration successful!");
  openDashboard(payload);
}

function handleLogin(event, role) {
  event.preventDefault();
  const email = document.getElementById(`${role}LoginEmail`).value;
  const pass = document.getElementById(`${role}LoginPass`).value;

  const user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass && u.role === role);

  if (user) {
    openDashboard(user);
  } else {
    alert("Invalid email or password!");
  }
}

function openDashboard(user) {
  currentUser = user;
  document.getElementById('navButtons').classList.add('hidden');

  if (user.role === 'client') {
    document.getElementById('clientProfileName').textContent = user.name;
    showSection('clientDashboard');
    searchWorkers();
  } else {
    // Populate Worker Dashboard Profile Details
    document.getElementById('wProfileName').textContent = user.name || '';
    document.getElementById('wProfileEmail').textContent = user.email || '';
    document.getElementById('wProfileCategory').textContent = user.category || '';
    document.getElementById('wProfileLocation').textContent = user.location || '';
    document.getElementById('wProfileContact').textContent = user.contact || '';
    document.getElementById('wProfileSalary').textContent = user.salary ? `₹${user.salary}` : '';
    document.getElementById('wProfileExperience').textContent = user.experience || '';
    
    // Set editable input fields if present
    if (document.getElementById('editSalary')) document.getElementById('editSalary').value = user.salary || '';
    if (document.getElementById('editExperience')) document.getElementById('editExperience').value = user.experience || '';
    
    // Set status toggle button/checkbox state
    const statusToggle = document.getElementById('workerStatusToggle');
    if (statusToggle) {
      statusToggle.checked = (user.status === 'Available');
    }

    showSection('workerDashboard');
  }
}

// Worker Feature: Toggle Availability Status (Available / Offline)
function toggleAvailability() {
  if (!currentUser || currentUser.role !== 'worker') return;

  const statusToggle = document.getElementById('workerStatusToggle');
  currentUser.status = statusToggle.checked ? 'Available' : 'Offline';

  // Update in local storage array
  const index = usersDatabase.findIndex(u => u.email === currentUser.email);
  if (index !== -1) {
    usersDatabase[index].status = currentUser.status;
    saveUsers();
  }

  alert(`Your availability status is now: ${currentUser.status}`);
}

// Worker Feature: Update Profile Details & Salary/Experience
function updateWorkerProfile(event) {
  event.preventDefault();
  if (!currentUser || currentUser.role !== 'worker') return;

  currentUser.salary = document.getElementById('editSalary').value;
  currentUser.experience = document.getElementById('editExperience').value;

  const index = usersDatabase.findIndex(u => u.email === currentUser.email);
  if (index !== -1) {
    usersDatabase[index].salary = currentUser.salary;
    usersDatabase[index].experience = currentUser.experience;
    saveUsers();
  }

  alert("Profile updated successfully!");
  openDashboard(currentUser);
}

// Worker Feature: Upload/Set Profile Picture (via image link or file reader)
function uploadProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    currentUser.photo = e.target.result;

    const index = usersDatabase.findIndex(u => u.email === currentUser.email);
    if (index !== -1) {
      usersDatabase[index].photo = currentUser.photo;
      saveUsers();
    }
    alert("Profile picture updated successfully!");
  };
  reader.readAsDataURL(file);
}

function searchWorkers() {
  const categoryQuery = document.getElementById('searchCategory').value.toLowerCase();
  const locationQuery = document.getElementById('searchLocation').value.toLowerCase();
  const resultsContainer = document.getElementById('workerResults');

  resultsContainer.innerHTML = "";

  const filtered = usersDatabase.filter(u => {
    if (u.role !== 'worker') return false;
    // Optionally skip offline workers
    if (u.status === 'Offline') return false;

    const matchesCategory = !categoryQuery || u.category.toLowerCase().includes(categoryQuery);
    const matchesLocation = !locationQuery || u.location.toLowerCase().includes(locationQuery);
    return matchesCategory && matchesLocation;
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = "<p>No active workers found matching criteria.</p>";
    return;
  }

  filtered.forEach(worker => {
    const card = document.createElement('div');
    card.className = 'worker-card';
    card.innerHTML = `
      ${worker.photo ? `<img src="${worker.photo}" alt="Profile Photo" style="width:60px;height:60px;border-radius:50%;object-fit:cover;float:right;" />` : ''}
      <h3>${worker.name}</h3>
      <p><strong>Category:</strong> ${worker.category}</p>
      <p><strong>Location:</strong> ${worker.location}</p>
      <p><strong>Salary:</strong> ₹${worker.salary} / day</p>
      <p><strong>Experience:</strong> ${worker.experience}</p>
      <p><strong>Contact:</strong> ${worker.contact}</p>
      <p><strong>Status:</strong> <span style="color:green;">${worker.status || 'Available'}</span></p>
    `;
    resultsContainer.appendChild(card);
  });
}

function logout() {
  currentUser = null;
  document.getElementById('navButtons').classList.remove('hidden');
  showSection('clientAuth');
}
