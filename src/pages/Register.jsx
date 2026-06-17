import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44, auth } from "@/api/base44Client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { SECTORES, INTERESES } from "@/lib/eventUtils";
import { hashPassword, saveAttendeeSession } from "@/lib/attendeeAuth";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    nombre: "", apellidos: "", email: "", empresa: "", whatsapp: "", password: "",
    sector: "", intereses: [], queBusca: "", queOfrece: "",
    perfilPublico: true, aceptoPolitica: false, asistira: true,
    webUrl: "",
    botCheck: "",
    sectorOtro: "",
  });

  const [eventConfig, setEventConfig] = useState(null);
  const [isFull, setIsFull] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mathQuestion, setMathQuestion] = useState({ a: 3, b: 4 });

  useEffect(() => {
    const init = async () => {
      try {
        const configData = await base44.entities.EventConfig.list();
        const conf = configData?.[0] || null;
        setEventConfig(conf);

        // O reconto de asistentes por "maxAttendees" xa non se fai aquí por motivos de seguridade,
        // xa que os usuarios anónimos non teñen permiso para descargar a lista de asistentes.
        // Usarase o peche manual "registroCerrado" dende o panel de admin.
        if (conf && conf.registroCerrado) {
          setIsClosed(true);
        }
        
        // Randomize math question
        setMathQuestion({
          a: Math.floor(Math.random() * 5) + 1,
          b: Math.floor(Math.random() * 5) + 1
        });
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    };
    init();
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

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!form.nombre || !form.apellidos || !form.email || !form.empresa || !form.password) {
        setError("Por favor, completa todos os campos obrigatorios."); return;
      }
      if (form.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
        setError("O contrasinal debe ter polo menos 8 caracteres, unha maiúscula, unha minúscula e un número."); return;
      }
    } else if (step === 2) {
      if (!form.sector) { setError("Por favor, selecciona o teu sector."); return; }
      if (form.sector === "Outros" && !form.sectorOtro.trim()) { setError("Por favor, especifica o teu sector."); return; }

      if (!form.queOfrece) {
        setError("Por favor, indica que ofreces no evento.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.aceptoPolitica) {
      setError("Debes aceptar a política de privacidade para rexistrarte.");
      return;
    }
    if (parseInt(form.botCheck) !== mathQuestion.a + mathQuestion.b) {
      setError("Por favor, resolve a suma de seguridade correctamente para demostrar que es humano.");
      return;
    }
    setLoading(true);

    try {
      // Firebase Auth comprobará automaticamente se o email xa existe.
      const userCredential = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      const uid = userCredential.user.uid;

      const attendeeData = {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim().toLowerCase(),
        empresa: form.empresa.trim(),
        whatsapp: form.whatsapp.trim(),
        sector: form.sector === "Outros" ? form.sectorOtro.trim() : form.sector,
        intereses: form.intereses,
        queBusca: form.queBusca.trim(),
        queOfrece: form.queOfrece.trim(),
        perfilPublico: form.perfilPublico,
        asistira: form.asistira,
        webUrl: form.webUrl.trim(),
      };

      const newAttendee = await base44.entities.Attendee.set(uid, attendeeData);
      saveAttendeeSession(newAttendee);

      setSuccess(true);
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError("Este email xa está rexistrado. Inicia sesión no canto de crear unha nova conta.");
      } else {
        setError("Ocorreu un erro ao rexistrarte. Inténtao de novo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle className="w-20 h-20 mx-auto mb-6" style={{ color: '#00869d' }} />
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Rexistro completado!</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Rexistráchete correctamente na Xornada de Networking Galicia Suroeste.
            </p>
            <div className="space-y-3">
              <Button size="lg" className="w-full font-semibold" style={{ backgroundColor: '#00869d', color: 'white' }} onClick={() => navigate("/mi-agenda")}>
                Ir á miña axenda
              </Button>
              <Button size="lg" variant="outline" className="w-full font-semibold" onClick={() => navigate("/networking")}>
                Explorar asistentes
              </Button>
            </div>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">Rexistro de Asistente</h1>
          <p className="text-muted-foreground">Completa o teu perfil para participar no networking.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          {checking ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#00869d] mb-4" />
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : isClosed ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <EyeOff className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Rexistros Pechados</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">O período de inscrición para o evento está pechado nestes momentos.</p>
              <Link to="/login">
                <Button variant="outline">Acceder ao meu perfil</Button>
              </Link>
            </div>
          ) : isFull ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Aforo Completo</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Lamentámolo, pero o aforo do evento xa está completo. Non se admiten máis rexistros.</p>
              <Button variant="outline" className="mt-8" onClick={() => navigate("/")}>Volver á páxina de inicio</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= i ? 'bg-[#00869d]' : 'bg-muted'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Datos persoais</h2>
                  <p className="text-sm text-muted-foreground mb-5">Información básica para a túa acreditación.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome <span className="text-destructive">*</span></Label>
                    <Input value={form.nombre} onChange={e => updateForm("nombre", e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Apelidos <span className="text-destructive">*</span></Label>
                    <Input value={form.apellidos} onChange={e => updateForm("apellidos", e.target.value)} className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="teu@email.com" className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1.5">Usarase para acceder á plataforma.</p>
                </div>
                <div className="relative">
                  <Label>Contrasinal <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => updateForm("password", e.target.value)} placeholder="Mín. 8 caracteres, 1 maiúscula, 1 minúscula e 1 número" className="mt-1.5 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Empresa <span className="text-destructive">*</span></Label>
                    <Input value={form.empresa} onChange={e => updateForm("empresa", e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input type="tel" value={form.whatsapp} onChange={e => updateForm("whatsapp", e.target.value)} placeholder="+34 600 000 000" className="mt-1.5" />
                  </div>
                </div>
                {(!eventConfig || eventConfig.allowNonAttending !== false) && (
                  <div className="rounded-xl border border-border p-4 bg-muted/20 mt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox id="asistira" checked={form.asistira} onCheckedChange={v => updateForm("asistira", v)} className="mt-1" />
                      <div>
                        <Label htmlFor="asistira" className="text-sm font-semibold cursor-pointer">Asistirei presencialmente ao evento</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Se o desmarcas, rexistraraste só para ver o directorio de profesionais, pero non poderás reservar reunións nin ter unha axenda propia.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Perfil profesional</h2>
                  <p className="text-sm text-muted-foreground mb-5">Axuda a outros asistentes a atoparte.</p>
                </div>
                <div>
                  <Label>Sector da túa empresa <span className="text-destructive">*</span></Label>
                  <Select value={form.sector} onValueChange={v => updateForm("sector", v)}>
                    <SelectTrigger className="mt-1.5">
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
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Privacidade e Termos</h2>
                  <p className="text-sm text-muted-foreground mb-5">Configura como interactúas coa plataforma.</p>
                </div>

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
                </div>

                <div className="flex items-start gap-3 mt-6">
                  <Checkbox id="aceptoPolitica" checked={form.aceptoPolitica} onCheckedChange={v => updateForm("aceptoPolitica", v)} className="mt-1" />
                  <Label htmlFor="aceptoPolitica" className="text-sm cursor-pointer leading-normal">
                    Lin e acepto a <a href="https://galiciasuroeste.gal/avisos-legais#privacidade" target="_blank" rel="noopener noreferrer" className="underline text-foreground hover:text-[#00869d]">política de privacidade</a> e autorizo o tratamento dos meus datos para a xestión do evento e o directorio de networking. <span className="text-destructive">*</span>
                  </Label>
                </div>

                <div className="mt-6">
                  <Label>Demostra que es humano <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-bold text-lg">{mathQuestion.a} + {mathQuestion.b} =</span>
                    <Input type="number" value={form.botCheck} onChange={e => updateForm("botCheck", e.target.value)} placeholder="?" className="w-24 text-center text-lg" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1 || loading}
            >
              Volver
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} style={{ backgroundColor: '#00869d', color: 'white' }} className="px-8">
                Seguinte
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} style={{ backgroundColor: '#00869d', color: 'white' }} className="px-8 gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Finalizar rexistro
              </Button>
            )}
          </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Xa tes conta? <Link to="/login" className="font-medium underline" style={{ color: '#00869d' }}>Inicia sesión</Link>
        </p>
      </div>
    </PageLayout>
  );
}
