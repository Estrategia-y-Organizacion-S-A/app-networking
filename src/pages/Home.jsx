import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Calendar, Users, ArrowRight, CheckCircle, MapPin, Clock, Briefcase, Handshake, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } })
};

export default function Home() {
  return (
    <PageLayout>
      {/* HERO SECTION */}
      <section className="relative bg-[#F8FAFC] overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-bl from-[#00869d]/10 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00869d] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="absolute top-20 left-10 w-24 h-24 dots-pattern opacity-10 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full relative z-10 py-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
              
              <motion.h1 variants={fadeUp} custom={1} className="text-5xl sm:text-6xl lg:text-[4.25rem] font-display font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Conecta cos <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00869d] to-[#005c6c]">profesionais</span> <br/>
                do teu sector.
              </motion.h1>
              
              <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                Rexístrate, descobre quen asiste ao evento e reserva reunións exclusivas 1:1. Networking estruturado para xerar verdadeiras oportunidades de negocio.
              </motion.p>
              
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base shadow-lg shadow-[#00869d]/20 hover:shadow-[#00869d]/40 transition-all hover:-translate-y-1" style={{ backgroundColor: '#00869d', color: 'white' }}>
                    Rexistrarme no evento <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/mi-agenda">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50 transition-all hover:-translate-y-1">
                    Ver a miña axenda
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Right Abstract Visual */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#e5f3f5] to-transparent rounded-3xl transform rotate-3 scale-105" />
              <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col gap-5 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                
                {/* Visual Fake Cards */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-[#00869d]/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-[#00869d]" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-slate-200 rounded mb-2" />
                    <div className="h-2 w-32 bg-slate-100 rounded" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#00869d] text-white shadow-xl shadow-[#00869d]/20 transform -translate-x-6 hover:-translate-x-4 transition-transform">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 w-28 bg-white/70 rounded mb-2" />
                    <div className="h-2 w-20 bg-white/40 rounded" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-semibold backdrop-blur-sm">
                    Reunión 1:1
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-28 bg-slate-200 rounded mb-2" />
                    <div className="h-2 w-16 bg-slate-100 rounded" />
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FLOATING STATS BANNER */}
      <section className="relative z-20 -mt-20 mb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {[
              { icon: Calendar, label: "Data", value: "26 de xuño, 2026", desc: "Inicio do evento: 19:30 horas" },
              { icon: MapPin, label: "Lugar", value: "Altos de Torona", desc: "Tomiño, Pontevedra", link: "https://maps.google.com/?q=Viñedos+Altos+de+Torona,+Tomiño,+Pontevedra" },
              { icon: Clock, label: "Formato", value: "Reunións 1:1", desc: "Reunións de 15 min." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 pt-6 md:pt-0 md:px-6 first:pt-0 first:pl-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#e5f3f5] shrink-0">
                  <item.icon className="w-6 h-6 text-[#00869d]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-slate-900 hover:text-[#00869d] transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-xl font-bold text-slate-900">{item.value}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#00869d] mb-3">O Proceso</h2>
            <h3 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6 leading-tight">Networking áxil<br/>e directo</h3>
            <p className="text-lg text-slate-600">Un fluxo de reservas intelixente deseñado para optimizar o teu tempo e conectar só con perfís relevantes para o teu negocio.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: UserPlus, step: "01", title: "Configura a túa dispoñibilidade", desc: "Crea o teu perfil e selecciona os bloques de 15 minutos nos que estarás dispoñible para reunirte." },
              { icon: Users, step: "02", title: "Explora e solicita", desc: "Revisa o directorio de asistentes, filtra por sector ou intereses e envía solicitudes de reunión ao instante." },
              { icon: Handshake, step: "03", title: "Conecta na mesa", desc: "Ao aceptar unha petición, asígnase unha mesa automaticamente. Só queda acudir no horario fixado." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true, margin: "-100px" }} 
                transition={{ delay: i * 0.15, duration: 0.6 }} 
                className="group relative bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-[#00869d]/30 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -top-8 right-2 text-[8rem] font-black text-slate-50 group-hover:text-[#e5f3f5] transition-colors duration-500 pointer-events-none select-none">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 group-hover:bg-[#00869d] transition-colors duration-500 mb-8 shadow-sm">
                    <item.icon className="w-7 h-7 text-[#00869d] group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-base">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY SECTION */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="absolute -left-40 top-10 w-96 h-96 bg-white rounded-full blur-3xl opacity-50" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-white rounded-[2.5rem] p-8 md:p-14 border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="w-20 h-20 rounded-3xl bg-[#e5f3f5] flex items-center justify-center shrink-0 border border-[#00869d]/10">
                <CheckCircle className="w-10 h-10 text-[#00869d]" />
              </div>
              <div>
                <h3 className="text-3xl font-display font-bold text-slate-900 mb-6">Privacidade e Control Total</h3>
                <ul className="space-y-5">
                  {[
                    "Decide en todo momento se o teu perfil é público e visible no directorio de asistentes.",
                    "Controla que datos de contacto (email, WhatsApp) compartes cos demais.",
                    "O directorio só será accesible para asistentes verificados os días previos ao evento.",
                    "Recibirás avisos de novas peticións por correo electrónico sen revelar o teu email."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-2 w-2 h-2 rounded-full bg-[#00869d] shrink-0" />
                      <span className="text-slate-600 leading-relaxed text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00869d] to-[#005c6c]" />
        
        {/* Elegant geometric overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon fill="white" points="0,100 100,0 100,100" />
          </svg>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 tracking-tight">Impulsa a túa rede<br/>de contactos</h2>
            <p className="text-white/90 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              O espazo perfecto para descubrir sinerxías, atopar provedores e pechar acordos comerciais con profesionais do teu ámbito.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-16 px-12 text-lg font-bold bg-white text-[#00869d] hover:bg-slate-50 hover:scale-105 transition-transform shadow-2xl rounded-full">
                Rexistrarme agora <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
