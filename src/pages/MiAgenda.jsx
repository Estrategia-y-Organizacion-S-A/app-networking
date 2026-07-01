import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44, db } from "@/api/base44Client";
import { runTransaction, doc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Building2, LogOut, Loader2, MapPin, Check, X, Send } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import AttendeeLogin from "@/pages/AttendeeLogin";
import { getAttendeeSession, clearAttendeeSession } from "@/lib/attendeeAuth";
import { MAX_MEETINGS, countMeetings, TIME_SLOTS, hasBookingConflict } from "@/lib/eventUtils";
import { sendMeetingAcceptedEmail, sendMeetingRejectedEmail, sendMeetingCancelledEmail } from "@/lib/emailService";

export default function MiAgenda() {
  const [currentAttendee, setCurrentAttendee] = useState(getAttendeeSession());
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [allMesas, setAllMesas] = useState([]);
  const [cancelRequestSlot, setCancelRequestSlot] = useState(null);
  const [cancelMeetingSlot, setCancelMeetingSlot] = useState(null);

  useEffect(() => {
    if (currentAttendee) loadData();
  }, [currentAttendee]);

  const loadData = async () => {
    setLoading(true);
    const [allSlots, mesas] = await Promise.all([
      base44.entities.MeetingSlot.list(),
      base44.entities.Mesa.list()
    ]);
    const id = String(currentAttendee.id);
    
    // Obtenemos todos los slots relacionados conmigo (como host o como solicitante/reservado)
    const mySlots = (allSlots || []).filter(s => {
      if (String(s.hostId) === id) return true;
      if (String(s.reservadoPorId) === id) return true;
      if (Array.isArray(s.solicitantes) && s.solicitantes.some(req => String(req.id) === id)) return true;
      return false;
    });
    
    mySlots.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    setSlots(mySlots);
    const sortedMesas = (mesas || []).sort((a, b) => (a.color || '').localeCompare(b.color || '', undefined, { numeric: true, sensitivity: 'base' }));
    setAllMesas(sortedMesas);
    setLoading(false);
  };

  const handleLogout = () => {
    clearAttendeeSession();
    setCurrentAttendee(null);
  };

  const handleAcceptRequest = async (slot, requesterId) => {
    setLoading(true);
    
    const latestSlots = await base44.entities.MeetingSlot.list();
    if (hasBookingConflict(currentAttendee.id, slot.fecha, slot.horaInicio, slot.horaFin, latestSlots, slot.id)) {
      alert("Xa tes unha reunión confirmada ou outra petición pendente nese horario.");
      setLoading(false);
      return;
    }

    if (hasBookingConflict(requesterId, slot.fecha, slot.horaInicio, slot.horaFin, latestSlots, slot.id)) {
      alert("Esta persoa xa ten outra reunión confirmada nese horario. O ideal sería que rexeites a petición.");
      setLoading(false);
      return;
    }

    try {
      let assignedTable = null;
      let requester = null;
      let rejectedRequesters = [];

      await runTransaction(db, async (transaction) => {
        const slotRef = doc(db, "meetingSlots", String(slot.id));
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists()) throw new Error("A reunión xa non existe.");
        
        const currentData = slotDoc.data();
        if (currentData.estado === "reservado") {
          throw new Error("A reunión xa foi aceptada.");
        }

        const ocupadasRef = doc(db, "mesas_ocupadas", `${slot.fecha}_${slot.horaInicio.replace(':', '')}`);
        const ocupadasDoc = await transaction.get(ocupadasRef);
        const ocupadas = ocupadasDoc.exists() ? (ocupadasDoc.data().tables || []) : [];

        const legacyOccupied = latestSlots
          .filter(s => s.estado === "reservado" && s.fecha === slot.fecha && s.horaInicio === slot.horaInicio)
          .map(s => String(s.mesaId));
        const allOcupadas = Array.from(new Set([...ocupadas, ...legacyOccupied]));

        const availableTables = allMesas.filter(m => !allOcupadas.includes(String(m.id)));
        if (availableTables.length === 0) {
          throw new Error("Non hai mesas dispoñibles nesta franxa horaria.");
        }
        
        assignedTable = availableTables[0];
        
        transaction.set(ocupadasRef, { tables: [...ocupadas, String(assignedTable.id)] }, { merge: true });

        const updatedSolicitantes = (currentData.solicitantes || []).map(req => {
          if (String(req.id) === String(requesterId)) return { ...req, estado: "aceptado" };
          return { ...req, estado: "rechazado" };
        });
        
        requester = updatedSolicitantes.find(req => String(req.id) === String(requesterId));
        rejectedRequesters = updatedSolicitantes.filter(req => req.estado === "rechazado" && (currentData.solicitantes || []).find(s => String(s.id) === String(req.id))?.estado === "pendiente");

        transaction.update(slotRef, {
          estado: "reservado",
          reservadoPorId: requester.id,
          reservadoPorNombre: `${requester.nombre} ${requester.apellidos}`,
          reservadoPorEmail: requester.email,
          mesaId: assignedTable.id,
          mesaColor: assignedTable.color,
          solicitantes: updatedSolicitantes
        });
      });

      await sendMeetingAcceptedEmail(requester, currentAttendee, `${slot.horaInicio} - ${slot.horaFin}`, assignedTable);
      for (const rej of rejectedRequesters) {
        await sendMeetingRejectedEmail(rej, currentAttendee, `${slot.horaInicio} - ${slot.horaFin}`);
      }
      
      base44.entities.MeetingSlot.clearCache();
      await loadData();
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  };

  const handleRejectRequest = async (slot, requesterId) => {
    setLoading(true);
    let requester = null;
    try {
      await runTransaction(db, async (transaction) => {
        const slotRef = doc(db, "meetingSlots", String(slot.id));
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists()) return;
        
        const currentData = slotDoc.data();
        const updatedSolicitantes = (currentData.solicitantes || []).map(req => {
          if (String(req.id) === String(requesterId)) return { ...req, estado: "rechazado" };
          return req;
        });
        
        requester = updatedSolicitantes.find(req => String(req.id) === String(requesterId));
        transaction.update(slotRef, { solicitantes: updatedSolicitantes });
      });

      if (requester) {
        await sendMeetingRejectedEmail(requester, currentAttendee, `${slot.horaInicio} - ${slot.horaFin}`);
      }
      base44.entities.MeetingSlot.clearCache();
      await loadData();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const executeCancelRequest = async () => {
    if (!cancelRequestSlot) return;
    const slot = cancelRequestSlot;
    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const slotRef = doc(db, "meetingSlots", String(slot.id));
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists()) return;
        
        const currentData = slotDoc.data();
        const updatedSolicitantes = (currentData.solicitantes || []).map(req => {
          if (String(req.id) === String(currentAttendee.id)) return { ...req, estado: "cancelado" };
          return req;
        });
        
        transaction.update(slotRef, { solicitantes: updatedSolicitantes });
      });

      base44.entities.MeetingSlot.clearCache();
      await loadData();
      setCancelRequestSlot(null);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const executeCancelMeeting = async () => {
    if (!cancelMeetingSlot) return;
    const slot = cancelMeetingSlot;
    setLoading(true);
    
    try {
      const amIHost = String(slot.hostId) === String(currentAttendee.id);
      const otherId = amIHost ? slot.reservadoPorId : slot.hostId;
      const otherResult = await base44.entities.Attendee.filter({ id: Number(otherId) });
      const otherAttendee = otherResult[0];

      await runTransaction(db, async (transaction) => {
        const slotRef = doc(db, "meetingSlots", String(slot.id));
        const slotDoc = await transaction.get(slotRef);
        if (!slotDoc.exists()) throw new Error("A reunión xa non existe.");
        
        const currentData = slotDoc.data();
        const ocupadasRef = doc(db, "mesas_ocupadas", `${slot.fecha}_${slot.horaInicio.replace(':', '')}`);
        const ocupadasDoc = await transaction.get(ocupadasRef);
        
        if (ocupadasDoc.exists()) {
          const ocupadas = ocupadasDoc.data().tables || [];
          const newOcupadas = ocupadas.filter(id => id !== String(currentData.mesaId));
          transaction.set(ocupadasRef, { tables: newOcupadas }, { merge: true });
        }

        const updatedSolicitantes = (currentData.solicitantes || []).map(req => {
          if (String(req.id) === String(currentData.reservadoPorId)) return { ...req, estado: "cancelado" };
          return req;
        });

        transaction.update(slotRef, {
          estado: "disponible",
          reservadoPorId: null,
          reservadoPorNombre: null,
          reservadoPorEmail: null,
          mesaId: null,
          mesaColor: null,
          solicitantes: updatedSolicitantes
        });
      });

      if (otherAttendee) {
        await sendMeetingCancelledEmail(otherAttendee, currentAttendee, `${slot.horaInicio} - ${slot.horaFin}`);
      }
      
      base44.entities.MeetingSlot.clearCache();
      await loadData();
      setCancelMeetingSlot(null);
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  };



  if (!currentAttendee) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-20">
          <AttendeeLogin onLogin={setCurrentAttendee} redirectLabel="A miña Axenda" />
        </div>
      </PageLayout>
    );
  }

  if (currentAttendee.asistira === false) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-muted">
            <X className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Non asistes ao evento</h2>
          <p className="text-muted-foreground mb-8">
            Como indicaches que non vas asistir presencialmente ao evento, non podes xestionar unha axenda de reunións.
          </p>
          <Button onClick={() => window.location.href = "/networking"} style={{ backgroundColor: '#00869d', color: 'white' }}>
            Ir ao Directorio de Networking
          </Button>
          <div className="mt-4">
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground">
              Pechar sesión
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const id = String(currentAttendee.id);
  const totalMeetings = countMeetings(id, slots);

  const confirmedMeetings = slots.filter(s => s.estado === "reservado" && (String(s.hostId) === id || String(s.reservadoPorId) === id));
  
  const pendingReceived = slots.filter(s => s.estado === "disponible" && String(s.hostId) === id && Array.isArray(s.solicitantes) && s.solicitantes.some(req => req.estado === "pendiente"));
  
  const pendingSent = slots.filter(s => s.estado === "disponible" && String(s.hostId) !== id && Array.isArray(s.solicitantes) && s.solicitantes.some(req => String(req.id) === id && req.estado === "pendiente"));
  


  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">A miña Axenda</h1>
            <p className="text-muted-foreground mt-1">
              Galicia Suroeste · {currentAttendee.nombre} {currentAttendee.apellidos}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 w-full sm:w-auto">
            <LogOut className="w-4 h-4" /> Pechar sesión
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">

              {/* RESUMEN DE HORARIO */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border bg-muted/20">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    O meu Horario
                  </h2>
                </div>
                <div className="p-0">
                  <div className="divide-y divide-border">
                    {TIME_SLOTS.map(ts => {
                      // Ver si tengo una reunión confirmada a esta hora
                      const confirmedSlot = slots.find(s => 
                        s.estado === "reservado" && 
                        s.horaInicio === ts.start && 
                        (String(s.hostId) === id || String(s.reservadoPorId) === id)
                      );

                      // Ver si recibí una petición a esta hora
                      const pendingReceivedSlot = slots.find(s => 
                        s.estado === "disponible" && 
                        s.horaInicio === ts.start && 
                        String(s.hostId) === id && 
                        Array.isArray(s.solicitantes) && 
                        s.solicitantes.some(req => req.estado === "pendiente")
                      );

                      // Ver si envié una petición a esta hora
                      const pendingSentSlot = slots.find(s => 
                        s.estado === "disponible" && 
                        s.horaInicio === ts.start && 
                        String(s.hostId) !== id && 
                        Array.isArray(s.solicitantes) && 
                        s.solicitantes.some(req => String(req.id) === id && req.estado === "pendiente")
                      );

                      let statusBadge = <Badge variant="outline" className="text-muted-foreground bg-muted/30">Libre</Badge>;
                      let infoText = "Dispoñible para recibir ou enviar solicitudes";

                      if (confirmedSlot) {
                        const otherName = String(confirmedSlot.hostId) === id ? confirmedSlot.reservadoPorNombre : confirmedSlot.hostNombre;
                        statusBadge = <Badge style={{ backgroundColor: '#00869d', color: 'white' }}>Ocupado</Badge>;
                        infoText = `Reunión confirmada con ${otherName}`;
                      } else if (pendingReceivedSlot) {
                        const requestersCount = pendingReceivedSlot.solicitantes.filter(r => r.estado === "pendiente").length;
                        statusBadge = <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Solicitado</Badge>;
                        infoText = `Tes ${requestersCount} solicitude(s) pendente(s) de aceptar`;
                      } else if (pendingSentSlot) {
                        statusBadge = <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Agardando</Badge>;
                        infoText = `Agardando resposta de ${pendingSentSlot.hostNombre}`;
                      }

                      return (
                        <div key={ts.start} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-foreground min-w-[100px]">{ts.start} – {ts.end}</div>
                            {statusBadge}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {infoText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* SOLICITUDES RECIBIDAS PENDIENTES */}
              {pendingReceived.length > 0 && (
                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-orange-200 bg-orange-50/50">
                    <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Solicitudes Recibidas
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {pendingReceived.map(slot => {
                      const pendingRequesters = slot.solicitantes.filter(r => r.estado === "pendiente");
                      return (
                        <div key={slot.id} className="border border-border rounded-lg p-4">
                          <p className="text-sm font-medium flex items-center gap-2 mb-3">
                            <Calendar className="w-3 h-3 text-muted-foreground" /> {slot.fecha}
                            <Clock className="w-3 h-3 text-muted-foreground ml-2" /> {slot.horaInicio} – {slot.horaFin}
                          </p>
                          <div className="space-y-3">
                            {pendingRequesters.map(req => (
                              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-md">
                                <div>
                                  <p className="text-sm font-medium">{req.nombre} {req.apellidos}</p>
                                  <p className="text-xs text-muted-foreground">{req.empresa}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={() => handleAcceptRequest(slot, req.id)} style={{ backgroundColor: '#00869d', color: 'white' }} className="h-8 px-3 text-xs gap-1">
                                    <Check className="w-3 h-3" /> Aceptar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(slot, req.id)} className="h-8 px-3 text-xs gap-1 text-destructive hover:text-destructive">
                                    <X className="w-3 h-3" /> Rexeitar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REUNIONES CONFIRMADAS */}
              <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: '#00869d' }} />
                    Reunións Confirmadas
                  </h2>
                  <Badge style={{ backgroundColor: '#00869d', color: 'white' }}>
                    {totalMeetings} / {MAX_MEETINGS}
                  </Badge>
                </div>
                <div className="p-5">
                  {confirmedMeetings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aínda non tes reunións confirmadas.
                      <br />Vai ao <a href="/networking" className="underline hover:text-foreground">directorio de networking</a> para axendar.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {confirmedMeetings.map(slot => {
                        const amIHost = String(slot.hostId) === id;
                        const otherName = amIHost ? slot.reservadoPorNombre : slot.hostNombre;
                        const otherEmpresa = amIHost ? "" : slot.hostEmpresa;
                        return (
                          <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-white hover:border-[#00869d]/30 transition-colors gap-4">
                            <div>
                              <p className="text-sm font-medium text-foreground mb-1">Reunión con {otherName}</p>
                              {otherEmpresa && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Building2 className="w-3 h-3" /> {otherEmpresa}</p>}
                              {slot.mesaColor && (
                                <Badge variant="secondary" className="text-xs font-medium gap-1 bg-[#e5f3f5] text-[#00869d] hover:bg-[#e5f3f5]">
                                  <MapPin className="w-3 h-3" /> Mesa {slot.mesaColor}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-3 text-sm flex-shrink-0 bg-muted/40 px-3 py-2 rounded-md">
                                <span className="flex items-center gap-1.5 text-foreground"><Calendar className="w-4 h-4 text-muted-foreground" /> {slot.fecha}</span>
                                <span className="flex items-center gap-1.5 font-medium" style={{ color: '#00869d' }}><Clock className="w-4 h-4" /> {slot.horaInicio}</span>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => setCancelMeetingSlot(slot)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Cancelar reunión">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* SOLICITUDES ENVIADAS */}
              {pendingSent.length > 0 && (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-border bg-muted/20">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <Send className="w-4 h-4 text-muted-foreground" />
                      As miñas Solicitudes Enviadas
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3">
                      {pendingSent.map(slot => (
                        <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border border-dashed text-sm gap-3">
                          <div>
                            <p className="font-medium text-foreground mb-0.5">A: {slot.hostNombre}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {slot.fecha} · <Clock className="w-3 h-3" /> {slot.horaInicio}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 whitespace-nowrap">Agardando...</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setCancelRequestSlot(slot)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-border p-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-4 shadow-sm" style={{ backgroundColor: '#00869d' }}>
                  {currentAttendee.nombre?.[0]}{currentAttendee.apellidos?.[0]}
                </div>
                <h3 className="font-bold text-foreground text-lg leading-tight">{currentAttendee.nombre} {currentAttendee.apellidos}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5"><Building2 className="w-4 h-4" /> {currentAttendee.empresa}</p>
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sector</p>
                    <Badge variant="secondary" className="text-xs">{currentAttendee.sector}</Badge>
                  </div>
                  {currentAttendee.perfilPublico && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contacto</p>
                      <p className="text-sm truncate">{currentAttendee.email}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#e5f3f5] rounded-xl border border-[#00869d]/20 p-4 text-sm text-center flex flex-col items-center">
                <p className="text-[#00869d] mb-2">
                  Queres modificar ou engadir algún dato do teu perfil?
                </p>
                <div className="bg-white/60 text-[#00869d] text-[11px] p-2 rounded border border-[#00869d]/10 mb-3 text-left leading-tight">
                  <strong>Aviso:</strong> Aproveita para revisar que o teu <strong>email</strong> estea ben escrito. Se hai unha errata, non recibirás os avisos de novas reunións.
                </div>
                <a href="/mi-perfil" className="font-semibold underline inline-block text-[#00869d]">
                  Ir ao meu Perfil
                </a>
              </div>

              <div className="bg-[#FFF5ED] rounded-xl border border-orange-200 p-4 text-sm text-center">
                <p className="text-orange-800">
                  <span className="font-semibold block mb-1">Aviso importante de correos</span>
                  Por favor, revisa o teu cartafol de SPAM (especialmente se usas Outlook/Hotmail) para non perder os avisos de reunións.
                </p>
              </div>

            </div>
          </div>
        )}

        <Dialog open={!!cancelRequestSlot} onOpenChange={() => setCancelRequestSlot(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancelar solicitude</DialogTitle>
              <DialogDescription>
                Seguro que queres cancelar esta petición? O oco volverá a quedar libre.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setCancelRequestSlot(null)} disabled={loading}>Volver</Button>
              <Button variant="destructive" onClick={executeCancelRequest} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Si, cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!cancelMeetingSlot} onOpenChange={() => setCancelMeetingSlot(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancelar reunión confirmada</DialogTitle>
              <DialogDescription>
                Seguro que queres cancelar esta reunión? Enviaráselle un aviso automático á outra persoa informando da cancelación.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setCancelMeetingSlot(null)} disabled={loading}>Mantela reunión</Button>
              <Button variant="destructive" onClick={executeCancelMeeting} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Si, cancelar reunión
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </PageLayout>
  );
}
