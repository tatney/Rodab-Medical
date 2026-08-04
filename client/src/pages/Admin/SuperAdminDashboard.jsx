import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar, { roleConfig } from '../../components/Sidebar';
import Map from '../../components/Map';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import {
  getAnalytics,
  getAdminUsers,
  getAllHospitals,
  createAdminUser,
  deleteUser,
  createHospital,
  updateHospital,
  deleteHospital,
  getActiveEmergencies,
  getEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadEventImage,
  deleteEventImages,
} from '../../api';
/* ──────────────────────────────────────────────
   Helper: Stat Card
   ────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${color || "#4f46e5"}` }}>
    <div className="stat-icon" style={{ background: color || "#4f46e5" }} aria-hidden="true">
      {icon || "📊"}
    </div>
    <div className="stat-info">
      <span className="stat-value">{value ?? "—"}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

/* ──────────────────────────────────────────────
   Helper: Progress Bar
   ────────────────────────────────────────────── */
const ProgressBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="progress-row">
      <div className="progress-header">
        <span>{label}</span>
        <span>
          {count} ({pct}%)
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { tab } = useParams();
  const validKeys = roleConfig.super_admin.tabs.map((t) => t.key);
  const activeTab = validKeys.includes(tab) ? tab : 'overview';
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ── Shared state ── */
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── Admins ── */
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    password: "",
    age: "",
    gender: "male",
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  /* ── Hospitals ── */
  const [hospitals, setHospitals] = useState([]);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    emergency_phone: "",
    services: "",
  });
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalSubmitting, setHospitalSubmitting] = useState(false);

  /* ── Emergency ── */
  const [emergencies, setEmergencies] = useState([]);

  /* ── Events ── */
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    is_active: true,
    images: [],
  });
  const [eventFiles, setEventFiles] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventSubmitting, setEventSubmitting] = useState(false);

  /* ── Logs ── */
  const [logs, setLogs] = useState({ users: [], appointments: [], emergencies: [] });

  /* ═══════════════════════════════════════════
     DATA FETCHING
     ═══════════════════════════════════════════ */
  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      setError("Failed to load analytics data.");
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const { data } = await getAdminUsers();
      setAdmins(data?.users || []);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  }, []);

  const fetchHospitals = useCallback(async () => {
    try {
      const { data } = await getAllHospitals();
      setHospitals(data?.hospitals || []);
    } catch (err) {
      console.error("Failed to fetch hospitals", err);
    }
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try {
      const { data } = await getActiveEmergencies();
      setEmergencies(data?.active || data?.rides || data?.emergencies || []);
    } catch (err) {
      console.error("Failed to fetch emergencies", err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await getEventsAdmin();
      setEvents(data?.events || []);
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchAdmins(), fetchHospitals(), fetchEmergencies(), fetchEvents()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchAnalytics, fetchAdmins, fetchHospitals, fetchEmergencies, fetchEvents]);

  /* Auto-refresh emergency data every 15 s */
  useEffect(() => {
    if (activeTab === "emergency" || activeTab === "logs") {
      fetchEmergencies();
      const iv = setInterval(() => {
        fetchEmergencies();
      }, 15000);
      return () => clearInterval(iv);
    }
  }, [activeTab, fetchEmergencies]);

  /* ═══════════════════════════════════════════
     ADMIN CRUD
     ═══════════════════════════════════════════ */
  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminSubmitting(true);
    try {
      await createAdminUser({
        fullName: adminForm.fullName,
        email: adminForm.email,
        password: adminForm.password,
        age: Number(adminForm.age),
        gender: adminForm.gender,
        role: "admin",
      });
      setAdminForm({ fullName: "", email: "", password: "", age: "", gender: "male" });
      fetchAdmins();
      toast.success("Admin created successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create admin.");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id, role) => {
    if (role === "super_admin") {
      toast.error("Cannot delete the Super Admin.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await deleteUser(id);
      fetchAdmins();
      fetchAnalytics();
    } catch (err) {
      toast.error("Failed to delete admin.");
    }
  };

  /* ═══════════════════════════════════════════
     HOSPITAL CRUD
     ═══════════════════════════════════════════ */
  const handleHospitalChange = (e) => {
    setHospitalForm({ ...hospitalForm, [e.target.name]: e.target.value });
  };

  const resetHospitalForm = () => {
    setHospitalForm({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      phone: "",
      emergency_phone: "",
      services: "",
    });
    setEditingHospital(null);
  };

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    setHospitalSubmitting(true);
    const payload = {
      ...hospitalForm,
      latitude: parseFloat(hospitalForm.latitude) || null,
      longitude: parseFloat(hospitalForm.longitude) || null,
      services: hospitalForm.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingHospital) {
        await updateHospital(editingHospital.id || editingHospital._id, payload);
      } else {
        await createHospital(payload);
      }
      resetHospitalForm();
      fetchHospitals();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save hospital.");
    } finally {
      setHospitalSubmitting(false);
    }
  };

  const handleEditHospital = (h) => {
    setEditingHospital(h);
    setHospitalForm({
      name: h.name || "",
      address: h.address || "",
      latitude: h.latitude?.toString() || "",
      longitude: h.longitude?.toString() || "",
      phone: h.phone || "",
      emergency_phone: h.emergency_phone || "",
      services: Array.isArray(h.services) ? h.services.join(", ") : h.services || "",
    });
  };

  const handleDeleteHospital = async (id) => {
    if (!window.confirm("Delete this hospital?")) return;
    try {
      await deleteHospital(id);
      fetchHospitals();
      fetchAnalytics();
    } catch (err) {
      toast.error("Failed to delete hospital.");
    }
  };

  /* ═══════════════════════════════════════════
     EVENTS CRUD
     ═══════════════════════════════════════════ */
  const handleEventChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  const resetEventForm = () => {
    setEventForm({ title: "", description: "", is_active: true, images: [] });
    setEventFiles([]);
    setEditingEvent(null);
  };

  const handleEventFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const room = 4 - eventForm.images.length;
    setEventFiles((prev) => [...prev, ...selected].slice(0, Math.max(0, room)));
    e.target.value = "";
  };

  const removePendingEventFile = (idx) => {
    setEventFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingEventImage = (url) => {
    setEventForm({ ...eventForm, images: eventForm.images.filter((img) => img !== url) });
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventSubmitting(true);
    try {
      const uploaded = [];
      for (const file of eventFiles) {
        uploaded.push(await uploadEventImage(file));
      }
      const images = [...eventForm.images, ...uploaded].slice(0, 4);
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        images,
        is_active: eventForm.is_active,
      };
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        toast.success("Event updated successfully.");
      } else {
        await createEvent(payload);
        toast.success("Event created successfully.");
      }
      resetEventForm();
      fetchEvents();
    } catch (err) {
      toast.error(err?.message || "Failed to save event.");
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title || "",
      description: ev.description || "",
      is_active: ev.is_active !== false,
      images: Array.isArray(ev.images) ? ev.images : [],
    });
    setEventFiles([]);
  };

  const handleToggleEventActive = async (ev) => {
    try {
      await updateEvent(ev.id, { is_active: ev.is_active === false });
      fetchEvents();
      toast.success(ev.is_active === false ? "Event published." : "Event hidden.");
    } catch (err) {
      toast.error("Failed to update event.");
    }
  };

  const handleDeleteEvent = async (ev) => {
    if (!window.confirm("Delete this event? Its uploaded images will also be removed.")) return;
    try {
      await deleteEventImages(ev.images);
      await deleteEvent(ev.id);
      fetchEvents();
      toast.success("Event deleted.");
    } catch (err) {
      toast.error("Failed to delete event.");
    }
  };

  /* ═══════════════════════════════════════════
     RENDER HELPERS
     ═══════════════════════════════════════════ */
  const renderOverview = () => {
    if (!analytics) return <p className="muted">No analytics data available.</p>;
    const a = analytics;

    const totalAppts =
      (a.appointmentStatus?.pending || 0) +
      (a.appointmentStatus?.confirmed || 0) +
      (a.appointmentStatus?.completed || 0) +
      (a.appointmentStatus?.cancelled || 0);

    return (
      <div className="overview-section">
        {/* ── KPI Cards ── */}
        <h3>Key Metrics</h3>
        <div className="stats-grid">
          <StatCard label="Total Users" value={a.totalUsers} color="#4f46e5" />
          <StatCard label="Doctors" value={a.totalDoctors} color="#10b981" />
          <StatCard label="Drivers" value={a.totalDrivers} color="#f59e0b" />
          <StatCard label="Vehicles" value={a.totalVehicles} color="#8b5cf6" />
          <StatCard label="Appointments (All)" value={a.totalAppointments} color="#06b6d4" />
          <StatCard label="Today's Appointments" value={a.todayAppointments} color="#ec4899" />
          <StatCard label="This Month" value={a.monthAppointments} color="#14b8a6" />
          <StatCard label="Consultations" value={a.totalConsultations} color="#f97316" />
          <StatCard
            label="Ambulance Requests"
            value={a.totalAmbulanceRequests}
            color="#ef4444"
          />
          <StatCard
            label="Critical Requests"
            value={a.criticalAmbulanceRequests}
            color="#dc2626"
          />
          <StatCard label="Messages" value={a.totalMessages} color="#6366f1" />
          <StatCard label="Repeat Prescriptions" value={a.totalRepeatPrescriptions} color="#84cc16" />
        </div>

        {/* ── Appointment Status ── */}
        <h3>Appointment Status</h3>
        <div className="progress-section">
          <ProgressBar
            label="Pending"
            count={a.appointmentStatus?.pending || 0}
            total={totalAppts}
            color="#f59e0b"
          />
          <ProgressBar
            label="Confirmed"
            count={a.appointmentStatus?.confirmed || 0}
            total={totalAppts}
            color="#3b82f6"
          />
          <ProgressBar
            label="Completed"
            count={a.appointmentStatus?.completed || 0}
            total={totalAppts}
            color="#10b981"
          />
          <ProgressBar
            label="Cancelled"
            count={a.appointmentStatus?.cancelled || 0}
            total={totalAppts}
            color="#ef4444"
          />
        </div>

        {/* ── Users by Role ── */}
        <h3>Users by Role</h3>
        <div className="chips-container">
          {a.usersByRole &&
            Object.entries(a.usersByRole).map(([role, count]) => (
              <span key={role} className="role-chip">
                <span className="chip-role">{role.replace(/_/g, " ")}</span>
                <span className="chip-count">{count}</span>
              </span>
            ))}
        </div>

        {/* ── Department Distribution ── */}
        {a.departmentDistribution && (
          <>
            <h3>Department Distribution</h3>
            <div className="progress-section">
              {Object.entries(a.departmentDistribution).map(([dept, count]) => (
                <ProgressBar
                  key={dept}
                  label={dept}
                  count={count}
                  total={a.totalDoctors || 1}
                  color="#6366f1"
                />
              ))}
            </div>
          </>
        )}

        {/* ── System Metrics ── */}
        <h3>System Metrics</h3>
        <div className="metrics-grid">
          {a.systemUptime !== undefined && (
            <div className="metric-item">
              <span className="metric-label">Uptime</span>
              <span className="metric-value">{a.systemUptime}%</span>
            </div>
          )}
          {a.activeUsers !== undefined && (
            <div className="metric-item">
              <span className="metric-label">Active Users (now)</span>
              <span className="metric-value">{a.activeUsers}</span>
            </div>
          )}
          {a.apiCallsToday !== undefined && (
            <div className="metric-item">
              <span className="metric-label">API Calls Today</span>
              <span className="metric-value">{a.apiCallsToday}</span>
            </div>
          )}
          {a.avgResponseTime !== undefined && (
            <div className="metric-item">
              <span className="metric-label">Avg Response (ms)</span>
              <span className="metric-value">{a.avgResponseTime}</span>
            </div>
          )}
        </div>

        {/* ── Recent Ambulance Requests ── */}
        {emergencies.length > 0 && (
          <>
            <h3>Recent Ambulance Requests</h3>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Ambulance Requests">
                <caption className="sr-only">Recent Ambulance Requests</caption>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {emergencies.slice(0, 10).map((e) => (
                    <tr key={e.id || e._id}>
                      <td className="mono">{(e.id || e._id || "").slice(0, 8)}</td>
                       <td>{e.patient_name || "—"}</td>
                      <td>
                        <span className={`badge badge-${e.status}`}>{e.status}</span>
                      </td>
                      <td>
                        <span className={`priority-badge priority-${e.emergency_level || e.priority || "normal"}`}>
                          {e.emergency_level || e.priority || "normal"}
                        </span>
                      </td>
                      <td>{e.created_at ? new Date(e.created_at).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  /* ── Admins Tab ── */
  const renderAdmins = () => (
    <div className="admins-section">
      <h3>Create Admin</h3>
      <form className="create-form" onSubmit={handleCreateAdmin}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={adminForm.fullName}
              onChange={handleAdminChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={adminForm.email}
              onChange={handleAdminChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={adminForm.password}
              onChange={handleAdminChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={adminForm.age}
              onChange={handleAdminChange}
              min={18}
              max={120}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={adminForm.gender} onChange={handleAdminChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={adminSubmitting}>
          {adminSubmitting ? "Creating…" : "Create Admin"}
        </button>
      </form>

      <h3>All Admins</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Admins">
          <caption className="sr-only">All Admins</caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id || a._id}>
                <td>{a.fullName || a.name}</td>
                <td>{a.email}</td>
                <td>
                  <span className={`role-chip role-${a.role}`}>{a.role}</span>
                </td>
                <td>
                  {a.role !== "super_admin" && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAdmin(a.id || a._id, a.role)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="muted text-center">
                  No admins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Hospitals Tab ── */
  const renderHospitals = () => (
    <div className="hospitals-section">
      <h3>{editingHospital ? "Edit Hospital" : "Add Partner Hospital"}</h3>
      <form className="create-form" onSubmit={handleHospitalSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Hospital Name</label>
            <input
              type="text"
              name="name"
              value={hospitalForm.name}
              onChange={handleHospitalChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={hospitalForm.address}
              onChange={handleHospitalChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={hospitalForm.latitude}
              onChange={handleHospitalChange}
            />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={hospitalForm.longitude}
              onChange={handleHospitalChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={hospitalForm.phone}
              onChange={handleHospitalChange}
            />
          </div>
          <div className="form-group">
            <label>Emergency Phone</label>
            <input
              type="tel"
              name="emergency_phone"
              value={hospitalForm.emergency_phone}
              onChange={handleHospitalChange}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Services (comma-separated)</label>
          <input
            type="text"
            name="services"
            value={hospitalForm.services}
            onChange={handleHospitalChange}
            placeholder="Cardiology, Neurology, Orthopedics"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={hospitalSubmitting}>
            {hospitalSubmitting
              ? "Saving…"
              : editingHospital
              ? "Update Hospital"
              : "Add Hospital"}
          </button>
          {editingHospital && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetHospitalForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>Hospital Map</h3>
      <div className="map-container">
        <Map
          markers={hospitals
            .filter((h) => h.latitude && h.longitude)
            .map((h) => ({
              id: h.id || h._id,
              name: h.name,
              lat: h.latitude,
              lng: h.longitude,
              type: "hospital",
            }))}
          height="400px"
        />
      </div>

      <h3>All Hospitals</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Hospitals">
          <caption className="sr-only">All Hospitals</caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Emergency</th>
              <th>Services</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id || h._id}>
                <td>{h.name}</td>
                <td>{h.address}</td>
                <td>{h.phone || "—"}</td>
                <td>{h.emergency_phone || "—"}</td>
                <td>
                  {Array.isArray(h.services)
                    ? h.services.join(", ")
                    : h.services || "—"}
                </td>
                <td className="actions-cell">
                  <button
                    className="btn btn-edit btn-sm"
                    onClick={() => handleEditHospital(h)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteHospital(h.id || h._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && (
              <tr>
                <td colSpan={6} className="muted text-center">
                  No hospitals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Emergency Tab ── */
  const renderEmergency = () => (
    <div className="emergency-section">
      <h3>Live Emergency Monitoring</h3>

      <div className="emergency-map-container">
        <Map
          markers={emergencies
            .filter((e) => e.latitude && e.longitude)
            .map((e) => ({
              id: e.id || e._id,
              name: `Emergency – ${e.patient_name || "Unknown"}`,
              lat: e.latitude,
              lng: e.longitude,
              type: "emergency",
              priority: e.emergency_level || e.priority || "normal",
            }))}
          height="450px"
        />
      </div>

      <h3>Active Emergencies ({emergencies.length})</h3>
      <div className="emergency-cards">
        {emergencies.length === 0 && (
          <p className="muted">No active emergencies at this time.</p>
        )}
        {emergencies.map((em) => (
          <div
            key={em.id || em._id}
            className={`emergency-card priority-border-${em.emergency_level || em.priority || "normal"}`}
          >
            <div className="emergency-card-header">
              <span className={`priority-badge priority-${em.emergency_level || em.priority || "normal"}`}>
                {em.emergency_level || em.priority || "normal"}
              </span>
              <span className={`badge badge-${em.status}`}>{em.status}</span>
            </div>
            <div className="emergency-card-body">
              <p>
                <strong>Patient:</strong> {em.patient_name || "—"}
              </p>
              <p>
                <strong>Phone:</strong> {em.contact_phone || "—"}
              </p>
              <p>
                <strong>Location:</strong>{" "}
                {em.location || "—"}
              </p>
              <p>
                <strong>Condition:</strong> {em.condition || "—"}
              </p>
              <p>
                <strong>Driver:</strong>{" "}
                {em.driverName || em.driver_name || "Unassigned"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {(em.createdAt || em.created_at) ? new Date(em.createdAt || em.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Logs Tab ── */
  const renderLogs = () => (
    <div className="logs-section">
      <h3>Recent Users</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Recent Users">
          <caption className="sr-only">Recent Users</caption>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {(logs.users || admins.slice(0, 20)).map((u, i) => (
              <tr key={u.id || u._id || i}>
                <td>{u.fullName || u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{(u.createdAt || u.created_at) ? new Date(u.createdAt || u.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Recent Appointments</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Recent Appointments">
          <caption className="sr-only">Recent Appointments</caption>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(logs.appointments || []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted text-center">
                  No recent appointments loaded.
                </td>
              </tr>
            )}
            {(logs.appointments || []).map((appt, i) => (
              <tr key={appt.id || appt._id || i}>
                <td className="mono">{(appt.id || appt._id || "").slice(0, 8)}</td>
                <td>{appt.patientName || appt.patient_name}</td>
                <td>{appt.doctorName || appt.doctor_name}</td>
                <td>
                  <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                </td>
                <td>{(appt.appointmentDate || appt.date) ? new Date(appt.appointmentDate || appt.date).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Recent Ambulance Activity</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Recent Ambulance Activity">
          <caption className="sr-only">Recent Ambulance Activity</caption>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(logs.emergencies || emergencies.slice(0, 20)).map((em, i) => (
              <tr key={em.id || em._id || i}>
                <td className="mono">{(em.id || em._id || "").slice(0, 8)}</td>
                <td>{em.patient_name || "—"}</td>
                <td>
                  <span className={`badge badge-${em.status}`}>{em.status}</span>
                </td>
                <td>{em.driver_name || "Unassigned"}</td>
                <td>{em.created_at ? new Date(em.created_at).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Live Incident Map</h3>
      <div className="map-container">
        <Map
          markers={emergencies
            .filter((e) => e.latitude && e.longitude)
            .map((e) => ({
              id: e.id || e._id,
               name: `Incident – ${e.patient_name || "Unknown"}`,
              lat: e.latitude,
              lng: e.longitude,
              type: "incident",
              priority: e.emergency_level || e.priority || "normal",
            }))}
          height="400px"
        />
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <h3>{editingEvent ? "Edit Event" : "Add Event"}</h3>
      <form className="create-form" onSubmit={handleEventSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={eventForm.title}
              onChange={handleEventChange}
              placeholder="e.g. Community Health Camp"
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="is_active" value={eventForm.is_active ? "true" : "false"} onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.value === "true" })}>
              <option value="true">Published</option>
              <option value="false">Hidden</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Caption / Description</label>
          <textarea
            name="description"
            value={eventForm.description}
            onChange={handleEventChange}
            rows={3}
            placeholder="Short caption shown with the event images"
          />
        </div>

        <div className="form-group">
          <label>Images (up to 4, never cropped)</label>
          <div className="event-image-grid" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {eventForm.images.map((url, i) => (
              <div key={`existing-${i}`} style={{ position: "relative", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <img src={url} alt={`Existing ${i + 1}`} style={{ width: 96, height: 96, objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: "absolute", top: 4, right: 4, padding: "2px 8px" }}
                  onClick={() => removeExistingEventImage(url)}
                >
                  ✕
                </button>
              </div>
            ))}
            {eventFiles.map((file, i) => (
              <div key={`pending-${i}`} style={{ position: "relative", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} style={{ width: 96, height: 96, objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: "absolute", top: 4, right: 4, padding: "2px 8px" }}
                  onClick={() => removePendingEventFile(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            {eventForm.images.length + eventFiles.length < 4 && (
              <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", alignSelf: "center", marginBottom: 0 }}>
                + Add Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleEventFilesChange}
                />
              </label>
            )}
          </div>
          <small className="muted">Files are uploaded to the public “images” bucket.</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={eventSubmitting}>
            {eventSubmitting ? "Saving…" : editingEvent ? "Update Event" : "Add Event"}
          </button>
          {(editingEvent || eventFiles.length || eventForm.images.length) && (
            <button type="button" className="btn btn-secondary" onClick={resetEventForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>All Events</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Events">
          <caption className="sr-only">All Events</caption>
          <thead>
            <tr>
              <th>Title</th>
              <th>Images</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <strong>{ev.title || "—"}</strong>
                  {ev.description && (
                    <div className="muted" style={{ fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.description}
                    </div>
                  )}
                </td>
                <td>{(Array.isArray(ev.images) ? ev.images.length : 0)} image(s)</td>
                <td>{ev.created_at ? new Date(ev.created_at).toLocaleDateString() : "—"}</td>
                <td>
                  <span className={`badge ${ev.is_active === false ? "badge-cancelled" : "badge-active"}`}>
                    {ev.is_active === false ? "Hidden" : "Published"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditEvent(ev)}>
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggleEventActive(ev)}>
                    {ev.is_active === false ? "Publish" : "Hide"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(ev)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="muted text-center">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     TAB CONTENT DISPATCH
     ═══════════════════════════════════════════ */
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "admins":
        return renderAdmins();
      case "hospitals":
        return renderHospitals();
      case "emergency":
        return renderEmergency();
      case "events":
        return renderEvents();
      case "logs":
        return renderLogs();
      default:
        return null;
    }
  };

  /* ═══════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="admin-dashboard">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <h1>Super Admin Dashboard</h1>
          </div>
          <div className="header-right">
            <span className="user-badge">
              👤 {user?.full_name || "Super Admin"}
            </span>
          </div>
        </header>

        {/* ── Content ── */}
        <section className="tab-content" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Loading dashboard…</p>
            </div>
          ) : error ? (
            <div className="error-banner">{error}</div>
          ) : (
            renderTabContent()
          )}
        </section>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
