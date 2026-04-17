// ============================================================
// GREEN TRANSPORTATION MANAGEMENT SYSTEM
// Node.js + Express.js Backend
// ============================================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// DATABASE CONNECTION POOL
// ============================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'green_transport',
  waitForConnections: true,
  connectionLimit: 10,
});

// Test DB connection
pool.getConnection()
  .then(conn => { console.log('✅ MySQL connected'); conn.release(); })
  .catch(err => console.error('❌ DB connection failed:', err.message));

// ============================================================
// HELPER
// ============================================================
const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// ============================================================
// DASHBOARD ROUTES
// ============================================================

// GET /api/dashboard - Overall stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT t.trip_id) AS total_trips,
        ROUND(SUM(e.co2_kg), 2) AS total_co2_kg,
        ROUND(SUM(f.litres_used), 2) AS total_fuel_litres,
        ROUND(AVG(ss.score_value), 2) AS avg_sustainability_score
      FROM Trip t
      JOIN Emission_Log e ON t.trip_id = e.trip_id
      JOIN Fuel_Usage f ON t.trip_id = f.trip_id
      JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id
    `);

    const ratings = await query(`
      SELECT rating, COUNT(*) AS count FROM Sustainability_Score GROUP BY rating
    `);

    const monthlyTrend = await query(`
      SELECT 
        DATE_FORMAT(t.start_time, '%Y-%m') AS month,
        ROUND(SUM(e.co2_kg), 2) AS total_co2,
        COUNT(t.trip_id) AS trips
      FROM Trip t
      JOIN Emission_Log e ON t.trip_id = e.trip_id
      GROUP BY month ORDER BY month
    `);

    res.json({ stats: stats[0], ratings, monthlyTrend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// VEHICLE ROUTES
// ============================================================

// GET /api/vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await query('SELECT * FROM Vehicle ORDER BY vehicle_id');
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehicles
app.post('/api/vehicles', async (req, res) => {
  const { registration_no, type, engine_type } = req.body;
  if (!registration_no || !type || !engine_type)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const result = await query(
      'INSERT INTO Vehicle (registration_no, type, engine_type) VALUES (?, ?, ?)',
      [registration_no, type, engine_type]
    );
    res.status(201).json({ message: 'Vehicle added', vehicle_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vehicles/:id
app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await query('DELETE FROM Vehicle WHERE vehicle_id = ?', [req.params.id]);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DRIVER ROUTES
// ============================================================

app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await query('SELECT * FROM Driver ORDER BY driver_id');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drivers', async (req, res) => {
  const { name, license_no, experience } = req.body;
  if (!name || !license_no || experience === undefined)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const result = await query(
      'INSERT INTO Driver (name, license_no, experience) VALUES (?, ?, ?)',
      [name, license_no, experience]
    );
    res.status(201).json({ message: 'Driver added', driver_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTE ROUTES
// ============================================================

app.get('/api/routes', async (req, res) => {
  try {
    const routes = await query('SELECT * FROM Route ORDER BY route_id');
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/routes', async (req, res) => {
  const { source, destination, distance_km } = req.body;
  if (!source || !destination || !distance_km)
    return res.status(400).json({ error: 'All fields required' });
  try {
    const result = await query(
      'INSERT INTO Route (source, destination, distance_km) VALUES (?, ?, ?)',
      [source, destination, distance_km]
    );
    res.status(201).json({ message: 'Route added', route_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TRIP ROUTES
// ============================================================

// GET /api/trips - all trips with full details
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await query(`
      SELECT 
        t.trip_id,
        v.registration_no,
        v.engine_type,
        d.name AS driver,
        CONCAT(r.source, ' → ', r.destination) AS route,
        r.distance_km,
        f.litres_used,
        e.co2_kg,
        ir.idle_minutes,
        ss.score_value,
        ss.rating,
        t.start_time,
        t.end_time
      FROM Trip t
      JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
      JOIN Driver d ON t.driver_id = d.driver_id
      JOIN Route r ON t.route_id = r.route_id
      LEFT JOIN Fuel_Usage f ON t.trip_id = f.trip_id
      LEFT JOIN Emission_Log e ON t.trip_id = e.trip_id
      LEFT JOIN Idle_Record ir ON t.trip_id = ir.trip_id
      LEFT JOIN Sustainability_Score ss ON t.trip_id = ss.trip_id
      ORDER BY t.start_time DESC
    `);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trips - record new trip using stored procedure
app.post('/api/trips', async (req, res) => {
  const { vehicle_id, driver_id, route_id, start_time, end_time, litres_used, idle_minutes } = req.body;
  if (!vehicle_id || !driver_id || !route_id || !start_time)
    return res.status(400).json({ error: 'Required fields missing' });
  try {
    const result = await query(
      'CALL sp_record_trip(?, ?, ?, ?, ?, ?, ?)',
      [vehicle_id, driver_id, route_id, start_time, end_time || null, litres_used || 0, idle_minutes || 0]
    );
    res.status(201).json({ message: 'Trip recorded', data: result[0][0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// EMISSION ROUTES
// ============================================================

// GET /api/emissions - all emission logs
app.get('/api/emissions', async (req, res) => {
  try {
    const emissions = await query(`
      SELECT 
        e.log_id,
        e.trip_id,
        CONCAT(r.source, ' → ', r.destination) AS route,
        v.registration_no,
        e.distance_km,
        e.fuel_used,
        e.co2_kg,
        ROUND(e.co2_kg / e.distance_km, 4) AS co2_per_km
      FROM Emission_Log e
      JOIN Trip t ON e.trip_id = t.trip_id
      JOIN Route r ON t.route_id = r.route_id
      JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
      ORDER BY e.co2_kg DESC
    `);
    res.json(emissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emissions/per-route
app.get('/api/emissions/per-route', async (req, res) => {
  try {
    const data = await query(`
      SELECT 
        CONCAT(r.source, ' → ', r.destination) AS route,
        COUNT(t.trip_id) AS total_trips,
        ROUND(SUM(e.co2_kg), 2) AS total_co2_kg,
        ROUND(AVG(e.co2_kg), 2) AS avg_co2
      FROM Route r
      JOIN Trip t ON r.route_id = t.route_id
      JOIN Emission_Log e ON t.trip_id = e.trip_id
      GROUP BY r.route_id ORDER BY total_co2_kg DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SUSTAINABILITY ROUTES
// ============================================================

// GET /api/sustainability - leaderboard from view
app.get('/api/sustainability', async (req, res) => {
  try {
    const data = await query('SELECT * FROM vw_green_leaderboard');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// REPORT ROUTES
// ============================================================

// POST /api/reports/monthly - generate monthly report
app.post('/api/reports/monthly', async (req, res) => {
  const { month } = req.body; // format: YYYY-MM
  if (!month) return res.status(400).json({ error: 'Month required (YYYY-MM)' });
  try {
    const result = await query('CALL sp_generate_monthly_report(?)', [month]);
    res.json({ message: 'Report generated', report: result[0][0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports - all reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await query('SELECT * FROM Environmental_Report ORDER BY generated_on DESC');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
