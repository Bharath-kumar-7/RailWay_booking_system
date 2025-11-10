const API_BASE_URL = 'http://localhost:5000';

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    const token = getAuthToken();
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, options);
}

document.addEventListener("DOMContentLoaded", loadUserBookings);

async function loadUserBookings() {
    const container = document.getElementById("bookingsContainer");
    container.innerHTML = "<p>Loading your bookings...</p>";

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/bookings/user`);
        const data = await res.json();

        if (!res.ok) {
            container.innerHTML = `<p class="error-message">${data.error}</p>`;
            return;
        }

        if (data.length === 0) {
            container.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-ticket-alt"></i>
                    <h3>No Bookings Found</h3>
                    <p>You haven’t booked any tickets yet.</p>
                </div>`;
            return;
        }

        container.innerHTML = "";

        data.forEach(b => {
            const card = document.createElement("div");
            card.classList.add("booking-card");
            
            const journeyDate = b.journey_date ? new Date(b.journey_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
            const bookingDate = b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

            card.innerHTML = `
                <div class="booking-header">
                    <div class="booking-info">
                        <h3>${b.train_name}</h3>
                        <p class="booking-id">Booking ID: ${b.id} | Booked on: ${bookingDate}</p>
                    </div>
                    <span class="status status-confirmed">${b.status}</span>
                </div>

                <div class="booking-details">
                    <div class="route">
                        <div class="station">
                            <div class="station-name">${b.source}</div>
                            <div class="time">${b.departure_time}</div>
                        </div>
                        <div class="journey">→</div>
                        <div class="station">
                            <div class="station-name">${b.destination}</div>
                            <div class="time">${b.arrival_time}</div>
                        </div>
                    </div>

                    <div class="booking-meta">
                        <div class="meta-item">
                            <strong>Journey Date</strong>
                            <span>${journeyDate}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Seats</strong>
                            <span>${b.seats_booked}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Total Fare</strong>
                            <span>₹${b.fare}</span>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `<p class="error-message">Failed to load bookings.</p>`;
        console.error(error);
    }
}
