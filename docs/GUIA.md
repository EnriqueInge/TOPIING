# Guía de uso en campo

## 1. Nuevo expediente desde un PDF registral
1. Abre la app y ve a **Expediente y datos**.
2. En **Carga de documento (PDF registral)** arrastra o selecciona el estudio de finca (Folio Real).
3. El sistema:
   - detecta el **Folio Finca** y genera el **número de expediente** (`UBI-<año>-<folio>`);
   - autocompleta los campos de las secciones A, B y C;
   - marca en **ámbar** los campos autocompletados con su **% de confianza**;
   - marca en **rojo (“Falta”)** los campos obligatorios que no detectó.
4. Si el folio ya existe en la base local, **no** crea uno nuevo y ofrece **abrir el existente**.
5. Revisa, corrige lo necesario (al editar, el campo pasa a **manual**) y pulsa **Guardar expediente**.

## 2. Captura manual
Si no hay PDF, completa las secciones colapsables **A · Datos generales**, **B · Datos del inmueble** y **C · Ubicación y acceso**. La barra inferior es la **única barra de guardado**; el botón **Validar** resalta los campos obligatorios pendientes (indicador por sección).

## 3. Levantamiento y verificación
- **Levantamiento**: método (GNSS/RTK…), coordenadas Este/Norte, sistema (CRTM05).
- **Verificación**: agrega filas de elementos (linderos, referencias, ancho de calle). La **diferencia** se calcula sola (en sitio − plano).

## 4. Fotografías
En **Fotografías** agrega imágenes (en tablet abre la cámara). Cada foto admite **categoría** y **descripción**; aparecen en el informe.

## 5. Informe
En **Informe** genera la **vista previa** y usa **Imprimir / PDF**. El encabezado con **logos TOPING/PYME** y los datos del **profesional responsable** se repite en todas las páginas.

## 6. Base local, Excel y respaldos
- **Base local**: lista de expedientes (abrir/borrar).
- **Importar Excel/CSV**: crea un expediente por fila (omite folios duplicados). Encabezados admitidos: `folio/finca`, `propietario`, `identificacion`, `area`, `plano`, `provincia`, `canton`, `distrito`, `direccion`, `tipoInforme`.
- **Respaldo JSON**: exporta/restaura todos los expedientes y el perfil. Haz respaldo **antes** de limpiar datos del navegador.

## 7. Perfil y logos
En **Perfil** configura el profesional (por defecto *Ingeniero Enrique Alvarado Martínez — IT-30674*) y sube los **logos oficiales** de TOPING y PYME.

## Notas
- La **carga de PDF y el OCR** requieren conexión la primera vez (librerías por CDN). El resto funciona **offline**.
- Los datos se guardan en **este dispositivo** (IndexedDB del navegador).
