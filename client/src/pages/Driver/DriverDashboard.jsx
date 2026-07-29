import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Map from '../../components/Map';
import {
  getDriverRides,
  updateRideStatus,
  getHospitals,
  updateDriverLocation,
} from '../../api';
import { getSmartLocation } from '../../utils/geolocation';
import { useToast } from '../../components/ToastContext';

const STATUS_FLOW = {
  dispatched: { next: 'in_transit', label: 'Set Off', color: '#2563eb', bg: '#dbeafe' },
  in_transit: { next: 'arrived', label: 'Mark Arrived', color: '#d97706', bg: '#fef3c7' },
  arrived: { next: 'completed', label: 'Mark Completed', color: '#16a34a', bg: '#dcfce7' },
};

const emergencyColors = {
  critical: { bg: '#fee2e2', color: '#991b1b', label: 'Critical' },
  urgent: { bg: '#fef3c7', color: '#92400e', label: 'Urgent' },
  moderate: { bg: '#dbeafe', color: '#1e40af', label: 'Moderate' },
  low: { bg: '#dcfce7', color: '#166534', label: 'Low' },
};

const rideStatusStyles = {
  dispatched: { bg: '#dbeafe', color: '#1e40af', label: 'Dispatched' },
  in_transit: { bg: '#fef3c7', color: '#92400e', label: 'In Transit' },
  arrived: { bg: '#d1fae5', color: '#065f46', label: 'Arrived' },
  completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const tabs = [
  { key: 'rides', label: 'Rides', icon: '🚑' },
  { key: 'map', label: 'Map', icon: '🗺' },
  { key: 'alerts', label: 'Alerts', icon: '🔔' },
];

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: 24,
};

const btnStyle = (color, bg) => ({
  padding: '10px 22px',
  backgroundColor: bg,
  color: color,
  border: `1px solid ${color}30`,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
});

export default function DriverDashboard() {
  const { user } = useAuth();
  const { tab } = useParams();
  const sidebarTabMap = {
    dashboard: 'rides',
    assignments: 'rides',
    history: 'history',
    profile: 'profile',
  };
  const [activeTab, setActiveTab] = useState(sidebarTabMap[tab] || 'rides');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rides, setRides] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const locationTimerRef = useRef(null);

  const toast = useToast();

  // ── Data loading ────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const driverId = user?.id;
      const [ridesRes, hospRes] = await Promise.all([
        getDriverRides(driverId).catch(() => ({ data: [] })),
        getHospitals().catch(() => ({ data: [] })),
      ]);

      setRides(ridesRes.data?.rides || ridesRes.data || []);
      setHospitals(hospRes.data?.hospitals || hospRes.data || []);
    } catch (err) {
      console.error('Failed to load driver data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
    else setLoading(false);
  }, [user, loadAll]);

  // ── Live location tracking ──────────────────────────────
  const updateLocation = useCallback(async () => {
    try {
      const loc = await getSmartLocation();
      setDriverLocation({ lat: loc.lat, lng: loc.lng, name: user?.full_name || 'Driver' });

      const driverId = user?.id;
      if (driverId) {
        updateDriverLocation(driverId, { lat: loc.lat, lng: loc.lng }).catch(() => {});
      }
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    updateLocation();
    locationTimerRef.current = setInterval(updateLocation, 5000);
    return () => clearInterval(locationTimerRef.current);
  }, [updateLocation]);

  // ── Derived data ────────────────────────────────────────
  const activeRides = rides.filter((r) => ['dispatched', 'in_transit', 'arrived'].includes(r.status));
  const pastRides = rides.filter((r) => ['completed', 'cancelled'].includes(r.status));

  const patientMarkers = activeRides
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      priority: r.emergency_level || 'moderate',
      title: `Patient: ${r.patient_name || 'Unknown'}`,
      patientName: r.patient_name,
      address: r.location || '',
    }));

  const hospitalMarkers = hospitals
    .filter((h) => h.latitude && h.longitude)
    .map((h) => ({
      lat: h.latitude,
      lng: h.longitude,
      name: h.name,
      address: h.address,
    }));

  // ── Handlers ────────────────────────────────────────────
  const handleStatusUpdate = async (rideId, newStatus) => {
    setUpdatingId(rideId);
    try {
      await updateRideStatus(rideId, { status: newStatus });
      setRides((prev) =>
        prev.map((r) => (r.id === rideId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Failed to update ride status:', err);
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Auto-refresh rides ────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      getDriverRides(user.id)
        .then((res) => setRides(res.data?.rides || res.data || []))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Loading guard ───────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={spinnerStyle} />
            <p style={{ color: '#6b7280', marginTop: 12, fontSize: 14 }}>Loading driver dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab content renderers ───────────────────────────────

  const renderRides = () => (
    <div>
      {/* Live map preview at top */}
      {patientMarkers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Patient Locations</h3>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <Map
              center={driverLocation ? [driverLocation.lat, driverLocation.lng] : [33.8938, 35.5018]}
              zoom={13}
              markers={patientMarkers}
              hospitals={hospitalMarkers}
              driverLocation={driverLocation}
              showRoute={activeRides.length > 0}
              height="320px"
            />
          </div>
        </div>
      )}

      {/* Active Rides */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
          Active Rides ({activeRides.length})
        </h3>
        {activeRides.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚑</div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>No active rides. You are on standby.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {activeRides.map((ride) => {
              const ec = emergencyColors[ride.emergency_level] || emergencyColors.moderate;
              const st = rideStatusStyles[ride.status] || rideStatusStyles.dispatched;
              const flow = STATUS_FLOW[ride.status];
              return (
                <div key={ride.id} style={{ ...cardStyle, borderLeft: `4px solid ${ec.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, backgroundColor: ec.bg, color: ec.color, textTransform: 'uppercase' }}>
                        {ec.label}
                      </span>
                      <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    {flow && (
                      <button
                        onClick={() => handleStatusUpdate(ride.id, flow.next)}
                        disabled={updatingId === ride.id}
                        style={btnStyle(flow.color, flow.bg)}
                      >
                        {updatingId === ride.id ? 'Updating...' : flow.label}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div>
                      <div style={labelStyle}>Patient</div>
                      <div style={valueStyle}>{ride.patient_name || 'Unknown'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Contact</div>
                      <div style={valueStyle}>{ride.contact_phone || '-'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Location</div>
                      <div style={valueStyle}>{ride.location || '-'}</div>
                    </div>
                    {ride.latitude && ride.longitude && (
                      <div>
                        <div style={labelStyle}>Coordinates</div>
                        <div style={valueStyle}>{ride.latitude.toFixed(5)}, {ride.longitude.toFixed(5)}</div>
                      </div>
                    )}
                    <div>
                      <div style={labelStyle}>Destination</div>
                      <div style={valueStyle}>{ride.destination || 'Rodab Medical Hospital'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Condition</div>
                      <div style={valueStyle}>{ride.condition || '-'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>Assigned At</div>
                      <div style={valueStyle}>{ride.assigned_at ? new Date(ride.assigned_at).toLocaleString() : ride.created_at ? new Date(ride.created_at).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Rides */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#6b7280', marginBottom: 16 }}>
          Past Rides ({pastRides.length})
        </h3>
        {pastRides.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No past rides.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.7 }}>
            {pastRides.map((ride) => {
              const st = rideStatusStyles[ride.status] || rideStatusStyles.completed;
              return (
                <div key={ride.id} style={{ ...cardStyle, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{ride.patient_name || 'Patient'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{ride.location || '-'} {ride.date ? ` - ${ride.date}` : ''}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderMap = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quick actions for active rides */}
      {activeRides.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeRides.map((ride) => {
            const flow = STATUS_FLOW[ride.status];
            return flow ? (
              <button
                key={ride.id}
                onClick={() => handleStatusUpdate(ride.id, flow.next)}
                disabled={updatingId === ride.id}
                style={btnStyle(flow.color, flow.bg)}
              >
                {ride.patient_name || 'Patient'}: {updatingId === ride.id ? '...' : flow.label}
              </button>
            ) : null;
          })}
        </div>
      )}

      {/* Full page map */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', height: 'calc(100vh - 220px)', minHeight: 400 }}>
        <Map
          center={driverLocation ? [driverLocation.lat, driverLocation.lng] : [33.8938, 35.5018]}
          zoom={13}
          markers={patientMarkers}
          hospitals={hospitalMarkers}
          driverLocation={driverLocation}
          showRoute={activeRides.length > 0}
          height="100%"
        />
      </div>

      {/* Driver location info */}
      {driverLocation && (
        <div style={{ ...cardStyle, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#16a34a', animation: 'pulse 2s infinite' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Your Location</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)} - Updates every 5s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div>
      <div style={{ ...cardStyle, marginBottom: 20, borderLeft: '4px solid #dc2626' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>🔔</span>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Emergency Alerts</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Active ambulance assignments and notifications</p>
          </div>
        </div>
      </div>

      {activeRides.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>All Clear</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>No active emergency assignments. You will be notified when a new ride is assigned.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeRides.map((ride) => {
            const ec = emergencyColors[ride.emergency_level] || emergencyColors.moderate;
            const st = rideStatusStyles[ride.status] || rideStatusStyles.dispatched;
            return (
              <div key={ride.id} style={{ ...cardStyle, borderLeft: `4px solid ${ec.color}`, backgroundColor: '#fffbeb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: ec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    🚑
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {ride.patient_name || 'Patient'} - {ec.label} Emergency
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      Status: {st.label} | Condition: {ride.condition || '-'}
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, backgroundColor: ec.bg, color: ec.color, textTransform: 'uppercase', flexShrink: 0 }}>
                    {ec.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  <div>📞 {ride.contact_phone || 'No phone'}</div>
                  <div>📍 {ride.location || 'Location not available'}</div>
                  {ride.destination && <div>🏥 Destination: {ride.destination}</div>}
                  {ride.assigned_at && <div>🕐 Assigned: {new Date(ride.assigned_at).toLocaleString()}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info note */}
      <div style={{ ...cardStyle, marginTop: 20, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.6 }}>
            <strong>How Alerts Work:</strong> When a patient requests an ambulance, the system dispatches the nearest available driver. Your location is tracked in real-time. Update your ride status as you respond to the emergency to keep the patient and hospital informed.
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main render ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="dashboard-main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >☰</button>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
                Driver Dashboard
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {user?.full_name || 'Driver'} - Active Rides: {activeRides.length}
              </p>
            </div>
          </div>
          {activeRides.length > 0 && (
            <div style={{ padding: '8px 16px', borderRadius: 999, backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>{activeRides.length} Active Ride{activeRides.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div role="tablist" style={{ display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: activeTab === tab.key ? '#d97706' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#6b7280',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Content */}
        {activeTab === 'rides' && <div role="tabpanel" id="tabpanel-rides" aria-labelledby="tab-rides">{renderRides()}</div>}
        {activeTab === 'map' && <div role="tabpanel" id="tabpanel-map" aria-labelledby="tab-map">{renderMap()}</div>}
        {activeTab === 'alerts' && <div role="tabpanel" id="tabpanel-alerts" aria-labelledby="tab-alerts">{renderAlerts()}</div>}
      </main>
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────
const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 2,
};

const valueStyle = {
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
};

const spinnerStyle = {
  width: 36,
  height: 36,
  border: '3px solid #e5e7eb',
  borderTopColor: '#d97706',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  margin: '0 auto',
};
