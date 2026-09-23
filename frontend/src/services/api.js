import { API_BASE_URL } from '../config';

const baseURL = API_BASE_URL;

export async function fetchJSON(path, options = {}) {
  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.mensaje || `La solicitud fallo (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
}
