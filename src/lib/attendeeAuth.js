// Attendee session management — uses localStorage

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function saveAttendeeSession(attendee) {
  localStorage.setItem("attendee_session", JSON.stringify(attendee));
}

export function getAttendeeSession() {
  try {
    const data = localStorage.getItem("attendee_session");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearAttendeeSession() {
  localStorage.removeItem("attendee_session");
}
