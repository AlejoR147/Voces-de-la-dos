# Diseño de páginas web

Guía para diseñar o mejorar pantallas y componentes de este proyecto (Vanilla JS + Vite + Leaflet, copy en español, Comuna 2 Santa Cruz, Medellín).

## Proceso

1. Leer `src/styles/base/variables.css` y los componentes existentes en `src/styles/components/` antes de escribir CSS nuevo.
2. Definir objetivo de la pantalla, usuario principal (consumidor, gestor, admin) y acción principal (un solo CTA dominante).
3. Reutilizar `src/shared/components/*` (`activityCard`, `eventCard`, `enrollButton`, `chipGroup`, `formModal`) antes de crear marcado nuevo.
4. Diseñar primero para móvil (barra de navegación inferior), luego escritorio (nav en el header).
5. Verificar con `npm.cmd run build` y revisar visualmente con `npm.cmd run dev`.

## Reglas del proyecto

- Colores, radios, sombras y alturas salen de variables CSS (`--purple`, `--bg`, `--card`, `--ink`, `--muted`, `--line`, `--radius*`, `--shadow*`, `--header-height`, `--nav-height`). No hardcodear hex nuevos; si falta un token, agregarlo en `variables.css`.
- Estilos reutilizables en `src/styles/components/` (importados en `styles/main.css`). Estilos propios de una pantalla en su carpeta `src/features/<id>/<id>.css`.
- Sin `onclick` ni `style` inline para estilos estáticos; usar clases y `delegate`. `style` solo para posiciones o colores dependientes de datos.
- Texto del usuario en `innerHTML` solo con `escapeHtml`.
- No poner `backdrop-filter` ni `transform` en ancestros de elementos `position: fixed`.
- Iconos desde `src/shared/icons.js`.
- Precios en COP con `es-CO`. Todo el copy en español.

## Principios de diseño

**Jerarquía**: un título claro por pantalla, secciones con espaciado consistente, un CTA primario por vista (botón relleno) y secundarios con borde o texto.

**Espaciado**: escala de 4/8 px (4, 8, 12, 16, 24, 32, 48). Más aire entre secciones que dentro de ellas.

**Tipografía**: máximo 2 familias. Escala sugerida: 12 / 14 / 16 / 20 / 24 / 32. Cuerpo mínimo 14 px (16 px en inputs móviles para evitar zoom). Interlineado 1.4–1.6 en texto corrido, 1.2 en títulos. Longitud de línea de 45–75 caracteres.

**Color**: base neutra (`--bg`, `--card`), morado como acento de marca, `--orange` para llamadas de atención, `--green`/`--red` para estados. Variantes `-soft` para fondos de badges y chips. No transmitir información solo con color.

**Superficies**: tarjetas blancas sobre `--bg`, borde `--line` o `--shadow-sm`; sombras fuertes solo en modales y elementos flotantes.

**Movimiento**: transiciones de 150–250 ms en `opacity`/`transform`, sin animar `width`/`height`. Respetar `prefers-reduced-motion`.

## Layout y responsive

- Contenedor centrado con ancho máximo (~1100–1200 px) y padding lateral 16 px móvil / 24+ px escritorio.
- Usar CSS Grid para tarjetas (`repeat(auto-fill, minmax(260px, 1fr))`) y Flexbox para alineación interna.
- Puntos de quiebre orientativos: 640 px, 900 px, 1200 px. Escribir CSS móvil por defecto y ampliar con `min-width`.
- En móvil dejar espacio inferior igual a `--nav-height` (más `env(safe-area-inset-bottom)`) para no tapar contenido con la barra inferior.
- Objetivos táctiles de al menos 44×44 px.
- Imágenes y mapas con tamaño reservado (`aspect-ratio` o altura fija) para evitar saltos de layout.

## Accesibilidad

- Contraste mínimo 4.5:1 para texto normal y 3:1 para texto grande e iconos.
- HTML semántico: `header`, `nav`, `main`, `section`, `button` para acciones y `a` para navegación. Un solo `h1` visible por pantalla.
- Todo control interactivo con foco visible (`:focus-visible`) y operable con teclado.
- `label` asociado a cada input; mensajes de error junto al campo y con texto.
- `aria-label` en botones solo con icono; `alt` descriptivo en imágenes informativas.
- Modales: foco atrapado, cierre con Escape, `role="dialog"` y `aria-modal`.

## Estados que toda pantalla debe cubrir

Vacío (mensaje + acción sugerida), cargando, error (con reintento), éxito (toast) y deshabilitado.

## Checklist final

- [ ] Usa tokens de `variables.css` y componentes compartidos.
- [ ] Se ve bien a 360 px, 768 px y 1280 px.
- [ ] Sin desbordamiento horizontal.
- [ ] Contraste, foco y teclado verificados.
- [ ] Copy en español, sin texto sin escapar.
- [ ] `npm.cmd run build` pasa.
