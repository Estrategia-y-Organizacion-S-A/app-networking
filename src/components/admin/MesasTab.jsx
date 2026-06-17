import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Pencil, Check, X, Download } from "lucide-react";

const COLORES_VISUALES = [
  { nombre: "Vermello", hex: "#EF4444" },
  { nombre: "Azul", hex: "#3B82F6" },
  { nombre: "Rosa", hex: "#EC4899" },
  { nombre: "Verde", hex: "#22C55E" },
  { nombre: "Laranxa", hex: "#F97316" },
  { nombre: "Morado", hex: "#8B5CF6" },
  { nombre: "Amarelo", hex: "#EAB308" },
  { nombre: "Cian", hex: "#06B6D4" },
  { nombre: "Lima", hex: "#84CC16" },
  { nombre: "Lila", hex: "#A78BFA" },
  { nombre: "Gris", hex: "#6B7280" },
  { nombre: "Índigo", hex: "#6366F1" },
];

export default function MesasTab({ mesas, onReload }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ color: "", colorHex: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ color: "", colorHex: "#3B82F6" }); // Default Azul
  const [saving, setSaving] = useState(false);

  const handleEdit = (mesa) => {
    setEditingId(mesa.id);
    setEditForm({ color: mesa.color, colorHex: mesa.colorHex || "#888" });
  };

  const handleSaveEdit = async () => {
    if (!editForm.color.trim()) return;
    setSaving(true);
    await base44.entities.Mesa.update(editingId, {
      color: editForm.color.trim(),
      colorHex: editForm.colorHex
    });
    setEditingId(null);
    setSaving(false);
    onReload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar esta mesa física?")) return;
    await base44.entities.Mesa.delete(id);
    onReload();
  };

  const handleAdd = async () => {
    if (!addForm.color.trim()) return;
    setSaving(true);
    await base44.entities.Mesa.create({
      color: addForm.color.trim(),
      colorHex: addForm.colorHex,
    });
    setAddForm({ color: "", colorHex: "#3B82F6" });
    setShowAdd(false);
    setSaving(false);
    onReload();
  };

  const handleExportCSV = async () => {
    setSaving(true);
    try {
      const allSlots = await base44.entities.MeetingSlot.list();
      const bookedSlots = (allSlots || []).filter(s => s.estado === "reservado");
      
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th { background-color: #00869d; color: white; padding: 10px; font-weight: bold; border: 1px solid #1a4231; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #e5f3f5; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora Inicio</th>
                <th>Hora Fin</th>
                <th>Mesa Asignada</th>
                <th>Anfitrión</th>
                <th>Convidado</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      for (const slot of bookedSlots) {
        let mesaNombre = slot.mesaColor || "Sen asignar";

        const hostName = `${slot.hostNombre} (${slot.hostEmpresa || ''})`;
        const guestName = `${slot.reservadoPorNombre} (${slot.reservadoPorEmail || ''})`;
        
        htmlContent += `
          <tr>
            <td>${slot.fecha}</td>
            <td>${slot.horaInicio}</td>
            <td>${slot.horaFin}</td>
            <td><strong>${mesaNombre}</strong></td>
            <td>${hostName}</td>
            <td>${guestName}</td>
          </tr>
        `;
      }
      
      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reuniones_${new Date().toISOString().split('T')[0]}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">Total mesas físicas:</span>
            <Badge style={{ backgroundColor: '#00869d', color: 'white' }}>{mesas.length}</Badge>
            <span className="text-muted-foreground ml-2">As mesas asignaranse automaticamente ás reunións.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={saving} className="gap-1 text-muted-foreground">
              <Download className="w-3 h-3" /> Exportar a Excel
            </Button>
            <Button size="sm" onClick={() => setShowAdd(v => !v)} style={{ backgroundColor: '#00869d', color: 'white' }} className="gap-1">
              <Plus className="w-3 h-3" /> Engadir mesa
            </Button>
          </div>
        </div>

        {showAdd && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[150px]">
              <Label className="text-xs">Nome de mesa (ex. Mesa EOSA)</Label>
              <Input 
                value={addForm.color} 
                onChange={e => setAddForm(p => ({ ...p, color: e.target.value }))}
                placeholder="Nome personalizado" 
                className="mt-1 h-8 text-sm" 
              />
            </div>
            <div className="w-32">
              <Label className="text-xs">Cor visual</Label>
              <Select value={addForm.colorHex} onValueChange={v => setAddForm(p => ({ ...p, colorHex: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Cor" /></SelectTrigger>
                <SelectContent>
                  {COLORES_VISUALES.map(c => (
                    <SelectItem key={c.hex} value={c.hex}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
                        {c.nombre}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Button size="sm" onClick={handleAdd} disabled={saving || !addForm.color.trim()} style={{ backgroundColor: '#00869d', color: 'white' }} className="gap-1">
                <Check className="w-3 h-3" /> Gardar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {mesas.map(mesa => (
          <div key={mesa.id} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="h-2" style={{ backgroundColor: mesa.colorHex || '#888' }} />
            <div className="p-3">
              {editingId === mesa.id ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Nome</Label>
                    <Input 
                      value={editForm.color} 
                      onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                      className="mt-1 h-7 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cor</Label>
                    <Select value={editForm.colorHex} onValueChange={v => setEditForm(p => ({ ...p, colorHex: v }))}>
                      <SelectTrigger className="mt-1 h-7 text-xs"><SelectValue placeholder="Cor" /></SelectTrigger>
                      <SelectContent>
                        {COLORES_VISUALES.map(c => <SelectItem key={c.hex} value={c.hex}>{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editForm.color.trim()} style={{ backgroundColor: '#00869d', color: 'white' }} className="h-7 px-2 flex-1">
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 px-2">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow" style={{ backgroundColor: mesa.colorHex || '#888' }} />
                    <span className="font-bold text-sm text-foreground truncate" title={mesa.color}>{mesa.color}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(mesa)}>
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(mesa.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {mesas.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm">
            Non hai mesas físicas creadas. Pulsa "Engadir mesa" para empezar.
          </div>
        )}
      </div>
    </div>
  );
}
