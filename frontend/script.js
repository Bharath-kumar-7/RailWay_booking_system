// ═══════════════════════════════════════════════════════════════════════════════
// RAILWAY BOOKING SYSTEM - FIXED SCRIPT.JS
// ═══════════════════════════════════════════════════════════════════════════════
// All fixes implemented:
// ✅ Buy button now redirects correctly with train ID
// ✅ Event listeners properly attached to dynamically created buttons
// ✅ Console logging for debugging
// ═══════════════════════════════════════════════════════════════════════════════

// API Configuration
const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const searchForm = document.getElementById('searchForm');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const swapStations = document.getElementById('swapStations');

// Utility function to get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Utility function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    if (token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    }
    return fetch(url, options);
}

// Check if user is logged in
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = getAuthToken();
    if ((!user || !token) && window.location.pathname.includes('home.html')) {
        alert('Please log in first!');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Initialize the app
function init() {
    // Check authentication for home page
    if (window.location.pathname.includes('home.html')) {
        checkLogin();
        setupHomePage();
    }
    
    // Setup event listeners for login page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setupAuthPage();
    }
}

// Setup authentication page
function setupAuthPage() {
    if (toggleLoginPassword) {
        toggleLoginPassword.addEventListener('click', () => {
            togglePasswordVisibility('loginPassword', toggleLoginPassword);
        });
    }
    
    if (toggleSignupPassword) {
        toggleSignupPassword.addEventListener('click', () => {
            togglePasswordVisibility('signupPassword', toggleSignupPassword);
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

// Setup home page
function setupHomePage() {
    const today = new Date().toISOString().split('T')[0];
    const travelDate = document.getElementById('travelDate');
    if (travelDate) {
        travelDate.min = today;
        travelDate.value = today;
    }
    
    if (swapStations) {
        swapStations.addEventListener('click', () => {
            const source = document.getElementById('source');
            const destination = document.getElementById('destination');
            const temp = source.value;
            source.value = destination.value;
            destination.value = temp;
        });
    }
    
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Display user name
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name;
        }
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Switch between login and signup forms
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const title = document.getElementById('formTitle');
    const subtitle = document.getElementById('formSubtitle');
    
    if (formType === 'signup') {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        title.innerText = 'Create Account';
        subtitle.innerText = 'Sign up to get started';
    } else {
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
        title.innerText = 'Welcome Back';
        subtitle.innerText = 'Sign in to your account';
    }
}

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = ' Signing In...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showNotification('Welcome back! 🚆', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Connection error. Please check if backend is running.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle user signup
async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = ' Creating Account...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            showNotification('Account created successfully! 🎉', 'success');
            setTimeout(() => {
                switchForm('login');
                document.getElementById('loginEmail').value = email;
            }, 1500);
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Connection error. Please check if backend is running.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle train search
async function handleSearch(e) {
    e.preventDefault();
    const source = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;
    const travelDate = document.getElementById('travelDate').value;
    
    if (!source || !destination) {
        showNotification('Please enter both source and destination stations', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = ' Searching...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetchWithAuth(
            `${API_BASE_URL}/trains/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`
        );
        
        if (response.ok) {
            const trains = await response.json();
            displaySearchResults(trains);
        } else {
            const data = await response.json();
            showNotification(data.error || 'Search failed', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Connection error. Please check if backend is running.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 FIX #1: DISPLAY SEARCH RESULTS WITH PROPER EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════════
// PROBLEM: Buy buttons created but no click handlers
// SOLUTION: Add data-train-id attribute and event listeners
// ═══════════════════════════════════════════════════════════════════════════════

function displaySearchResults(trains) {
    const resultsSection = document.getElementById('results');
    
    if (!trains || trains.length === 0) {
        resultsSection.innerHTML = `
            <div class="no-results">
                <i class="fas fa-train"></i>
                <h3>No trains found</h3>
                <p>Try adjusting your source or destination stations</p>
            </div>
        `;
        return;
    }
    
    resultsSection.innerHTML = `<h3>Available Trains</h3>`;
    
    trains.forEach(train => {
        const trainCard = document.createElement('div');
        trainCard.className = 'train-card';
        
        const departureTime = train.departure_time || '00:00';
        const arrivalTime = train.arrival_time || '00:00';
        
        // ✅ FIX: Add data-train-id attribute to button
        trainCard.innerHTML = `
            <div class="train-header">
                <div>
                    <h3 class="train-name">${train.train_name}</h3>
                    <p class="train-number">ID: ${train.id}</p>
                </div>
                <span class="fare">₹${parseFloat(train.fare).toFixed(2)}</span>
            </div>
            
            <div class="train-route">
                <i class="fas fa-map-marker-alt"></i>
                <strong>${train.source}</strong>
                <i class="fas fa-arrow-right"></i>
                <strong>${train.destination}</strong>
            </div>
            
            <div class="train-timing">
                <div class="timing">
                    <span class="time">${departureTime}</span>
                    <span class="station">Departure</span>
                </div>
                <div class="timing">
                    <span class="time">${arrivalTime}</span>
                    <span class="station">Arrival</span>
                </div>
            </div>
            
            <div class="train-fare">
                <div>
                    <small>Available Seats</small>
                    <strong>${train.available_seats}/${train.total_seats}</strong>
                </div>
                <button class="btn-primary book-btn" data-train-id="${train.id}" data-train-name="${train.train_name}">
                    <i class="fas fa-ticket-alt"></i> Buy Ticket
                </button>
            </div>
        `;
        
        resultsSection.appendChild(trainCard);
    });
    
    // ✅ FIX: ADD CLICK EVENT LISTENERS TO ALL BUY BUTTONS
    console.log('Attaching click listeners to buy buttons...');
    document.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const trainId = this.getAttribute('data-train-id');
            const trainName = this.getAttribute('data-train-name');
            console.log(`Buy clicked: Train=${trainName}, ID=${trainId}`);
            console.log(`Redirecting to: book.html?train_id=${trainId}`);
            window.location.href = `book.html?train_id=${trainId}`;
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);