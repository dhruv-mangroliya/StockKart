import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  const fetchUser = () => {
    fetch("http://localhost:3001/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  };

  useEffect(() => { fetchUser(); }, []);

  const logout = async () => {
    await fetch("http://localhost:3001/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, logout, refreshUser: fetchUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
