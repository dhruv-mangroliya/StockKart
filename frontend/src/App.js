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

  if (!user) return (
    <div className="app-layout">
      {/* Blurred sidebar */}
      <aside className="sidebar">
        <div className="sidebar-bg-shapes">
          {[...Array(6)].map((_, i) => <div key={i} className={`sb-shape sb-shape-${i + 1}`} />)}
        </div>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="nav-group-label">{group.label}</span>
              {group.links.map((n) => (
                <span key={n.to} className="sidebar-link">{n.label}</span>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="user-name">Guest User</span>
            <span className="user-email">Sign in to continue</span>
          </div>
        </div>
      </aside>

      {/* Blurred main content */}
      <main className="main-content" style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
        <div className="main-bg-shapes">
          {[...Array(8)].map((_, i) => <div key={i} className={`main-shape main-shape-${i + 1}`} />)}
        </div>
        <div className="main-inner">
          <div className="page">
            <h2>🏪 Stores</h2>
            <div className="form-block">
              <div className="form-row">
                <input placeholder="Store name" readOnly />
                <button disabled>Add Store</button>
              </div>
            </div>
            <table>
              <thead><tr><th>Name</th><th>Action</th></tr></thead>
              <tbody>
                {["Main Warehouse", "Retail Store A", "Outlet B"].map((name) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td><div className="form-row"><button disabled>Edit</button><button disabled>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Login modal overlay */}
      <div className="login-modal-overlay">
        <div className="login-modal-card">
          <div className="login-logo">📦</div>
          <h1>Inventory Manager</h1>
          <p>Sign in to manage your inventory, production and stores.</p>
          {new URLSearchParams(window.location.search).get("error") && (
            <p className="error">Authentication failed. Please try again.</p>
          )}
          <a href={`${process.env.BACKEND_URL}auth/google`} className="google-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} />
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  );

  const needsSubscription = user.trialExpired && !user.subscriptionActive;

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span /><span /><span />
        </button>
        <img src="/mainLogo.png" alt="InventoryBook" className="mobile-logo" />
        <div className="mobile-brand-text">
          <div style={{ display: "flex" }}><span className="brand-inventory">Inventory</span><span className="brand-book">Book</span></div>
          <span className="brand-tagline">Track.Manage.Grow</span>
        </div>
        {user.avatar && <img src={user.avatar} alt={user.name} className="avatar" referrerPolicy="no-referrer" />}
      </div>

      {/* Sidebar backdrop on mobile */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-bg-shapes">
          {[...Array(6)].map((_, i) => <div key={i} className={`sb-shape sb-shape-${i + 1}`} />)}
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

      </aside>
      <main className="main-content">
        {needsSubscription && <SubscriptionModal user={user} onSuccess={refreshUser} />}
        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        <header className="main-header">
          <img src="/mainLogo.png" alt="InventoryBook" className="header-logo" />
          <div className="header-brand">
            <div className="brand-name"><span className="brand-inventory">Inventory</span><span className="brand-book">Book</span></div>
            <span className="brand-tagline">Track.Manage.Grow</span>
          </div>
          <div className="header-right">
            <div className="header-user-info">
              <span className="header-user-name">{user.name}</span>
              <span className="header-user-email">{user.email}</span>
            </div>
            {user.avatar && <img src={user.avatar} alt={user.name} className="avatar" referrerPolicy="no-referrer" />}
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </header>
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
