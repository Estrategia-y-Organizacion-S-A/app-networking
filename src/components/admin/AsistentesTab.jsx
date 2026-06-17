import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, Download } from "lucide-react";
import { SECTORES } from "@/lib/eventUtils";

export default function AsistentesTab({ attendees, onReload }) {
  const [searchText, setSearchText] = useState("");
  const [filterSector, setFilterSector] = useState("all");

  const handleDeleteAttendee = async (id) => {
    if (!window.confirm("Eliminar este asistente?")) return;
    await base44.entities.Attendee.delete(id);
    await onReload();
  };

  const handleExportCSV = () => {
    if (attendees.length === 0) return;
    // Format: Nombre, Apellidos, Email
    const header = "Nome,Apelidos,Email\n";
    const rows = attendees.map(a => `"${(a.nombre || "").replace(/"/g, '""')}","${(a.apellidos || "").replace(/"/g, '""')}","${(a.email || "").replace(/"/g, '""')}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asistentes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAttendees = attendees.filter(a => {
    const nameMatch = `${a.nombre} ${a.apellidos} ${a.email} ${a.empresa}`.toLowerCase().includes(searchText.toLowerCase());
    const sectorMatch = filterSector === "all" || a.sector === filterSector;
    return nameMatch && sectorMatch;
  });

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            placeholder="Buscar asistente..." 
            className="pl-9" 
          />
        </div>
        <Select value={filterSector} onValueChange={setFilterSector}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {SECTORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2 shrink-0">
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Empresa</th>
              <th className="text-left px-4 py-3 font-medium">Sector</th>
              <th className="text-left px-4 py-3 font-medium">Perfil</th>
              <th className="text-right px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAttendees.map(a => (
              <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{a.nombre} {a.apellidos}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.empresa}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{a.sector}</Badge>
                </td>
                <td className="px-4 py-3">
                  {a.perfilPublico 
                    ? <Badge className="text-xs" style={{ backgroundColor: '#e5f3f5', color: '#00869d' }}>Público</Badge> 
                    : <Badge variant="outline" className="text-xs text-muted-foreground">Privado</Badge>
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAttendee(a.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAttendees.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Non hai asistentes rexistrados.
          </div>
        )}
      </div>
    </div>
  );
}
