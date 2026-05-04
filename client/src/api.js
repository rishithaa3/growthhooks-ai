const API_BASE_URL = 'http://localhost:5001/api';

export const generateHooks = async (data) => {
  const response = await fetch(`${API_BASE_URL}/generate-hooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to generate hooks');
  }

  return response.json();
};

export const sendEmail = async (email, hooks, insights) => {
  const response = await fetch(`${API_BASE_URL}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, hooks, insights }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
};
