// URL base del backend. En Vercel se configura con la variable de entorno
// VITE_API_BASE_URL (por ejemplo: https://tu-backend.onrender.com).
// En desarrollo local, si no se define, cae a localhost:3000.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
