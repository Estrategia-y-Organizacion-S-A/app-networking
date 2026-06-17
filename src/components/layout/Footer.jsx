export default function Footer() {
  return (
    <footer className="bg-white border-t border-border py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-center mb-8">
          <img src="/tira-de-logos.png" alt="Logos institucionais" className="h-auto w-full max-w-4xl object-contain opacity-90 hover:opacity-100 transition-opacity mix-blend-multiply" style={{ imageRendering: '-webkit-optimize-contrast' }} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          <div className="text-sm text-muted-foreground text-left">
            <p className="font-semibold text-foreground mb-1">Networking Galicia Suroeste</p>
            <p>© {new Date().getFullYear()} Todos os dereitos reservados.</p>
          </div>
          <div className="text-sm text-muted-foreground text-left md:text-right">
            <p className="font-semibold text-foreground mb-1">Contacto</p>
            <p><a href="mailto:info@eurural.gal" className="hover:text-[#00869d] transition-colors">info@eurural.gal</a></p>
            <p><a href="tel:+34986443030" className="hover:text-[#00869d] transition-colors">+34 986 443 030</a></p>
            <p className="mt-1">Avenida Peinador, 39, 1º andar<br />36416 Mos, Pontevedra</p>
          </div>
        </div>
        <div className="pt-6 border-t border-border flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
          <a href="https://galiciasuroeste.gal/avisos-legais" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#00869d] transition-colors">Aviso Legal</a>
          <a href="https://galiciasuroeste.gal/avisos-legais#privacidade" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#00869d] transition-colors">Política de Privacidade</a>
          <a href="https://galiciasuroeste.gal/avisos-legais#cookies" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#00869d] transition-colors">Política de Cookies</a>
        </div>
      </div>
    </footer>
  );
}
