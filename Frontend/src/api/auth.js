import api from "./axios";

const endpoint = {
  admin: "/api/admin/login",
  fisherman: "/api/fisherman/login",
  customer: "/api/customer/login",
};

export async function login({ email, password, role }) {
  const res = await api.post(endpoint[role], { email, password });
  return res.data;
}

// ✅ New: Google login helper
export async function googleLogin(idToken) {
  const res = await api.post("/api/auth/google/id-token", { id_token: idToken });
  return res.data; // { token, user }
}
