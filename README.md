# Networking Galicia Suroeste - 2026

# Networking Galicia Suroeste

Unha plataforma web desenvolvida para xestionar o evento de networking "Galicia Suroeste - 2026". Esta aplicación permite aos asistentes rexistrarse, crear un perfil profesional, consultar o directorio doutros profesionais e xestionar reunións 1:1 de xeito eficiente.

## 🚀 Características Principais

- **Directorio de Asistentes**: Visualización e filtrado por sector e intereses de todos os profesionais inscritos no evento.
- **Axenda Intelixente**: Sistema automatizado de reservas onde todos os usuarios dispoñen de 4 franxas horarias fixas (20:30h a 21:30h).
- **Protección contra Dobre-Booking**: Validacións en tempo real que evitan solapamentos de reunións entre os asistentes.
- **Panel de Administración**: Zona restrinxida para os organizadores dende onde poden:
  - Activar ou desactivar o evento e o módulo de networking.
  - Xestionar a lista de asistentes, descargar datos en formato CSV e definir un límite máximo de inscritos.
  - Xestionar as mesas dispoñibles para as reunións.
- **Seguridade e Privacidade**: Asistentes poden decidir se fan públicos ou non os seus datos de contacto (email e teléfono), protección contra bots (honeypot) e validación de contrasinais fortes.

## 🛠️ Tecnoloxías Empregadas

Este proxecto foi construído baixo un ecosistema moderno e lixeiro:
- **[React](https://reactjs.org/)** (con **[Vite](https://vitejs.dev/)**): Biblioteca principal para a construción de interfaces de usuario.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework utilitario para un deseño rápido, consistente e responsive. Tipografía principal: **Albert Sans**.
- **[shadcn/ui](https://ui.shadcn.com/)**: Compoñentes de interface accesibles e personalizables (Radix UI).
- **Lucide React**: Biblioteca de iconas lixeiras e consistentes.
- **Base44**: Cliente de base de datos personalizado e xestor de entidades do backend.

## 📦 Instalación e Execución (Desenvolvemento)

1. **Clonar ou descargar o repositorio.**
2. **Instalar dependencias:**
   No directorio raíz do proxecto, abre a terminal e executa:
   ```bash
   npm install
   ```
3. **Iniciar o servidor de desenvolvemento:**
   ```bash
   npm run dev
   ```
   A aplicación estará dispoñible en `http://localhost:5173`.

## 🏗️ Compilación (Produción)

Para xerar a versión optimizada para produción, executa:
```bash
npm run build
```
Isto xerará un cartafol `dist` cos ficheiros listos para ser despregados en calquera servidor web estático.

## 📂 Estrutura do Proxecto (Resumo)

- `src/components/`: Compoñentes reutilizables de UI (botóns, modais, tarxetas) e layouts.
- `src/pages/`: Vistas principais da aplicación (Rexistro, Directorio de Networking, A miña Axenda, Panel de Admin, etc.).
- `src/lib/`: Funcións utilitarias, lóxica de autenticación e xestión de validacións da axenda (`eventUtils.js`).
- `src/api/`: Cliente de conexión coa base de datos (`base44Client.js`).

## 💡 Notas Adicionais
O proxecto sufriu unha evolución cara a automatización total da xestión de ocos das reunións. Actualmente, os usuarios non necesitan "publicar" o seu tempo dispoñible de forma manual; o sistema calcúlao automaticamente a partir das reunións xa confirmadas.

© 2026 Lara Loveira Nores. Todos los derechos reservados. Queda prohibida la reproducción, distribución o uso de este proyecto sin autorización expresa del autor.