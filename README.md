# Santa Cruz Vive Digital

Prototipo web interactivo y modular para la **Comuna 2 Santa Cruz (Medellín)**, desarrollado con **Vanilla JavaScript (ES modules)**, **Vite 6** y **Leaflet**.

Este proyecto transforma la visión comunitaria en una aplicación web moderna, con autenticación segura en cliente, mapas interactivos de la comuna, gestión de eventos barriales y retos de innovación abierta.

---

## Características principales

- **Tres tipos de usuarios y roles protegidos:**
  - **Persona / Consumidor:** Explora recomendaciones personalizadas ("Para ti"), participa en eventos, consulta el mapa y colabora en retos barriales.
  - **Organización / Gestor:** Se registra con datos institucionales, crea y gestiona eventos comunitarios propios (sujeto a moderación) y propone retos.
  - **Administrador:** Gestiona la moderación de eventos y proyectos pendientes, visualiza el panel de impacto global y audita el registro de actividad del sistema.
- **Seguridad en el cliente:**
  - Autenticación con contraseñas cifradas mediante **PBKDF2-SHA256** (150,000 iteraciones) y sal aleatoria.
  - Bloqueo temporal por 60 segundos tras 5 intentos fallidos de inicio de sesión.
  - Sesiones de usuario persistentes (7 días) y de administrador efímeras (memoria, expiración por inactividad a los 15 minutos).
  - Pistas de auditoría locales y validación estricta de entradas (saneamiento de perfiles, eventos y equipos).
- **Mapa interactivo:**
  - Implementado con **Leaflet** y teselas raster de OpenStreetMap (con soporte de geolocalización restringida a la comuna y cálculo de rutas a pie mediante `routing.openstreetmap.de`).
- **Interfaz moderna y accesible:**
  - Diseño responsivo (adaptado para móviles con barra de navegación inferior y escritorio).
  - Textos e interfaz completamente en español, con formato de moneda en COP (`es-CO`).
  - Cabecera con Content-Security-Policy (CSP) estricta.

---

## Stack tecnológico

- **Frontend:** Vanilla JavaScript (ESM), HTML5, CSS3 (variables globales y diseño modular).
- **Herramientas de desarrollo y empaquetado:** Vite 6.
- **Mapas:** Leaflet.
- **Pruebas y verificación:** Puppeteer (automatización de flujos E2E).

---

## Guía rápida de desarrollo

### Requisitos previos
- Node.js (versión 18 o superior recomendada).
- En Windows (PowerShell), utilizar preferiblemente `npm.cmd` debido a las políticas de ejecución de scripts.

### 1. Instalación de dependencias
```powershell
npm.cmd install
```

### 2. Configuración del Administrador
Para inicializar las credenciales del administrador, genera el archivo de entorno local `.env.local` ejecutando:
```powershell
npm.cmd run admin:hash -- --email admin@santacruz.local --write
```
*(Esto imprimirá una contraseña aleatoria y configurará el hash seguro de forma local)*.

### 3. Ejecutar el servidor de desarrollo
```powershell
npm.cmd run dev
```
Abre tu navegador en `http://localhost:5173`.

### 4. Compilación para producción
Para generar los archivos optimizados en la carpeta `dist/`:
```powershell
npm.cmd run build
```

---

## Arquitectura del proyecto

- `src/main.js`: Punto de entrada que importa estilos globales y monta la aplicación.
- `src/app/`: Enrutador basado en hash (`router.js`) con guardias de acceso por rol y contenedor principal (`App.js`).
- `src/features/`: Módulos independientes por pantalla (`bienvenida`, `acceso`, `inicio`, `mapa`, `eventos`, `retos`, `perfil`, `gestion`, `admin`, `impacto`, `explorar`).
- `src/state/`: Tiendas de estado reactivas para la sesión (`appStore.js`), cuentas (`accountsStore.js`) y contenidos comunitarios (`contentStore.js`).
- `src/services/`: Capas de autenticación (`auth.js`), auditoría (`audit.js`), validación (`validation.js`), eventos y geolocalización.

---

## Licencia

Proyecto desarrollado bajo los términos de la comunidad de la Comuna 2 Santa Cruz. Uso libre para fines educativos y comunitarios.
