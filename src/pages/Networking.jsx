import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Users, Lock, Loader2, LogOut, CalendarPlus, CheckSquare, Search as SearchIcon, Mail } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import AttendeeCard from "@/components/networking/AttendeeCard";
import SlotModal from "@/components/networking/SlotModal";
import AttendeeLogin from "@/pages/AttendeeLogin";
import { isNetworkingVisible, isAdminLoggedIn, SECTORES } from "@/lib/eventUtils";
import { getAttendeeSession, saveAttendeeSession, clearAttendeeSession } from "@/lib/attendeeAuth";

export default function Networking() {
  const [currentAttendee, setCurrentAttendee] = useState(getAttendeeSession());
  const [config, setConfig] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [filterSector, setFilterSector] = useState("all");

  const [selectedHost, setSelectedHost] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentAttendee]);

  const loadData = async () => {
    setLoading(true);
    const [cfgList, attList, slotList] = await Promise.all([
      base44.entities.EventConfig.list(),
      currentAttendee ? base44.entities.Attendee.list() : Promise.resolve([]),
      currentAttendee ? base44.entities.MeetingSlot.list() : Promise.resolve([])
    ]);
    setConfig(cfgList?.[0] || null);
    if (attList) {
      const sanitized = attList.map(a => {
        if (currentAttendee && String(a.id) === String(currentAttendee.id)) return a;
        const safe = { ...a };
        delete safe.passwordHash;
        if (!safe.perfilPublico) {
          delete safe.email;
          delete safe.whatsapp;
        }
        return safe;
      });
      setAttendees(sanitized);
    }
    if (slotList) setSlots(slotList);
    setLoading(false);
  };

  const visible = isAdminLoggedIn() || isNetworkingVisible(config);

  const filteredAttendees = attendees.filter(a => {
    const matchName = `${a.nombre} ${a.apellidos} ${a.empresa}`.toLowerCase().includes(searchText.toLowerCase());
    const matchSector = filterSector === "all" || a.sector === filterSector;
    return matchName && matchSector;
  });

  const handleLogout = () => {
    clearAttendeeSession();
    setCurrentAttendee(null);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  if (!visible) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-muted">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">Networking aínda non dispoñible</h2>
          <p className="text-muted-foreground">
            O directorio de asistentes e a reserva de reunións activaranse proximamente.
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!currentAttendee) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-20">
          <AttendeeLogin onLogin={setCurrentAttendee} redirectLabel="Networking" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              Directorio de Networking
              <Badge style={{ backgroundColor: '#e5f3f5', color: '#00869d' }}>{attendees.length} asistentes</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">Descobre outros profesionais e reserva reunións 1:1.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleLogout} title="Pechar sesión">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Como funciona banner */}
        <div className="bg-[#e5f3f5]/50 border border-[#00869d]/20 rounded-xl p-5 mb-8">
          <h2 className="text-[#00869d] font-semibold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
            Como funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-[2px] bg-[#00869d]/10 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#00869d]/20 flex items-center justify-center mb-3 shadow-sm text-[#00869d]">
                <SearchIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">1. Atopa profesionais</h3>
              <p className="text-xs text-muted-foreground">Usa o buscador e os filtros para atopar perfís afíns aos teus intereses.</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#00869d]/20 flex items-center justify-center mb-3 shadow-sm text-[#00869d]">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">2. Solicita reunión</h3>
              <p className="text-xs text-muted-foreground">Escolle un oco libre na súa axenda e envíalle unha petición (máx 4).</p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#00869d]/20 flex items-center justify-center mb-3 shadow-sm text-[#00869d]">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm mb-1 text-foreground">3. Revisa a túa axenda</h3>
              <p className="text-xs text-muted-foreground">Acepta peticións recibidas para fixar unha mesa e confirma o teu calendario.</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-[#00869d]/10 flex items-start gap-3 text-sm text-[#00869d]">
            <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Notificacións por correo:</strong> Recibirás un aviso no teu correo cando alguén che solicite unha reunión, cando che acepten unha petición, ou cando a rexeiten. <span className="font-semibold text-orange-600">Por favor, revisa sempre a túa carpeta de Spam ou Correo Non Desexado por se acaso!</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 mb-8 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Buscar por nome, apelidos ou empresa..."
              className="pl-9 bg-muted/20 border-transparent focus-visible:bg-transparent"
            />
          </div>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className="w-full sm:w-56 bg-muted/20 border-transparent">
              <SelectValue placeholder="Sector profesional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sectores</SelectItem>
              {SECTORES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredAttendees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-border border-dashed">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Sen resultados</h3>
            <p className="text-muted-foreground">Non se atoparon asistentes con eses filtros.</p>
            <Button variant="link" onClick={() => { setSearchText(""); setFilterSector("all"); }} style={{ color: '#00869d' }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAttendees.map(attendee => (
              <motion.div key={attendee.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <AttendeeCard
                  attendee={attendee}
                  currentUserId={currentAttendee.id}
                  onReserveSlot={(host) => setSelectedHost(host)}
                  currentUserAsistira={currentAttendee.asistira}
                />
              </motion.div>
            ))}
          </div>
        )}

        {selectedHost && (
          <SlotModal
            host={selectedHost}
            currentAttendee={currentAttendee}
            allSlots={slots}
            eventDate={config?.fechaEvento}
            onClose={() => setSelectedHost(null)}
            onBooked={loadData}
          />
        )}
      </div>
    </PageLayout>
  );
}
