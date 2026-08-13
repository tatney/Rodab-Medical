import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar, { roleConfig } from '../../components/Sidebar';
import Map from '../../components/Map';
import LiveMonitor from '../../components/LiveMonitor';
import EmergencyCta from '../../components/EmergencyCta';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import {
  getAnalytics,
  getAdminUsers,
  getAllHospitals,
  createAdminUser,
  deleteUser,
  flagUser,
  unflagUser,
  rewardUser,
  updateAdminUser,
  updateDoctorAccount,
  updateDriver,
  getDepartments,
  getVehicles,
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
  getProgrammesAdmin,
  createProgramme,
  updateProgramme,
  deleteProgramme,
  uploadProgrammeImage,
  deleteProgrammeImages,
  getPartnersAdmin,
  createPartner,
  updatePartner,
  deletePartner,
  uploadPartnerLogo,
  deletePartnerLogo,
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
  const [adminSearch, setAdminSearch] = useState("");
  const [adminRoleFilter, setAdminRoleFilter] = useState("");

  /* ── Users ── */
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userFlaggedFilter, setUserFlaggedFilter] = useState("");
  const [userDateFrom, setUserDateFrom] = useState("");
  const [userDateTo, setUserDateTo] = useState("");
  const [userModal, setUserModal] = useState(null);
  const [userModalAction, setUserModalAction] = useState("");
  const [userModalReason, setUserModalReason] = useState("");
  const [userModalAmount, setUserModalAmount] = useState("");
  const [userSubmitting, setUserSubmitting] = useState(false);

  /* ── Edit account (Users tab) ── */
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [vehicles, setVehicles] = useState([]);

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

  /* ── Events / News & Blogs ── */
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    category: "",
    is_active: true,
    images: [],
  });
  const [eventFiles, setEventFiles] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventSubmitting, setEventSubmitting] = useState(false);

  /* ── Programmes ── */
  const [programmes, setProgrammes] = useState([]);
  const [programmeForm, setProgrammeForm] = useState({
    title: "",
    description: "",
    category: "",
    is_active: true,
    images: [],
  });
  const [programmeFiles, setProgrammeFiles] = useState([]);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [programmeSubmitting, setProgrammeSubmitting] = useState(false);

  /* ── Partners ── */
  const [partners, setPartners] = useState([]);
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    logo_url: "",
    is_active: true,
  });
  const [partnerFile, setPartnerFile] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);

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

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await getAdminUsers();
      setUsers(data?.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await getDepartments();
      setDepartments(data?.departments || []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data } = await getVehicles();
      setVehicles(data?.vehicles || []);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
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

  const fetchProgrammes = useCallback(async () => {
    try {
      const { data } = await getProgrammesAdmin();
      setProgrammes(data?.programmes || []);
    } catch (err) {
      console.error("Failed to fetch programmes", err);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    try {
      const { data } = await getPartnersAdmin();
      setPartners(data?.partners || []);
    } catch (err) {
      console.error("Failed to fetch partners", err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchAdmins(), fetchUsers(), fetchHospitals(), fetchEmergencies(), fetchEvents(), fetchProgrammes(), fetchPartners(), fetchDepartments(), fetchVehicles()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchAnalytics, fetchAdmins, fetchUsers, fetchHospitals, fetchEmergencies, fetchEvents, fetchProgrammes, fetchPartners, fetchDepartments, fetchVehicles]);

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
     USERS (ACCOUNT MODERATION)
     ═══════════════════════════════════════════ */
  const openUserModal = (user, action) => {
    setUserModal(user);
    setUserModalAction(action);
    setUserModalReason("");
    setUserModalAmount("");
  };

  const handleUserModalSubmit = async (e) => {
    e.preventDefault();
    if (!userModal) return;
    setUserSubmitting(true);
    try {
      if (userModalAction === "flag") {
        if (!userModalReason.trim()) {
          toast.error("A flag reason is required.");
          return;
        }
        await flagUser(userModal.id, userModalReason.trim());
        toast.success("User flagged and signed out.");
      } else if (userModalAction === "unflag") {
        await unflagUser(userModal.id);
        toast.success("User unflagged.");
      } else if (userModalAction === "reward") {
        const amount = Number(userModalAmount);
        if (!Number.isInteger(amount) || amount <= 0) {
          toast.error("Enter a positive whole-number amount.");
          return;
        }
        await rewardUser(userModal.id, amount, userModalReason.trim());
        toast.success(`Rewarded ${amount} point(s).`);
      } else if (userModalAction === "delete") {
        if (userModal.id === user?.id) {
          toast.error("You cannot delete your own account.");
          return;
        }
        if (!window.confirm(`Permanently delete the account of ${userModal.full_name || userModal.email}?`)) {
          return;
        }
        await deleteUser(userModal.id);
        toast.success("User account deleted.");
      }
      setUserModal(null);
      fetchUsers();
      fetchAnalytics();
    } catch (err) {
      toast.error(err?.message || "Action failed.");
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleDeleteUser = (user) => {
    if (user.id === user?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Permanently delete the account of ${user.full_name || user.email}?`)) {
      return;
    }
    deleteUser(user.id)
      .then(() => {
        toast.success("User account deleted.");
        fetchUsers();
        fetchAnalytics();
      })
      .catch((err) => toast.error(err?.message || "Failed to delete user."));
  };

  const openEditUser = (u) => {
    const doctor = Array.isArray(u.doctors) ? u.doctors[0] : u.doctors;
    const driver = Array.isArray(u.drivers) ? u.drivers[0] : u.drivers;
    setEditUser(u);
    setEditForm({
      full_name: u.full_name || u.fullName || "",
      email: u.email || "",
      phone: u.phone || "",
      password: "",
      role: u.role || "",
      specialty: doctor?.specialty || u.specialty || "",
      department_id: doctor?.department_id || u.department_id || "",
      consultation_fee: doctor?.consultation_fee ?? "",
      license_number: driver?.license_number || u.license_number || "",
      vehicle_id: driver?.vehicle_id || u.vehicle_id || "",
      is_available: driver?.is_available ?? true,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSubmitting(true);
    try {
      const id = editUser.id;
      const base = {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
      };
      if (editForm.password) base.password = editForm.password;

      if (editUser.role === "doctor") {
        await updateDoctorAccount(id, {
          ...base,
          specialty: editForm.specialty,
          department_id: editForm.department_id || null,
          consultation_fee:
            editForm.consultation_fee === "" ? undefined : Number(editForm.consultation_fee),
        });
      } else if (editUser.role === "driver") {
        await updateDriver(id, {
          ...base,
          license_number: editForm.license_number,
          vehicle_id: editForm.vehicle_id || null,
          is_available: editForm.is_available,
        });
      } else {
        await updateAdminUser(id, base);
      }

      toast.success("Account updated successfully.");
      setEditUser(null);
      fetchUsers();
      fetchAdmins();
      fetchAnalytics();
    } catch (err) {
      toast.error(err?.message || "Failed to update account.");
    } finally {
      setEditSubmitting(false);
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
    setEventForm({ title: "", description: "", category: "", is_active: true, images: [] });
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
        category: eventForm.category,
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
      category: ev.category || "",
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
     PROGRAMMES CRUD
     ═══════════════════════════════════════════ */
  const handleProgrammeChange = (e) => {
    setProgrammeForm({ ...programmeForm, [e.target.name]: e.target.value });
  };

  const resetProgrammeForm = () => {
    setProgrammeForm({ title: "", description: "", category: "", is_active: true, images: [] });
    setProgrammeFiles([]);
    setEditingProgramme(null);
  };

  const handleProgrammeFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const room = 4 - programmeForm.images.length;
    setProgrammeFiles((prev) => [...prev, ...selected].slice(0, Math.max(0, room)));
    e.target.value = "";
  };

  const removePendingProgrammeFile = (idx) => {
    setProgrammeFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingProgrammeImage = (url) => {
    setProgrammeForm({ ...programmeForm, images: programmeForm.images.filter((img) => img !== url) });
  };

  const handleProgrammeSubmit = async (e) => {
    e.preventDefault();
    setProgrammeSubmitting(true);
    try {
      const uploaded = [];
      for (const file of programmeFiles) {
        uploaded.push(await uploadProgrammeImage(file));
      }
      const images = [...programmeForm.images, ...uploaded].slice(0, 4);
      const payload = {
        title: programmeForm.title,
        description: programmeForm.description,
        category: programmeForm.category,
        images,
        is_active: programmeForm.is_active,
      };
      if (editingProgramme) {
        await updateProgramme(editingProgramme.id, payload);
        toast.success("Programme updated successfully.");
      } else {
        await createProgramme(payload);
        toast.success("Programme created successfully.");
      }
      resetProgrammeForm();
      fetchProgrammes();
    } catch (err) {
      toast.error(err?.message || "Failed to save programme.");
    } finally {
      setProgrammeSubmitting(false);
    }
  };

  const handleEditProgramme = (pg) => {
    setEditingProgramme(pg);
    setProgrammeForm({
      title: pg.title || "",
      description: pg.description || "",
      category: pg.category || "",
      is_active: pg.is_active !== false,
      images: Array.isArray(pg.images) ? pg.images : [],
    });
    setProgrammeFiles([]);
  };

  const handleToggleProgrammeActive = async (pg) => {
    try {
      await updateProgramme(pg.id, { is_active: pg.is_active === false });
      fetchProgrammes();
      toast.success(pg.is_active === false ? "Programme published." : "Programme hidden.");
    } catch (err) {
      toast.error("Failed to update programme.");
    }
  };

  const handleDeleteProgramme = async (pg) => {
    if (!window.confirm("Delete this programme? Its uploaded images will also be removed.")) return;
    try {
      await deleteProgrammeImages(pg.images);
      await deleteProgramme(pg.id);
      fetchProgrammes();
      toast.success("Programme deleted.");
    } catch (err) {
      toast.error("Failed to delete programme.");
    }
  };

  /* ═══════════════════════════════════════════
     PARTNERS CRUD
     ═══════════════════════════════════════════ */
  const handlePartnerChange = (e) => {
    setPartnerForm({ ...partnerForm, [e.target.name]: e.target.value });
  };

  const resetPartnerForm = () => {
    setPartnerForm({ name: "", logo_url: "", is_active: true });
    setPartnerFile(null);
    setEditingPartner(null);
  };

  const handlePartnerFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setPartnerFile(file || null);
    e.target.value = "";
  };

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    setPartnerSubmitting(true);
    try {
      let logo_url = partnerForm.logo_url;
      if (partnerFile) {
        logo_url = await uploadPartnerLogo(partnerFile);
      }
      const payload = {
        name: partnerForm.name,
        logo_url: logo_url || null,
        is_active: partnerForm.is_active,
      };
      if (editingPartner) {
        await updatePartner(editingPartner.id, payload);
        toast.success("Partner updated successfully.");
      } else {
        await createPartner(payload);
        toast.success("Partner created successfully.");
      }
      resetPartnerForm();
      fetchPartners();
    } catch (err) {
      toast.error(err?.message || "Failed to save partner.");
    } finally {
      setPartnerSubmitting(false);
    }
  };

  const handleEditPartner = (pt) => {
    setEditingPartner(pt);
    setPartnerForm({
      name: pt.name || "",
      logo_url: pt.logo_url || "",
      is_active: pt.is_active !== false,
    });
    setPartnerFile(null);
  };

  const handleTogglePartnerActive = async (pt) => {
    try {
      await updatePartner(pt.id, { is_active: pt.is_active === false });
      fetchPartners();
      toast.success(pt.is_active === false ? "Partner published." : "Partner hidden.");
    } catch (err) {
      toast.error("Failed to update partner.");
    }
  };

  const handleDeletePartner = async (pt) => {
    if (!window.confirm("Delete this partner? Its uploaded logo will also be removed.")) return;
    try {
      await deletePartnerLogo(pt.logo_url);
      await deletePartner(pt.id);
      fetchPartners();
      toast.success("Partner deleted.");
    } catch (err) {
      toast.error("Failed to delete partner.");
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

        <EmergencyCta />

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
  const renderAdmins = () => {
    const q = adminSearch.trim().toLowerCase();
    const filtered = admins.filter((a) => {
      if (adminRoleFilter && a.role !== adminRoleFilter) return false;
      if (q) {
        const haystack = [
          a.full_name,
          a.fullName,
          a.name,
          a.email,
          a.id,
          a.gender,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return (
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
                minLength={8}
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

        <h3>Manage Accounts</h3>
        <form
          className="create-form"
          onSubmit={(e) => e.preventDefault()}
          style={{ marginBottom: 12 }}
        >
          <div className="form-row">
            <div className="form-group">
              <label>Search</label>
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search by name, ID or gender"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={adminRoleFilter}
                onChange={(e) => setAdminRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="driver">Driver</option>
                <option value="user">User</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setAdminSearch("");
                  setAdminRoleFilter("");
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        <h3>All Accounts ({filtered.length})</h3>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Admins">
            <caption className="sr-only">All Accounts</caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id || a._id}>
                  <td>{a.fullName || a.full_name || a.name}</td>
                  <td>{a.email}</td>
                  <td>
                    <span className={`role-chip role-${a.role}`}>{a.role}</span>
                  </td>
                  <td>{a.gender || "—"}</td>
                  <td className="actions-cell">
                    <button className="btn btn-edit btn-sm" onClick={() => openEditUser(a)}>
                      Edit
                    </button>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted text-center">
                    No accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Users Tab ── */
  const renderUsers = () => {
    const q = userSearch.trim().toLowerCase();
    const filtered = users.filter((u) => {
      if (userRoleFilter && u.role !== userRoleFilter) return false;
      if (userFlaggedFilter === "flagged" && !u.is_flagged) return false;
      if (userFlaggedFilter === "unflagged" && u.is_flagged) return false;
      if (userDateFrom && new Date(u.created_at) < new Date(userDateFrom)) return false;
      if (userDateTo && new Date(u.created_at) > new Date(userDateTo)) return false;
      if (q) {
        const haystack = [
          u.full_name,
          u.fullName,
          u.email,
          u.phone,
          u.id,
          u.national_id,
          u.medical_id,
          u.gender,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return (
      <div className="users-section">
        <h3>Account Search</h3>
        <form
          className="create-form"
          onSubmit={(e) => e.preventDefault()}
          style={{ marginBottom: 12 }}
        >
          <div className="form-row">
            <div className="form-group">
              <label>Search</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Name, email, phone or ID"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="user">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={userFlaggedFilter}
                onChange={(e) => setUserFlaggedFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="flagged">Flagged</option>
                <option value="unflagged">Not flagged</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Joined from</label>
              <input
                type="date"
                value={userDateFrom}
                onChange={(e) => setUserDateFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Joined to</label>
              <input
                type="date"
                value={userDateTo}
                onChange={(e) => setUserDateTo(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setUserSearch("");
                  setUserRoleFilter("");
                  setUserFlaggedFilter("");
                  setUserDateFrom("");
                  setUserDateTo("");
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        <h3>Accounts ({filtered.length})</h3>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Accounts">
            <caption className="sr-only">All Accounts</caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th>Points</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.full_name || u.fullName || "—"}</strong>
                    {u.is_flagged && u.flag_reason && (
                      <div className="muted" style={{ fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.flag_reason}>
                        ⚠ {u.flag_reason}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{u.email || "—"}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{u.phone || ""}</div>
                  </td>
                  <td>
                    <span className={`role-chip role-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{u.reward_points || 0}</td>
                  <td>
                    {u.is_flagged ? (
                      <span className="badge badge-error">Flagged</span>
                    ) : (
                      <span className="badge badge-success">Active</span>
                    )}
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td className="actions-cell">
                    <button className="btn btn-edit btn-sm" onClick={() => openEditUser(u)}>
                      Edit
                    </button>
                    {u.is_flagged ? (
                      <button className="btn btn-edit btn-sm" onClick={() => openUserModal(u, "unflag")}>
                        Unflag
                      </button>
                    ) : (
                      u.role !== "super_admin" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => openUserModal(u, "flag")}>
                          Flag
                        </button>
                      )
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => openUserModal(u, "reward")}>
                      Reward
                    </button>
                    {u.role !== "super_admin" && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted text-center">
                    No accounts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {userModal && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40, overflowY: 'auto' }}
            onClick={() => setUserModal(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Account action"
          >
            <div
              style={{ backgroundColor: '#fff', borderRadius: 14, maxWidth: 520, width: '100%', padding: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
                {userModalAction === "flag" && `Flag ${userModal.full_name || userModal.email}`}
                {userModalAction === "unflag" && `Unflag ${userModal.full_name || userModal.email}`}
                {userModalAction === "reward" && `Reward ${userModal.full_name || userModal.email}`}
              </h3>
              <form onSubmit={handleUserModalSubmit}>
                {(userModalAction === "flag" || userModalAction === "reward") && (
                  <div className="form-group">
                    <label>
                      {userModalAction === "flag" ? "Reason (required)" : "Reason (optional)"}
                    </label>
                    <textarea
                      rows={3}
                      value={userModalReason}
                      onChange={(e) => setUserModalReason(e.target.value)}
                      required={userModalAction === "flag"}
                    />
                  </div>
                )}
                {userModalAction === "reward" && (
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={userModalAmount}
                      onChange={(e) => setUserModalAmount(e.target.value)}
                      required
                    />
                  </div>
                )}
                {userModalAction === "flag" && (
                  <p className="muted" style={{ marginTop: 8 }}>
                    Flagging signs the user out and blocks future logins until unflagged.
                  </p>
                )}
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={userSubmitting}>
                    {userSubmitting ? "Saving…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setUserModal(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderEditModal = () => {
    if (!editUser) return null;
    return (
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40, overflowY: 'auto' }}
        onClick={() => setEditUser(null)}
        role="dialog"
        aria-modal="true"
        aria-label="Edit account"
      >
        <div
          style={{ backgroundColor: '#fff', borderRadius: 14, maxWidth: 560, width: '100%', padding: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
            Edit {editUser.role === "doctor" ? "Doctor" : editUser.role === "driver" ? "Driver" : "Admin"} — {editUser.full_name || editUser.email}
          </h3>
          <form onSubmit={handleEditUserSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {editUser.role === "doctor" && (
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    name="department_id"
                    value={editForm.department_id || ""}
                    onChange={handleEditChange}
                  >
                    <option value="">None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input
                    type="text"
                    name="specialty"
                    value={editForm.specialty}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Consultation Fee</label>
                  <input
                    type="number"
                    name="consultation_fee"
                    value={editForm.consultation_fee}
                    onChange={handleEditChange}
                    min="0"
                    step="any"
                  />
                </div>
              </div>
            )}

            {editUser.role === "driver" && (
              <div className="form-row">
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    name="license_number"
                    value={editForm.license_number}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle</label>
                  <select
                    name="vehicle_id"
                    value={editForm.vehicle_id || ""}
                    onChange={handleEditChange}
                  >
                    <option value="">None</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.plate_number || v.plateNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={!!editForm.is_available}
                      onChange={handleEditChange}
                    />
                    Available
                  </label>
                </div>
              </div>
            )}

            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              {editForm.password
                ? "A new password will be set. The account holder must use it on next login."
                : "Leave the password field blank to keep the current password."}
            </p>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                {editSubmitting ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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

      <div className="live-monitor-wrap">
        <LiveMonitor hospitals={hospitals} />
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

  const renderNews = () => (
    <div className="events-section">
      <h3>{editingEvent ? "Edit News / Blog Post" : "Add News / Blog Post"}</h3>
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
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={eventForm.category}
              onChange={handleEventChange}
              placeholder="e.g. Mental Health"
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
            {eventSubmitting ? "Saving…" : editingEvent ? "Update Post" : "Add Post"}
          </button>
          {(editingEvent || eventFiles.length || eventForm.images.length) && (
            <button type="button" className="btn btn-secondary" onClick={resetEventForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>All News & Blog Posts</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="News and blog posts">
          <caption className="sr-only">All News & Blog Posts</caption>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
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
                <td>{ev.category ? <span className="badge badge-active">{ev.category}</span> : "—"}</td>
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
                <td colSpan={6} className="muted text-center">
                  No posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProgrammes = () => (
    <div className="events-section">
      <h3>{editingProgramme ? "Edit Programme" : "Add Programme"}</h3>
      <form className="create-form" onSubmit={handleProgrammeSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={programmeForm.title}
              onChange={handleProgrammeChange}
              placeholder="e.g. Maternal Health Programme"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={programmeForm.category}
              onChange={handleProgrammeChange}
              placeholder="e.g. Maternal Health"
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="is_active" value={programmeForm.is_active ? "true" : "false"} onChange={(e) => setProgrammeForm({ ...programmeForm, is_active: e.target.value === "true" })}>
              <option value="true">Published</option>
              <option value="false">Hidden</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={programmeForm.description}
            onChange={handleProgrammeChange}
            rows={3}
            placeholder="Short description shown with the programme"
          />
        </div>

        <div className="form-group">
          <label>Images (up to 4, never cropped)</label>
          <div className="event-image-grid" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {programmeForm.images.map((url, i) => (
              <div key={`existing-${i}`} style={{ position: "relative", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <img src={url} alt={`Existing ${i + 1}`} style={{ width: 96, height: 96, objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: "absolute", top: 4, right: 4, padding: "2px 8px" }}
                  onClick={() => removeExistingProgrammeImage(url)}
                >
                  ✕
                </button>
              </div>
            ))}
            {programmeFiles.map((file, i) => (
              <div key={`pending-${i}`} style={{ position: "relative", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <img src={URL.createObjectURL(file)} alt={`New ${i + 1}`} style={{ width: 96, height: 96, objectFit: "cover", display: "block" }} />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: "absolute", top: 4, right: 4, padding: "2px 8px" }}
                  onClick={() => removePendingProgrammeFile(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            {programmeForm.images.length + programmeFiles.length < 4 && (
              <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", alignSelf: "center", marginBottom: 0 }}>
                + Add Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleProgrammeFilesChange}
                />
              </label>
            )}
          </div>
          <small className="muted">Files are uploaded to the public “images” bucket.</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={programmeSubmitting}>
            {programmeSubmitting ? "Saving…" : editingProgramme ? "Update Programme" : "Add Programme"}
          </button>
          {(editingProgramme || programmeFiles.length || programmeForm.images.length) && (
            <button type="button" className="btn btn-secondary" onClick={resetProgrammeForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>All Programmes</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Programmes">
          <caption className="sr-only">All Programmes</caption>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Images</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {programmes.map((pg) => (
              <tr key={pg.id}>
                <td>
                  <strong>{pg.title || "—"}</strong>
                  {pg.description && (
                    <div className="muted" style={{ fontSize: 12, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pg.description}
                    </div>
                  )}
                </td>
                <td>{pg.category ? <span className="badge badge-active">{pg.category}</span> : "—"}</td>
                <td>{(Array.isArray(pg.images) ? pg.images.length : 0)} image(s)</td>
                <td>{pg.created_at ? new Date(pg.created_at).toLocaleDateString() : "—"}</td>
                <td>
                  <span className={`badge ${pg.is_active === false ? "badge-cancelled" : "badge-active"}`}>
                    {pg.is_active === false ? "Hidden" : "Published"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditProgramme(pg)}>
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleToggleProgrammeActive(pg)}>
                    {pg.is_active === false ? "Publish" : "Hide"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProgramme(pg)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {programmes.length === 0 && (
              <tr>
                <td colSpan={6} className="muted text-center">
                  No programmes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPartners = () => (
    <div className="events-section">
      <h3>{editingPartner ? "Edit Partner" : "Add Partner"}</h3>
      <form className="create-form" onSubmit={handlePartnerSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Organisation Name</label>
            <input
              type="text"
              name="name"
              value={partnerForm.name}
              onChange={handlePartnerChange}
              placeholder="e.g. Uganda Red Cross"
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="is_active" value={partnerForm.is_active ? "true" : "false"} onChange={(e) => setPartnerForm({ ...partnerForm, is_active: e.target.value === "true" })}>
              <option value="true">Published</option>
              <option value="false">Hidden</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {(partnerFile || partnerForm.logo_url) && (
              <img
                src={partnerFile ? URL.createObjectURL(partnerFile) : partnerForm.logo_url}
                alt="Partner logo preview"
                style={{ width: 72, height: 72, objectFit: "contain", border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }}
              />
            )}
            <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", marginBottom: 0 }}>
              {partnerForm.logo_url || partnerFile ? "Replace Logo" : "+ Upload Logo"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePartnerFileChange} />
            </label>
            {(partnerForm.logo_url || partnerFile) && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => { setPartnerFile(null); setPartnerForm({ ...partnerForm, logo_url: "" }); }}>
                Remove Logo
              </button>
            )}
          </div>
          <small className="muted">Logo is uploaded to the public “images” bucket.</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={partnerSubmitting}>
            {partnerSubmitting ? "Saving…" : editingPartner ? "Update Partner" : "Add Partner"}
          </button>
          {(editingPartner || partnerFile || partnerForm.logo_url || partnerForm.name) && (
            <button type="button" className="btn btn-secondary" onClick={resetPartnerForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>All Partners</h3>
      <div className="table-wrapper">
        <table className="data-table" aria-label="Partners">
          <caption className="sr-only">All Partners</caption>
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((pt) => (
              <tr key={pt.id}>
                <td>
                  {pt.logo_url ? (
                    <img src={pt.logo_url} alt={pt.name || "Partner logo"} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 6, background: "#fff", border: "1px solid var(--border)" }} />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <strong>{pt.name || "—"}</strong>
                </td>
                <td>{pt.created_at ? new Date(pt.created_at).toLocaleDateString() : "—"}</td>
                <td>
                  <span className={`badge ${pt.is_active === false ? "badge-cancelled" : "badge-active"}`}>
                    {pt.is_active === false ? "Hidden" : "Published"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditPartner(pt)}>
                    Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleTogglePartnerActive(pt)}>
                    {pt.is_active === false ? "Publish" : "Hide"}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePartner(pt)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr>
                <td colSpan={5} className="muted text-center">
                  No partners yet.
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
      case "users":
        return renderUsers();
      case "hospitals":
        return renderHospitals();
      case "emergency":
        return renderEmergency();
      case "news":
        return renderNews();
      case "programmes":
        return renderProgrammes();
      case "partners":
        return renderPartners();
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

        {renderEditModal()}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
