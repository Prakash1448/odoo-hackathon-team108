import apiClient from "./apiClient";

export const authService = {
  login: async (email, password) => {
    try {
      const data = await apiClient.post("/auth/login", { email, password });
      if (data.access_token) {
        localStorage.setItem("dealflow_token", data.access_token);
        localStorage.setItem("dealflow_user", JSON.stringify(data.user));
      }
      return { success: true, user: data.user, token: data.access_token };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getCurrentUser: async () => {
    try {
      const user = await apiClient.get("/auth/me");
      return user;
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("dealflow_token");
    localStorage.removeItem("dealflow_user");
  }
};
