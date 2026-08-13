import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActiveEmergencies, getDriverActiveRides, getAvailableDrivers, assignDriver, createNotification, getNotifications, markNotificationRead, cancelAmbulanceRequest } from '../api';
import supabase from '../supabaseClient';
import { useToast } from './ToastContext';
import { startPremiumAlert } from '../utils/alertSound';

const EmergencyAlertOverlay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dismissedRef = useRef(false);
  const lastSeenIdRef = useRef(null);
  const intervalRef = useRef(null);
  const dialogRef = useRef(null);
  const visibleRef = useRef(false);

  const toast = useToast();

  const alertRef = useRef(null);
  const audioSuspendedRef = useRef(false);
  const [cancelling, setCancelling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dismissedIdsRef = useRef(new Set());

  const isDismissed = useCallback((id) => {
    if (!id) return false;
    return dismissedIdsRef.current.has(id);
  }, []);

  const markDismissed = useCallback((id) => {
    if (!id) return;
    dismissedIdsRef.current.add(id);
    try { sessionStorage.setItem('emergency_dismissed_ids', JSON.stringify([...dismissedIdsRef.current])); } catch {}
  }, []);

  const showOverlay = useCallback((data) => {
    const sosId = data?.id || data?._id;
    if (sosId && isDismissed(sosId)) return;
    setEmergency(data);
    setVisible(true);
    visibleRef.current = true;
    setAssignSuccess(false);
    setSelectedDriver('');
    setDismissed(false);
    dismissedRef.current = false;
    playAlert();
    if (user?.role === 'driver') {
      getNotifications({ limit: 50 })
        .then((res) => {
          const notifs = res.data?.notifications || [];
          notifs
            .filter((n) => n.type === 'ambulance' && !n.is_read)
            .forEach((n) => markNotificationRead(n.id).catch(() => {}));
        })
        .catch(() => {});
    }
  }, [user?.role, isDismissed]);

  const playAlert = () => {
    try {
      stopAlert();
      const handle = startPremiumAlert({ loop: true });
      alertRef.current = handle;

      if (handle.suspended) {
        audioSuspendedRef.current = true;
        setSoundEnabled(false);
        const resumeOnClick = () => {
          handle.resume().then(() => {
            handle.start();
            audioSuspendedRef.current = false;
            setSoundEnabled(true);
          });
        };
        document.addEventListener('click', resumeOnClick, { once: true });
        return;
      }
      audioSuspendedRef.current = false;
      setSoundEnabled(true);
      handle.start();
    } catch (err) {
      console.warn('Alert audio failed:', err);
    }
  };

  const stopAlert = () => {
    if (alertRef.current) {
      alertRef.current.stop();
      alertRef.current = null;
    }
  };

  useEffect(() => {
    const role = user?.role;
    if (role !== 'admin' && role !== 'super_admin' && role !== 'driver') return;

    const pollEmergencies = async () => {
      if (dismissedRef.current) return;
      try {
        const isDriver = role === 'driver';
        const res = isDriver ? await getDriverActiveRides() : await getActiveEmergencies();
        const rides = res.data?.active || res.data?.rides || (Array.isArray(res.data) ? res.data : []);
        if (isDriver) console.log('[DriverAlert] poll result:', rides.length, 'rides', rides.map(r => ({ id: r.id, driver_id: r.driver_id, status: r.status })));
        if (rides.length > 0) {
          const newest = rides[0];
          const newestId = newest.id || newest._id;
          if (newestId !== lastSeenIdRef.current) {
            lastSeenIdRef.current = newestId;
            if (!dismissedRef.current) {
              showOverlay(newest);
            }
          } else if (!dismissedRef.current && !visibleRef.current) {
            showOverlay(newest);
          }
        }
      } catch (err) {
        // silently fail - polling
      }
    };

    pollEmergencies();
    intervalRef.current = setInterval(pollEmergencies, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.role, showOverlay]);

  useEffect(() => {
    return () => {
      stopAlert();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('emergency_dismissed_ids');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) ids.forEach((id) => dismissedIdsRef.current.add(id));
      }
    } catch {}
  }, []);

  const fetchAvailableDriversList = async () => {
    try {
      const res = await getAvailableDrivers();
      setDrivers(res.data?.data || res.data?.drivers || res.data || []);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  const handleDismiss = () => {
    stopAlert();
    markDismissed(emergency?.id || emergency?._id);
    setDismissed(true);
    dismissedRef.current = true;
    setVisible(false);
    visibleRef.current = false;
    setEmergency(null);
  };

  useEffect(() => {
    if (visible && (user?.role === 'admin' || user?.role === 'super_admin')) {
      fetchAvailableDriversList();
    }
  }, [visible, user]);

  useEffect(() => {
    if (!visible || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
        return;
      }
      if (e.key === 'Tab') {
        const focusableElements = dialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleDismiss]);

  const handleAssignDriver = async () => {
    if (!selectedDriver || !emergency?.id) return;

    setAssigning(true);
    try {
      await assignDriver(emergency.id, selectedDriver);
      const { data: driverProfile } = await supabase
        .from('drivers')
        .select('profile_id, full_name')
        .eq('id', selectedDriver)
        .single();
      if (driverProfile?.profile_id) {
        createNotification({
          targetUserId: driverProfile.profile_id,
          title: 'New Ride Assignment',
          message: `You have been assigned a ${emergency.emergency_level || 'normal'} priority emergency ride for patient ${emergency.patient_name || 'Unknown'}. Please respond immediately.`,
          type: 'ambulance',
        }).catch(() => {});
      }
      setAssignSuccess(true);
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } catch (err) {
      console.error('Failed to assign driver:', err);
      toast.error('Failed to assign driver. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleGoToEmergency = () => {
    stopAlert();
    markDismissed(emergency?.id || emergency?._id);
    setVisible(false);
    if (user?.role === 'driver') {
      navigate('/driver');
    } else {
      navigate('/admin');
    }
  };

  const handleCancelRequest = async () => {
    if (!emergency?.id) return;
    setCancelling(true);
    try {
      await cancelAmbulanceRequest(emergency.id);
      markDismissed(emergency.id);
      toast.success('SOS request cancelled successfully.');
      handleDismiss();
    } catch (err) {
      toast.error('Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      critical: { bg: '#fef2f2', border: '#dc2626', text: '#dc2626', label: 'CRITICAL' },
      urgent: { bg: '#fffbeb', border: '#d97706', text: '#d97706', label: 'URGENT' },
      moderate: { bg: '#eff6ff', border: '#2563eb', text: '#2563eb', label: 'MODERATE' },
      low: { bg: '#f0fdf4', border: '#16a34a', text: '#16a34a', label: 'LOW' },
    };
    return styles[priority] || styles.urgent;
  };

  if (!visible || !emergency) return null;

  const priorityStyle = getPriorityStyle(emergency.emergency_level || emergency.priority);

  return (
    <div ref={dialogRef} style={styles.overlay} role="dialog" aria-modal="true" aria-label="Emergency alert" tabIndex="-1">
      {/* Animated Background */}
      <div style={styles.animatedBg}>
        <div style={styles.sirenCircle1} />
        <div style={styles.sirenCircle2} />
      </div>

      {/* Main Card */}
      <div style={styles.card}>
        {/* Header */}
        <div style={{ ...styles.header, backgroundColor: priorityStyle.bg, borderBottom: `3px solid ${priorityStyle.border}` }}>
          <div style={styles.alertIconContainer}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={priorityStyle.text} strokeWidth="2" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 style={styles.alertTitle}>EMERGENCY ALERT</h2>
            <span
              style={{
                ...styles.priorityBadge,
                backgroundColor: priorityStyle.border,
                color: 'white',
              }}
            >
              {priorityStyle.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Patient Details */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Patient Details</h4>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Name</span>
                <span style={styles.detailValue}>{emergency.patient_name || 'Unknown'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Phone</span>
                <span style={styles.detailValue}>{emergency.contact_phone || 'N/A'}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Condition</span>
                <span style={styles.detailValue}>{emergency.condition || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Location</h4>
            <div style={styles.locationBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={styles.locationText}>{emergency.location || 'Location not specified'}</span>
            </div>
            {(emergency.latitude || emergency.pickup_lat) && (
              <div style={styles.coordText}>
                Lat: {Number(emergency.latitude || emergency.pickup_lat).toFixed(5)}, Lng: {Number(emergency.longitude || emergency.pickup_lng).toFixed(5)}
              </div>
            )}
          </div>

          {/* Additional Info */}
          {emergency.condition && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Additional Info</h4>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Condition:</span>
                <span style={styles.infoValue}>{emergency.condition}</span>
              </div>
            </div>
          )}

          {/* Driver Assignment (admin/super_admin only) */}
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Assign Driver</h4>
              {assignSuccess ? (
                <div style={styles.successBox}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span style={{ color: '#16a34a', fontWeight: '600' }}>Driver assigned successfully!</span>
                </div>
              ) : (
                <>
                  <label htmlFor="driver-select" style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Select Driver</label>
                  <select
                    id="driver-select"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Select a driver --</option>
                    {drivers.map((d) => {
                      const st = d.status === 'busy'
                        ? 'busy'
                        : d.status === 'offline' || d.status === 'off_duty'
                          ? 'offline'
                          : 'online';
                      return (
                        <option key={d.id} value={d.id} disabled={st !== 'online'}>
                          {d.full_name || d.name || d.email} — {st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={handleAssignDriver}
                    disabled={!selectedDriver || assigning}
                    style={{
                      ...styles.assignBtn,
                      opacity: !selectedDriver || assigning ? 0.6 : 1,
                    }}
                  >
                    {assigning ? 'Assigning...' : 'Assign Driver'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div style={styles.timestamp}>
            Reported: {emergency.created_at ? new Date(emergency.created_at).toLocaleString() : 'Unknown'}
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={handleGoToEmergency} style={styles.viewBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {user?.role === 'driver' ? 'View Assignment' : 'Go to Emergency'}
          </button>
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <button onClick={handleCancelRequest} disabled={cancelling} style={styles.cancelBtn}>
              {cancelling ? 'Cancelling...' : 'Cancel SOS'}
            </button>
          )}
          <button onClick={handleDismiss} style={styles.dismissBtn}>
            Dismiss
          </button>
        </div>
        {!soundEnabled && (
          <div style={styles.soundHint}>
            Click anywhere to enable alert sound
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  animatedBg: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  sirenCircle1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    border: '3px solid rgba(220,38,38,0.3)',
    animation: 'pulse-ring 2s ease-out infinite',
  },
  sirenCircle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    border: '3px solid rgba(220,38,38,0.3)',
    animation: 'pulse-ring 2s ease-out infinite 0.6s',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fade-in 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '20px 24px',
  },
  alertIconContainer: {
    width: '56px',
    height: '56px',
    backgroundColor: 'white',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(220,38,38,0.15)',
  },
  alertTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1f2937',
    margin: 0,
    letterSpacing: '1px',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    marginTop: '4px',
  },
  content: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 10px 0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '500',
  },
  locationBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
  },
  locationText: {
    fontSize: '14px',
    color: '#1f2937',
  },
  coordText: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '6px',
    fontFamily: 'monospace',
  },
  infoRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '6px',
  },
  infoLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: '13px',
    color: '#1f2937',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1f2937',
    backgroundColor: 'white',
    marginBottom: '10px',
    outline: 'none',
  },
  assignBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
  },
  timestamp: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '8px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  viewBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dismissBtn: {
    padding: '12px 20px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  soundHint: {
    padding: '6px 12px',
    backgroundColor: '#fffbeb',
    color: '#d97706',
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'center',
    borderTop: '1px solid #fde68a',
  },
};

export default EmergencyAlertOverlay;
