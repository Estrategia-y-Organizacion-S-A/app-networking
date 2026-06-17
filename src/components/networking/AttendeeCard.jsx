import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Calendar, Globe } from "lucide-react";

export default function AttendeeCard({ attendee, onReserveSlot, currentUserId, currentUserAsistira }) {
  const isOwn = attendee.id === currentUserId;
  const initials = `${attendee.nombre?.[0] || ""}${attendee.apellidos?.[0] || ""}`.toUpperCase();

  return (
    <div className={`rounded-xl border p-5 transition-shadow ${attendee.asistira === false ? "bg-muted/30 border-dashed border-muted-foreground/30" : "bg-white border-border hover:shadow-md"}`}>
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${attendee.asistira === false ? "grayscale opacity-60" : ""}`}
          style={{ backgroundColor: '#00869d' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm truncate flex items-center gap-2">
            {attendee.nombre} {attendee.apellidos}
            {isOwn && <span className="text-xs text-muted-foreground font-normal">(Ti)</span>}
            {attendee.asistira === false && <Badge variant="secondary" className="text-[10px] h-5">Non asistente</Badge>}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            {attendee.empresa}
          </p>
          {attendee.sector && (
            <Badge variant="outline" className="text-xs mt-1">{attendee.sector}</Badge>
          )}
        </div>
      </div>

      {attendee.intereses && attendee.intereses.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {attendee.intereses.slice(0, 3).map(interes => (
            <span
              key={interes}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#e5f3f5', color: '#00869d' }}
            >
              {interes}
            </span>
          ))}
          {attendee.intereses.length > 3 && (
            <span className="text-xs text-muted-foreground">+{attendee.intereses.length - 3}</span>
          )}
        </div>
      )}

      {(attendee.queBusca || attendee.queOfrece) && (
        <div className="space-y-1 mb-3 text-xs text-muted-foreground border-t border-border pt-2">
          {attendee.queBusca && <p><span className="font-medium text-foreground">Busca:</span> {attendee.queBusca}</p>}
          {attendee.queOfrece && <p><span className="font-medium text-foreground">Ofrece:</span> {attendee.queOfrece}</p>}
        </div>
      )}

      {((attendee.perfilPublico && (attendee.email || attendee.whatsapp)) || attendee.webUrl) && (
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          {attendee.perfilPublico && attendee.email && (
            <a href={`mailto:${attendee.email}`} className="flex items-center gap-1 text-muted-foreground hover:underline">
              <Mail className="w-3 h-3" /> {attendee.email}
            </a>
          )}
          {attendee.perfilPublico && attendee.whatsapp && (
            <a href={`https://wa.me/${attendee.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-muted-foreground hover:underline">
              <Phone className="w-3 h-3" /> {attendee.whatsapp}
            </a>
          )}
          {attendee.webUrl && (
            <a href={attendee.webUrl.startsWith('http') ? attendee.webUrl : `https://${attendee.webUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-muted-foreground hover:underline">
              <Globe className="w-3 h-3" /> Web
            </a>
          )}
        </div>
      )}

      {!isOwn && onReserveSlot && attendee.asistira !== false && currentUserAsistira !== false && (
        <Button
          size="sm"
          className="w-full text-xs gap-1"
          variant="outline"
          style={{ borderColor: '#00869d', color: '#00869d' }}
          onClick={() => onReserveSlot(attendee)}
        >
          <Calendar className="w-3 h-3" />
          Ver ocos dispoñibles
        </Button>
      )}
    </div>
  );
}
