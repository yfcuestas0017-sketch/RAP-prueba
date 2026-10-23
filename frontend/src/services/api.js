import { API_BASE_URL } from '../config';

export const apiBaseURL = API_BASE_URL;

export async function fetchJSON(path, options = {}) {
  const response = await fetch(`${apiBaseURL}${path}`, {
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
    const error = new Error(data?.mensaje || data?.message || `La solicitud fallo (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function postFormData(path, formData) {
  const response = await fetch(`${apiBaseURL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.mensaje || data?.message || `La solicitud fallo (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
}
