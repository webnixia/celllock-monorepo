const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
const API_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 🛡️ Limpiar comillas accidentales si se guardó con JSON.stringify
  if (token) {
    token = token.replace(/^"(.*)"$/, '$1');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error en fetchApi:', { status: response.status, errorData, tokenEnviado: token ? 'Presente' : 'Ausente' });
    throw new Error(errorData.message || 'Error en la petición');
  }

  return response.json();
}