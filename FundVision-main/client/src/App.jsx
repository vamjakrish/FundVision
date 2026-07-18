import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './context/authStore';
import { initSocket } from './services/socket';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PageLoader from './components/common/PageLoader';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const CampaignList = lazy(() => import('./pages/CampaignList'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const DonorDashboard = lazy(() => import('./pages/dashboard/DonorDashboard'));
const OrgDashboard = lazy(() => import('./pages/dashboard/OrgDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const CreateCampaign = lazy(() => import('./pages/campaigns/CreateCampaign'));
const EditCampaign = lazy(() => import('./pages/campaigns/EditCampaign'));
const OrganizationSetup = lazy(() => import('./pages/organizations/OrganizationSetup'));
const OrganizationProfile = lazy(() => import('./pages/organizations/OrganizationProfile'));
const Profile = lazy(() => import('./pages/Profile'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const DonationLedger = lazy(() => import('./pages/DonationLedger'));
const Notifications = lazy(() => import('./pages/Notifications'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const { token, initialize, user } = useAuthStore();

  useEffect(() => {
    initialize();
    initSocket(token);
  }, [token]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/organizations/:id" element={<OrganizationProfile />} />
          <Route path="/about" element={<About />} />
          <Route path="/ledger" element={<DonationLedger />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Protected - all users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={
              user?.role === 'admin' ? <AdminDashboard /> :
              user?.role === 'organization' ? <OrgDashboard /> :
              <DonorDashboard />
            } />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/donate/:campaignId" element={<DonatePage />} />
          </Route>

          {/* Organization only */}
          <Route element={<ProtectedRoute roles={['organization', 'admin']} />}>
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/campaigns/:id/edit" element={<EditCampaign />} />
          </Route>

          {/* Org setup */}
          <Route element={<ProtectedRoute roles={['organization', 'donor', 'admin']} />}>
            <Route path="/organization/setup" element={<OrganizationSetup />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
