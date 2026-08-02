import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar from '../../components/Sidebar';
import Map from '../../components/Map';
import NotificationBell from '../../components/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import {
  getAnalytics, getAdminUsers, createAdminUser, deleteUser,
  getDoctors, createDoctorAccount, deleteDoctor,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getAvailability, createAvailabilitySlot, deleteAvailabilitySlot,
  getAllHospitals, createHospital, updateHospital, deleteHospital,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getDrivers, createDriverWithAccount, deleteDriver,
  getActiveEmergencies, getFeesAdmin, createFee, updateFee, deleteFee,
  createNotification, getAdminMessages,
  getPrescriptionsAdmin, approvePrescription,
  getIllnessCertsAdmin, approveIllnessCert,
  getAppointments, getConsultations,
  getFormTemplatesAdmin, createFormTemplate, updateFormTemplate, deleteFormTemplate,
} from '../../api';
import { useToast } from '../../components/ToastContext';
/* Shared UI helpers */
const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${color || "#4f46e5"}` }}>
    <div className="stat-icon" style={{ background: color || "#4f46e5" }} aria-hidden="true">{icon || "📊"}</div>
    <div className="stat-info">
      <span className="stat-value">{value ?? "—"}</span>
      <span className="stat-label">{label}</span>
    </div>
  </div>
);

const ProgressBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="progress-row">
      <div className="progress-header">
        <span>{label}</span>
        <span>{count} ({pct}%)</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

const EmptyRow = ({ colSpan = 5, msg = "No records found." }) => (
  <tr><td colSpan={colSpan} className="muted text-center">{msg}</td></tr>
);

const TABS = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "admins", label: "Admins", icon: "👤" },
  { key: "departments", label: "Departments", icon: "🏢" },
  { key: "doctors", label: "Doctors", icon: "🩺" },
  { key: "availability", label: "Availability", icon: "📅" },
  { key: "hospitals", label: "Hospitals", icon: "🏥" },
  { key: "vehicles", label: "Vehicles", icon: "🚑" },
  { key: "drivers", label: "Drivers", icon: "🧑‍✈️" },
  { key: "emergency", label: "Emergency", icon: "🚨" },
  { key: "fees", label: "Fees", icon: "💰" },
  { key: "forms", label: "Forms", icon: "📋" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
  { key: "messages", label: "Messages", icon: "✉️" },
  { key: "prescriptions", label: "Prescriptions", icon: "💊" },
  { key: "certificates", label: "Certificates", icon: "📄" },
  { key: "appointments", label: "Appointments", icon: "📆" },
  { key: "consultations", label: "Consultations", icon: "💬" },
];

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user } = useAuth();
  const { tab } = useParams();
  const sidebarTabMap = {
    dashboard: 'overview',
    appointments: 'appointments',
    patients: 'overview',
    emergency: 'emergency',
    doctors: 'doctors',
    reports: 'overview',
    settings: 'overview',
  };
  const [activeTab, setActiveTab] = useState(sidebarTabMap[tab] || 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Admins / Users */
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({ fullName: "", email: "", password: "", age: "", gender: "male", role: "admin" });
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  /* Departments */
  const [departments, setDepartments] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [editingDept, setEditingDept] = useState(null);
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  /* Doctors */
  const [doctors, setDoctors] = useState([]);
  const [doctorForm, setDoctorForm] = useState({ fullName: "", email: "", password: "", age: "", gender: "male", specialty: "", department: "", phone: "", consultationFee: "" });
  const [doctorSubmitting, setDoctorSubmitting] = useState(false);

  /* Availability */
  const [availability, setAvailability] = useState([]);
  const [availForm, setAvailForm] = useState({ doctorId: "", day_of_week: "Monday", start_time: "09:00", end_time: "17:00" });
  const [availSubmitting, setAvailSubmitting] = useState(false);

  /* Hospitals */
  const [hospitals, setHospitals] = useState([]);
  const [hospitalForm, setHospitalForm] = useState({ name: "", address: "", latitude: "", longitude: "", phone: "", emergency_phone: "", services: "" });
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalSubmitting, setHospitalSubmitting] = useState(false);

  /* Vehicles */
  const [vehicles, setVehicles] = useState([]);
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", type: "ambulance", model: "", year: "", capacity: "", status: "available" });
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);

  /* Drivers */
  const [drivers, setDrivers] = useState([]);
  const [driverForm, setDriverForm] = useState({ fullName: "", email: "", password: "", phone: "", licenseNumber: "", age: "", gender: "male", vehicleId: "" });
  const [driverSubmitting, setDriverSubmitting] = useState(false);

  /* Emergency */
  const [emergencies, setEmergencies] = useState([]);

  /* Fees */
  const [fees, setFees] = useState([]);
  const [feeForm, setFeeForm] = useState({ name: "", description: "", amount: "", category: "consultation" });
  const [editingFee, setEditingFee] = useState(null);
  const [feeSubmitting, setFeeSubmitting] = useState(false);

  /* Form Templates */
  const [formTemplates, setFormTemplates] = useState([]);
  const [formTemplateForm, setFormTemplateForm] = useState({ title: "", description: "", icon: "📄", category: "", form_code: "", revision: "1", fields: [] });
  const [editingFormTemplate, setEditingFormTemplate] = useState(null);
  const [formTemplateSubmitting, setFormTemplateSubmitting] = useState(false);

  /* Notifications */
  const [notifForm, setNotifForm] = useState({ title: "", message: "", targetUserId: "", type: "info" });
  const [notifSubmitting, setNotifSubmitting] = useState(false);

  /* Messages */
  const [messages, setMessages] = useState([]);

  /* Prescriptions */
  const [prescriptions, setPrescriptions] = useState([]);

  /* Certificates */
  const [certificates, setCertificates] = useState([]);

  /* Appointments */
  const [appointments, setAppointments] = useState([]);

  /* Consultations */
  const [consultations, setConsultations] = useState([]);

  const toast = useToast();

  /* ═══════════════════════════════════════════
     FETCH HELPERS
     ═══════════════════════════════════════════ */
  const toArray = (response) => {
    const data = response?.data ?? response;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) return data[k];
      }
    }
    return [];
  };

  const fetchAnalytics = useCallback(async () => {
    try { const { data } = await getAnalytics(); setAnalytics(data); }
    catch (err) { console.error("Analytics error:", err); setError("Failed to load analytics."); }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try { setAdmins(toArray(await getAdminUsers())); } catch (err) { console.error("Admins error:", err?.message || err); }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try { setDepartments(toArray(await getDepartments())); } catch (err) { console.error("Departments error:", err?.message || err); }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try { setDoctors(toArray(await getDoctors())); } catch (err) { console.error("Doctors error:", err?.message || err); }
  }, []);

  const fetchAvailability = useCallback(async () => {
    try { setAvailability(toArray(await getAvailability())); } catch (err) { console.error("Availability error:", err?.message || err); }
  }, []);

  const fetchHospitals = useCallback(async () => {
    try { setHospitals(toArray(await getAllHospitals())); } catch (err) { console.error("Hospitals error:", err?.message || err); }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try { setVehicles(toArray(await getVehicles())); } catch (err) { console.error("Vehicles error:", err?.message || err); }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try { setDrivers(toArray(await getDrivers())); } catch (err) { console.error("Drivers error:", err?.message || err); }
  }, []);

  const fetchEmergencies = useCallback(async () => {
    try { setEmergencies(toArray(await getActiveEmergencies())); } catch (err) { console.error("Emergencies error:", err?.message || err); }
  }, []);

  const fetchFees = useCallback(async () => {
    try { setFees(toArray(await getFeesAdmin())); } catch (err) { console.error("Fees error:", err?.message || err); }
  }, []);

  const fetchFormTemplates = useCallback(async () => {
    try { setFormTemplates(toArray(await getFormTemplatesAdmin())); } catch (err) { console.error("Form templates error:", err?.message || err); }
  }, []);

  const fetchMessages = useCallback(async () => {
    try { setMessages(toArray(await getAdminMessages())); } catch (err) { console.error("Messages error:", err?.message || err); }
  }, []);

  const fetchPrescriptions = useCallback(async () => {
    try { setPrescriptions(toArray(await getPrescriptionsAdmin())); } catch (err) { console.error("Prescriptions error:", err?.message || err); }
  }, []);

  const fetchCertificates = useCallback(async () => {
    try { setCertificates(toArray(await getIllnessCertsAdmin())); } catch (err) { console.error("Certificates error:", err?.message || err); }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try { setAppointments(toArray(await getAppointments())); } catch (err) { console.error("Appointments error:", err?.message || err); }
  }, []);

  const fetchConsultations = useCallback(async () => {
    try { setConsultations(toArray(await getConsultations())); } catch (err) { console.error("Consultations error:", err?.message || err); }
  }, []);

  /* ── Load on mount ── */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchAnalytics(), fetchAdmins(), fetchDepartments(), fetchDoctors(),
        fetchHospitals(), fetchVehicles(), fetchDrivers(), fetchEmergencies(),
      ]);
      setLoading(false);
    };
    init();
  }, [fetchAnalytics, fetchAdmins, fetchDepartments, fetchDoctors, fetchHospitals, fetchVehicles, fetchDrivers, fetchEmergencies]);

  /* ── Lazy-load tab data ── */
  useEffect(() => {
    if (activeTab === "fees" && fees.length === 0) fetchFees();
    if (activeTab === "forms" && formTemplates.length === 0) fetchFormTemplates();
    if (activeTab === "messages" && messages.length === 0) fetchMessages();
    if (activeTab === "prescriptions" && prescriptions.length === 0) fetchPrescriptions();
    if (activeTab === "certificates" && certificates.length === 0) fetchCertificates();
    if (activeTab === "appointments" && appointments.length === 0) fetchAppointments();
    if (activeTab === "consultations" && consultations.length === 0) fetchConsultations();
    if (activeTab === "availability" && availability.length === 0) fetchAvailability();
  }, [activeTab, fees.length, messages.length, prescriptions.length, certificates.length, appointments.length, consultations.length, availability.length, fetchFees, fetchMessages, fetchPrescriptions, fetchCertificates, fetchAppointments, fetchConsultations, fetchAvailability]);

  /* ── Auto-refresh emergencies ── */
  useEffect(() => {
    if (activeTab === "emergency") {
      fetchEmergencies();
      const iv = setInterval(fetchEmergencies, 15000);
      return () => clearInterval(iv);
    }
  }, [activeTab, fetchEmergencies]);

  const makeHandler = (setter) => (e) => {
    setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ═══════════════════════════════════════════
     ADMIN / USER CRUD
     ═══════════════════════════════════════════ */
  const handleAdminChange = makeHandler(setAdminForm);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminSubmitting(true);
    try {
      await createAdminUser({ fullName: adminForm.fullName, email: adminForm.email, password: adminForm.password, age: Number(adminForm.age), gender: adminForm.gender, role: adminForm.role });
      setAdminForm({ fullName: "", email: "", password: "", age: "", gender: "male", role: "admin" });
      fetchAdmins();
      fetchDoctors();
      toast.success("Account created successfully.");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to create account."); }
    finally { setAdminSubmitting(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await deleteUser(id); fetchAdmins(); fetchDoctors(); fetchAnalytics(); }
    catch (err) { toast.error("Failed to delete user."); }
  };

  /* ═══════════════════════════════════════════
     DEPARTMENT CRUD
     ═══════════════════════════════════════════ */
  const handleDeptChange = makeHandler(setDeptForm);

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setDeptSubmitting(true);
    try {
      if (editingDept) { await updateDepartment(editingDept.id || editingDept._id, deptForm); }
      else { await createDepartment(deptForm); }
      setDeptForm({ name: "", description: "" });
      setEditingDept(null);
      fetchDepartments();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save department."); }
    finally { setDeptSubmitting(false); }
  };

  const handleEditDept = (d) => {
    setEditingDept(d);
    setDeptForm({ name: d.name || "", description: d.description || "" });
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try { await deleteDepartment(id); fetchDepartments(); fetchAnalytics(); }
    catch (err) { toast.error("Failed to delete department."); }
  };

  /* ═══════════════════════════════════════════
     DOCTOR CRUD
     ═══════════════════════════════════════════ */
  const handleDoctorChange = makeHandler(setDoctorForm);

  const handlecreateDoctorAccount = async (e) => {
    e.preventDefault();
    setDoctorSubmitting(true);
    try {
      await createDoctorAccount({ fullName: doctorForm.fullName, email: doctorForm.email, password: doctorForm.password, age: Number(doctorForm.age), gender: doctorForm.gender, specialty: doctorForm.specialty, department: doctorForm.department, phone: doctorForm.phone, consultationFee: Number(doctorForm.consultationFee) });
      setDoctorForm({ fullName: "", email: "", password: "", age: "", gender: "male", specialty: "", department: "", phone: "", consultationFee: "" });
      fetchDoctors();
      fetchAnalytics();
      toast.success("Doctor created successfully.");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to create doctor."); }
    finally { setDoctorSubmitting(false); }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    try { await deleteDoctor(id); fetchDoctors(); fetchAnalytics(); }
    catch (err) { toast.error("Failed to delete doctor."); }
  };

  /* ═══════════════════════════════════════════
     AVAILABILITY CRUD
     ═══════════════════════════════════════════ */
  const handleAvailChange = makeHandler(setAvailForm);

  const handlecreateAvailabilitySlot = async (e) => {
    e.preventDefault();
    setAvailSubmitting(true);
    try {
      await createAvailabilitySlot({ doctorId: availForm.doctorId, day_of_week: availForm.day_of_week, start_time: availForm.start_time, end_time: availForm.end_time });
      setAvailForm({ doctorId: "", day_of_week: "Monday", start_time: "09:00", end_time: "17:00" });
      fetchAvailability();
      toast.success("Availability slot created.");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to create availability."); }
    finally { setAvailSubmitting(false); }
  };

  const handledeleteAvailabilitySlot = async (id) => {
    if (!window.confirm("Delete this availability slot?")) return;
    try { await deleteAvailabilitySlot(id); fetchAvailability(); }
    catch (err) { toast.error("Failed to delete availability."); }
  };

  /* ═══════════════════════════════════════════
     HOSPITAL CRUD
     ═══════════════════════════════════════════ */
  const handleHospitalChange = makeHandler(setHospitalForm);

  const resetHospitalForm = () => {
    setHospitalForm({ name: "", address: "", latitude: "", longitude: "", phone: "", emergency_phone: "", services: "" });
    setEditingHospital(null);
  };

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    setHospitalSubmitting(true);
    const payload = {
      ...hospitalForm,
      latitude: parseFloat(hospitalForm.latitude) || null,
      longitude: parseFloat(hospitalForm.longitude) || null,
      services: hospitalForm.services.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editingHospital) { await updateHospital(editingHospital.id || editingHospital._id, payload); }
      else { await createHospital(payload); }
      resetHospitalForm();
      fetchHospitals();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save hospital."); }
    finally { setHospitalSubmitting(false); }
  };

  const handleEditHospital = (h) => {
    setEditingHospital(h);
    setHospitalForm({ name: h.name || "", address: h.address || "", latitude: h.latitude?.toString() || "", longitude: h.longitude?.toString() || "", phone: h.phone || "", emergency_phone: h.emergency_phone || "", services: Array.isArray(h.services) ? h.services.join(", ") : h.services || "" });
  };

  const handleDeleteHospital = async (id) => {
    if (!window.confirm("Delete this hospital?")) return;
    try { await deleteHospital(id); fetchHospitals(); fetchAnalytics(); }
    catch (err) { toast.error("Failed to delete hospital."); }
  };

  /* ═══════════════════════════════════════════
     VEHICLE CRUD
     ═══════════════════════════════════════════ */
  const handleVehicleChange = makeHandler(setVehicleForm);

  const resetVehicleForm = () => {
    setVehicleForm({ plateNumber: "", type: "ambulance", model: "", year: "", capacity: "", status: "available" });
    setEditingVehicle(null);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setVehicleSubmitting(true);
    const payload = { plateNumber: vehicleForm.plateNumber, type: vehicleForm.type, model: vehicleForm.model, year: Number(vehicleForm.year), capacity: Number(vehicleForm.capacity), status: vehicleForm.status };
    try {
      if (editingVehicle) { await updateVehicle(editingVehicle.id || editingVehicle._id, payload); }
      else { await createVehicle(payload); }
      resetVehicleForm();
      fetchVehicles();
      fetchAnalytics();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save vehicle."); }
    finally { setVehicleSubmitting(false); }
  };

  const handleEditVehicle = (v) => {
    setEditingVehicle(v);
    setVehicleForm({ plateNumber: v.plateNumber || v.plate_number || "", type: v.type || "ambulance", model: v.model || "", year: v.year?.toString() || "", capacity: v.capacity?.toString() || "", status: v.status || "available" });
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try { await deleteVehicle(id); fetchVehicles(); fetchAnalytics(); }
    catch (err) { toast.error("Failed to delete vehicle."); }
  };

  /* ═══════════════════════════════════════════
     DRIVER CRUD
     ═══════════════════════════════════════════ */
  const handleDriverChange = makeHandler(setDriverForm);

  const handlecreateDriverWithAccount = async (e) => {
    e.preventDefault();
    setDriverSubmitting(true);
    try {
      await createDriverWithAccount({ fullName: driverForm.fullName, email: driverForm.email, password: driverForm.password, phone: driverForm.phone, licenseNumber: driverForm.licenseNumber, age: Number(driverForm.age), gender: driverForm.gender, vehicleId: driverForm.vehicleId || undefined });
      setDriverForm({ fullName: "", email: "", password: "", phone: "", licenseNumber: "", age: "", gender: "male", vehicleId: "" });
      fetchDrivers();
      fetchAnalytics();
      toast.success("Driver created successfully.");
    } catch (err) { toast.error(err?.message || "Failed to create driver."); }
    finally { setDriverSubmitting(false); }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm("Delete this driver?")) return;
    try { await deleteDriver(id); fetchDrivers(); fetchAnalytics(); }
    catch (err) { toast.error(err?.message || "Failed to delete driver."); }
  };

  /* ═══════════════════════════════════════════
     FEE CRUD
     ═══════════════════════════════════════════ */
  const handleFeeChange = makeHandler(setFeeForm);

  const resetFeeForm = () => {
    setFeeForm({ name: "", description: "", amount: "", category: "consultation" });
    setEditingFee(null);
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    setFeeSubmitting(true);
    const payload = { name: feeForm.name, description: feeForm.description, amount: Number(feeForm.amount), category: feeForm.category };
    try {
      if (editingFee) { await updateFee(editingFee.id || editingFee._id, payload); }
      else { await createFee(payload); }
      resetFeeForm();
      fetchFees();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to save fee."); }
    finally { setFeeSubmitting(false); }
  };

  const handleEditFee = (f) => {
    setEditingFee(f);
    setFeeForm({ name: f.name || "", description: f.description || "", amount: f.amount?.toString() || "", category: f.category || "consultation" });
  };

  const handleDeleteFee = async (id) => {
    if (!window.confirm("Delete this fee entry?")) return;
    try { await deleteFee(id); fetchFees(); }
    catch (err) { toast.error("Failed to delete fee."); }
  };

  /* ═══════════════════════════════════════════
     FORM TEMPLATE CRUD
     ═══════════════════════════════════════════ */
  const handleFormTemplateChange = makeHandler(setFormTemplateForm);

  const resetFormTemplateForm = () => {
    setFormTemplateForm({ title: "", description: "", icon: "📄", category: "", form_code: "", revision: "1", fields: [] });
    setEditingFormTemplate(null);
  };

  const addFormField = () => {
    setFormTemplateForm((prev) => ({ ...prev, fields: [...prev.fields, { key: "", label: "", type: "text", required: false, placeholder: "", full: false, options: "" }] }));
  };

  const updateFormField = (index, patch) => {
    setFormTemplateForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    }));
  };

  const removeFormField = (index) => {
    setFormTemplateForm((prev) => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }));
  };

  const handleFormTemplateSubmit = async (e) => {
    e.preventDefault();
    const isEditing = !!editingFormTemplate;
    const cleanFields = (formTemplateForm.fields || [])
      .filter((f) => f.key && f.label)
      .map((f) => ({
        key: f.key.trim(),
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        placeholder: f.placeholder || "",
        full: !!f.full,
        options: (f.type === "select" || f.type === "radio") && f.options ? f.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
      }));
    if (cleanFields.length === 0) {
      toast.error("Add at least one field with a key and label.");
      return;
    }
    const payload = {
      title: formTemplateForm.title,
      description: formTemplateForm.description,
      icon: formTemplateForm.icon || "📄",
      category: formTemplateForm.category,
      form_code: formTemplateForm.form_code,
      revision: formTemplateForm.revision,
      fields: cleanFields,
    };
    setFormTemplateSubmitting(true);
    try {
      if (isEditing) { await updateFormTemplate(editingFormTemplate.id || editingFormTemplate._id, payload); }
      else { await createFormTemplate(payload); }
      resetFormTemplateForm();
      fetchFormTemplates();
      toast.success(isEditing ? "Form updated successfully." : "Form created successfully.");
    } catch (err) { toast.error(err?.response?.data?.message || err?.message || "Failed to save form."); }
    finally { setFormTemplateSubmitting(false); }
  };

  const handleEditFormTemplate = (f) => {
    setEditingFormTemplate(f);
    setFormTemplateForm({
      title: f.title || "",
      description: f.description || "",
      icon: f.icon || "📄",
      category: f.category || "",
      form_code: f.form_code || "",
      revision: f.revision || "1",
      fields: Array.isArray(f.fields) ? f.fields.map((field) => ({
        key: field.key || "",
        label: field.label || "",
        type: field.type || "text",
        required: !!field.required,
        placeholder: field.placeholder || "",
        full: !!field.full,
        options: Array.isArray(field.options) ? field.options.join(", ") : field.options || "",
      })) : [],
    });
  };

  const handleDeleteFormTemplate = async (id) => {
    if (!window.confirm("Delete this form template? This will also delete all related submissions.")) return;
    try { await deleteFormTemplate(id); fetchFormTemplates(); toast.success("Form deleted."); }
    catch (err) { toast.error(err?.message || "Failed to delete form."); }
  };

  /* ═══════════════════════════════════════════
     NOTIFICATION + STATUS UPDATES
     ═══════════════════════════════════════════ */
  const handleNotifChange = makeHandler(setNotifForm);

  const handlecreateNotification = async (e) => {
    e.preventDefault();
    setNotifSubmitting(true);
    try {
      await createNotification({ title: notifForm.title, message: notifForm.message, targetUserId: notifForm.targetUserId || undefined, type: notifForm.type });
      setNotifForm({ title: "", message: "", targetUserId: "", type: "info" });
      toast.success("Notification sent successfully.");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to send notification."); }
    finally { setNotifSubmitting(false); }
  };

  const handlePrescriptionStatus = async (id, status) => {
    try { await approvePrescription(id, { status }); fetchPrescriptions(); }
    catch (err) { toast.error("Failed to update prescription."); }
  };

  const handleCertificateStatus = async (id, status) => {
    try { await approveIllnessCert(id, { status }); fetchCertificates(); }
    catch (err) { toast.error("Failed to update certificate."); }
  };

  /* ═══════════════════════════════════════════
     RENDER — OVERVIEW
     ═══════════════════════════════════════════ */
  const renderOverview = () => {
    if (!analytics) return <p className="muted">No analytics data available.</p>;
    const a = analytics;
    const totalAppts = (a.appointmentStatus?.pending || 0) + (a.appointmentStatus?.confirmed || 0) + (a.appointmentStatus?.completed || 0) + (a.appointmentStatus?.cancelled || 0);

    return (
      <div className="overview-section">
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
          <StatCard label="Ambulance Requests" value={a.totalAmbulanceRequests} color="#ef4444" />
          <StatCard label="Critical Requests" value={a.criticalAmbulanceRequests} color="#dc2626" />
          <StatCard label="Messages" value={a.totalMessages} color="#6366f1" />
          <StatCard label="Repeat Prescriptions" value={a.totalRepeatPrescriptions} color="#84cc16" />
        </div>
        <h3>Appointment Status</h3>
        <div className="progress-section">
          <ProgressBar label="Pending" count={a.appointmentStatus?.pending || 0} total={totalAppts} color="#f59e0b" />
          <ProgressBar label="Confirmed" count={a.appointmentStatus?.confirmed || 0} total={totalAppts} color="#3b82f6" />
          <ProgressBar label="Completed" count={a.appointmentStatus?.completed || 0} total={totalAppts} color="#10b981" />
          <ProgressBar label="Cancelled" count={a.appointmentStatus?.cancelled || 0} total={totalAppts} color="#ef4444" />
        </div>
        <h3>Users by Role</h3>
        <div className="chips-container">
          {a.usersByRole && Object.entries(a.usersByRole).map(([role, count]) => (
            <span key={role} className="role-chip">
              <span className="chip-role">{role.replace(/_/g, " ")}</span>
              <span className="chip-count">{count}</span>
            </span>
          ))}
        </div>
        {a.departmentDistribution && (
          <>
            <h3>Department Distribution</h3>
            <div className="progress-section">
              {Object.entries(a.departmentDistribution).map(([dept, count]) => (
                <ProgressBar key={dept} label={dept} count={count} total={a.totalDoctors || 1} color="#6366f1" />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════
     RENDER — ADMINS
     ═══════════════════════════════════════════ */
  const renderAdmins = () => (
    <div className="admins-section">
      <h3>Create Admin / Doctor Account</h3>
      <form className="create-form" onSubmit={handleCreateAdmin}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" value={adminForm.fullName} onChange={handleAdminChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={adminForm.email} onChange={handleAdminChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={adminForm.password} onChange={handleAdminChange} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" name="age" value={adminForm.age} onChange={handleAdminChange} min={18} max={120} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={adminForm.gender} onChange={handleAdminChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={adminForm.role} onChange={handleAdminChange}>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={adminSubmitting}>
          {adminSubmitting ? "Creating..." : "Create Account"}
        </button>
      </form>
      <h3>All Users ({admins.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Users">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {admins.map((u) => (
              <tr key={u.id || u._id}>
                <td>{u.fullName || u.name}</td>
                <td>{u.email}</td>
                <td><span className={`role-chip role-${u.role}`}>{u.role}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id || u._id)}>Delete</button></td>
              </tr>
            ))}
            {admins.length === 0 && <EmptyRow colSpan={4} />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — DEPARTMENTS
     ═══════════════════════════════════════════ */
  const renderDepartments = () => (
    <div className="departments-section">
      <h3>{editingDept ? "Edit Department" : "Create Department"}</h3>
      <form className="create-form" onSubmit={handleDeptSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={deptForm.name} onChange={handleDeptChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" name="description" value={deptForm.description} onChange={handleDeptChange} />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={deptSubmitting}>
            {deptSubmitting ? "Saving..." : editingDept ? "Update" : "Create"}
          </button>
          {editingDept && (
            <button type="button" className="btn btn-secondary" onClick={() => { setEditingDept(null); setDeptForm({ name: "", description: "" }); }}>Cancel</button>
          )}
        </div>
      </form>
      <h3>All Departments ({departments.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Departments">
          <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id || d._id}>
                <td>{d.name}</td>
                <td>{d.description || "—"}</td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditDept(d)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDept(d.id || d._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && <EmptyRow colSpan={3} msg="No departments yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — DOCTORS
     ═══════════════════════════════════════════ */
  const renderDoctors = () => (
    <div className="doctors-section">
      <h3>Create Doctor Account</h3>
      <form className="create-form" onSubmit={handlecreateDoctorAccount}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" value={doctorForm.fullName} onChange={handleDoctorChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={doctorForm.email} onChange={handleDoctorChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={doctorForm.password} onChange={handleDoctorChange} required minLength={6} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Specialty</label>
            <input type="text" name="specialty" value={doctorForm.specialty} onChange={handleDoctorChange} placeholder="e.g. Cardiology" />
          </div>
          <div className="form-group">
            <label>Department</label>
            <select name="department" value={doctorForm.department} onChange={handleDoctorChange}>
              <option value="">Select Department</option>
              {departments.map((d) => (<option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={doctorForm.phone} onChange={handleDoctorChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input type="number" name="age" value={doctorForm.age} onChange={handleDoctorChange} min={25} max={100} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={doctorForm.gender} onChange={handleDoctorChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Consultation Fee</label>
            <input type="number" name="consultationFee" value={doctorForm.consultationFee} onChange={handleDoctorChange} min={0} step="0.01" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={doctorSubmitting}>
          {doctorSubmitting ? "Creating..." : "Create Doctor"}
        </button>
      </form>
      <h3>All Doctors ({doctors.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Doctors">
          <thead><tr><th>Name</th><th>Email</th><th>Specialty</th><th>Department</th><th>Fee</th><th>Actions</th></tr></thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc.id || doc._id}>
                <td>{doc.fullName || doc.name}</td>
                <td>{doc.email}</td>
                <td>{doc.specialty || "—"}</td>
                <td>{doc.departmentName || doc.department || "—"}</td>
                <td>{doc.consultationFee != null ? `$${doc.consultationFee}` : "—"}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteDoctor(doc.id || doc._id)}>Delete</button></td>
              </tr>
            ))}
            {doctors.length === 0 && <EmptyRow colSpan={6} msg="No doctors yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — AVAILABILITY
     ═══════════════════════════════════════════ */
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const renderAvailability = () => (
    <div className="availability-section">
      <h3>Create Availability Slot</h3>
      <form className="create-form" onSubmit={handlecreateAvailabilitySlot}>
        <div className="form-row">
          <div className="form-group">
            <label>Doctor</label>
            <select name="doctorId" value={availForm.doctorId} onChange={handleAvailChange} required>
              <option value="">Select Doctor</option>
              {doctors.map((d) => (<option key={d.id || d._id} value={d.id || d._id}>{d.fullName || d.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Day of Week</label>
            <select name="day_of_week" value={availForm.day_of_week} onChange={handleAvailChange}>
              {DAYS.map((day) => (<option key={day} value={day}>{day}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" name="start_time" value={availForm.start_time} onChange={handleAvailChange} required />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" name="end_time" value={availForm.end_time} onChange={handleAvailChange} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={availSubmitting}>
          {availSubmitting ? "Saving..." : "Add Slot"}
        </button>
      </form>
      <h3>All Availability Slots ({availability.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Availability">
          <thead><tr><th>Doctor</th><th>Day</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
          <tbody>
            {availability.map((slot) => (
              <tr key={slot.id || slot._id}>
                <td>{slot.doctorName || slot.doctor_name || slot.doctorId}</td>
                <td>{slot.day_of_week}</td>
                <td>{slot.start_time}</td>
                <td>{slot.end_time}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handledeleteAvailabilitySlot(slot.id || slot._id)}>Delete</button></td>
              </tr>
            ))}
            {availability.length === 0 && <EmptyRow colSpan={5} msg="No availability slots yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — HOSPITALS
     ═══════════════════════════════════════════ */
  const renderHospitals = () => (
    <div className="hospitals-section">
      <h3>{editingHospital ? "Edit Hospital" : "Add Partner Hospital"}</h3>
      <form className="create-form" onSubmit={handleHospitalSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={hospitalForm.name} onChange={handleHospitalChange} required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={hospitalForm.address} onChange={handleHospitalChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Latitude</label>
            <input type="number" step="any" name="latitude" value={hospitalForm.latitude} onChange={handleHospitalChange} />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input type="number" step="any" name="longitude" value={hospitalForm.longitude} onChange={handleHospitalChange} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={hospitalForm.phone} onChange={handleHospitalChange} />
          </div>
          <div className="form-group">
            <label>Emergency Phone</label>
            <input type="tel" name="emergency_phone" value={hospitalForm.emergency_phone} onChange={handleHospitalChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Services (comma-separated)</label>
          <input type="text" name="services" value={hospitalForm.services} onChange={handleHospitalChange} placeholder="Cardiology, Neurology" />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={hospitalSubmitting}>
            {hospitalSubmitting ? "Saving..." : editingHospital ? "Update" : "Add Hospital"}
          </button>
          {editingHospital && (<button type="button" className="btn btn-secondary" onClick={resetHospitalForm}>Cancel</button>)}
        </div>
      </form>
      <h3>Hospital Map</h3>
      <div className="map-container">
        <Map markers={hospitals.filter((h) => h.latitude && h.longitude).map((h) => ({ id: h.id || h._id, name: h.name, lat: h.latitude, lng: h.longitude, type: "hospital" }))} height="400px" />
      </div>
      <h3>All Hospitals ({hospitals.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Hospitals">
          <thead><tr><th>Name</th><th>Address</th><th>Phone</th><th>Emergency</th><th>Services</th><th>Actions</th></tr></thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id || h._id}>
                <td>{h.name}</td>
                <td>{h.address}</td>
                <td>{h.phone || "—"}</td>
                <td>{h.emergency_phone || "—"}</td>
                <td>{Array.isArray(h.services) ? h.services.join(", ") : h.services || "—"}</td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditHospital(h)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHospital(h.id || h._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && <EmptyRow colSpan={6} msg="No hospitals yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — VEHICLES
     ═══════════════════════════════════════════ */
  const renderVehicles = () => (
    <div className="vehicles-section">
      <h3>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h3>
      <form className="create-form" onSubmit={handleVehicleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Plate Number</label>
            <input type="text" name="plateNumber" value={vehicleForm.plateNumber} onChange={handleVehicleChange} required />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={vehicleForm.type} onChange={handleVehicleChange}>
              <option value="ambulance">Ambulance</option>
              <option value="van">Van</option>
              <option value="car">Car</option>
              <option value="truck">Truck</option>
            </select>
          </div>
          <div className="form-group">
            <label>Model</label>
            <input type="text" name="model" value={vehicleForm.model} onChange={handleVehicleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Year</label>
            <input type="number" name="year" value={vehicleForm.year} onChange={handleVehicleChange} min={1990} max={2030} />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input type="number" name="capacity" value={vehicleForm.capacity} onChange={handleVehicleChange} min={1} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={vehicleForm.status} onChange={handleVehicleChange}>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={vehicleSubmitting}>
            {vehicleSubmitting ? "Saving..." : editingVehicle ? "Update" : "Add Vehicle"}
          </button>
          {editingVehicle && (<button type="button" className="btn btn-secondary" onClick={resetVehicleForm}>Cancel</button>)}
        </div>
      </form>
      <h3>All Vehicles ({vehicles.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Vehicles">
          <thead><tr><th>Plate</th><th>Type</th><th>Model</th><th>Year</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id || v._id}>
                <td className="mono">{v.plateNumber || v.plate_number}</td>
                <td>{v.type}</td>
                <td>{v.model || "—"}</td>
                <td>{v.year || "—"}</td>
                <td>{v.capacity || "—"}</td>
                <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditVehicle(v)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVehicle(v.id || v._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && <EmptyRow colSpan={7} msg="No vehicles yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — DRIVERS
     ═══════════════════════════════════════════ */
  const renderDrivers = () => (
    <div className="drivers-section">
      <h3>Create Driver Account</h3>
      <form className="create-form" onSubmit={handlecreateDriverWithAccount}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" value={driverForm.fullName} onChange={handleDriverChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={driverForm.email} onChange={handleDriverChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={driverForm.password} onChange={handleDriverChange} required minLength={6} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={driverForm.phone} onChange={handleDriverChange} />
          </div>
          <div className="form-group">
            <label>License Number</label>
            <input type="text" name="licenseNumber" value={driverForm.licenseNumber} onChange={handleDriverChange} required />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" name="age" value={driverForm.age} onChange={handleDriverChange} min={18} max={100} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={driverForm.gender} onChange={handleDriverChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Assign Vehicle (optional)</label>
            <select name="vehicleId" value={driverForm.vehicleId} onChange={handleDriverChange}>
              <option value="">No Vehicle</option>
              {vehicles.map((v) => (<option key={v.id || v._id} value={v.id || v._id}>{v.plateNumber || v.plate_number} - {v.model || v.type}</option>))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={driverSubmitting}>
          {driverSubmitting ? "Creating..." : "Create Driver"}
        </button>
      </form>
      <h3>All Drivers ({drivers.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Drivers">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>License</th><th>Vehicle</th><th>Actions</th></tr></thead>
          <tbody>
            {drivers.map((dr) => (
              <tr key={dr.id || dr._id}>
                <td>{dr.fullName || dr.name}</td>
                <td>{dr.email}</td>
                <td>{dr.phone || "—"}</td>
                <td className="mono">{dr.licenseNumber || dr.license_number || "—"}</td>
                <td>{dr.vehiclePlate || dr.vehicle?.plateNumber || "—"}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteDriver(dr.id || dr._id)}>Delete</button></td>
              </tr>
            ))}
            {drivers.length === 0 && <EmptyRow colSpan={6} msg="No drivers yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — EMERGENCY
     ═══════════════════════════════════════════ */
  const renderEmergency = () => (
    <div className="emergency-section">
      <h3>Live Emergency Monitoring</h3>
      <div className="emergency-map-container">
        <Map markers={emergencies.filter((e) => e.latitude && e.longitude).map((e) => ({ id: e.id || e._id, name: `Emergency - ${e.patient_name || "Unknown"}`, lat: e.latitude, lng: e.longitude, type: "emergency", priority: e.emergency_level || "normal" }))} height="450px" />
      </div>
      <h3>Active Emergencies ({emergencies.length})</h3>
      <div className="emergency-cards">
        {emergencies.length === 0 && <p className="muted">No active emergencies.</p>}
        {emergencies.map((em) => (
          <div key={em.id || em._id} className={`emergency-card priority-border-${em.emergency_level || em.priority || "normal"}`}>
            <div className="emergency-card-header">
              <span className={`priority-badge priority-${em.emergency_level || em.priority || "normal"}`}>{em.emergency_level || em.priority || "normal"}</span>
              <span className={`badge badge-${em.status}`}>{em.status}</span>
            </div>
            <div className="emergency-card-body">
              <p><strong>Patient:</strong> {em.patient_name || "—"}</p>
              <p><strong>Phone:</strong> {em.contact_phone || "—"}</p>
              <p><strong>Location:</strong> {em.location || "—"}</p>
              <p><strong>Condition:</strong> {em.condition || "—"}</p>
              <p><strong>Driver:</strong> {em.driver_name || "Unassigned"}</p>
              <p><strong>Created:</strong> {em.created_at ? new Date(em.created_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — FEES
     ═══════════════════════════════════════════ */
  const renderFees = () => (
    <div className="fees-section">
      <h3>{editingFee ? "Edit Fee" : "Create Fee Entry"}</h3>
      <form className="create-form" onSubmit={handleFeeSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={feeForm.name} onChange={handleFeeChange} required />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" name="amount" value={feeForm.amount} onChange={handleFeeChange} min={0} step="0.01" required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={feeForm.category} onChange={handleFeeChange}>
              <option value="consultation">Consultation</option>
              <option value="procedure">Procedure</option>
              <option value="lab_test">Lab Test</option>
              <option value="imaging">Imaging</option>
              <option value="ambulance">Ambulance</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" name="description" value={feeForm.description} onChange={handleFeeChange} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={feeSubmitting}>
            {feeSubmitting ? "Saving..." : editingFee ? "Update" : "Create Fee"}
          </button>
          {editingFee && (<button type="button" className="btn btn-secondary" onClick={resetFeeForm}>Cancel</button>)}
        </div>
      </form>
      <h3>All Fee Entries ({fees.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Fees">
          <thead><tr><th>Name</th><th>Description</th><th>Amount</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id || f._id}>
                <td>{f.name}</td>
                <td>{f.description || "—"}</td>
                <td>${Number(f.amount).toFixed(2)}</td>
                <td><span className="badge badge-info">{f.category}</span></td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditFee(f)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFee(f.id || f._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && <EmptyRow colSpan={5} msg="No fee entries yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — FORM TEMPLATES
     ═══════════════════════════════════════════ */
  const renderForms = () => (
    <div className="forms-section">
      <h3>{editingFormTemplate ? `Edit Form: ${editingFormTemplate.title}` : "Create Form Template"}</h3>
      <form className="create-form" onSubmit={handleFormTemplateSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={formTemplateForm.title} onChange={handleFormTemplateChange} required />
          </div>
          <div className="form-group">
            <label>Icon (emoji)</label>
            <input type="text" name="icon" value={formTemplateForm.icon} onChange={handleFormTemplateChange} maxLength={4} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Form Code</label>
            <input type="text" name="form_code" value={formTemplateForm.form_code} onChange={handleFormTemplateChange} placeholder="e.g. FM-007" />
          </div>
          <div className="form-group">
            <label>Revision</label>
            <input type="text" name="revision" value={formTemplateForm.revision} onChange={handleFormTemplateChange} placeholder="e.g. 1.0" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" name="category" value={formTemplateForm.category} onChange={handleFormTemplateChange} placeholder="e.g. Admission" />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" name="description" value={formTemplateForm.description} onChange={handleFormTemplateChange} />
        </div>

        <h4 style={{ marginBottom: 8 }}>Form Fields ({formTemplateForm.fields.length})</h4>
        {formTemplateForm.fields.length === 0 && <p className="muted">No fields yet. Add fields below.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {formTemplateForm.fields.map((field, index) => (
            <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', backgroundColor: '#fafafa' }}>
              <div className="form-group" style={{ minWidth: 130 }}>
                <label>Key</label>
                <input type="text" value={field.key} onChange={(e) => updateFormField(index, { key: e.target.value })} placeholder="full_name" />
              </div>
              <div className="form-group" style={{ minWidth: 160 }}>
                <label>Label</label>
                <input type="text" value={field.label} onChange={(e) => updateFormField(index, { label: e.target.value })} placeholder="Full Name" />
              </div>
              <div className="form-group" style={{ minWidth: 110 }}>
                <label>Type</label>
                <select value={field.type} onChange={(e) => updateFormField(index, { type: e.target.value })}>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="signature">Signature</option>
                </select>
              </div>
              {(field.type === "select" || field.type === "radio") && (
                <div className="form-group" style={{ minWidth: 200 }}>
                  <label>Options (comma-separated)</label>
                  <input type="text" value={field.options} onChange={(e) => updateFormField(index, { options: e.target.value })} placeholder="Male, Female, Other" />
                </div>
              )}
              <div className="form-group" style={{ minWidth: 140 }}>
                <label>Placeholder</label>
                <input type="text" value={field.placeholder} onChange={(e) => updateFormField(index, { placeholder: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', paddingBottom: 10 }}>
                <input type="checkbox" checked={!!field.required} onChange={(e) => updateFormField(index, { required: e.target.checked })} />
                Required
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', paddingBottom: 10 }}>
                <input type="checkbox" checked={!!field.full} onChange={(e) => updateFormField(index, { full: e.target.checked })} />
                Full width
              </label>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFormField(index)} style={{ marginBottom: 10 }}>Remove</button>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={addFormField}>+ Add Field</button>
          <button type="submit" className="btn btn-primary" disabled={formTemplateSubmitting}>
            {formTemplateSubmitting ? "Saving..." : editingFormTemplate ? "Update Form" : "Create Form"}
          </button>
          {editingFormTemplate && (<button type="button" className="btn btn-secondary" onClick={resetFormTemplateForm}>Cancel</button>)}
        </div>
      </form>

      <h3>All Form Templates ({formTemplates.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Form Templates">
          <thead><tr><th>Title</th><th>Code</th><th>Category</th><th>Fields</th><th>Active</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {formTemplates.map((f) => (
              <tr key={f.id || f._id}>
                <td>{f.icon || "📄"} {f.title}</td>
                <td>{f.form_code || "—"}</td>
                <td>{f.category || "—"}</td>
                <td>{Array.isArray(f.fields) ? f.fields.length : 0}</td>
                <td><span className={`badge ${f.is_active === false ? "badge-error" : "badge-success"}`}>{f.is_active === false ? "Inactive" : "Active"}</span></td>
                <td>{f.updated_at ? new Date(f.updated_at).toLocaleDateString() : "—"}</td>
                <td className="actions-cell">
                  <button className="btn btn-edit btn-sm" onClick={() => handleEditFormTemplate(f)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteFormTemplate(f.id || f._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {formTemplates.length === 0 && <EmptyRow colSpan={7} msg="No form templates yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — NOTIFICATIONS
     ═══════════════════════════════════════════ */
  const renderNotifications = () => (
    <div className="notifications-section">
      <h3>Send Notification</h3>
      <form className="create-form" onSubmit={handlecreateNotification}>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={notifForm.title} onChange={handleNotifChange} required />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={notifForm.type} onChange={handleNotifChange}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea name="message" value={notifForm.message} onChange={handleNotifChange} rows={4} required className="form-textarea" />
        </div>
        <div className="form-group">
          <label>Target User ID (leave blank for broadcast)</label>
          <input type="text" name="targetUserId" value={notifForm.targetUserId} onChange={handleNotifChange} placeholder="Optional: specific user ID" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={notifSubmitting}>
          {notifSubmitting ? "Sending..." : "Send Notification"}
        </button>
      </form>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — MESSAGES
     ═══════════════════════════════════════════ */
  const renderMessages = () => (
    <div className="messages-section">
      <h3>Contact Form Submissions ({messages.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Messages">
          <thead><tr><th>From</th><th>Email</th><th>Subject</th><th>Message</th><th>Date</th></tr></thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id || m._id}>
                <td>{m.name || m.fullName}</td>
                <td>{m.email}</td>
                <td>{m.subject || "—"}</td>
                <td className="message-cell">{m.message || m.body}</td>
                <td>{(m.createdAt || m.created_at) ? new Date(m.createdAt || m.created_at).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
            {messages.length === 0 && <EmptyRow colSpan={5} msg="No messages yet." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — PRESCRIPTIONS
     ═══════════════════════════════════════════ */
  const renderPrescriptions = () => (
    <div className="prescriptions-section">
      <h3>Repeat Prescriptions ({prescriptions.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Prescriptions">
          <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {prescriptions.map((p) => (
              <tr key={p.id || p._id}>
                <td>{p.patientName || p.patient_name || "—"}</td>
                <td>{p.medication || p.medicineName || "—"}</td>
                <td>{p.dosage || "—"}</td>
                <td>{p.frequency || "—"}</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td className="actions-cell">
                  {p.status === "pending" && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handlePrescriptionStatus(p.id || p._id, "approved")}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handlePrescriptionStatus(p.id || p._id, "rejected")}>Reject</button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handlePrescriptionStatus(p.id || p._id, "dispensed")}>Mark Dispensed</button>
                  )}
                </td>
              </tr>
            ))}
            {prescriptions.length === 0 && <EmptyRow colSpan={6} msg="No repeat prescriptions." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — CERTIFICATES
     ═══════════════════════════════════════════ */
  const renderCertificates = () => (
    <div className="certificates-section">
      <h3>Illness Certificates ({certificates.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Certificates">
          <thead><tr><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {certificates.map((c) => (
              <tr key={c.id || c._id}>
                <td>{c.patientName || c.patient_name || "—"}</td>
                <td>{c.doctorName || c.doctor_name || "—"}</td>
                <td>{c.diagnosis || "—"}</td>
                <td>{c.startDate || c.start_date ? new Date(c.startDate || c.start_date).toLocaleDateString() : "—"}</td>
                <td>{c.endDate || c.end_date ? new Date(c.endDate || c.end_date).toLocaleDateString() : "—"}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                <td className="actions-cell">
                  {c.status === "pending" && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleCertificateStatus(c.id || c._id, "approved")}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCertificateStatus(c.id || c._id, "rejected")}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {certificates.length === 0 && <EmptyRow colSpan={7} msg="No illness certificates." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — APPOINTMENTS
     ═══════════════════════════════════════════ */
  const renderAppointments = () => (
    <div className="appointments-section">
      <h3>All Appointments ({appointments.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Appointments">
          <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Type</th></tr></thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id || appt._id}>
                <td className="mono">{(appt.id || appt._id || "").slice(0, 8)}</td>
                <td>{appt.patientName || appt.patient_name || "—"}</td>
                <td>{appt.doctorName || appt.doctor_name || "—"}</td>
                <td>{(appt.appointmentDate || appt.date) ? new Date(appt.appointmentDate || appt.date).toLocaleDateString() : 'N/A'}</td>
                <td>{appt.appointmentTime || appt.time || "—"}</td>
                <td><span className={`badge badge-${appt.status}`}>{appt.status}</span></td>
                <td>{appt.type || appt.appointmentType || "—"}</td>
              </tr>
            ))}
            {appointments.length === 0 && <EmptyRow colSpan={7} msg="No appointments found." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     RENDER — CONSULTATIONS
     ═══════════════════════════════════════════ */
  const renderConsultations = () => (
    <div className="consultations-section">
      <h3>All Consultations ({consultations.length})</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" aria-label="Consultations">
          <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.id || c._id}>
                <td className="mono">{(c.id || c._id || "").slice(0, 8)}</td>
                <td>{c.patientName || c.patient_name || "—"}</td>
                <td>{c.doctorName || c.doctor_name || "—"}</td>
                <td>{(c.createdAt || c.created_at) ? new Date(c.createdAt || c.created_at).toLocaleDateString() : 'N/A'}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                <td className="notes-cell">{c.notes || c.summary || "—"}</td>
              </tr>
            ))}
            {consultations.length === 0 && <EmptyRow colSpan={6} msg="No consultations found." />}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
     TAB DISPATCH
     ═══════════════════════════════════════════ */
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "admins": return renderAdmins();
      case "departments": return renderDepartments();
      case "doctors": return renderDoctors();
      case "availability": return renderAvailability();
      case "hospitals": return renderHospitals();
      case "vehicles": return renderVehicles();
      case "drivers": return renderDrivers();
      case "emergency": return renderEmergency();
      case "fees": return renderFees();
      case "forms": return renderForms();
      case "notifications": return renderNotifications();
      case "messages": return renderMessages();
      case "prescriptions": return renderPrescriptions();
      case "certificates": return renderCertificates();
      case "appointments": return renderAppointments();
      case "consultations": return renderConsultations();
      default: return null;
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
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation menu">☰</button>
            <h1>Admin Dashboard</h1>
          </div>
          <div className="header-right">
            <NotificationBell />
            <span className="user-badge">👤 {user?.full_name || "Admin"}</span>
          </div>
        </header>
        <nav className="tab-nav" role="tablist" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {TABS.map((tab) => (
            <button key={tab.key} role="tab" id={`tab-${tab.key}`} aria-selected={activeTab === tab.key} aria-controls={`tabpanel-${tab.key}`} className={`tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
        <section className="tab-content" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Loading dashboard...</p>
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

export default AdminDashboard;
