import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Stores from "./pages/Stores";
import RawMaterials from "./pages/RawMaterials";
import Products from "./pages/Products";
import Producers from "./pages/Producers";
import Inventory from "./pages/Inventory";
import ProductionOrders from "./pages/ProductionOrders";
import Transfers from "./pages/Transfers";
import Returns from "./pages/Returns";
import "./App.css";

const nav = [
  { to: "/", label: "Stores" },
  { to: "/raw-materials", label: "Raw Materials" },
  { to: "/products", label: "Products" },
  { to: "/producers", label: "Producers" },
  { to: "/inventory", label: "Inventory" },
  { to: "/transfers", label: "Transfers" },
  { to: "/returns", label: "Ecom Returns" },
  { to: "/production-orders", label: "Production Orders" },
];

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <span className="brand">📦 Inventory Manager</span>
        <div className="nav-links">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Stores />} />
          <Route path="/raw-materials" element={<RawMaterials />} />
          <Route path="/products" element={<Products />} />
          <Route path="/producers" element={<Producers />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/production-orders" element={<ProductionOrders />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
