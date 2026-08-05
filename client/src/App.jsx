import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { EmergencyProvider } from './context/EmergencyContext';
import { LANDING_MODE } from './config';


// Layout Components
import Navbar from './components/Navbar';
import EmergencyAlertOverlay from './components/EmergencyAlertOverlay';
import SOSButton from './components/SOSButton';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import PatientLayout from './components/PatientLayout';
import PageLoader from './components/PageLoader';
import HomePage from './pages/HomePage';

// Public Pages
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const TrackPage = lazy(() => import('./pages/TrackPage'));
const FindDoctorPage = lazy(() => import('./pages/FindDoctorPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const SOSPage = lazy(() => import('./pages/SOSPage'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const ProgrammesPage = lazy(() => import('./pages/ProgrammesPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Protected Pages
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AmbulancePage = lazy(() => import('./pages/AmbulancePage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const ConsultationsPage = lazy(() => import('./pages/ConsultationsPage'));
const FormsPage = lazy(() => import('./pages/FormsPage'));
const FormHistoryPage = lazy(() => import('./pages/FormHistoryPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const RepeatPrescriptionPage = lazy(() => import('./pages/RepeatPrescriptionPage'));
const IllnessCertificatePage = lazy(() => import('./pages/IllnessCertificatePage'));
const FeesPage = lazy(() => import('./pages/FeesPage'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Role-Specific Dashboards
const SuperAdminDashboard = lazy(() => import('./pages/Admin/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const DoctorDashboard = lazy(() => import('./pages/Doctor/DoctorDashboard'));
const DriverDashboard = lazy(() => import('./pages/Driver/DriverDashboard'));

import './App.css';

function App() {
  return (
    <HelmetProvider>
    <EmergencyProvider>
      <div className="app">
        <a href="#main-content" className="skip-to-content">Skip to main content</a>
        <Navbar />
        <EmergencyAlertOverlay />

        <main id="main-content" className="main-content">
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {LANDING_MODE ? (
              <>
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/find-doctor" element={<FindDoctorPage />} />
                <Route path="/about-us" element={<AboutUsPage />} />
                <Route path="/faqs" element={<FAQsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/policies" element={<PoliciesPage />} />
                <Route path="/sos" element={<SOSPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/programmes" element={<ProgrammesPage />} />
                <Route path="/track/:id" element={<TrackPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                {/* ── Public Routes ────────────────────────────────────── */}
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/track/:id" element={<TrackPage />} />
                <Route path="/find-doctor" element={<FindDoctorPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/sos" element={<SOSPage />} />
                <Route path="/faqs" element={<FAQsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/programmes" element={<ProgrammesPage />} />

                {/* ── Patient Routes (shared sidebar layout) ─────────── */}
                <Route element={<PatientLayout />}>
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ambulance"
                    element={<AmbulancePage />}
                  />
                  <Route
                    path="/appointments"
                    element={
                      <ProtectedRoute>
                        <AppointmentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/consultations"
                    element={
                      <ProtectedRoute>
                        <ConsultationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forms"
                    element={
                      <ProtectedRoute>
                        <FormsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/form-history"
                    element={
                      <ProtectedRoute>
                        <FormHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/repeat-prescription"
                    element={
                      <ProtectedRoute>
                        <RepeatPrescriptionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/illness-certificate"
                    element={
                      <ProtectedRoute>
                        <IllnessCertificatePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/fees"
                    element={
                      <ProtectedRoute>
                        <FeesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/policies"
                  element={
                    <ProtectedRoute>
                      <PoliciesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/about-us"
                  element={
                    <ProtectedRoute>
                      <AboutUsPage />
                    </ProtectedRoute>
                  }
                />

                {/* ── Role-Specific Dashboards ────────────────────────── */}
                <Route
                  path="/super-admin"
                  element={
                    <ProtectedRoute roles={['super_admin']}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/super-admin/:tab"
                  element={
                    <ProtectedRoute roles={['super_admin']}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/:tab"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute roles={['doctor']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/:tab"
                  element={
                    <ProtectedRoute roles={['doctor']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/driver"
                  element={
                    <ProtectedRoute roles={['driver']}>
                      <DriverDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/driver/:tab"
                  element={
                    <ProtectedRoute roles={['driver']}>
                      <DriverDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* ── Not Authorized ─────────────────────────────────── */}
                <Route path="/not-authorized" element={
                  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
                    <div>
                      <h1 style={{ fontSize: 64, fontWeight: 900, color: '#e5e7eb', margin: 0 }}>403</h1>
                      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginTop: 16, marginBottom: 8 }}>Access Denied</h2>
                      <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>You don't have permission to access this page.</p>
                      <a href="/" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: '#1e40af', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Back to Home</a>
                    </div>
                  </div>
                } />

                {/* ── 404 Catch-All ───────────────────────────────────── */}
                <Route path="*" element={<NotFoundPage />} />
              </>
            )}
          </Routes>
          </Suspense>
        </main>

        <SOSButton />
        <Footer />
        <CookieConsent />
      </div>
    </EmergencyProvider>
    </HelmetProvider>
  );
}

export default App;
