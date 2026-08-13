import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAppointments,
  getConsultations,
  getAmbulanceHistory,
} from '../api';
import { getPrescriptions } from '../api';
import { extractArray } from '../utils/api-helpers';
import EmergencyCta from '../components/EmergencyCta';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [ambulanceHistory, setAmbulanceHistory] = useState([]);
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
        const [apptRes, consulRes, prescRes, ambuRes] = await Promise.allSettled([
          getAppointments(),
          getConsultations(),
          getPrescriptions(),
          getAmbulanceHistory(),
        ]);
        if (cancelled) return;
        if (apptRes.status === 'fulfilled') setAppointments(extractArray(apptRes.value, 'appointments'));
        if (consulRes.status === 'fulfilled') setConsultations(extractArray(consulRes.value, 'consultations'));
        if (prescRes.status === 'fulfilled') setPrescriptions(extractArray(prescRes.value, 'prescriptions'));
        if (ambuRes.status === 'fulfilled') setAmbulanceHistory(extractArray(ambuRes.value, 'rides'));
        const failures = [apptRes, consulRes, prescRes, ambuRes].filter((r) => r.status === 'rejected');
        if (failures.length === 4) setError('Failed to load dashboard data. Please try again later.');
      } catch (err) {
        if (!cancelled) setError(err.message || 'An unexpected error occurred while loading your dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const todayString = new Date().toISOString().slice(0, 10);
  const todaysAppointments = appointments.filter((a) => {
    const apptDate = (a.appointment_date || a.appointmentDate || '').slice(0, 10);
    return apptDate === todayString;
  });
  const pendingConsultations = consultations.filter((c) => c.status === 'pending');
  const activePrescriptions = prescriptions.filter(
    (p) => p.status === 'active' || p.repeat === true || p.is_repeat === true || p.type === 'repeat-prescription'
  );
  const activeAmbulanceRequests = ambulanceHistory.filter(
    (a) => a.status === 'active' || a.status === 'dispatched' || a.status === 'en_route'
  );

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

      {/* Stats Row */}
      <section className="stats-row">
        <div className="stat-card-hero blue">
          <div className="stat-icon-wrap blue">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{todaysAppointments.length}</h3>
            <p>Appointments Today</p>
          </div>
        </div>

        <div className="stat-card-hero amber">
          <div className="stat-icon-wrap amber">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{pendingConsultations.length}</h3>
            <p>Pending Consultations</p>
          </div>
        </div>

        <div className="stat-card-hero green">
          <div className="stat-icon-wrap green">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28A745" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{activePrescriptions.length}</h3>
            <p>Active Prescriptions</p>
          </div>
        </div>

        <div className="stat-card-hero red">
          <div className="stat-icon-wrap red">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div className="stat-info">
            <h3>{activeAmbulanceRequests.length}</h3>
            <p>Ambulance Requests</p>
          </div>
        </div>
      </section>

      {/* Emergency CTA */}
      <EmergencyCta />

      {/* Quick Actions */}
      <section className="quick-actions-grid">
        <Link to="/appointments" className="quick-action-card">
          <div className="quick-action-icon blue">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="12" y1="14" x2="12" y2="18" />
              <line x1="10" y1="16" x2="14" y2="16" />
            </svg>
          </div>
          <h3>Book Appointment</h3>
          <p>Schedule a visit with your doctor</p>
        </Link>

        <Link to="/consultations" className="quick-action-card">
          <div className="quick-action-icon teal">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <h3>Consultation</h3>
          <p>Start or continue a consultation</p>
        </Link>

        <Link to="/sos" className="quick-action-card">
          <div className="quick-action-icon red">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC3545" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3>Emergency SOS</h3>
          <p>Dispatch an emergency ambulance now</p>
        </Link>

        <Link to="/forms" className="quick-action-card">
          <div className="quick-action-icon green">
            <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#28A745" strokeWidth="2">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="16" x2="12" y2="16" />
            </svg>
          </div>
          <h3>Medical Forms</h3>
          <p>Fill out and submit medical forms</p>
        </Link>
      </section>

      {/* Today's Appointments */}
      {todaysAppointments.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 className="dashboard-section-title">
            Today's Appointments
            <span className="count">{todaysAppointments.length}</span>
          </h2>
          <div className="dashboard-grid">
            {todaysAppointments.map((appt) => (
              <div className="card" key={appt.id || appt._id}>
                <div className="card-body">
                  <h4 style={{ marginBottom: 8 }}>{appt.doctor_name || appt.doctorName || 'Doctor'}</h4>
                  <p style={{ margin: '4px 0', fontSize: 14 }}>
                    <strong>Time:</strong> {appt.appointment_time || appt.appointmentTime || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: 14 }}>
                    <strong>Type:</strong> {appt.type || appt.visit_type || 'General'}
                  </p>
                  {appt.department && <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Dept:</strong> {appt.department}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Consultations */}
      {pendingConsultations.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 className="dashboard-section-title">
            Pending Consultations
            <span className="count">{pendingConsultations.length}</span>
          </h2>
          <div className="dashboard-grid">
            {pendingConsultations.map((cons) => (
              <div className="card" key={cons.id || cons._id}>
                <div className="card-body">
                  <h4 style={{ marginBottom: 8 }}>{cons.title || cons.subject || 'Consultation'}</h4>
                  <p style={{ margin: '4px 0', fontSize: 14 }}>
                    <strong>Status:</strong>{' '}
                    <span className="badge badge-pending">{cons.status}</span>
                  </p>
                  {cons.doctor_name && <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Doctor:</strong> {cons.doctor_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Ambulance Requests */}
      {activeAmbulanceRequests.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 className="dashboard-section-title">
            Active Ambulance Requests
            <span className="count">{activeAmbulanceRequests.length}</span>
          </h2>
          <div className="dashboard-grid">
            {activeAmbulanceRequests.map((amb) => (
              <div className="card" key={amb.id || amb._id}>
                <div className="card-body">
                  <h4 style={{ marginBottom: 8 }}>Ambulance Request</h4>
                  <p style={{ margin: '4px 0', fontSize: 14 }}>
                    <strong>Status:</strong>{' '}
                    <span className="badge badge-pending">{amb.status}</span>
                  </p>
                  <p style={{ margin: '4px 0', fontSize: 14 }}>
                    <strong>Level:</strong> {amb.emergency_level || amb.emergencyLevel || 'N/A'}
                  </p>
                  {(amb.id || amb.tracking_id) && (
                    <Link to={`/track/${amb.tracking_id || amb.id}`} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
                      Track Ambulance
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </main>
  );
};

export default UserDashboard;
