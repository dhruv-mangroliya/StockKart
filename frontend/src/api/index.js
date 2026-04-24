const BASE = "http://localhost:3001";

const normalize = (data) => {
  if (Array.isArray(data)) return data.map(normalize);
  if (data && typeof data === "object") {
    const obj = { ...data };
    if (obj._id) { obj.id = obj._id; delete obj._id; }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "object" && obj[key] !== null) obj[key] = normalize(obj[key]);
    }
    return obj;
  }
  return data;
};

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (res.status === 401) { window.location.href = "/login"; return; }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return normalize(data);
};

export const api = {
  get: (path) => req("GET", path),
  post: (path, body) => req("POST", path, body),
  put: (path, body) => req("PUT", path, body),
  delete: (path, body) => req("DELETE", path, body),
};
