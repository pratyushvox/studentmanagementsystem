export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ROLE: 'role',
  FULL_NAME: 'fullName',
} as const;
