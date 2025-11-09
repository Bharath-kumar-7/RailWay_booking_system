// ═══════════════════════════════════════════════════════════════════════════════
// RAILWAY BOOKING SYSTEM - FIXED BOOKING.JS
// ═══════════════════════════════════════════════════════════════════════════════
// All fixes implemented:
// ✅ Train data properly fetched and populated in HTML
// ✅ Error handling with user feedback
// ✅ Input validation before booking
// ✅ Console logging for debugging
// ✅ Train summary card populated with all details
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = 'http://localhost:5000';

let currentTrain = null;
let baseFare = 0;

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    const token = getAuthToken();
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    options.headers['Content-Type'] = 'application/json';
    return fetch(url, options);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 FIX #2: POPULATE TRAIN DATA IN BOOKING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
// PROBLEM: Train data fetched but HTML not populated, fields show ₹0
// SOLUTION: Extract train ID, fetch data, populate HTML, add error handling
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // ✅ Extract train_id from URL parameter
    const params = new URLSearchParams(window.location.search);
    const trainId = params.get('train_id');
    
    console.log('=== BOOKING PAGE LOADED ===');
    console.log('Train ID from URL:', trainId);
    
    // Validate train_id exists
    if (!trainId) {
        alert("No train selected. Redirecting to home...");
        window.location.href = 'home.html';
        return;
    }
    
    const passengerCountSel = document.getElementById('passengerCount');
    
    // ✅ Fetch train details with proper error handling
    console.log(`Fetching train details from: ${API_BASE_URL}/trains/${trainId}`);
    
    fetch(`${API_BASE_URL}/trains/${trainId}`)
        .then(res => {
            console.log('Response status:', res.status);
            if (!res.ok) throw new Error(`Train not found (${res.status})`);
            return res.json();
        })
        .then(train => {
            console.log('✅ Train data received:', train);
            
            // Store train data
            currentTrain = train;
            baseFare = train.fare || 0;
            
            console.log('Base fare:', baseFare);
            
            // ✅ Populate train summary card with actual data
            populateTrainSummary(train);
            
            // ✅ Update booking summary
            updateBookingSummary();
            
            // ✅ Add event listener for passenger count changes
            if (passengerCountSel) {
                passengerCountSel.addEventListener('change', updateBookingSummary);
            }
            
            console.log('✅ Booking page fully loaded');
        })
        .catch(error => {
            console.error('❌ Error fetching train:', error);
            alert(`Failed to load train details: ${error.message}\n\nPlease check if backend is running on port 5000`);
            window.location.href = 'home.html';
        });
    
    // ✅ Handle booking form submission
    const form = document.getElementById('bookingForm');
    if (form) {
        form.addEventListener('submit', handleBookingSubmit);
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Populate train summary card with all details
// ═══════════════════════════════════════════════════════════════════════════════
function populateTrainSummary(train) {
    const summary = document.querySelector('.train-summary-card');
    if (!summary) {
        console.warn('Train summary card element not found');
        return;
    }
    
    const departureTime = train.departure_time || '00:00';
    const arrivalTime = train.arrival_time || '00:00';
    
    console.log('Populating train summary...');
    
    summary.innerHTML = `
        <h2>Train Details</h2>
        <div class="train-info">
            <div class="train-name-number">
                <h3>${train.train_name || 'N/A'}</h3>
                <span class="train-number">Train ID: ${train.id}</span>
            </div>
            
            <div class="route-info">
                <div class="station">
                    <div class="station-name">${train.source || 'N/A'}</div>
                    <div class="time">${departureTime}</div>
                    <div class="label">Departure</div>
                </div>
                
                <div class="journey-line">
                    <div class="duration">Journey</div>
                    <div class="line"></div>
                </div>
                
                <div class="station">
                    <div class="station-name">${train.destination || 'N/A'}</div>
                    <div class="time">${arrivalTime}</div>
                    <div class="label">Arrival</div>
                </div>
            </div>
            
            <div class="fare-info">
                <div>
                    <strong>Base Fare Per Seat</strong>
                    <p id="baseFareDisplay">₹${parseFloat(train.fare || 0).toFixed(2)}</p>
                </div>
                <div>
                    <strong>Available Seats</strong>
                    <p>${train.available_seats || 0} / ${train.total_seats || 0}</p>
                </div>
                <div>
                    <strong>Train Status</strong>
                    <p style="color: green; font-weight: bold;">Available</p>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Train summary populated');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Update booking summary with calculations
// ═══════════════════════════════════════════════════════════════════════════════
function updateBookingSummary() {
    const numSeats = parseInt(document.getElementById('passengerCount').value, 10) || 1;
    
    console.log(`Updating summary: ${numSeats} passengers`);
    
    if (!currentTrain) {
        console.warn('currentTrain not set yet');
        return;
    }
    
    // Calculate totals
    const totalFare = baseFare * numSeats;
    const gst = totalFare * 0.05; // 5% GST
    const finalAmount = totalFare + gst;
    
    console.log(`Fare calculation: ${baseFare} × ${numSeats} = ${totalFare}, GST: ${gst}, Total: ${finalAmount}`);
    
    // Update HTML elements
    const baseFareEl = document.getElementById('baseFare');
    const passengerCountEl = document.getElementById('passengerCountDisplay');
    const totalFareEl = document.getElementById('totalFare');
    const gstEl = document.getElementById('gstAmount');
    const totalEl = document.getElementById('totalAmount');
    
    if (baseFareEl) baseFareEl.textContent = `₹${parseFloat(baseFare).toFixed(2)}`;
    if (passengerCountEl) passengerCountEl.textContent = numSeats;
    if (totalFareEl) totalFareEl.textContent = `₹${totalFare.toFixed(2)}`;
    if (gstEl) gstEl.textContent = `₹${gst.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${finalAmount.toFixed(2)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Handle booking form submission
// ═══════════════════════════════════════════════════════════════════════════════
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const params = new URLSearchParams(window.location.search);
    const trainId = params.get('train_id');
    const numSeats = parseInt(document.getElementById('passengerCount').value, 10) || 1;
    
    console.log('=== BOOKING SUBMISSION ===');
    console.log('Train ID:', trainId);
    console.log('Number of seats:', numSeats);
    
    // ✅ Validate booking details
    if (!currentTrain) {
        alert('Train details not loaded. Please refresh and try again.');
        console.error('currentTrain not set');
        return;
    }
    
    if (numSeats < 1) {
        alert('Please select at least 1 seat');
        return;
    }
    
    if (numSeats > currentTrain.available_seats) {
        alert(`Only ${currentTrain.available_seats} seats available. Please select fewer seats.`);
        return;
    }
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Processing your booking...';
    submitBtn.disabled = true;
    
    try {
        console.log('Sending booking request to backend...');
        
        // ✅ Send booking request with error handling
        const response = await fetchWithAuth(`${API_BASE_URL}/book`, {
            method: 'POST',
            body: JSON.stringify({ 
                train_id: parseInt(trainId, 10),
                seats_booked: numSeats 
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            console.log('✅ Booking successful!');
            // ✅ Show booking success modal or message
            showBookingSuccess(data);
        } else {
            console.error('❌ Booking failed:', data.error);
            alert(`Booking failed: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('❌ Booking error:', error);
        alert(`Connection error: ${error.message}\n\nPlease check if backend is running on port 5000`);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Show booking success message/modal
// ═══════════════════════════════════════════════════════════════════════════════
function showBookingSuccess(bookingData) {
    console.log('Showing booking success...');
    
    // Create success message
    const successMessage = `
✅ BOOKING CONFIRMED!

Booking ID: ${bookingData.bookingId}
Train: ${bookingData.trainName}
Route: ${bookingData.source} → ${bookingData.destination}
Seats Booked: ${bookingData.seatsBooked}
Total Fare: ₹${bookingData.fare}

Your booking is confirmed. Redirecting to bookings page...
    `;
    
    alert(successMessage);
    
    // Try to update modal if it exists
    const modal = document.getElementById('successModal');
    if (modal) {
        const bookingDetailsEl = modal.querySelector('.booking-details');
        if (bookingDetailsEl) {
            bookingDetailsEl.innerHTML = `
                <div class="detail-item">
                    <strong>Booking ID:</strong>
                    <span>${bookingData.bookingId}</span>
                </div>
                <div class="detail-item">
                    <strong>Train:</strong>
                    <span>${bookingData.trainName}</span>
                </div>
                <div class="detail-item">
                    <strong>Route:</strong>
                    <span>${bookingData.source} → ${bookingData.destination}</span>
                </div>
                <div class="detail-item">
                    <strong>Seats Booked:</strong>
                    <span>${bookingData.seatsBooked}</span>
                </div>
                <div class="detail-item">
                    <strong>Total Fare:</strong>
                    <span>₹${bookingData.fare}</span>
                </div>
            `;
        }
        modal.classList.add('show');
        
        // Add button listeners
        const viewBookingsBtn = modal.querySelector('.view-bookings-btn');
        const homeBtn = modal.querySelector('.home-btn');
        
        if (viewBookingsBtn) {
            viewBookingsBtn.addEventListener('click', () => {
                window.location.href = 'bookings.html';
            });
        }
        
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = 'home.html';
            });
        }
    } else {
        // Redirect to bookings page after delay
        setTimeout(() => {
            window.location.href = 'bookings.html';
        }, 2000);
    }
}