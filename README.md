# TOPING · Inspecciones e Informes de Bien Inmueble

Plataforma web (una sola página, **offline-first e instalable**) para la **toma de datos en campo** y la **generación de informes técnicos** de bienes inmuebles en Costa Rica — TOPING · PYME. Carga el documento registral en PDF, autocompleta los datos, verifica dimensiones con coordenadas oficiales y genera el informe listo para **imprimir / exportar a PDF**.

> El informe es un documento con fines informativos no técnicos, para valoraciones a nivel interno del propietario.

---

## Flujo y módulos

1. **Base local (punto de entrada)** — carga de **PDF** y **Excel/CSV**, y organización de los expedientes con filtros por **Provincia, Cantón, Distrito y Trámite** (+ búsqueda). Respaldo/restauración JSON.
2. **Expediente** — formulario unificado con secciones colapsables **A** (datos del trámite), **B** (inmueble) y **C** (ubicación) y una única barra de guardado.
3. **Levantamiento y verificación** (unificado) — captura de **coordenadas oficiales CRTM05 · CR-SIRGAS** (botón GPS con conversión desde WGS84, precisión y hora), y tabla de verificación de dimensiones.
4. **Fotografías** — cámara o archivo, **sin límite**, con fecha/hora; se imprimen a **10 cm × 8 cm**.
5. **Informe** — **vista previa editable**, exportación a **PDF** (imprimir/guardar como PDF), descarga de **HTML editable** y **envío por correo** (a cualquier dirección o rápido a `info@topingcr.com`).
6. **Gestión / Revisión** — trámites retirados de la base activa (color distintivo), con **PDF**, **correo**, reactivación y un **submódulo de Auditoría** que verifica que todo el informe esté completo (errores / advertencias / completitud %).
7. **Perfil** — profesional responsable configurable e **identidad visual** (logos TOPING y PYME, reemplazables). Incluye la **instalación de la app**.
8. **Pruebas** — batería de pruebas integradas.

## Tipos de trámite

Cada tipo usa su **plantilla de informe** y su **conjunto de campos obligatorios**:

- **Puesta en Posesión** — nomenclatura automática **`MUCAP-P.P-FOLIO-AÑO`** (única; el folio debe provenir del documento cargado).
- **Avalúo** — `AVL-AÑO-FOLIO`.
- **Informe de Replanteo** — `REP-AÑO-FOLIO`.
- **Inspección general** — `INSP-AÑO-FOLIO`.

## Extracción automática del PDF

Texto **nativo** (`pdf.js`) con **OCR** de respaldo (`Tesseract.js`, español). Reconoce y vuelca: **matrícula** (folio/finca), **Provincia/Cantón/Distrito**, **propietario**, **identificación**, **plano** y el **ÁREA SEGÚN REGISTRO** (campo “mide”), **convirtiendo el área escrita en letras a valor numérico** (p. ej. “DOSCIENTOS CINCUENTA CON CINCUENTA” → `250.5`). Cada campo autocompletado se marca con su **nivel de confianza**; los no detectados quedan señalados como **“FALTA”** para captura manual. Al editarlos pasan a **manual**.

## Reglas globales

- **MAYÚSCULAS**: todas las respuestas y celdas se guardan y muestran en mayúsculas (la conversión se aplica al guardar; se respetan correos, imágenes y claves internas).
- **Offline**: la app **abre y funciona sin internet** tras la primera carga (service worker cachea el shell y las librerías). **Sin conexión, la toma de coordenadas queda deshabilitada** (requiere internet).
- **Compatibilidad histórica**: los expedientes antiguos siguen funcionando; los campos retirados (Fecha de solicitud, Plano de consulta, Origen del dato, Fecha de consulta registral, Finalidad del levantamiento) se preservan en `_legacy`.

## Instalación (teléfono · tablet · computadora)

Desde **Perfil → Instalar aplicación** o el botón **Instalar** del encabezado:

- **Android/Chrome** y **Windows/macOS (Chrome/Edge)**: botón “Instalar” o menú → “Instalar app”.
- **iPhone/iPad (Safari)**: Compartir ⬆️ → “Agregar a pantalla de inicio”.

Es una PWA con `manifest.webmanifest`, `sw.js` e íconos (`icon-192.png`, `icon-512.png`).

---

## Uso

Sin build. Un único `index.html`.

```bash
python3 -m http.server 8080   # recomendado (habilita PWA/servicio de PDF)
# luego http://localhost:8080
```

> La primera carga necesita internet para descargar y cachear las librerías de PDF/OCR/Excel. Después, la app abre y opera offline (excepto la toma de coordenadas).

## Pruebas

Cubren **extracción parcial, folio duplicado, cambio de estado y generación del informe**, además de extracción/área en letras, nomenclatura, CRTM05, auditoría, mayúsculas y compatibilidad histórica.

```bash
npm test          # runner Node (extrae y evalúa las funciones reales de index.html)
```

También hay pruebas en la app (pestaña **Pruebas**). Verificación adicional en navegador headless (Playwright) confirma que la app abre con el CDN bloqueado (offline), guarda, filtra, cambia estado, audita y genera el informe sin errores de JavaScript.

## Estructura

```
index.html                 · aplicación completa (SPA)
manifest.webmanifest       · PWA (instalable)
sw.js                      · service worker (shell + librerías cacheadas → offline)
icon-192.png / icon-512.png· íconos de instalación
tests/logic.test.js        · pruebas puras (Node, sin dependencias)
.github/workflows/ci.yml   · CI
docs/GUIA.md · assets/ · package.json · LICENSE · README.md
```

## Licencia

MIT — ver [LICENSE](LICENSE).
