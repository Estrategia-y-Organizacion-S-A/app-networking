import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = "STcQABf0JKegGjL4v";
const EMAILJS_SERVICE_ID = "service_e16q9jk";
const EMAILJS_TEMPLATE_ID = "template_npwnhqh";

// Evita inicializar si no hay configuración real (evita crasheos)
const isConfigured = !EMAILJS_PUBLIC_KEY.includes("TU_PUBLIC_KEY");
if (isConfigured) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

async function sendEmail({ to, subject, html }) {
  if (!isConfigured) {
    console.log("=====================================");
    console.log(`✉️ [SIMULACIÓN EMAIL] Hacia: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Contenido: \n${html.replace(/<[^>]+>/g, '')}`);
    console.log("=====================================");
    return { success: true, simulated: true };
  }

  try {
    // Estas variables deben coincidir con las variables que pongas en la plantilla de EmailJS
    // En tu plantilla de EmailJS debes tener algo como: {{{html_message}}} para que inyecte el HTML
    const templateParams = {
      to_email: to,
      subject: subject,
      html_message: html
    };
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log(`Email enviado a ${to}`);
    return { success: true, data: response };
  } catch (error) {
    console.error("Error enviando email vía EmailJS:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(attendee) {
  const subject = "Benvido/a á Xornada de Networking Galicia Suroeste!";
  const html = `
    <h2>Ola ${attendee.nombre},</h2>
    <p>O teu rexistro completouse con éxito!</p>
    <p>Xa podes acceder á plataforma para configurar a túa axenda e solicitar reunións con outros profesionais.</p>
    <p>Vémonos na Xornada.</p>
    <br/>
    <p>Saúdos,<br/>O equipo de Organización<br/><strong>Evento Networking - Galicia Suroeste | 26 de xuño 2026</strong></p>
  `;
  return sendEmail({ to: attendee.email, subject, html });
}

export async function sendMeetingRequestEmail(host, requester, timeRange) {
  const subject = `Nova solicitude de reunión de ${requester.nombre}!`;
  const html = `
    <h2>Ola ${host.nombre},</h2>
    <p><strong>${requester.nombre} ${requester.apellidos}</strong> (${requester.empresa}) solicitouche unha reunión.</p>
    <p><strong>Horario:</strong> ${timeRange}</p>
    <p>Por favor, entra na plataforma en "A miña Axenda" para Aceptar ou Rexeitar esta solicitude.</p>
    <br/>
    <p>Saúdos,<br/>O equipo de Organización<br/><strong>Evento Networking - Galicia Suroeste | 26 de xuño 2026</strong></p>
  `;
  return sendEmail({ to: host.email, subject, html });
}

export async function sendMeetingAcceptedEmail(requester, host, timeRange, mesa) {
  const subject = `✅ Reunión aceptada con ${host.nombre}!`;
  const html = `
    <h2>Ola ${requester.nombre},</h2>
    <p>Boas novas! <strong>${host.nombre} ${host.apellidos}</strong> (${host.empresa}) <strong>aceptou</strong> a túa solicitude de reunión.</p>
    <p><strong>Horario:</strong> ${timeRange}</p>
    <p><strong>Situación:</strong> ${mesa ? `Mesa ${mesa.color}` : "Asignaráseche unha mesa axiña."}</p>
    <p>Lembra ser puntual.</p>
    <p>Por favor, diríxete á aplicación web para ver a túa axenda e comprobar os detalles.</p>
    <br/>
    <p>Saúdos,<br/>O equipo de Organización<br/><strong>Evento Networking - Galicia Suroeste | 26 de xuño 2026</strong></p>
  `;
  return sendEmail({ to: requester.email, subject, html });
}

export async function sendMeetingRejectedEmail(requester, host, timeRange) {
  const subject = `Oco liberado ás ${timeRange}`;
  const html = `
    <h2>Ola ${requester.nombre},</h2>
    <p>Acaba de quedar un <strong>oco libre na túa axenda</strong> para as <strong>${timeRange}</strong>!</p>
    <p>Posto que <strong>${host.nombre} ${host.apellidos}</strong> non poderá reunirse contigo nese momento, recuperas a túa quenda.</p>
    <p>Convidámoste a buscar outros profesionais no directorio de networking e enviarlles unha nova solicitude para aproveitar o oco.</p>
    <p>Por favor, diríxete á aplicación web para ver a túa axenda e escoller unha nova persoa.</p>
    <br/>
    <p>Saúdos,<br/>O equipo de Organización<br/><strong>Evento Networking - Galicia Suroeste | 26 de xuño 2026</strong></p>
  `;
  return sendEmail({ to: requester.email, subject, html });
}

export async function sendMeetingCancelledEmail(toAttendee, fromAttendee, timeRange) {
  const subject = `⚠️ Reunión cancelada`;
  const html = `
    <h2>Ola ${toAttendee.nombre},</h2>
    <p>Informámoste de que <strong>${fromAttendee.nombre} ${fromAttendee.apellidos}</strong> cancelou a reunión que tiñades programada para as <strong>${timeRange}</strong>.</p>
    <p>Ese oco na túa axenda volve estar libre para que poidas axendar con outra persoa ou aceptar novas solicitudes.</p>
    <p>Por favor, diríxete á aplicación web para ver a túa axenda e comprobar os detalles.</p>
    <br/>
    <p>Saúdos,<br/>O equipo de Organización<br/><strong>Evento Networking - Galicia Suroeste | 26 de xuño 2026</strong></p>
  `;
  return sendEmail({ to: toAttendee.email, subject, html });
}
