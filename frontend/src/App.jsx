/**
 * Root application component.
 * Defines public site routes and protected admin routes.
 *
 * Public routes: /, /about, /brothers, /events, /rush, /gallery, /donate, /contact
 * Admin routes:  /admin/login, /admin (dashboard), /admin/members, /admin/events,
 *                /admin/announcements, /admin/gallery, /admin/pledge-classes, /admin/donate,
 *                /admin/contact, /admin/rush, /admin/messages
 */

import { Routes, Route } from "react-router-dom";

// Public layout components
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Public pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Brothers from "./pages/Brothers.jsx";
import Events from "./pages/Events.jsx";
import Gallery from "./pages/Gallery.jsx";
import Donate from "./pages/Donate.jsx";
import Contact from "./pages/Contact.jsx";

// Admin pages (no public navbar/footer)
import AdminLogin from "./pages/admin/Login.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminMembers from "./pages/admin/AdminMembers.jsx";
import AdminEvents from "./pages/admin/AdminEvents.jsx";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements.jsx";
import AdminGallery from "./pages/admin/AdminGallery.jsx";
import AdminPledgeClasses from "./pages/admin/AdminPledgeClasses.jsx";
import AdminDonate from "./pages/admin/AdminDonate.jsx";
import AdminContact from "./pages/admin/AdminContact.jsx";
import AdminRush from "./pages/admin/AdminRush.jsx";
import AdminMessages from "./pages/admin/AdminMessages.jsx";

export default function App() {
  return (
    <Routes>
      {/* ---------------------------------------------------------------- */}
      {/* Admin routes — no public navbar/footer, protected by auth check  */}
      {/* ---------------------------------------------------------------- */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/members" element={<ProtectedRoute><AdminMembers /></ProtectedRoute>} />
      <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute><AdminAnnouncements /></ProtectedRoute>} />
      <Route path="/admin/gallery" element={<ProtectedRoute><AdminGallery /></ProtectedRoute>} />
      <Route path="/admin/pledge-classes" element={<ProtectedRoute><AdminPledgeClasses /></ProtectedRoute>} />
      <Route path="/admin/donate" element={<ProtectedRoute><AdminDonate /></ProtectedRoute>} />
      <Route path="/admin/contact" element={<ProtectedRoute><AdminContact /></ProtectedRoute>} />
      <Route path="/admin/rush" element={<ProtectedRoute><AdminRush /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />

      {/* ---------------------------------------------------------------- */}
      {/* Public routes — wrapped in the site navbar + footer              */}
      {/* ---------------------------------------------------------------- */}
      <Route
        path="/*"
        element={
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/brothers" element={<Brothers />} />
                <Route path="/events" element={<Events />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}
