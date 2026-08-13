import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar, { roleConfig } from '../../components/Sidebar';
import {
  getAppointments,
  updateAppointment,
  getConsultations,
  getDoctors,
  getAvailability,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  updateConsultation,
} from '../../api';
import { extractArray } from '../../utils/api-helpers';
import EmergencyCta from '../../components/EmergencyCta';
import { useToast } from '../../components/ToastContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const statusStyles = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
  completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  dispatched: { bg: '#fef3c7', color: '#92400e', label: 'Dispatched' },
  open: { bg: '#fef3c7', color: '#92400e', label: 'Open' },
  answered: { bg: '#dcfce7', color: '#166534', label: 'Answered' },
  closed: { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: 24,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '10px 24px',
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnDanger = {
  padding: '6px 14px',
  backgroundColor: '#fee2e2',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnOutline = {
  padding: '6px 14px',
  backgroundColor: '#ffffff',
  color: '#7c3aed',
  border: '1px solid #7c3aed',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSuccess = {
  padding: '6px 14px',
  backgroundColor: '#dcfce7',
  color: '#16a34a',
  border: '1px solid #bbf7d0',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams();
  const validKeys = roleConfig.doctor.tabs.map((t) => t.key);
  const activeTab = validKeys.includes(tab) ? tab : 'dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [myProfile, setMyProfile] = useState(null);

  // Availability form
  const [availDay, setAvailDay] = useState('Sunday');
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('12:00');
  const [addingSlot, setAddingSlot] = useState(false);

  // Consultation reply
  const [replyMap, setReplyMap] = useState({});

  const toast = useToast();

  // ── Data loading ────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [aptRes, conRes, docRes] = await Promise.all([
        getAppointments().catch(() => ({ data: [] })),
        getConsultations().catch(() => ({ data: [] })),
        getDoctors().catch(() => ({ data: [] })),
      ]);

      const apts = extractArray(aptRes, 'appointments');
      const cons = extractArray(conRes, 'consultations');
      const docs = extractArray(docRes, 'doctors');

      setAppointments(apts);
      setConsultations(cons);
      setAllDoctors(docs);

      // Find own doctor profile
      const profile = docs.find(
        (d) => d.user_id === user?.id || d.user_id === user?.user_id || d.id === user?.id
      );
      if (profile) {
        setMyProfile(profile);
        // Load availability for this doctor
        try {
          const availRes = await getAvailability({ doctor_id: profile.id });
          setAvailability(extractArray(availRes, 'slots'));
        } catch {
          setAvailability([]);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
    else setLoading(false);
  }, [user, loadAll]);

  // ── Derived data ────────────────────────────────────────
  const myApts = myProfile
    ? appointments.filter(
        (a) =>
          a.doctor_id === myProfile.id ||
          a.doctor_id === myProfile.user_id ||
          a.department_id === myProfile.department_id
      )
    : appointments;

  const totalAppointments = myApts.length;
  const confirmedAppointments = myApts.filter((a) => a.status === 'confirmed').length;
  const uniquePatients = new Set(myApts.map((a) => a.patient_id || a.user_id || a.patient_name)).size;
  const pendingConsultations = consultations.filter(
    (c) => c.status === 'open' || c.status === 'pending'
  ).length;

  const myConsultations = myProfile
    ? consultations.filter(
        (c) =>
          c.specialty?.toLowerCase() === myProfile.specialty?.toLowerCase() ||
          c.doctor_id === myProfile.id
      )
    : consultations;

  // Unique patients from appointments
  const patientMap = {};
  myApts.forEach((a) => {
    const key = a.patient_id || a.user_id || a.patient_name;
    if (key && !patientMap[key]) {
      patientMap[key] = {
        id: key,
        name: a.patient_name || a.patient?.name || a.user?.full_name || 'Unknown',
        phone: a.patient_phone || a.patient?.phone || a.user?.phone || '-',
        department: a.department?.name || a.department_name || '-',
        lastVisit: a.appointment_date || a.date,
      };
    } else if (key && (a.appointment_date || a.date) > (patientMap[key].lastVisit || '')) {
      patientMap[key].lastVisit = a.appointment_date || a.date;
    }
  });
  const patients = Object.values(patientMap);

  // Recent activity (merged + sorted)
  const activityLog = [
    ...myApts.map((a) => ({
      type: 'appointment',
      text: `${a.profiles?.full_name || a.patient_name || 'Patient'} - ${a.department?.name || a.department_name || 'Dept'} (${a.status})`,
      date: a.appointment_date || a.date,
      time: a.appointment_time || a.time,
    })),
    ...myConsultations.map((c) => ({
      type: 'consultation',
      text: `Consultation: ${c.message?.substring(0, 60) || 'N/A'}... (${c.status})`,
      date: c.created_at?.split('T')[0] || c.date || '',
      time: c.created_at?.split('T')[1]?.substring(0, 5) || '',
    })),
  ]
    .sort((a, b) => {
      const da = `${a.date} ${a.time || ''}`;
      const db = `${b.date} ${b.time || ''}`;
      return db.localeCompare(da);
    })
    .slice(0, 10);

  // Availability grouped by day
  const groupedAvailability = {};
  DAYS.forEach((d) => {
    groupedAvailability[d] = availability.filter(
      (s) => s.day_of_week === d || s.day === d
    );
  });

  // ── Handlers ────────────────────────────────────────────
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!myProfile) return;
    setAddingSlot(true);
    try {
      await createAvailabilitySlot({
        doctor_id: myProfile.id,
        day_of_week: availDay,
        start_time: availStart,
        end_time: availEnd,
      });
      // Reload availability
      const availRes = await getAvailability({ doctor_id: myProfile.id });
      setAvailability(availRes.data?.slots || availRes.data || []);
      setAvailStart('09:00');
      setAvailEnd('12:00');
    } catch (err) {
      console.error('Failed to add slot:', err);
      toast.error(err.response?.data?.message || 'Failed to add availability slot.');
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Remove this time slot?')) return;
    try {
      await deleteAvailabilitySlot(slotId);
      setAvailability((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      console.error('Failed to delete slot:', err);
      toast.error('Failed to remove slot.');
    }
  };

  const handleUpdateStatus = async (aptId, status) => {
    try {
      await updateAppointment(aptId, { status });
      setAppointments((prev) => prev.map((a) => (a.id === aptId ? { ...a, status } : a)));
      toast.success(`Appointment marked as ${status}.`);
    } catch (err) {
      console.error('Failed to update appointment:', err);
      toast.error(err.response?.data?.message || 'Failed to update appointment.');
    }
  };

  const handleReplyConsultation = async (conId) => {
    const response = replyMap[conId];
    if (!response?.trim()) {
      toast.warning('Please enter a response.');
      return;
    }
    try {
      await updateConsultation(conId, {
        response: response.trim(),
        status: 'answered',
      });
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === conId ? { ...c, response: response.trim(), status: 'answered' } : c
        )
      );
      setReplyMap((prev) => ({ ...prev, [conId]: '' }));
    } catch (err) {
      console.error('Failed to reply:', err);
      toast.error(err.response?.data?.message || 'Failed to send reply.');
    }
  };

  // ── Loading / error guards ──────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={spinnerStyle} />
            <p style={{ color: '#6b7280', marginTop: 12, fontSize: 14 }}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Tab content renderers ───────────────────────────────

  const renderDashboard = () => (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Appointments', value: totalAppointments, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Confirmed', value: confirmedAppointments, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Unique Patients', value: uniquePatients, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Pending Consultations', value: pendingConsultations, color: '#d97706', bg: '#fef3c7' },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: stat.color, flexShrink: 0 }}>
              {stat.value}
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <EmergencyCta />

      {/* Recent Activity */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Recent Activity</h3>
        {activityLog.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No recent activity.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activityLog.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: item.type === 'appointment' ? '#f5f3ff' : '#f0fdf4', border: '1px solid', borderColor: item.type === 'appointment' ? '#ede9fe' : '#dcfce7' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.type === 'appointment' ? '📅' : '💬'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{item.text}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.date} {item.time ? `at ${item.time}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPatients = () => (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20 }}>My Patients</h3>
      {patients.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>No patients found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.phone}</td>
                  <td style={tdStyle}>{p.department}</td>
                  <td style={tdStyle}>{p.lastVisit || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAppointments = () => (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Appointments</h3>
      {myApts.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>No appointments found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myApts.map((apt) => {
            const st = statusStyles[apt.status] || statusStyles.pending;
            return (
              <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{apt.profiles?.full_name || apt.patient_name || apt.patient?.name || 'Patient'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{apt.department?.name || apt.department_name || '-'}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                    {apt.appointment_date ? new Date(`${apt.appointment_date}T00:00:00`).toLocaleDateString() : ''}
                    {apt.appointment_time ? ` at ${String(apt.appointment_time).slice(0, 5)}` : ''}
                  </div>
                  {apt.reason && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>{apt.reason}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                    {st.label}
                  </span>
                  {apt.status === 'pending' && (
                    <button style={btnOutline} onClick={() => handleUpdateStatus(apt.id, 'confirmed')}>Confirm</button>
                  )}
                  {apt.status === 'confirmed' && (
                    <button style={btnSuccess} onClick={() => handleUpdateStatus(apt.id, 'completed')}>Complete</button>
                  )}
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <button style={btnDanger} onClick={() => handleUpdateStatus(apt.id, 'cancelled')}>Cancel</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAvailability = () => (
    <div>
      {/* Add Slot Form */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Add Time Slot</h3>
        {!myProfile && (
          <p style={{ color: '#d97706', fontSize: 13, marginBottom: 12 }}>No doctor profile linked. Cannot add availability.</p>
        )}
        <form onSubmit={handleAddSlot} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' }}>Day of Week</label>
            <select value={availDay} onChange={(e) => setAvailDay(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 130 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' }}>Start Time</label>
            <input type="time" value={availStart} onChange={(e) => setAvailStart(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ minWidth: 130 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' }}>End Time</label>
            <input type="time" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} required style={inputStyle} />
          </div>
          <button type="submit" disabled={addingSlot || !myProfile} style={{ ...btnPrimary, opacity: addingSlot || !myProfile ? 0.5 : 1, height: 40 }}>
            {addingSlot ? 'Adding...' : '+ Add Slot'}
          </button>
        </form>
      </div>

      {/* Grouped Slots */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Your Weekly Schedule</h3>
        {availability.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: 14 }}>No time slots configured yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {DAYS.map((day) => {
              const slots = groupedAvailability[day];
              if (!slots || slots.length === 0) return null;
              return (
                <div key={day}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>{day}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.map((slot) => (
                      <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, backgroundColor: '#ede9fe', border: '1px solid #ddd6fe' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#5b21b6' }}>
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <button onClick={() => handleDeleteSlot(slot.id)} style={{ ...btnDanger, padding: '8px 12px', fontSize: 12, minHeight: 36 }} title="Remove slot" aria-label="Remove time slot">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderConsultations = () => (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Consultations</h3>
      {myConsultations.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>No consultations found for your specialty.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {myConsultations.map((con) => {
            const st = statusStyles[con.status] || statusStyles.pending;
            const isPending = con.status === 'open' || con.status === 'pending';
            return (
              <div key={con.id} style={{ padding: '18px 20px', borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: isPending ? '#fffbeb' : '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Dr. {con.doctor_name || myProfile?.full_name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{con.specialty || myProfile?.specialty || '-'}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: '8px 0' }}>{con.message}</p>

                {con.response && (
                  <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 8, backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Response:</div>
                    <p style={{ fontSize: 14, color: '#166534', margin: 0, lineHeight: 1.5 }}>{con.response}</p>
                  </div>
                )}

                {isPending && (
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      value={replyMap[con.id] || ''}
                      onChange={(e) => setReplyMap((prev) => ({ ...prev, [con.id]: e.target.value }))}
                      placeholder="Type your response..."
                      aria-label="Reply to consultation"
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
                    />
                    <button onClick={() => handleReplyConsultation(con.id)} style={btnPrimary}>
                      Send Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Main render ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="dashboard-main-content">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >☰</button>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
                Welcome, Dr. {user?.full_name?.split(' ')[0] || user?.email || 'Doctor'}
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Manage your patients, appointments, and consultations
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Content */}
        {activeTab === 'dashboard' && <div role="tabpanel" id="tabpanel-dashboard" aria-labelledby="tab-dashboard">{renderDashboard()}</div>}
        {activeTab === 'patients' && <div role="tabpanel" id="tabpanel-patients" aria-labelledby="tab-patients">{renderPatients()}</div>}
        {activeTab === 'appointments' && <div role="tabpanel" id="tabpanel-appointments" aria-labelledby="tab-appointments">{renderAppointments()}</div>}
        {activeTab === 'availability' && <div role="tabpanel" id="tabpanel-availability" aria-labelledby="tab-availability">{renderAvailability()}</div>}
        {activeTab === 'consultations' && <div role="tabpanel" id="tabpanel-consultations" aria-labelledby="tab-consultations">{renderConsultations()}</div>}
      </main>
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────
const thStyle = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '12px 14px',
  color: '#374151',
};

const spinnerStyle = {
  width: 36,
  height: 36,
  border: '3px solid #e5e7eb',
  borderTopColor: '#7c3aed',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  margin: '0 auto',
};
