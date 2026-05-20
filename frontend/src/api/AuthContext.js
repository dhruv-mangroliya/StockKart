import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const API = (process.env.REACT_APP_BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  const fetchUser = () => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  };

  useEffect(() => {
    // Small delay to ensure session cookie is committed after OAuth redirect
    const t = setTimeout(fetchUser, 100);
    return () => clearTimeout(t);
  }, []);

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, logout, refreshUser: fetchUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);