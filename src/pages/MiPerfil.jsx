import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44, auth, db } from "@/api/base44Client";
import { doc } from "firebase/firestore";
import { updateEmail, deleteUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User as UserIcon, CheckCircle, Trash2, MailWarning } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { SECTORES, INTERESES, EUROPEAN_PREFIXES } from "@/lib/eventUtils";
import { getAttendeeSession, saveAttendeeSession, clearAttendeeSession } from "@/lib/attendeeAuth";
import AttendeeLogin from "@/pages/AttendeeLogin";

export default function MiPerfil() {
  const navigate = useNavigate();
  const [currentAttendee, setCurrentAttendee] = useState(getAttendeeSession());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEmailVerifyAlert, setShowEmailVerifyAlert] = useState(false);

  const [form, setForm] = useState({
    nombre: "", apellidos: "", email: "", empresa: "", whatsapp: "", prefijoWhatsapp: "+34",
    sector: "", intereses: [], queBusca: "", queOfrece: "",
    perfilPublico: true, asistira: true,
    webUrl: "",
    sectorOtro: "",
  });

  const [eventConfig, setEventConfig] = useState(null);

  useEffect(() => {
    if (currentAttendee) {
      const isCustomSector = currentAttendee.sector && !SECTORES.includes(currentAttendee.sector);
      const waParts = currentAttendee.whatsapp ? currentAttendee.whatsapp.split(' ') : [];
      const waPrefix = waParts.length > 1 && waParts[0].startsWith('+') ? waParts[0] : "+34";
      const waNumber = waParts.length > 1 && waParts[0].startsWith('+') ? waParts.slice(1).join(' ') : currentAttendee.whatsapp || "";

      setForm({
        nombre: currentAttendee.nombre || "",
        apellidos: currentAttendee.apellidos || "",
        email: currentAttendee.email || "",
        empresa: currentAttendee.empresa || "",
        whatsapp: waNumber,
        prefijoWhatsapp: waPrefix,
        sector: isCustomSector ? "Outros" : (currentAttendee.sector || ""),
        sectorOtro: isCustomSector ? currentAttendee.sector : "",
        intereses: (currentAttendee.intereses || []).filter(i => INTERESES.includes(i)),
        queBusca: currentAttendee.queBusca || "",
        queOfrece: currentAttendee.queOfrece || "",
        perfilPublico: currentAttendee.perfilPublico ?? true,
        asistira: currentAttendee.asistira ?? true,
        webUrl: currentAttendee.webUrl || "",
      });
    }
  }, [currentAttendee]);

  useEffect(() => {
    base44.entities.EventConfig.list().then(data => {
      setEventConfig(data?.[0] || null);
    });
  }, []);

  const updateForm = (key, value) => {
    let finalValue = value;
    if (key === "nombre" && value) {
      finalValue = value.charAt(0).toUpperCase() + value.slice(1);
    } else if (key === "apellidos" && value) {
      finalValue = value.split(" ").map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "").join(" ");
    }
    setForm(prev => ({ ...prev, [key]: finalValue }));
  };

  const toggleInteres = (i) => {
    setForm(prev => {
      const isSelected = prev.intereses.includes(i);
      if (isSelected) return { ...prev, intereses: prev.intereses.filter(item => item !== i) };
      if (prev.intereses.length >= 3) return prev;
      return { ...prev, intereses: [...prev.intereses, i] };
    });
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);

    if (!form.nombre || !form.apellidos || !form.email || !form.empresa) {
      setError("Por favor, completa os campos obrigatorios (Nome, Apelidos, Email, Empresa).");
      return;
    }
    if (!form.sector) {
      setError("Por favor, selecciona o teu sector.");
      return;
    }
    if (form.sector === "Outros" && !form.sectorOtro.trim()) {
      setError("Por favor, especifica o teu sector.");
      return;
    }

    if (!form.queOfrece) {
      setError("Por favor, indica que ofreces no evento.");
      return;
    }
    setLoading(true);

    try {
      let emailChanged = false;
      if (form.email.trim().toLowerCase() !== (currentAttendee.email || "").toLowerCase()) {
        if (!auth.currentUser) throw new Error("A túa sesión caducou. Por favor, pecha a sesión dende a Axenda e volve a entrar.");
        await updateEmail(auth.currentUser, form.email.trim().toLowerCase());
        emailChanged = true;
      }

      const updatedAttendee = await base44.entities.Attendee.update(currentAttendee.id, {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim().toLowerCase(),
        empresa: form.empresa.trim(),
        whatsapp: form.whatsapp.trim() ? `${form.prefijoWhatsapp} ${form.whatsapp.trim()}` : "",
        sector: form.sector === "Outros" ? form.sectorOtro.trim() : form.sector,
        intereses: form.intereses,
        queBusca: form.queBusca.trim(),
        queOfrece: form.queOfrece.trim(),
        perfilPublico: form.perfilPublico,
        asistira: form.asistira,
        webUrl: form.webUrl.trim(),
      });

      // Sincronizar datos desnormalizados en MeetingSlots
      const myId = String(currentAttendee.id);
      const allSlots = await base44.entities.MeetingSlot.list() || [];
      const newName = `${form.nombre.trim()} ${form.apellidos.trim()}`;
      const newEmpresa = form.empresa.trim();
      const newEmail = form.email.trim().toLowerCase();

      const batch = base44.writeBatch();
      let hasBatchOperations = false;

      for (const slot of allSlots) {
        let needsUpdate = false;
        const updates = {};

        if (String(slot.hostId) === myId) {
          if (slot.hostNombre !== newName || slot.hostEmpresa !== newEmpresa) {
            updates.hostNombre = newName;
            updates.hostEmpresa = newEmpresa;
            needsUpdate = true;
          }
        }

        if (String(slot.reservadoPorId) === myId) {
          if (slot.reservadoPorNombre !== newName || slot.reservadoPorEmail !== newEmail) {
            updates.reservadoPorNombre = newName;
            updates.reservadoPorEmail = newEmail;
            needsUpdate = true;
          }
        }

        if (Array.isArray(slot.solicitantes)) {
          let solicitantesModificados = false;
          const updatedSolicitantes = slot.solicitantes.map(req => {
            if (String(req.id) === myId && (req.nombre !== form.nombre.trim() || req.apellidos !== form.apellidos.trim() || req.empresa !== newEmpresa || req.email !== newEmail)) {
              solicitantesModificados = true;
              return { ...req, nombre: form.nombre.trim(), apellidos: form.apellidos.trim(), empresa: newEmpresa, email: newEmail };
            }
            return req;
          });
          if (solicitantesModificados) {
            updates.solicitantes = updatedSolicitantes;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          const slotRef = doc(db, "meetingSlots", String(slot.id));
          batch.update(slotRef, updates);
          hasBatchOperations = true;
        }
      }

      if (hasBatchOperations) {
        await batch.commit();
        base44.entities.MeetingSlot.clearCache();
      }

      saveAttendeeSession(updatedAttendee);
      setCurrentAttendee(updatedAttendee);
      
      if (emailChanged) {
        setShowEmailVerifyAlert(true);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        setError("Por seguridade, pecha a sesión e volve a entrar para cambiar o teu email.");
      } else if (e.code === 'auth/email-already-in-use') {
        setError("Este email xa está a ser usado por outra conta.");
      } else if (e.code === 'auth/invalid-email') {
        setError("O formato do novo email non é válido.");
      } else if (e.code === 'auth/operation-not-allowed') {
        setError("A actualización de email non está permitida na configuración do servidor.");
      } else {
        setError(e.message ? `Erro: ${e.message}` : "Ocorreu un erro ao gardar os cambios.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError("");
    try {
      if (!auth.currentUser) throw new Error("No hai sesión activa.");
      
      const myId = String(currentAttendee.id);
      
      // Borramos de Firestore
      await base44.entities.Attendee.delete(currentAttendee.id);
      
      // Limpeza de MeetingSlots para non deixar reunións orfas
      const allSlots = await base44.entities.MeetingSlot.list() || [];
      const batch = base44.writeBatch();
      let hasBatchOperations = false;
      
      for (const slot of allSlots) {
        let needsUpdate = false;
        let shouldDelete = false;
        const updates = {};

        if (String(slot.hostId) === myId) {
          shouldDelete = true;
        } else {
          if (String(slot.reservadoPorId) === myId) {
            updates.estado = "disponible";
            updates.reservadoPorId = null;
            updates.reservadoPorNombre = null;
            updates.reservadoPorEmail = null;
            updates.mesaId = null;
            updates.mesaColor = null;
            needsUpdate = true;
          }
          if (Array.isArray(slot.solicitantes) && slot.solicitantes.some(req => String(req.id) === myId)) {
            updates.solicitantes = slot.solicitantes.filter(req => String(req.id) !== myId);
            needsUpdate = true;
          }
        }

        const slotRef = doc(db, "meetingSlots", String(slot.id));
        if (shouldDelete) {
          batch.delete(slotRef);
          hasBatchOperations = true;
        } else if (needsUpdate) {
          batch.update(slotRef, updates);
          hasBatchOperations = true;
        }
      }

      if (hasBatchOperations) {
        await batch.commit();
        base44.entities.MeetingSlot.clearCache();
      }

      // Borramos de Firebase Auth
      await deleteUser(auth.currentUser);
      
      clearAttendeeSession();
      navigate("/");
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        setError("Por seguridade, pecha a sesión e volve a entrar para poder eliminar a túa conta.");
      } else {
        setError("Ocorreu un erro ao intentar eliminar a conta.");
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!currentAttendee) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-20">
          <AttendeeLogin onLogin={setCurrentAttendee} redirectLabel="O meu Perfil" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">O meu Perfil</h1>
            <p className="text-muted-foreground mt-1">
              Actualiza a túa información e preferencias de networking.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/mi-agenda")} className="gap-2 w-full sm:w-auto">
            Volver á miña Axenda
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Datos Personales */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-muted-foreground" /> Datos Persoais
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome <span className="text-destructive">*</span></Label>
                  <Input value={form.nombre} onChange={e => updateForm("nombre", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Apelidos <span className="text-destructive">*</span></Label>
                  <Input value={form.apellidos} onChange={e => updateForm("apellidos", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} className="mt-1.5" />
                  <p className="text-[11px] text-orange-600/90 mt-1.5 font-medium leading-tight">
                    Importante: revisa que o teu correo estea ben escrito. Se hai unha errata, non che chegarán as notificacións de novas reunións nin avisos importantes.
                  </p>
                </div>
                <div>
                  <Label>Empresa <span className="text-destructive">*</span></Label>
                  <Input value={form.empresa} onChange={e => updateForm("empresa", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <div className="flex mt-1.5">
                    <Select value={form.prefijoWhatsapp} onValueChange={v => updateForm("prefijoWhatsapp", v)}>
                      <SelectTrigger className="w-[110px] rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EUROPEAN_PREFIXES.map(p => (
                          <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="tel" pattern="[0-9]*" value={form.whatsapp} onChange={e => updateForm("whatsapp", e.target.value.replace(/[^0-9]/g, ''))} placeholder="600000000" className="rounded-l-none" />
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Perfil Profesional */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Perfil Profesional</h2>
              <div className="space-y-5">
                <div>
                  <Label>Sector da túa empresa <span className="text-destructive">*</span></Label>
                  <Select value={form.sector} onValueChange={v => updateForm("sector", v)}>
                    <SelectTrigger className="mt-1.5 w-full sm:w-1/2">
                      <SelectValue placeholder="Selecciona un sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.sector === "Outros" && (
                    <div className="mt-3">
                      <Label>Especifica o teu sector <span className="text-destructive">*</span></Label>
                      <Input value={form.sectorOtro} onChange={e => updateForm("sectorOtro", e.target.value)} placeholder="Escribe o teu sector..." className="mt-1.5" />
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Áreas de interese (Máx 3) (Opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESES.map(i => {
                      const selected = form.intereses.includes(i);
                      return (
                        <Badge
                          key={i}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer py-1.5 text-xs transition-colors"
                          style={selected ? { backgroundColor: '#00869d', color: 'white' } : {}}
                          onClick={() => toggleInteres(i)}
                        >
                          {i}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Que buscas no evento? (Opcional) <span className="text-xs text-muted-foreground font-normal ml-2">(Máx. 500 caracteres)</span></Label>
                  <Textarea maxLength={500} value={form.queBusca} onChange={e => updateForm("queBusca", e.target.value)} placeholder="Ex: Busco coñecer empresas tecnolóxicas para posibles colaboracións..." className="mt-1.5 resize-none h-20" />
                  <p className="text-right text-[10px] text-muted-foreground mt-1">{form.queBusca.length}/500</p>
                </div>
                <div>
                  <Label>Que ofreces? <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal ml-2">(Máx. 500 caracteres)</span></Label>
                  <Textarea maxLength={500} value={form.queOfrece} onChange={e => updateForm("queOfrece", e.target.value)} placeholder="Ex: Ofrezo servizos de consultoría dixital..." className="mt-1.5 resize-none h-20" />
                  <p className="text-right text-[10px] text-muted-foreground mt-1">{form.queOfrece.length}/500</p>
                </div>
                <div className="mt-4">
                  <Label>Páxina web ou Catálogo de produtos (Opcional)</Label>
                  <Input type="url" value={form.webUrl} onChange={e => updateForm("webUrl", e.target.value)} placeholder="https://www.tuweb.com" className="mt-1.5" />
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* Privacidad */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Privacidade</h2>
              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <div className="flex items-start gap-3">
                  <Checkbox id="perfilPublico" checked={form.perfilPublico} onCheckedChange={v => updateForm("perfilPublico", v)} className="mt-1" />
                  <div>
                    <Label htmlFor="perfilPublico" className="text-sm font-semibold cursor-pointer">Amosar os meus datos de contacto</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se o desmarcas, o teu correo electrónico e teléfono ocultaranse no directorio (aínda que o teu perfil siga sendo visible para concertar reunións).
                    </p>
                  </div>
                </div>
                {(!eventConfig || eventConfig.allowNonAttending !== false) && (
                  <div className="flex items-start gap-3 mt-4 pt-4 border-t border-border">
                    <Checkbox id="asistira" checked={form.asistira} onCheckedChange={v => updateForm("asistira", v)} className="mt-1" />
                    <div>
                      <Label htmlFor="asistira" className="text-sm font-semibold cursor-pointer">Asistirei presencialmente ao evento</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Se o desmarcas, rexistraraste só para ver o directorio de profesionais, pero non poderás reservar reunións nin ter unha axenda propia.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

          </div>
          
          <div className="p-6 sm:p-8 bg-muted/10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              {error && <p className="text-destructive text-sm font-medium">{error}</p>}
              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-green-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CheckCircle className="w-4 h-4" /> Cambios gardados correctamente!
                </div>
              )}
            </div>
            <Button onClick={handleSave} disabled={loading} style={{ backgroundColor: '#00869d', color: 'white' }} className="w-full sm:w-auto px-8 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Gardar cambios
            </Button>
          </div>
        </div>

        {/* Zona de Peligro: Eliminar cuenta */}
        <div className="mt-8 bg-red-50/50 rounded-xl border border-red-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Eliminar conta
          </h2>
          <p className="text-sm text-red-800/80 mb-4">
            Unha vez que elimines a túa conta, borraranse todos os teus datos persoais e as reunións que teñas programadas no directorio. Esta acción non se pode desfacer.
          </p>
          
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              Eliminar a miña conta
            </Button>
          ) : (
            <div className="bg-red-100/50 border border-red-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-semibold text-red-900 mb-3">Estás completamente seguro/a?</p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Si, eliminar definitivamente
                </Button>
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="w-full sm:w-auto text-red-800 hover:text-red-900 hover:bg-red-100" disabled={deleting}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showEmailVerifyAlert} onOpenChange={setShowEmailVerifyAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <MailWarning className="w-5 h-5" />
              Revisa o teu novo correo
            </DialogTitle>
            <DialogDescription className="text-foreground pt-2 space-y-3">
              <p>
                Os teus cambios gardáronse correctamente, pero por motivos de seguridade, <strong>o teu correo de inicio de sesión aínda non cambiou</strong>.
              </p>
              <p className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm border border-orange-100">
                Acabamos de enviarche un correo automático de verificación á túa nova dirección. <strong>Pode que chegue ao cartafol de Spam</strong>.
              </p>
              <p className="text-sm">
                Fai clic no enlace dese correo para confirmar o cambio. Mentres non o fagas, terás que seguir iniciando sesión co teu correo antigo.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowEmailVerifyAlert(false)} style={{ backgroundColor: '#00869d', color: 'white' }}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
