# RideCompare 🚖

RideCompare is a production-ready, full-stack ride aggregator and route optimization application. It detects user coordinates, calculates routing lines, compares fares, recommends the best provider, and offers seamless booking deep-linking.

---

## 🛠 Tech Stack

- **Frontend:** React.js, TypeScript, Tailwind CSS v4, Vite, Leaflet Maps.
- **Backend:** Node.js, Express.js, TypeScript, PostgreSQL Database connection.
- **Data APIs:** OpenStreetMap Geocoding (Nominatim), OSRM Routing Engine.
- **Infrastructure:** Docker, Docker Compose, PostgreSQL database.

---

## 🚀 How to Run the Application

There are two methods to boot up the application: using **Docker Compose** (recommended for production deployment) or **Local Development** (best for live editing).

### Method 1: Docker Compose (All-in-One containerization)

This launches the database, API server, and Nginx frontend server inside Docker.

1. Ensure **Docker Desktop** is running on your machine.
2. In the root directory (`c:\Users\HP\Desktop\distance_comaprison`), run:
   ```bash
   docker-compose up --build
   ```
3. Once running, access the portals:
   - **Frontend App:** [http://localhost](http://localhost) (Served on standard port 80).
   - **Backend API:** [http://localhost:5000](http://localhost:5000) (Health checks available at `/health`).
   - **Database:** PostgreSQL listening on port `5432`.

---

### Method 2: Local Development (Live Reloading)

This runs the React client and Express API locally on your system node path.

#### 1. Setup the Database
You can spin up only the database container:
```bash
docker-compose up -d db
```
The database will execute the tables creation and mock seeds automatically in the background.

#### 2. Start the Backend API
Navigate to the `backend` folder, install dependencies, and launch:
```bash
cd backend
npm install
npm run dev
```
The server will boot up and listen on port **5000**.

#### 3. Start the Frontend App
Navigate to the `frontend` folder, install dependencies, and launch the Vite server:
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Database Schema

Tables defined in PostgreSQL database:
- `users`: Stores user profile records.
- `searches`: Log entries for all route comparisons (pickup location, destination, distance, duration, recommendations, savings).
- `analytics`: Tracks clicks, provider selections, total revenue redirects.

---

## 🧠 Smart Recommendation Engine

Our engine weights metrics dynamically to assign a recommendation score:

$$\text{Score} = (40\% \times \text{Fare Efficiency}) + (40\% \times \text{Travel Time Efficiency}) + (20\% \times \text{Distance Efficiency})$$

- **Uber:** Optimized for premium standard cabs.
- **Ola:** Reliable alternatives with driver allocation latency simulation.
- **Rapido:** Bike taxi rates, weaving 20% faster through traffic.

---

## 📱 Deep Booking Links

RideCompare dynamically structures deep booking redirects for mobile applications or desktop:
- **Uber:** Redirects to the Uber mobile app (or web interface fallback) with coordinates pre-populated.
- **Ola:** Activates Ola app launcher deep-link parameters.
- **Rapido:** Boots Rapido app interface mapping.

- https://taxi.teamnexterp.com/
