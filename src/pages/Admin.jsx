import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { auth, base44 } from "@/api/base44Client";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, LogOut, Users, Settings, TableProperties } from "lucide-react";
import { validateAdminLogin, logoutAdmin, ADMIN_EMAIL, SECTORES } from "@/lib/eventUtils";
import MesasTab from "@/components/admin/MesasTab";
import MonitorMesasTab from "@/components/admin/MonitorMesasTab";
import ConfigTab from "@/components/admin/ConfigTab";
import AsistentesTab from "@/components/admin/AsistentesTab";

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [eventConfig, setEventConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingList, setPendingList] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setLoggedIn(true);
        localStorage.setItem("admin_logged_in", "true");
      } else {
        setLoggedIn(false);
        localStorage.removeItem("admin_logged_in");
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadAll();
  }, [loggedIn]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadAttendees(), loadMesas(), loadConfig()]);
    setLoading(false);
  };
  const loadAttendees = async () => { const d = await base44.entities.Attendee.list(); setAttendees(d || []); };
  const loadMesas = async () => { 
    const d = await base44.entities.Mesa.list(); 
    const sorted = (d || []).sort((a, b) => a.color.localeCompare(b.color, undefined, { numeric: true, sensitivity: 'base' }));
    setMesas(sorted); 
  };
  const loadConfig = async () => {
    const d = await base44.entities.EventConfig.list();
    setEventConfig(d?.[0] || null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const isValid = await validateAdminLogin(loginForm.email, loginForm.password);
    if (!isValid) { setLoginError("Credenciais incorrectas."); }
    setLoginLoading(false);
  };
  const handleLogout = async () => { await logoutAdmin(); setLoggedIn(false); };

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const slots = await base44.entities.MeetingSlot.list();
      const atts = await base44.entities.Attendee.list();
      
      const pendingHosts = new Set();
      const details = {};
      
      slots.forEach(slot => {
        if (slot.estado === "disponible" && Array.isArray(slot.solicitantes)) {
          const pendingCount = slot.solicitantes.filter(r => r.estado === "pendiente").length;
          if (pendingCount > 0) {
            pendingHosts.add(slot.hostId);
            details[slot.hostId] = (details[slot.hostId] || 0) + pendingCount;
          }
        }
      });
      
      const list = Array.from(pendingHosts).map(id => {
        const att = atts.find(a => String(a.id) === String(id));
        if (!att) return `Usuario borrado (ID ${id}) - ${details[id]} peticiones`;
        return `${att.nombre} ${att.apellidos} (${att.email}) - Empresa: ${att.empresa} - ${details[id]} petición(es) pendiente(s)`;
      });
      
      setPendingList(list);
    } catch (e) {
      alert("Error leyendo la base de datos: " + e.message);
    }
    setLoading(false);
  };

  if (!authChecked) return <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="bg-white rounded-xl border border-border shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#00869d' }}><Settings className="w-6 h-6 text-white" /></div>
              <h1 className="text-xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground mt-1">Galicia Suroeste</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label>Email</Label><Input type="email" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} placeholder="admin@gmail.com" className="mt-1" /></div>
              <div><Label>Contrasinal</Label><Input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="mt-1" /></div>
              {loginError && (<div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"><AlertCircle className="w-4 h-4" /> {loginError}</div>)}
              <Button type="submit" disabled={loginLoading} className="w-full" style={{ backgroundColor: '#00869d', color: 'white' }}>{loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Acceder</Button>
            </form>
            <div className="mt-6 pt-6 border-t border-border text-center">
              <Link to="/">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                  Volver ao inicio da web
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: '#00869d' }}><Settings className="w-4 h-4 text-white" /></div><span className="font-semibold text-sm text-foreground">Admin · Galicia Suroeste</span></div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchPendingUsers} disabled={loading} style={{ borderColor: 'orange', color: 'orange' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Revisar Usuarios Pendientes
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-muted-foreground"><LogOut className="w-4 h-4" /> Saír</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {pendingList && (
          <div className="bg-white border border-border shadow-sm rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Resultado del Informe:</h3>
            {pendingList.length === 0 ? (
              <p className="text-sm text-orange-900">No hay ningún usuario con solicitudes pendientes. ¡Todo al día!</p>
            ) : (
              <ul className="list-disc pl-5 space-y-2 text-sm text-foreground font-medium">
                {pendingList.map((str, idx) => <li key={idx}>{str}</li>)}
              </ul>
            )}
            <Button onClick={() => setPendingList(null)} variant="outline" className="mt-4">Cerrar informe</Button>
          </div>
        )}
        {loading ? (<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>) : (
          <Tabs defaultValue="asistentes">
            <TabsList className="mb-6 bg-white border border-border flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="asistentes" className="gap-1 data-[state=active]:text-primary"><Users className="w-4 h-4" /> Asistentes<Badge className="ml-1 text-xs" style={{ backgroundColor: '#00869d', color: 'white' }}>{attendees.length}</Badge></TabsTrigger>
              <TabsTrigger value="reuniones" className="gap-1"><TableProperties className="w-4 h-4" /> Xestión Mesas<Badge className="ml-1 text-xs" variant="outline">{mesas.length}</Badge></TabsTrigger>
              <TabsTrigger value="monitor" className="gap-1" style={{ color: '#00869d' }}><TableProperties className="w-4 h-4" /> Monitor en vivo</TabsTrigger>
              <TabsTrigger value="config" className="gap-1"><Settings className="w-4 h-4" /> Configuración</TabsTrigger>
            </TabsList>
            <TabsContent value="asistentes">
              <AsistentesTab attendees={attendees} onReload={loadAttendees} />
            </TabsContent>
            <TabsContent value="reuniones"><MesasTab mesas={mesas} attendees={attendees} onReload={loadMesas} /></TabsContent>
            <TabsContent value="monitor"><MonitorMesasTab mesas={mesas} /></TabsContent>
            <TabsContent value="config">
              <ConfigTab 
                eventConfig={eventConfig} 
                onReload={loadAll} 
                attendees={attendees} 
                mesas={mesas} 
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
