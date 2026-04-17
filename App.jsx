import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

const ratingColor = (r) => ({
  Excellent: "#16a34a",
  Good: "#2563eb",
  Average: "#d97706",
  Poor: "#dc2626",
}[r] || "#6b7280");

const StatCard = ({ label, value, unit, color }) => (
  <div style={{
    background: "#fff", borderRadius: 12, padding: "1.2rem 1.5rem",
    border: "0.5px solid #e5e7eb", flex: 1, minWidth: 140
  }}>
    <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px" }}>{label}</p>
    <p style={{ fontSize: 26, fontWeight: 600, color: color || "#111827", margin: 0 }}>
      {value} <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>{unit}</span>
    </p>
  </div>
);

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [emissions, setEmissions] = useState([]);
  const [sustainability, setSustainability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, t, v, e, s] = await Promise.all([
        fetch(`${API}/dashboard`).then(r => r.json()),
        fetch(`${API}/trips`).then(r => r.json()),
        fetch(`${API}/vehicles`).then(r => r.json()),
        fetch(`${API}/emissions`).then(r => r.json()),
        fetch(`${API}/sustainability`).then(r => r.json()),
      ]);
      setDashboard(d);
      setTrips(t);
      setVehicles(v);
      setEmissions(e);
      setSustainability(s);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddTrip = async () => {
    try {
      const res = await fetch(`${API}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMsg(data.message || data.error);
      fetchAll();
    } catch (e) {
      setMsg("Error adding trip");
    }
  };

  const tabs = ["dashboard", "trips", "vehicles", "emissions", "sustainability", "add trip"];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "#14532d", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>🌿</span>
        <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 600 }}>
          Green Transportation Management System
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "0.75rem 2rem", background: "#fff", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 16px", borderRadius: 8, border: "none",
            background: tab === t ? "#14532d" : "transparent",
            color: tab === t ? "#fff" : "#374151",
            cursor: "pointer", fontSize: 14, fontWeight: tab === t ? 600 : 400,
            textTransform: "capitalize"
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        {loading && <p style={{ color: "#6b7280" }}>Loading...</p>}

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && dashboard && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Overview</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "2rem" }}>
              <StatCard label="Total Trips" value={dashboard.stats.total_trips} />
              <StatCard label="Total CO₂" value={dashboard.stats.total_co2_kg} unit="kg" color="#dc2626" />
              <StatCard label="Fuel Used" value={dashboard.stats.total_fuel_litres} unit="L" color="#d97706" />
              <StatCard label="Avg Green Score" value={dashboard.stats.avg_sustainability_score} unit="/ 100" color="#16a34a" />
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Rating Distribution</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "2rem" }}>
              {dashboard.ratings.map(r => (
                <div key={r.rating} style={{
                  background: "#fff", border: "0.5px solid #e5e7eb",
                  borderRadius: 10, padding: "0.8rem 1.2rem", minWidth: 100
                }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{r.rating}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: ratingColor(r.rating) }}>{r.count}</p>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Monthly CO₂ Trend</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120 }}>
              {dashboard.monthlyTrend.map(m => {
                const max = Math.max(...dashboard.monthlyTrend.map(x => x.total_co2));
                const h = Math.max(20, (m.total_co2 / max) * 100);
                return (
                  <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "#374151", fontWeight: 600 }}>{m.total_co2}</span>
                    <div style={{ width: 40, height: h, background: "#16a34a", borderRadius: "4px 4px 0 0", opacity: 0.8 }} />
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TRIPS TAB */}
        {tab === "trips" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>All Trips</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    {["ID", "Vehicle", "Engine", "Driver", "Route", "Fuel (L)", "CO₂ (kg)", "Idle (min)", "Score", "Rating"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 12, color: "#374151", textAlign: "left", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t, i) => (
                    <tr key={t.trip_id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.trip_id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.registration_no}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.engine_type}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.driver}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.route}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.litres_used}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{t.co2_kg}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{t.idle_minutes}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{t.score_value}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontSize: 11, padding: "3px 10px", borderRadius: 20,
                          background: ratingColor(t.rating) + "22",
                          color: ratingColor(t.rating), fontWeight: 600
                        }}>{t.rating}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VEHICLES TAB */}
        {tab === "vehicles" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Vehicles</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {vehicles.map(v => (
                <div key={v.vehicle_id} style={{
                  background: "#fff", border: "0.5px solid #e5e7eb",
                  borderRadius: 10, padding: "1rem 1.25rem", minWidth: 180
                }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{v.registration_no}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{v.type} · {v.engine_type}</p>
                  <span style={{
                    display: "inline-block", marginTop: 8, fontSize: 11, padding: "2px 8px",
                    borderRadius: 20, background: v.engine_type === "Electric" ? "#dcfce7" : "#fef3c7",
                    color: v.engine_type === "Electric" ? "#16a34a" : "#92400e"
                  }}>{v.engine_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMISSIONS TAB */}
        {tab === "emissions" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Emission Logs</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    {["Trip", "Vehicle", "Route", "Distance (km)", "Fuel (L)", "CO₂ (kg)", "CO₂/km"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", fontSize: 12, color: "#374151", textAlign: "left", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emissions.map((e, i) => (
                    <tr key={e.log_id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.trip_id}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.registration_no}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.route}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.distance_km}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.fuel_used}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{e.co2_kg}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13 }}>{e.co2_per_km}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUSTAINABILITY TAB */}
        {tab === "sustainability" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Green Vehicle Leaderboard</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sustainability.map((s, i) => (
                <div key={s.vehicle_id} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "#fff", border: "0.5px solid #e5e7eb",
                  borderRadius: 10, padding: "1rem 1.25rem"
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: i === 0 ? "#ca8a04" : "#9ca3af", minWidth: 28 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{s.registration_no}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{s.engine_type} · {s.trips} trips</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{s.avg_green_score}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>avg score</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#dc2626" }}>{s.total_co2} kg</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>total CO₂</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD TRIP TAB */}
        {tab === "add trip" && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Record New Trip</h2>
            {msg && <p style={{ color: "#16a34a", marginBottom: "1rem", fontWeight: 500 }}>{msg}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "vehicle_id", label: "Vehicle ID", type: "number" },
                { key: "driver_id", label: "Driver ID", type: "number" },
                { key: "route_id", label: "Route ID", type: "number" },
                { key: "start_time", label: "Start Time", type: "datetime-local" },
                { key: "end_time", label: "End Time", type: "datetime-local" },
                { key: "litres_used", label: "Fuel Used (litres)", type: "number" },
                { key: "idle_minutes", label: "Idle Time (minutes)", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key] || ""}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8,
                      border: "1px solid #d1d5db", fontSize: 14, outline: "none"
                    }}
                  />
                </div>
              ))}
              <button onClick={handleAddTrip} style={{
                background: "#14532d", color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 20px", fontSize: 15,
                fontWeight: 600, cursor: "pointer", marginTop: 4
              }}>Record Trip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
