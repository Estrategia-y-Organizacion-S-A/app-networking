import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export default function ConfigTab({ eventConfig, onReload, attendees, mesas }) {
  const [savingConfig, setSavingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ 
    nombreEvento: "", 
    fechaEvento: "", 
    descripcion: "", 
    lugarEvento: "", 
    networkingActivo: false, 
    diasAntelacionNetworking: 1,
    allowNonAttending: true,
    registroCerrado: false,
    maxAttendees: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventConfig) {
      setConfigForm({ 
        nombreEvento: eventConfig.nombreEvento || "", 
        fechaEvento: eventConfig.fechaEvento || "", 
        descripcion: eventConfig.descripcion || "", 
        lugarEvento: eventConfig.lugarEvento || "", 
        networkingActivo: eventConfig.networkingActivo || false,
        diasAntelacionNetworking: eventConfig.diasAntelacionNetworking !== undefined ? eventConfig.diasAntelacionNetworking : 1,
        allowNonAttending: eventConfig.allowNonAttending !== undefined ? eventConfig.allowNonAttending : true,
        registroCerrado: eventConfig.registroCerrado || false,
        maxAttendees: eventConfig.maxAttendees || ""
      });
    }
  }, [eventConfig]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    if (eventConfig) { 
      await base44.entities.EventConfig.update(eventConfig.id, configForm); 
    } else { 
      await base44.entities.EventConfig.create(configForm); 
    }
    await onReload();
    setSavingConfig(false);
  };

  const handleClearData = async () => {
    if (!window.confirm("ATENCIÓN! Isto borrará TODOS os asistentes e TODAS as reunións. A configuración e as mesas manteranse. Estás seguro?")) return;
    const pwd = window.prompt("Introduce o contrasinal de administrador para confirmar:");
    if (pwd !== "Networking2026!") {
      alert("Contrasinal incorrecto. Operación cancelada.");
      return;
    }
    setLoading(true);
    const allSlots = await base44.entities.MeetingSlot.list();
    for (const s of allSlots || []) await base44.entities.MeetingSlot.delete(s.id);
    const allAttendees = await base44.entities.Attendee.list();
    for (const a of allAttendees || []) await base44.entities.Attendee.delete(a.id);
    await onReload();
    setLoading(false);
    alert("Datos baleirados correctamente.");
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-6">Configuración do evento</h2>
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nome do evento</Label>
              <Input value={configForm.nombreEvento} onChange={e => setConfigForm(p => ({ ...p, nombreEvento: e.target.value }))} placeholder="Xornada de Galicia Suroeste · 2026" className="mt-1.5" />
            </div>
            <div>
              <Label>Data do evento</Label>
              <Input type="date" value={configForm.fechaEvento} onChange={e => setConfigForm(p => ({ ...p, fechaEvento: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Lugar</Label>
              <Input value={configForm.lugarEvento} onChange={e => setConfigForm(p => ({ ...p, lugarEvento: e.target.value }))} placeholder="Cidade, venue..." className="mt-1.5" />
            </div>
            <div>
              <Label>Límite de asistentes</Label>
              <Input type="number" min="1" value={configForm.maxAttendees} onChange={e => setConfigForm(p => ({ ...p, maxAttendees: e.target.value ? Number(e.target.value) : "" }))} placeholder="Ex: 50" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1.5">Déixao en branco se non hai límite.</p>
            </div>
            <div className="md:col-span-2">
              <Label>Descrición</Label>
              <Input value={configForm.descripcion} onChange={e => setConfigForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descrición breve do evento" className="mt-1.5" />
            </div>
            <div className="md:col-span-2">
              <Label>Días de antelación para abrir Networking automaticamente</Label>
              <Input type="number" min="0" max="30" value={configForm.diasAntelacionNetworking} onChange={e => setConfigForm(p => ({ ...p, diasAntelacionNetworking: Number(e.target.value) }))} className="mt-1.5 md:w-1/2" />
              <p className="text-xs text-muted-foreground mt-1.5">Por defecto: 1 día antes do evento. Pon 0 para que se abra o mesmo día da data do evento.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div className="pr-4">
                <p className="font-medium text-sm text-foreground">Pechar novos rexistros</p>
                <p className="text-xs text-muted-foreground mt-1">Se o activas, ninguén máis poderá inscribirse no evento, aínda que non se chegara ao límite.</p>
              </div>
              <Switch checked={configForm.registroCerrado} onCheckedChange={v => setConfigForm(p => ({ ...p, registroCerrado: v }))} className="mt-1" />
            </div>
            <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div className="pr-4">
                <p className="font-medium text-sm text-foreground">Activar networking manualmente agora</p>
                <p className="text-xs text-muted-foreground mt-1">Isto ignora os días de antelación e abre a plataforma instantaneamente.</p>
              </div>
              <Switch checked={configForm.networkingActivo} onCheckedChange={v => setConfigForm(p => ({ ...p, networkingActivo: v }))} className="mt-1" />
            </div>
            <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-muted/20 md:col-span-2">
              <div className="pr-4">
                <p className="font-medium text-sm text-foreground">Permitir rexistro sen asistencia presencial</p>
                <p className="text-xs text-muted-foreground mt-1">Activa a caixa "Asistirei presencialmente ao evento" no formulario de rexistro.</p>
              </div>
              <Switch checked={configForm.allowNonAttending} onCheckedChange={v => setConfigForm(p => ({ ...p, allowNonAttending: v }))} className="mt-1" />
            </div>
          </div>

          <Button type="submit" disabled={savingConfig} className="w-full md:w-auto" style={{ backgroundColor: '#00869d', color: 'white' }}>
            {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Gardar configuración
          </Button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="font-semibold text-destructive mb-2">Zona de Perigo</h3>
          <p className="text-sm text-muted-foreground mb-4">Borrar todos os asistentes e reservas de reunións. A configuración e as mesas físicas manteranse. Esta acción non se pode desfacer.</p>
          <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-lg mb-4">
            <strong>Aviso importante de seguridade:</strong> Isto baleira a base de datos, pero <strong>non borra as contas de usuario (emails e contrasinais)</strong>. Para permitir que unha persoa se volva rexistrar co mesmo correo despois de baleirar os datos, tes que ir á consola de Firebase &gt; Authentication &gt; Users e borralos manualmente dende alí.
          </div>
          <Button variant="outline" onClick={handleClearData} className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
            Baleirar datos do evento
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          { label: "Asistentes rexistrados", value: attendees.length },
          { label: "Perfís públicos", value: attendees.filter(a => a.perfilPublico).length },
          { label: "Mesas creadas", value: mesas.length },
          { label: "Mesas completas", value: mesas.filter(m => m.persona1Id && m.persona2Id).length }
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: '#00869d' }}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
