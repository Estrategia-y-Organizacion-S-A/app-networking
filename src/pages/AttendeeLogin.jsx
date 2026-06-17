import { useState } from "react";
import { motion } from "framer-motion";
import { base44, auth } from "@/api/base44Client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { hashPassword, saveAttendeeSession } from "@/lib/attendeeAuth";

export default function AttendeeLogin({ onLogin, redirectLabel = "A miña Axenda" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Por favor, introduce o teu email e contrasinal.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const uid = userCredential.user.uid;
      const attendee = await base44.entities.Attendee.get(uid);
      if (!attendee) {
        setError("Usuario non atopado na base de datos do evento.");
        setLoading(false);
        return;
      }
      saveAttendeeSession(attendee);
      setLoading(false);
      if (onLogin) onLogin(attendee);
    } catch (err) {
      console.error(err);
      setError("Credenciais incorrectas ou erro de conexión.");
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-6 max-w-sm w-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e5f3f5' }}>
          <LogIn className="w-4 h-4" style={{ color: '#00869d' }} />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm leading-tight">Inicia sesión ou rexístrate</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Para acceder a {redirectLabel}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teu@email.com" className="mt-1" autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="login-password">Contrasinal</Label>
          <Input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="O teu contrasinal" className="mt-1" autoComplete="current-password" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full font-semibold" style={{ backgroundColor: '#00869d', color: 'white' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
          Entrar
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Aínda non estás rexistrado?{" "}
        <Link to="/register" className="underline" style={{ color: '#00869d' }}>Rexístrate aquí</Link>
      </p>
    </motion.div>
  );
}
