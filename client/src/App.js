import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Common Pages
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/Layout/Navbar";
import About from "./pages/About";

// Student Pages
import Dashboard from "./components/Dashboard";
import Events from "./components/Events/Events";
import EventDetail from "./components/Events/EventDetail";
import CalendarView from "./components/Calendar/CalendarView";
import MyRegistrations from "./components/Registrations/MyRegistrations";
import ProposedEvents from "./components/Votes/ProposedEvents";

// Organiser Pages
import OrganiserDashboard from "./pages/OrganiserDashboard";
import CreateEvent from "./pages/CreateEvent";
import ManageEvents from "./pages/ManageEvents";
import Participants from "./pages/Participants";
import Feedback from "./pages/Feedback";
import ScanQR from "./pages/scanQR";
import GoogleCallback from "./pages/GoogleCallback";
import OrganiserNotifications from "./pages/OrganiserNotifications";

// Private route logic
const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading)
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "organiser" ? "/organiser" : "/"} replace />;
  }
  return children;
};

// Public route logic
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (user)
    return <Navigate to={user.role === "organiser" ? "/organiser" : "/"} replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/about" element={<About />} />

            {/* Student Routes */}
            <Route path="/" element={<PrivateRoute role="student"><Dashboard /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute role="student"><Events /></PrivateRoute>} />
            <Route path="/events/:id" element={<PrivateRoute role="student"><EventDetail /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute role="student"><CalendarView /></PrivateRoute>} />
            <Route path="/my-registrations" element={<PrivateRoute role="student"><MyRegistrations /></PrivateRoute>} />
            <Route path="/proposed-events" element={<PrivateRoute role="student"><ProposedEvents /></PrivateRoute>} />


            {/* Organiser Routes */}
            <Route path="/organiser" element={<PrivateRoute role="organiser"><OrganiserDashboard /></PrivateRoute>} />
            <Route path="/organiser/create-event" element={<PrivateRoute role="organiser"><CreateEvent /></PrivateRoute>} />
            <Route path="/organiser/manage-events" element={<PrivateRoute role="organiser"><ManageEvents /></PrivateRoute>} />
            <Route path="/organiser/participants/:eventId" element={<PrivateRoute role="organiser"><Participants /></PrivateRoute>} />
            {/* Organiser Proposed Events */}
            <Route 
  path="/organiser/proposed-events" 
  element={
    <PrivateRoute role="organiser">
      <ProposedEvents />
    </PrivateRoute>
  } 
/>


            <Route path="/organiser/feedback/:eventId" element={<PrivateRoute role="organiser"><Feedback /></PrivateRoute>} />
            <Route path="/organiser/notifications" element={<PrivateRoute role="organiser"><OrganiserNotifications /></PrivateRoute>} />

            
<Route path="/organiser/scan/:eventId" element={<PrivateRoute role="organiser"><ScanQR /></PrivateRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
