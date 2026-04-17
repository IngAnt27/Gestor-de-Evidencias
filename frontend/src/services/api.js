const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const parseResponse = async (response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorMessage = data?.msg || response.statusText || 'Error en la solicitud';
    throw new Error(errorMessage);
  }

  return data;
};

export const apiLogin = (payload) =>
  fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(parseResponse);

export const apiRegister = (payload) =>
  fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(parseResponse);

export const apiGetEvidences = (token) =>
  fetch(`${API_URL}/evidencias`, {
    headers: { Authorization: token },
  }).then(parseResponse);

export const apiUploadEvidence = (token, formData) =>
  fetch(`${API_URL}/evidencias`, {
    method: 'POST',
    headers: { Authorization: token },
    body: formData,
  }).then(parseResponse);

export const apiUpdateEvidence = (token, id, payload) =>
  fetch(`${API_URL}/evidencias/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(parseResponse);

export const apiDeleteEvidence = (token, id) =>
  fetch(`${API_URL}/evidencias/${id}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  }).then(parseResponse);

export const apiGetCustodyLogs = (token, evidenceId) =>
  fetch(`${API_URL}/custodia/${evidenceId}`, {
    headers: { Authorization: token },
  }).then(parseResponse);
