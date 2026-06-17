// Event utilities — business logic for networking, admin auth, and meeting management
import { hashPassword } from "@/lib/attendeeAuth";
import { auth } from "@/api/base44Client";
import { signInWithEmailAndPassword } from "firebase/auth";

// ─── Sectores e intereses profesionales ─────────────────────────
export const SECTORES = [
  "Aloxamentos", "Restauración", "Axencias de viaxe", "Guías turísticos", 
  "Oferta turística complementaria", "Viveiros", "Industrias agroalimentarias", 
  "Artesanía", "Tendas especializadas", "Outros"
];

export const INTERESES = [
  "Provedores locais", "Colaboracións turísticas", "Distribución de produtos",
  "Experiencias combinadas", "Turismo sostible", "Canles de venda directa",
  "Aloxamento de grupos", "Materias primas agroalimentarias", "Deseño e artesanía",
  "Innovación tecnolóxica", "Eventos e promoción", "Gastronomía local"
];

// ─── Constantes ─────────────────────────────────────────────────
export const MAX_MEETINGS = 4;

export const TIME_SLOTS = [
  { start: "21:00", end: "21:15", label: "21:00 - 21:15" },
  { start: "21:15", end: "21:30", label: "21:15 - 21:30" },
  { start: "21:30", end: "21:45", label: "21:30 - 21:45" },
  { start: "21:45", end: "22:00", label: "21:45 - 22:00" }
];

// ─── Admin auth ─────────────────────────────────────────────────
const ADMIN_EMAIL = "networking@eosa.com";
const ADMIN_PASSWORD_HASH = "3dcb93ebb2ca346a3eb0c6bede84be275aeea5c9bf6f706ea49b526f098d5c2e";
const ADMIN_SECRET_TOKEN = "eosa_admin_token_2026_secured_7x9q";

export async function validateAdminLogin(email, password) {
  if (email !== ADMIN_EMAIL) return false;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export function loginAdmin(email) {
  localStorage.setItem("admin_token", ADMIN_SECRET_TOKEN);
  localStorage.setItem("admin_email", email);
}

export function logoutAdmin() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_email");
}

export function isAdminLoggedIn() {
  return localStorage.getItem("admin_token") === ADMIN_SECRET_TOKEN;
}

// ─── Networking visibility ──────────────────────────────────────
export function isNetworkingVisible(config) {
  if (!config) return false;
  if (config.networkingActivo) return true;
  if (!config.fechaEvento) return false;
  const eventDate = new Date(config.fechaEvento);
  const dayBefore = new Date(eventDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(0, 0, 0, 0);
  const now = new Date();
  return now >= dayBefore;
}

// ─── Time utilities ─────────────────────────────────────────────
export function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─── Meeting slot utilities ─────────────────────────────────────


export function countMeetings(userId, slots) {
  if (!userId) return 0;
  let count = 0;
  for (const s of slots) {
    if (s.estado === "cancelado") continue;
    
    // 1. Soy anfitrión y la reunión está reservada (confirmada)
    if (s.estado === "reservado" && String(s.hostId) === String(userId)) {
      count++;
      continue;
    }
    
    // 2. Soy invitado y la reunión está reservada (confirmada)
    if (s.estado === "reservado" && String(s.reservadoPorId) === String(userId)) {
      count++;
      continue;
    }
    
    // 3. Soy solicitante y mi petición está pendiente
    if (s.estado === "disponible" && String(s.hostId) !== String(userId) && Array.isArray(s.solicitantes)) {
      const myReq = s.solicitantes.find(req => String(req.id) === String(userId));
      if (myReq && myReq.estado === "pendiente") {
        count++;
      }
    }
  }
  return count;
}

export function hasBookingConflict(userId, fecha, horaInicio, horaFin, slots, excludeId = null) {
  if (!userId) return false;
  const start = timeToMinutes(horaInicio);
  const end = timeToMinutes(horaFin);
  
  return slots.some((s) => {
    if (s.id === excludeId) return false;
    if (s.estado === "cancelado") return false;
    if (s.fecha !== fecha) return false;
    
    let isInvolved = false;
    
    // Caso 1: Soy anfitrión y ya tengo la reunión confirmada
    if (s.estado === "reservado" && String(s.hostId) === String(userId)) {
      isInvolved = true;
    } 
    // Caso 2: Soy invitado y ya tengo la reunión confirmada
    else if (s.estado === "reservado" && String(s.reservadoPorId) === String(userId)) {
      isInvolved = true;
    } 
    // Caso 3: He enviado una solicitud y está pendiente (para evitar doble-booking preventivo)
    else if (s.estado === "disponible" && String(s.hostId) !== String(userId) && Array.isArray(s.solicitantes)) {
      const myReq = s.solicitantes.find(req => String(req.id) === String(userId));
      if (myReq && myReq.estado === "pendiente") {
        isInvolved = true;
      }
    }

    if (!isInvolved) return false;
    
    const sStart = timeToMinutes(s.horaInicio);
    const sEnd = timeToMinutes(s.horaFin);
    return start < sEnd && end > sStart;
  });
}
