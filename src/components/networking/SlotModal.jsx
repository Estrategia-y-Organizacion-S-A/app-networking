import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, CheckCircle, Loader2, Building2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { countMeetings, MAX_MEETINGS, hasBookingConflict, TIME_SLOTS } from "@/lib/eventUtils";
import { sendMeetingRequestEmail } from "@/lib/emailService";

export default function SlotModal({ host, currentAttendee, allSlots, eventDate, onClose, onBooked }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const myMeetingsCount = countMeetings(currentAttendee?.id, allSlots);

  // Check if I already have a meeting with this host in ANY direction
  const myMeetingWithHost = allSlots.find(s => {
    if (s.estado === "reservado") {
      if (String(s.hostId) === String(host.id) && String(s.reservadoPorId) === String(currentAttendee?.id)) return true;
      if (String(s.hostId) === String(currentAttendee?.id) && String(s.reservadoPorId) === String(host.id)) return true;
    }
    return false;
  });

  // Check if there is a pending request in ANY direction
  const pendingRequestWithHost = allSlots.find(s => {
    if (s.estado === "disponible" && Array.isArray(s.solicitantes)) {
      if (String(s.hostId) === String(host.id) && s.solicitantes.some(req => String(req.id) === String(currentAttendee?.id) && req.estado === "pendiente")) return true;
      if (String(s.hostId) === String(currentAttendee?.id) && s.solicitantes.some(req => String(req.id) === String(host.id) && req.estado === "pendiente")) return true;
    }
    return false;
  });

  const handleBook = async (ts) => {
    setError("");
    if (myMeetingsCount >= MAX_MEETINGS) {
      setError(`Has alcanzado el máximo de ${MAX_MEETINGS} reuniones.`);
      return;
    }
    
    // We check for conflict using the existing slots. Since this is a new booking request, we pass the time
    if (hasBookingConflict(currentAttendee.id, eventDate, ts.start, ts.end, allSlots)) {
      setError("Tienes otra reunión o solicitud pendiente en ese horario.");
      return;
    }

    if (myMeetingWithHost) {
      setError("Xa tes unha reunión confirmada con esta persoa.");
      return;
    }

    if (pendingRequestWithHost) {
      setError("Xa tes unha solicitude pendente con esta persoa.");
      return;
    }
    
    setBooking(ts.start);
    setLoading(true);

    const newSolicitante = {
      id: currentAttendee.id,
      nombre: currentAttendee.nombre,
      apellidos: currentAttendee.apellidos,
      empresa: currentAttendee.empresa,
      email: currentAttendee.email,
      estado: "pendiente"
    };

    try {
      // Find if a MeetingSlot already exists for this host at this time
      const existingSlot = allSlots.find(s => String(s.hostId) === String(host.id) && s.horaInicio === ts.start);

      if (existingSlot) {
        const currentSolicitantes = Array.isArray(existingSlot.solicitantes) 
          ? existingSlot.solicitantes.filter(req => String(req.id) !== String(currentAttendee.id)) 
          : [];
        currentSolicitantes.push(newSolicitante);
        await base44.entities.MeetingSlot.update(existingSlot.id, {
          solicitantes: currentSolicitantes
        });
      } else {
        await base44.entities.MeetingSlot.create({
          hostId: host.id,
          hostNombre: `${host.nombre} ${host.apellidos}`,
          hostEmpresa: host.empresa || "",
          fecha: eventDate || new Date().toISOString().split('T')[0],
          horaInicio: ts.start,
          horaFin: ts.end,
          estado: "disponible",
          solicitantes: [newSolicitante]
        });
      }

      // Enviar email
      try {
        await sendMeetingRequestEmail(host, currentAttendee, `${ts.start} - ${ts.end}`);
      } catch (emailErr) {
        console.error("Erro enviando email:", emailErr);
      }
      setSuccess({ fecha: eventDate, horaInicio: ts.start, horaFin: ts.end });
      if (onBooked) onBooked();
    } catch (err) {
      console.error("Error booking slot:", err);
      setError("Non se puido procesar a solicitude. Permisos insuficientes ou erro de rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#2D6A4F' }}>
              {host.nombre?.[0]}{host.apellidos?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{host.nombre} {host.apellidos}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />{host.empresa}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: '#2D6A4F' }} />
              <p className="font-semibold text-foreground">¡Solicitud enviada!</p>
              <p className="text-sm text-muted-foreground mt-1">
                O anfitrión xa foi notificado. Debes agardar a que acepte.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {success.fecha} · {success.horaInicio}–{success.horaFin}
              </p>
              <Button className="mt-4" style={{ backgroundColor: '#2D6A4F', color: 'white' }} onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Axenda do anfitrión</p>
                <Badge variant="outline" className="text-xs">
                  {myMeetingsCount}/{MAX_MEETINGS} ocos ocupados
                </Badge>
              </div>

              {myMeetingsCount >= MAX_MEETINGS && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Alcanzache o máximo de {MAX_MEETINGS} reunións.
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {myMeetingWithHost ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-[#F0F7F4] border-[#2D6A4F]/20 text-[#2D6A4F]">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">Xa tes unha reunión confirmada con esta persoa.</p>
                  <p className="text-xs mt-1">Revisa "A miña axenda" para ver a hora e a mesa asignada.</p>
                </div>
              ) : pendingRequestWithHost ? (
                <div className="flex flex-col items-center justify-center p-6 text-center border border-border rounded-lg bg-muted/20">
                  <Clock className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Xa tes unha solicitude pendente con esta persoa.</p>
                  <p className="text-xs text-muted-foreground mt-1">Só podes reservar un oco por asistente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {TIME_SLOTS.map(ts => {
                    // Ver si el host ya está ocupado a esta hora
                    const hostOccupied = allSlots.some(s => 
                      s.estado === "reservado" && 
                      s.horaInicio === ts.start && 
                      (String(s.hostId) === String(host.id) || String(s.reservadoPorId) === String(host.id))
                    );

                    // Ver si existe ya el slot (alguien más lo solicitó o lo canceló)
                    const existingSlot = allSlots.find(s => String(s.hostId) === String(host.id) && s.horaInicio === ts.start);
                    
                    const isOccupied = hostOccupied;
                    const isMyConfirmed = isOccupied && existingSlot && String(existingSlot.reservadoPorId) === String(currentAttendee.id);
                    const isMyRequest = existingSlot && Array.isArray(existingSlot.solicitantes) && existingSlot.solicitantes.some(req => String(req.id) === String(currentAttendee.id) && req.estado === "pendiente");
                    
                    let statusLabel = "Libre";
                    let statusColor = "text-green-600 bg-green-50 border-green-200";
                    let buttonText = "Solicitar";
                    let disabled = false;

                    if (isOccupied) {
                      statusLabel = isMyConfirmed ? "Tu reunión" : "Ocupado";
                      statusColor = isMyConfirmed ? "text-primary bg-primary/10 border-primary/20" : "text-destructive bg-destructive/10 border-destructive/20";
                      disabled = true;
                      buttonText = "No disponible";
                    } else if (isMyRequest) {
                      statusLabel = "Pendiente de respuesta";
                      statusColor = "text-orange-600 bg-orange-50 border-orange-200";
                      disabled = true;
                      buttonText = "Solicitado";
                    }

                    const conflict = hasBookingConflict(currentAttendee?.id, eventDate, ts.start, ts.end, allSlots);

                    return (
                      <div key={ts.start} className={`flex items-center justify-between p-3 rounded-lg border ${statusColor}`}>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ts.start} – {ts.end}
                          </p>
                          <p className="text-xs font-semibold mt-1 uppercase tracking-wider">{statusLabel}</p>
                          {!disabled && conflict && <p className="text-xs text-destructive mt-1">Conflicto de horario</p>}
                        </div>
                        <Button
                          size="sm"
                          disabled={disabled || loading || myMeetingsCount >= MAX_MEETINGS || conflict}
                          variant={disabled ? "outline" : "default"}
                          style={!disabled ? { backgroundColor: '#2D6A4F', color: 'white' } : {}}
                          onClick={() => handleBook(ts)}
                        >
                          {loading && booking === ts.start ? <Loader2 className="w-3 h-3 animate-spin" /> : buttonText}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
