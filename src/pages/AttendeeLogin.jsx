import { useState } from "react";
import { motion } from "framer-motion";
import { base44, auth } from "@/api/base44Client";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { hashPassword, saveAttendeeSession } from "@/lib/attendeeAuth";

export default function AttendeeLogin({ onLogin, redirectLabel = "A miña Axenda" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Por favor, introduce o teu email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") setError("Non atopamos ningunha conta con este email.");
      else setError("Ocorreu un erro ao enviar o correo.");
    }
    setLoading(false);
  };

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

  if (isResetting) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e5f3f5' }}>
            <KeyRound className="w-4 h-4" style={{ color: '#00869d' }} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm leading-tight">Recuperar contrasinal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Enviaremos un enlace ao teu correo</p>
          </div>
        </div>
        {resetSent ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium mb-1">Correo enviado!</p>
            <p className="text-xs text-muted-foreground mb-6">
              Revisa a túa bandexa de entrada e o <strong>cartafol de Spam</strong>. <br/><span className="text-orange-600/90 font-medium">Nota: O correo pode tardar ata 5 minutos en chegar, ten paciencia!</span>
            </p>
            <Button variant="outline" className="w-full text-xs" onClick={() => { setIsResetting(false); setResetSent(false); setError(""); }}>
              Volver ao inicio de sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded-lg border border-orange-200 leading-relaxed mb-4">
              <strong>Nota importante:</strong> O correo pode tardar ata 5 minutos en chegar. Lembra revisar a túa <strong>bandexa de Spam</strong> ou correo non desexado.
            </div>
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teu@email.com" className="mt-1" autoFocus />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full font-semibold" style={{ backgroundColor: '#00869d', color: 'white' }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enviar enlace
            </Button>
            <Button type="button" variant="ghost" className="w-full text-xs gap-1" onClick={() => { setIsResetting(false); setError(""); }}>
              <ArrowLeft className="w-3 h-3" /> Volver atrás
            </Button>
          </form>
        )}
      </motion.div>
    );
  }

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
          <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teu@email.com" className="mt-1" autoComplete="email" autoFocus />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Contrasinal</Label>
            <button type="button" onClick={() => { setIsResetting(true); setError(""); }} className="text-xs hover:underline" style={{ color: '#00869d' }}>
              Esqueciches o contrasinal?
            </button>
          </div>
          <div className="relative mt-1">
            <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="O teu contrasinal" className="pr-10" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
