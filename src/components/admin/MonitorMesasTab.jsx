import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TableProperties, Users, Building2 } from "lucide-react";
import { TIME_SLOTS } from "@/lib/eventUtils";

export default function MonitorMesasTab({ mesas }) {
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0].label);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    const allSlots = await base44.entities.MeetingSlot.list();
    // Nos interesan solo las reservas confirmadas
    setMeetings((allSlots || []).filter(s => s.estado === "reservado"));
    setLoading(false);
  };

  // Filtrar las reuniones que caen en la franja seleccionada
  // Un slot tiene horaInicio y horaFin. Generalmente coincidirá con un TIME_SLOT exacto pero comparamos por si acaso.
  const activeMeetings = meetings.filter(m => {
    const timeLabel = `${m.horaInicio} - ${m.horaFin}`;
    return timeLabel === selectedTime;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-lg">
              <TableProperties className="w-5 h-5 text-primary" style={{ color: '#00869d' }} />
              Control de Mesas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Visualiza o estado das mesas físicas en cada franxa horaria.
            </p>
          </div>
          
          <div className="w-full sm:w-64">
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full bg-[#e5f3f5] border-[#00869d]/20 text-[#00869d] font-semibold">
                <SelectValue placeholder="Selecciona hora" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map(slot => (
                  <SelectItem key={slot.label} value={slot.label}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mesas.map(mesa => {
            const meeting = activeMeetings.find(m => String(m.mesaId) === String(mesa.id));
            const isOccupied = !!meeting;

            return (
              <div 
                key={mesa.id} 
                className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                  isOccupied ? "bg-white border-border shadow-sm" : "bg-muted/10 border-dashed border-border"
                }`}
              >
                {/* Cabecera de la mesa */}
                <div 
                  className="px-4 py-3 flex items-center justify-between border-b"
                  style={{ 
                    borderColor: isOccupied ? `${mesa.colorHex}30` : 'var(--border)',
                    backgroundColor: isOccupied ? `${mesa.colorHex}10` : 'transparent' 
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: mesa.colorHex || '#ccc' }}
                    />
                    {mesa.color}
                  </div>
                  {isOccupied ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      Ocupada
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                      Libre
                    </span>
                  )}
                </div>

                {/* Contenido de la mesa */}
                <div className="p-4">
                  {isOccupied ? (
                    <div className="space-y-4">
                      {/* Persona 1 (Host) */}
                      <div className="flex gap-3 items-start">
                        <div className="mt-0.5 bg-muted rounded p-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {meeting.hostNombre}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" /> {meeting.hostEmpresa || "Sen empresa"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="w-0.5 h-4 bg-border"></div>
                      </div>

                      {/* Persona 2 (Invitado) */}
                      <div className="flex gap-3 items-start">
                        <div className="mt-0.5 bg-muted rounded p-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {meeting.reservadoPorNombre}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {meeting.reservadoPorEmail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-muted-foreground opacity-60">
                      <TableProperties className="w-8 h-8 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-medium">Dispoñible</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {mesas.length === 0 && (
            <div className="col-span-full text-center py-10 bg-white rounded-xl border border-border">
              <TableProperties className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Non hai mesas físicas creadas.</p>
              <p className="text-sm text-muted-foreground mt-1">Vai á pestana "Xestión Mesas" para engadir mesas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
