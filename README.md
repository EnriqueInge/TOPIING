# Ubicación y Verificación de Bien Inmueble — TOPING · PYME

Aplicación web (una sola página, offline-first) para la **toma de datos en campo** y la **generación del informe técnico de ubicación de bien inmueble** en Costa Rica. Reemplaza el flujo en papel: carga el estudio registral en PDF, autocompleta los datos, verifica dimensiones y genera el informe listo para **imprimir / exportar a PDF** con la identidad visual de TOPING y PYME.

> El informe es un **documento con fines informativos no técnicos**, para valoraciones a nivel interno del propietario.

---

## Características

- **Formulario unificado** (módulos 1‑2‑3 en un solo formulario continuo con secciones colapsables A/B/C y una **única barra de guardado**):
  - **A · Datos generales del trámite**
  - **B · Datos del inmueble**
  - **C · Ubicación y acceso**
- **Carga de PDF + autocompletado**: extracción de **texto nativo** (`pdf.js`) con **OCR de respaldo** (`Tesseract.js`, español) para PDF escaneados.
  - Genera el **número de expediente** a partir del **Folio Finca** (`UBI-<año>-<folio>`).
  - **Anti-duplicados**: si ya existe un expediente con el mismo folio, no crea uno nuevo y ofrece abrir el existente.
  - Marca visualmente cada **campo autocompletado**, muestra el **nivel de confianza** (%) y señala los campos no detectados como *“Falta”* para captura manual. Editar un campo lo pasa a **manual**.
- **Levantamiento y coordenadas** (GNSS/RTK, CRTM05, etc.).
- **Verificación de dimensiones y vía pública** (tabla dinámica; la diferencia se calcula sola).
- **Fotografías** con categoría y descripción (soporta cámara en tablet).
- **Informe técnico** con las 5 secciones del machote + registro fotográfico y firma, con **encabezado profesional en todas las páginas** (logos TOPING/PYME + nombre y registro del profesional). Salida por **impresión/PDF** del navegador.
- **Base local** en `IndexedDB`: lista de expedientes, **importación de Excel/CSV** (un expediente por fila, omite folios duplicados) y **respaldo/restauración JSON**.
- **Perfil profesional configurable**: nombre, registro (por defecto *Ingeniero Enrique Alvarado Martínez — IT-30674*) y **carga de logos** TOPING y PYME (se usan en la interfaz y en el encabezado del informe).
- **Compatibilidad histórica**: los registros antiguos que contengan campos eliminados (Fecha de solicitud, Plano de consulta, Origen del dato, Fecha de consulta registral) se **preservan en `_legacy`** sin mostrarse ni validarse.
- **Pruebas integradas** (pestaña *Pruebas*) y **CI** en Node (ver abajo).

---

## Uso rápido

No requiere build. Es un único `index.html`.

```bash
# Opción 1: abrir directamente
xdg-open index.html            # Linux
open index.html                # macOS

# Opción 2: servidor local (recomendado para OCR/servicio de PDF y el service worker)
python3 -m http.server 8080
# luego visita http://localhost:8080
```

> La carga de PDF y el OCR usan librerías desde CDN (`cdnjs`), por lo que requieren conexión la primera vez. El resto de la app (captura, guardado, informe) funciona **sin conexión** una vez cargada.

### Reemplazar los logos

Ve a **Perfil → Logos** y sube los archivos oficiales de TOPING y PYME (PNG/SVG de alta resolución). Se guardan en el dispositivo y se aplican a la interfaz y a los informes. Los logos por defecto son provisionales.

---

## Campos eliminados (con compatibilidad)

Se retiraron de la interfaz, validaciones y payload: **Fecha de solicitud**, **Plano de consulta**, **Origen del dato** y **Fecha de consulta registral**. Al cargar un expediente histórico que los contenga, se conservan en el objeto `_legacy` para no perder información.

---

## Pruebas

Las pruebas cubren: **extracción exitosa**, **extracción parcial**, **folio duplicado**, **generación del informe** y **compatibilidad histórica**. Se ejecutan de dos formas:

1. **En la app**: pestaña *Pruebas* → *Ejecutar pruebas*.
2. **En línea de comandos / CI** (Node ≥ 18, sin dependencias):

```bash
npm test
```

El runner extrae las funciones puras directamente desde `index.html` y las valida, de modo que las pruebas corren contra el código real de la aplicación.

---

## Estructura

```
.
├── index.html                # Aplicación completa (SPA)
├── manifest.webmanifest      # PWA
├── sw.js                     # Service worker (shell offline)
├── tests/
│   └── logic.test.js         # Pruebas puras (Node, sin dependencias)
├── .github/workflows/ci.yml  # CI: ejecuta las pruebas en cada push/PR
├── docs/
│   └── GUIA.md               # Guía de uso en campo
├── assets/                   # (logos oficiales — reemplazar provisionales)
├── package.json
├── LICENSE
└── README.md
```

## Licencia

MIT — ver [LICENSE](LICENSE).
