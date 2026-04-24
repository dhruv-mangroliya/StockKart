import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./api/AuthContext";
import { useState, useEffect } from "react";
import Stores from "./pages/Stores";
import RawMaterials from "./pages/RawMaterials";
import Products from "./pages/Products";
import Producers from "./pages/Producers";
import Inventory from "./pages/Inventory";
import Transfers from "./pages/Transfers";
import Returns from "./pages/Returns";
import ProducerReturn from "./pages/ProducerReturn";
import ProductionOrders from "./pages/ProductionOrders";
import Login from "./pages/Login";
import Onboarding from "./components/Onboarding";
import TodoPanel from "./components/TodoPanel";
import SubscriptionModal from "./components/SubscriptionModal";
import Subscription from "./pages/Subscription";
import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import TermsOfService from "./pages/policies/TermsOfService";
import CookiePolicy from "./pages/policies/CookiePolicy";
import RefundPolicy from "./pages/policies/RefundPolicy";
import "./App.css";

const navGroups = [
  {
    label: "Master Data",
    links: [
      { to: "/", label: "🏪 Stores" },
      { to: "/raw-materials", label: "🧵 Raw Materials" },
      { to: "/products", label: "📦 Products" },
      { to: "/producers", label: "🏭 Producers" },
    ],
  },
  {
    label: "Inventory",
    links: [
      { to: "/inventory", label: "📊 Inventory" },
      { to: "/transfers", label: "🔁 Transfers" },
      { to: "/producer-return", label: "↩ Producer Return" },
    ],
  },
  {
    label: "Orders",
    links: [
      { to: "/returns", label: "🛒 Ecom Orders" },
      { to: "/production-orders", label: "⚙️ Production Orders" },
    ],
  },
];

function AppShell() {
  const { user, logout, refreshUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem("onboarding_done")) {
      setShowOnboarding(true);
    }
  }, [user]);

  if (user === undefined) return <div className="loading">Loading...</div>;
  if (!user) return <Login />;

  const needsSubscription = user.trialExpired && !user.subscriptionActive;

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span /><span /><span />
        </button>
        <span className="mobile-brand">📦 Inventory</span>
        {user.avatar && <img src={user.avatar} alt={user.name} className="avatar" referrerPolicy="no-referrer" />}
      </div>

      {/* Sidebar backdrop on mobile */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-bg-shapes">
          {[...Array(6)].map((_, i) => <div key={i} className={`sb-shape sb-shape-${i + 1}`} />)}
        </div>
        <div className="sidebar-brand">
          <span className="brand-icon">📦</span>
          <span className="brand-text">Inventory</span>
        </div>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="nav-group-label">{group.label}</span>
              {group.links.map((n) => (
                <NavLink key={n.to} to={n.to} end className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
          <div className="nav-group">
            <span className="nav-group-label">Account</span>
            <NavLink to="/subscription" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>💳 Subscription</NavLink>
          </div>
          <div className="nav-group">
            <span className="nav-group-label">Help</span>
            <button className="sidebar-link guide-btn" onClick={() => setShowOnboarding(true)}>📖 View Guide</button>
          </div>
          <div className="nav-group">
            <span className="nav-group-label">Legal</span>
            <NavLink to="/privacy-policy" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>🔒 Privacy Policy</NavLink>
            <NavLink to="/terms-of-service" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>📄 Terms of Service</NavLink>
            <NavLink to="/cookie-policy" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>🍪 Cookie Policy</NavLink>
            <NavLink to="/refund-policy" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>💰 Refund Policy</NavLink>
          </div>
        </nav>
        <div className="sidebar-user">
          {user.avatar && <img src={user.avatar} alt={user.name} className="avatar" referrerPolicy="no-referrer" />}
          <div className="sidebar-user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">Logout</button>
        </div>
      </aside>
      <main className="main-content">
        {needsSubscription && <SubscriptionModal user={user} onSuccess={refreshUser} />}
        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        <div className="main-bg-shapes">
          {[...Array(8)].map((_, i) => <div key={i} className={`main-shape main-shape-${i + 1}`} />)}
        </div>
        <div className="main-inner">
          <Routes>
            <Route path="/" element={<Stores />} />
            <Route path="/raw-materials" element={<RawMaterials />} />
            <Route path="/products" element={<Products />} />
            <Route path="/producers" element={<Producers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/producer-return" element={<ProducerReturn />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/production-orders" element={<ProductionOrders />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <TodoPanel />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
