import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map from './Map';
import { getActiveEmergencies, getDrivers } from '../api';
import { subscribeAllDrivers } from '../utils/realtime';

const NEAR_CLIENT_M = 120;
const NEAR_HOSPITAL_M = 200;
const MAX_HISTORY = 120;

function haversineMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function getDriverRow(profile) {
  if (!profile) return null;
  return Array.isArray(profile.drivers) ? profile.drivers[0] : profile.drivers;
}

function formatKm(meters) {
  if (meters == null) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

const LiveMonitor = ({ hospitals = [], mapHeight = '480px' }) => {
  const [emergencies, setEmergencies] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({});
  const [paths, setPaths] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState('');
  const historyRef = useRef({});

  // Applies a single driver fix to the movement trail, speed and last-update
  // stats. Shared by the polled snapshot and the realtime subscription.
  const handleDriverFix = useCallback((key, dr) => {
    const lat = dr?.current_latitude;
    const lng = dr?.current_longitude;
    if (lat == null || lng == null || key == null) return;

    const now = Date.now();
    const hist = historyRef.current[key] || [];
    hist.push({ lat, lng, ts: now });
    if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY);
    historyRef.current[key] = hist;

    let speedKmh = null;
    let moving = null;
    const prev = hist[hist.length - 2];
    if (prev) {
      const dtSec = (now - prev.ts) / 1000;
      const distM = haversineMeters(prev.lat, prev.lng, lat, lng) || 0;
      if (dtSec > 0) {
        const speedMs = distM / dtSec;
        speedKmh = Math.round(speedMs * 3.6);
        moving = speedKmh >= 2;
      }
    }

    setStats((prevStats) => ({
      ...prevStats,
      [key]: { speedKmh, moving, lastUpdate: dr?.last_location_update || null },
    }));

    if (hist.length > 1) {
      const p = hist.map((h) => [h.lat, h.lng]);
      p.color = '#0b2a57';
      setPaths((prevPaths) => ({ ...prevPaths, [key]: p }));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const [emRes, drRes] = await Promise.allSettled([getActiveEmergencies(), getDrivers()]);

    if (emRes.status === 'fulfilled') {
      const data = emRes.value?.data || {};
      const list = data.active || data.emergencies || data.rides || [];
      setEmergencies(list);
    }

    if (drRes.status === 'fulfilled') {
      const data = drRes.value?.data || {};
      const raw = data.drivers || [];

      raw.forEach((d) => {
        handleDriverFix(d.id, getDriverRow(d));
      });

      setDrivers(raw);
    }

    setLastRefresh(new Date());
  }, [handleDriverFix]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // Realtime: driver fixes push instantly so markers and trails move live.
  useEffect(() => {
    const unsubscribe = subscribeAllDrivers((row) => {
      const { profile_id, id, current_latitude, current_longitude, last_location_update } = row;
      if (profile_id == null || current_latitude == null || current_longitude == null) return;

      setDrivers((prev) =>
        prev.map((p) => {
          if (p.id !== profile_id) return p;
          const dr = getDriverRow(p);
          if (!dr || dr.id !== id) return p;
          const updated = { ...dr, current_latitude, current_longitude, last_location_update };
          return { ...p, drivers: Array.isArray(p.drivers) ? [updated] : updated };
        })
      );

      handleDriverFix(profile_id, row);
    });
    return unsubscribe;
  }, [handleDriverFix]);

  const activeDriverIds = useMemo(() => {
    const s = new Set();
    emergencies.forEach((e) => {
      if (e.driver_id) s.add(e.driver_id);
    });
    return s;
  }, [emergencies]);

  const patientMarkers = useMemo(
    () =>
      emergencies
        .filter((e) => e.latitude && e.longitude)
        .map((e) => ({
          id: e.id,
          lat: e.latitude,
          lng: e.longitude,
          priority: e.emergency_level || e.priority || 'normal',
          title: `Patient: ${e.patient_name || 'Unknown'}`,
          patientName: e.patient_name,
          address: e.location || e.pickup_address || '',
        })),
    [emergencies]
  );

  const hospitalMarkers = useMemo(
    () =>
      hospitals
        .filter((h) => h.latitude && h.longitude)
        .map((h) => ({
          id: h.id || h._id,
          lat: h.latitude,
          lng: h.longitude,
          name: h.name,
          address: h.address,
        })),
    [hospitals]
  );

  const driverMarkers = useMemo(
    () =>
      drivers
        .map((d) => {
          const dr = getDriverRow(d);
          const lat = dr?.current_latitude;
          const lng = dr?.current_longitude;
          if (lat == null || lng == null || d.id == null) return null;

          const isOnRide = activeDriverIds.has(d.id);
          const available = dr?.is_available !== false && dr?.status !== 'off_duty';
          const color = isOnRide ? '#dc2626' : available ? '#16a34a' : '#6b7280';

          const st = stats[d.id];
          let lastUpdateLabel = 'no update';
          if (st?.lastUpdate) {
            const ageMin = (Date.now() - new Date(st.lastUpdate).getTime()) / 60000;
            lastUpdateLabel = ageMin < 1 ? 'just now' : `${Math.round(ageMin)} min ago`;
          }

          return {
            id: d.id,
            name: d.full_name || 'Ambulance',
            lat,
            lng,
            color,
            iconLabel: isOnRide ? 'R' : 'A',
            pulse: isOnRide,
            statusLabel: isOnRide ? 'ON RIDE' : available ? 'AVAILABLE' : 'OFF DUTY',
            lastUpdate: lastUpdateLabel,
          };
        })
        .filter(Boolean),
    [drivers, activeDriverIds, stats]
  );

  const driverPathList = useMemo(() => Object.values(paths), [paths]);

  const selected = emergencies.find((e) => e.id === selectedId) || null;
  const selectedProfile = selected ? drivers.find((d) => d.id === selected.driver_id) : null;
  const selectedRow = selectedProfile ? getDriverRow(selectedProfile) : null;
  const selPos =
    selected && selectedRow?.current_latitude != null
      ? { lat: selectedRow.current_latitude, lng: selectedRow.current_longitude }
      : null;
  const selStats = selectedProfile ? stats[selectedProfile.id] : null;

  let nearestHospital = null;
  let distanceToPatient = null;
  let distanceToHospital = null;
  if (selPos) {
    if (selected && selected.latitude && selected.longitude) {
      distanceToPatient = haversineMeters(selPos.lat, selPos.lng, selected.latitude, selected.longitude);
    }
    hospitals.forEach((h) => {
      if (!h.latitude || !h.longitude) return;
      const d = haversineMeters(selPos.lat, selPos.lng, h.latitude, h.longitude);
      if (d == null) return;
      if (!nearestHospital || d < nearestHospital.d) nearestHospital = { ...h, d };
    });
    distanceToHospital = nearestHospital ? nearestHospital.d : null;
  }

  const reachedClient =
    selected && (selected.status === 'arrived' || (distanceToPatient != null && distanceToPatient <= NEAR_CLIENT_M));
  const reachedHospital =
    selected && (selected.status === 'completed' || (distanceToHospital != null && distanceToHospital <= NEAR_HOSPITAL_M));

  const mapCenter = useMemo(() => {
    if (selPos) return [selPos.lat, selPos.lng];
    if (driverMarkers.length) {
      const lat = driverMarkers.reduce((s, m) => s + m.lat, 0) / driverMarkers.length;
      const lng = driverMarkers.reduce((s, m) => s + m.lng, 0) / driverMarkers.length;
      return [lat, lng];
    }
    return [0.3476, 32.5825];
  }, [selPos, driverMarkers]);

  const trackMarkers = selected ? patientMarkers.filter((m) => m.id === selected.id) : patientMarkers;
  const trackDriverLocation =
    selected && selPos ? { ...selPos, name: selectedProfile?.full_name || 'Ambulance' } : null;

  const selectedByDriverName = (e) => {
    const p = drivers.find((d) => d.id === e.driver_id);
    return p?.full_name || 'Unassigned';
  };

  const speedLabel = (s) => {
    if (!s) return '—';
    if (s.speedKmh == null) return '—';
    return `${s.speedKmh} km/h`;
  };

  const motionLabel = (s) => {
    if (!s || s.moving == null) return 'No signal';
    return s.moving ? 'Moving' : 'Static';
  };

  const statusBadgeClass = (e) => `badge badge-${e.status || 'requested'}`;

  return (
    <div className="live-monitor">
      <div className="live-monitor-toolbar">
        <div className="live-monitor-stats">
          <span className="live-dot" />
          <strong>LIVE</strong>
          <span className="toolbar-sep">·</span>
          <span>
            <strong>{emergencies.length}</strong> active ride{emergencies.length === 1 ? '' : 's'}
          </span>
          <span className="toolbar-sep">·</span>
          <span>
            <strong>{drivers.filter((d) => getDriverRow(d)?.current_latitude != null).length}</strong> ambulance
            {drivers.filter((d) => getDriverRow(d)?.current_latitude != null).length === 1 ? '' : 's'} on map
          </span>
          <span className="toolbar-sep">·</span>
          <span className="live-refresh">refreshed {lastRefresh ? lastRefresh.toLocaleTimeString() : '…'}</span>
        </div>
        {selected && (
          <button className="live-clear-btn" onClick={() => setSelectedId(null)}>
            Clear selection
          </button>
        )}
      </div>

      {error && <div className="live-error">Monitoring error: {error}</div>}

      <div className="live-monitor-grid">
        <div className="live-map-shell">
          <Map
            center={mapCenter}
            zoom={12}
            markers={trackMarkers}
            hospitals={hospitalMarkers}
            drivers={driverMarkers}
            driverPaths={driverPathList}
            driverLocation={trackDriverLocation}
            showRoute={!!trackDriverLocation}
            height={mapHeight}
          />
        </div>

        <div className="live-side">
          {selected && (
            <div className="live-tracker">
              <div className="live-tracker-header">
                <div>
                  <span className="live-tracker-title">Session Tracker</span>
                  <span className="live-tracker-patient">{selected.patient_name || 'Unknown patient'}</span>
                </div>
                <button className="live-tracker-close" onClick={() => setSelectedId(null)} aria-label="Close tracker">
                  ×
                </button>
              </div>

              <div className="live-tracker-status-row">
                <span className={`live-pill ${selStats?.moving ? 'live-pill-ok' : 'live-pill-muted'}`}>
                  {motionLabel(selStats)}
                </span>
                <span className="live-pill live-pill-accent">{speedLabel(selStats)}</span>
                <span className={`live-pill ${reachedClient ? 'live-pill-ok' : 'live-pill-pending'}`}>
                  {reachedClient ? 'Reached client' : 'En route to client'}
                </span>
                <span className={`live-pill ${reachedHospital ? 'live-pill-ok' : 'live-pill-pending'}`}>
                  {reachedHospital ? 'Reached hospital' : 'En route to hospital'}
                </span>
              </div>

              <div className="live-stat-grid">
                <div className="live-stat">
                  <span className="live-stat-label">Distance to patient</span>
                  <span className="live-stat-value">{formatKm(distanceToPatient)}</span>
                </div>
                <div className="live-stat">
                  <span className="live-stat-label">Distance to hospital</span>
                  <span className="live-stat-value">{formatKm(distanceToHospital)}</span>
                </div>
                <div className="live-stat">
                  <span className="live-stat-label">Nearest hospital</span>
                  <span className="live-stat-value live-stat-sub">{nearestHospital ? nearestHospital.name : '—'}</span>
                </div>
                <div className="live-stat">
                  <span className="live-stat-label">Last update</span>
                  <span className="live-stat-value live-stat-sub">
                    {selStats?.lastUpdate ? new Date(selStats.lastUpdate).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>

              <div className="live-tracker-details">
                <p>
                  <strong>Status:</strong> <span className={statusBadgeClass(selected)}>{selected.status || 'requested'}</span>
                </p>
                <p>
                  <strong>Priority:</strong>{' '}
                  <span className={`priority-badge priority-${selected.emergency_level || selected.priority || 'normal'}`}>
                    {selected.emergency_level || selected.priority || 'normal'}
                  </span>
                </p>
                <p>
                  <strong>Ambulance:</strong> {selectedProfile?.full_name || 'Unassigned'}
                </p>
                <p>
                  <strong>Patient location:</strong>{' '}
                  {selected.latitude && selected.longitude
                    ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`
                    : selected.location || selected.pickup_address || '—'}
                </p>
                {selected.destination_address && (
                  <p>
                    <strong>Destination:</strong> {selected.destination_address}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="live-sessions">
            <h4>Active Sessions ({emergencies.length})</h4>
            {emergencies.length === 0 ? (
              <p className="live-empty">No active emergency sessions.</p>
            ) : (
              <div className="live-session-list">
                {emergencies.map((e) => {
                  const st = stats[e.driver_id];
                  return (
                    <button
                      key={e.id}
                      className={`live-session-row ${selectedId === e.id ? 'active' : ''}`}
                      onClick={() => setSelectedId(e.id)}
                    >
                      <span
                        className={`priority-badge priority-${e.emergency_level || e.priority || 'normal'}`}
                      >
                        {e.emergency_level || e.priority || 'normal'}
                      </span>
                      <span className="live-session-main">
                        <span className="live-session-name">{e.patient_name || 'Unknown patient'}</span>
                        <span className="live-session-meta">
                          {selectedByDriverName(e)} · <span className={statusBadgeClass(e)}>{e.status}</span>
                        </span>
                      </span>
                      <span className="live-session-status">
                        <span className={`live-session-motion ${st?.moving ? 'moving' : ''}`}>
                          {motionLabel(st)}
                        </span>
                        <span className="live-session-speed">{speedLabel(st)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="live-fleet">
            <h4>Fleet ({drivers.length})</h4>
            {drivers.length === 0 ? (
              <p className="live-empty">No ambulances registered.</p>
            ) : (
              <div className="live-fleet-list">
                {drivers.map((d) => {
                  const dr = getDriverRow(d);
                  const isOnRide = d.id != null && activeDriverIds.has(d.id);
                  const available = dr?.is_available !== false && dr?.status !== 'off_duty';
                  const hasLoc = dr?.current_latitude != null;
                  const st = stats[d.id];
                  return (
                    <div key={d.id} className="live-fleet-row">
                      <span
                        className="live-fleet-dot"
                        style={{ backgroundColor: isOnRide ? '#dc2626' : available ? '#16a34a' : '#6b7280' }}
                      />
                      <span className="live-fleet-name">{d.full_name || 'Ambulance'}</span>
                      <span
                        className={`live-fleet-chip ${isOnRide ? 'on-ride' : available ? 'available' : 'off-duty'}`}
                      >
                        {isOnRide ? 'ON RIDE' : available ? 'AVAILABLE' : 'OFF DUTY'}
                      </span>
                      <span className="live-fleet-meta">
                        {hasLoc ? (
                          <>
                            {motionLabel(st)} · {speedLabel(st)}
                          </>
                        ) : (
                          'no signal'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
