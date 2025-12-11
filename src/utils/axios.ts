// utils/axios.ts
// SECURITY: Authentication is handled via HttpOnly cookies
// NO tokens are stored or read from localStorage to prevent XSS attacks
import axios from "axios";

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json'
    },
    // SECURITY: Enable cookies for all requests (HttpOnly cookie authentication)
    // The server sets/reads the authentication cookie automatically
    withCredentials: true
});

// Response interceptor for handling auth errors
// NOTE: We do NOT redirect on 401 here because:
// 1. Most routes are public and don't require authentication
// 2. The AuthContext handles 401s gracefully (just sets user to null)
// 3. Only the ProtectedRoute component should redirect to /login
// 4. Redirecting on every 401 breaks public pages like purchase flow
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Just reject the error - let each component handle it appropriately
        // Protected routes will redirect via ProtectedRoute component
        return Promise.reject(error);
    }
);
