import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAppointments,
  getConsultations,
  getAmbulanceHistory,
  getPrescriptions,
  getMyFormSubmissions,
} from '../api';
import { extractArray } from '../utils/api-helpers';
import EmergencyCta from '../components/EmergencyCta';

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sw = startOfWeek(now);
  const ew = new Date(sw);
  ew.setDate(sw.getDate() + 7);
  return d >= sw && d < ew;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [ambulanceHistory, setAmbulanceHistory] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-open the onboarding wizard for patients who haven't completed or
  // skipped it yet. Once they finish (or skip), they won't be redirected again.
  useEffect(() => {
    if (
      user &&
      user.role === 'user' &&
      user.onboarding_status &&
      user.onboarding_status !== 'complete' &&
      user.onboarding_status !== 'skipped'
    ) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [apptRes, consulRes, prescRes, ambuRes, formRes] = await Promise.allSettled([
          getAppointments(),
          getConsultations(),
          getPrescriptions(),
          getAmbulanceHistory(),
          getMyFormSubmissions(),
        ]);
        if (cancelled) return;
        if (apptRes.status === 'fulfilled') setAppointments(extractArray(apptRes.value, 'appointments'));
        if (consulRes.status === 'fulfilled') setConsultations(extractArray(consulRes.value, 'consultations'));
        if (prescRes.status === 'fulfilled') setPrescriptions(extractArray(prescRes.value, 'prescriptions'));
        if (ambuRes.status === 'fulfilled') setAmbulanceHistory(extractArray(ambuRes.value, 'rides'));
        if (formRes.status === 'fulfilled') setFormSubmissions(extractArray(formRes.value, 'submissions'));
        const failures = [apptRes, consulRes, prescRes, ambuRes, formRes].filter((r) => r.status === 'rejected');
        if (failures.length === 5) setError('Failed to load dashboard data. Please try again later.');
      } catch (err) {
        if (!cancelled) setError(err.message || 'An unexpected error occurred while loading your dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  );
  const thisWeekAppointments = appointments.filter((a) => isThisWeek(a.appointment_date || a.appointmentDate));
  const openConsultations = consultations.filter((c) => !c.response);
  const activeAmbulanceRequests = ambulanceHistory.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled'
  );
  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'pending');

  const stats = [
    { to: '/appointments', label: 'Appointments', count: appointments.length, color: 'blue', icon: 'calendar' },
    { to: '/consultations', label: 'Consultations', count: consultations.length, color: 'amber', icon: 'chat' },
    { to: '/prescriptions', label: 'Prescriptions', count: prescriptions.length, color: 'green', icon: 'bookmark' },
    { to: '/emergencies', label: 'Ambulance Requests', count: ambulanceHistory.length, color: 'red', icon: 'phone' },
    { to: '/form-history', label: 'Medical Forms', count: formSubmissions.length, color: 'teal', icon: 'doc' },
  ];

  const activityTileHex = {
    blue: '#3b82f6',
    cyan: '#0891b2',
    amber: '#f59e0b',
    red: '#dc2626',
    green: '#16a34a',
    purple: '#7c3aed',
  };

  const activityTiles = [
    { to: '/appointments', label: 'Appointments this week', count: thisWeekAppointments.length, color: 'blue', icon: 'calendar' },
    { to: '/appointments', label: 'Upcoming appointments', count: upcomingAppointments.length, color: 'cyan', icon: 'clock' },
    { to: '/consultations', label: 'Open consultations', count: openConsultations.length, color: 'amber', icon: 'chat' },
    { to: '/emergencies', label: 'Live SOS requests', count: activeAmbulanceRequests.length, color: 'red', icon: 'phone' },
    { to: '/prescriptions', label: 'Prescriptions pending', count: pendingPrescriptions.length, color: 'green', icon: 'bookmark' },
    { to: '/form-history', label: 'Forms submitted', count: formSubmissions.length, color: 'purple', icon: 'doc' },
  ];

  const statIcon = (name, color) => {
    const stroke = (fallback) => color || fallback;
    switch (name) {
      case 'calendar':
        return (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke('#3b82f6')} strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'clock':
        return (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke('#0891b2')} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'chat':
        return (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke('#f59e0b')} strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        );
      case 'bookmark':
        return (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke('#28A745')} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        );
      case 'phone':
        return (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke('#DC3545')} strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        );
      case 'doc':
        return (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke('#0891b2')} strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <main className="dashboard-container" role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-container">
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-greeting">{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Patient'}</h1>
        <p className="hero-subtitle">Here's an overview of your healthcare dashboard. Stay on top of your appointments, consultations, and health records.</p>
      </section>

      {/* Onboarding nudge (skipped users) */}
      {user?.role === 'user' && user?.onboarding_status === 'skipped' && (
        <section className="card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }} aria-hidden="true">🩺</span>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Complete your medical profile</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                Fill it in once and every medical form will be auto-filled for you.
              </p>
            </div>
          </div>
          <Link to="/onboarding" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
            Complete Now
          </Link>
        </section>
      )}

      {/* Stats Row — clickable, each shows the total count */}
      <section className="stats-row">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className={`stat-card-hero ${s.color}`}>
            <div className={`stat-icon-wrap ${s.color}`}>
              {statIcon(s.icon)}
            </div>
            <div className="stat-info">
              <h3>{s.count}</h3>
              <p>{s.label}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Emergency CTA */}
      <EmergencyCta />

      {/* Health Activity Overview */}
      <section style={{ marginBottom: 32 }}>
        <h2 className="dashboard-section-title">Health Activity Overview</h2>
        <div className="activity-tiles-grid">
          {activityTiles.map((tile) => (
            <Link key={tile.label} to={tile.to} className={`activity-tile ${tile.color}`}>
              <span className="activity-tile-icon" aria-hidden="true">
                {statIcon(tile.icon, activityTileHex[tile.color])}
              </span>
              <span className="activity-tile-count">{tile.count}</span>
              <span className="activity-tile-label">{tile.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default UserDashboard;
