import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User as UserIcon, CheckCircle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { SECTORES, INTERESES } from "@/lib/eventUtils";
import { getAttendeeSession, saveAttendeeSession } from "@/lib/attendeeAuth";
import AttendeeLogin from "@/pages/AttendeeLogin";

export default function MiPerfil() {
  const navigate = useNavigate();
  const [currentAttendee, setCurrentAttendee] = useState(getAttendeeSession());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "", apellidos: "", empresa: "", whatsapp: "",
    sector: "", intereses: [], queBusca: "", queOfrece: "",
    perfilPublico: true, asistira: true,
    webUrl: "",
    sectorOtro: "",
  });

  const [eventConfig, setEventConfig] = useState(null);

  useEffect(() => {
    if (currentAttendee) {
      const isCustomSector = currentAttendee.sector && !SECTORES.includes(currentAttendee.sector);
      setForm({
        nombre: currentAttendee.nombre || "",
        apellidos: currentAttendee.apellidos || "",
        empresa: currentAttendee.empresa || "",
        whatsapp: currentAttendee.whatsapp || "",
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

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

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

    if (!form.nombre || !form.apellidos || !form.empresa) {
      setError("Por favor, completa os campos obrigatorios (Nome, Apelidos, Empresa).");
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
      const updatedAttendee = await base44.entities.Attendee.update(currentAttendee.id, {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        empresa: form.empresa.trim(),
        whatsapp: form.whatsapp.trim(),
        sector: form.sector === "Outros" ? form.sectorOtro.trim() : form.sector,
        intereses: form.intereses,
        queBusca: form.queBusca.trim(),
        queOfrece: form.queOfrece.trim(),
        perfilPublico: form.perfilPublico,
        asistira: form.asistira,
        webUrl: form.webUrl.trim(),
      });

      saveAttendeeSession(updatedAttendee);
      setCurrentAttendee(updatedAttendee);
      setSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      setError("Ocorreu un erro ao gardar os cambios.");
    } finally {
      setLoading(false);
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
                  <Label>Empresa <span className="text-destructive">*</span></Label>
                  <Input value={form.empresa} onChange={e => updateForm("empresa", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input type="tel" value={form.whatsapp} onChange={e => updateForm("whatsapp", e.target.value)} placeholder="+34 600 000 000" className="mt-1.5" />
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
                  <Label>Que buscas no evento? (Opcional)</Label>
                  <Textarea value={form.queBusca} onChange={e => updateForm("queBusca", e.target.value)} placeholder="Ex: Busco coñecer empresas tecnolóxicas para posibles colaboracións..." className="mt-1.5 resize-none h-20" />
                </div>
                <div>
                  <Label>Que ofreces? <span className="text-destructive">*</span></Label>
                  <Textarea value={form.queOfrece} onChange={e => updateForm("queOfrece", e.target.value)} placeholder="Ex: Ofrezo servizos de consultoría dixital..." className="mt-1.5 resize-none h-20" />
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
                <p className="text-[#00869d] text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Cambios gardados correctamente.
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={loading} style={{ backgroundColor: '#00869d', color: 'white' }} className="w-full sm:w-auto px-8 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Gardar cambios
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
