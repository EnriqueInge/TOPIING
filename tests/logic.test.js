/**
 * Pruebas de lógica pura del sistema de Ubicación de Bien Inmueble.
 * Ejecuta contra el código REAL: extrae el <script> de ../index.html,
 * neutraliza el arranque de DOM y evalúa las funciones en un sandbox.
 *
 * Casos cubiertos: extracción exitosa, extracción parcial, folio duplicado,
 * generación del informe y compatibilidad histórica.
 *
 * Uso:  node tests/logic.test.js   (Node >= 18, sin dependencias)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const app = scripts.find(s => s.includes('buildReportHTML'));
if (!app) { console.error('No se encontró el script de la aplicación en index.html'); process.exit(2); }

let src = app
  .replace("document.addEventListener('DOMContentLoaded',init);", '')
  .replace(/if\('serviceWorker'[^\n]*\n?/, '');

const ctx = {
  encodeURIComponent, JSON, Math, Date, console, parseFloat, parseInt, isNaN,
  String, Object, Array, RegExp, Number,
  navigator: { onLine: true }, window: {}, indexedDB: {},
  document: { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({}), addEventListener: () => {} }
};
vm.createContext(ctx);
vm.runInContext(src, ctx);

let pass = 0, fail = 0;
const results = [];
function test(name, fn) { try { fn(); pass++; results.push(['PASS', name, '']); } catch (e) { fail++; results.push(['FAIL', name, e.message]); } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }

const YR = new Date().getFullYear();
const FULL = 'Folio Real: 7-90252-000 Naturaleza: Terreno Provincia: Limon Canton: Siquirres Distrito: Siquirres ' +
  'Propietario: Mutual Cartago de Ahorro y Prestamo Cedula juridica: 3-009-045222 ' +
  'Plano catastrado: L-0855909-1989 Area: 250,50 metros cuadrados Situacion: De la Escuela 20 metros norte';
const PARTIAL = 'Folio Real: 1-334455-000 Provincia: San Jose Naturaleza: Lote';

test('Extracción exitosa: texto nativo completo', () => {
  const f = ctx.extractFields(FULL);
  assert(f['inmueble.folioFinca'] && f['inmueble.folioFinca'].value === '7-90252-000', 'folio');
  assert(f['inmueble.planoCatastrado'] && f['inmueble.planoCatastrado'].value === 'L-0855909-1989', 'plano');
  assert(f['ubicacion.provincia'] && f['ubicacion.provincia'].value.trim() === 'Limon', 'provincia limpia: ' + JSON.stringify(f['ubicacion.provincia']));
  assert(f['ubicacion.canton'] && /Siquirres/.test(f['ubicacion.canton'].value), 'canton');
  assert(f['inmueble.identificacion'] && f['inmueble.identificacion'].value.replace(/-/g, '').length >= 9, 'cedula');
  assert(Object.keys(f).length >= 5, '>=5 campos');
});

test('Extracción parcial: campos faltantes quedan sin detectar', () => {
  const f = ctx.extractFields(PARTIAL);
  assert(f['inmueble.folioFinca'] && f['inmueble.folioFinca'].value === '1-334455-000', 'folio parcial');
  assert(!f['inmueble.planoCatastrado'], 'plano NO debe detectarse');
  assert(!f['inmueble.propietario'], 'propietario NO debe detectarse');
  assert(f['ubicacion.provincia'], 'provincia SÍ debe extraerse');
});

test('Folio duplicado: generación de expediente y detección', () => {
  const exp = ctx.generateExpediente('7-90252-000');
  assert(exp === 'UBI-' + YR + '-7-90252-000', 'expediente: ' + exp);
  const store = [{ meta: { id: 'x' }, inmueble: { folioFinca: '7-90252-000' }, tramite: { expediente: exp } }];
  assert(ctx.findCaseByFolio(store, '7-90252-000') !== null, 'duplicado exacto');
  assert(ctx.findCaseByFolio(store, ' 7-90252-000 ') !== null, 'duplicado con espacios');
  assert(ctx.findCaseByFolio(store, '1-000000-000') === null, 'sin falso positivo');
});

test('Generación del informe: HTML con secciones, encabezado y logos', () => {
  const st = ctx.newState();
  st.tramite.expediente = 'UBI-' + YR + '-7-90252-000';
  st.tramite.tipoInforme = 'Ubicación y puesta en posesión';
  st.inmueble.folioFinca = '7-90252-000';
  st.inmueble.propietario = 'Propietario X';
  st.ubicacion.provincia = 'Limón'; st.ubicacion.canton = 'Siquirres'; st.ubicacion.distrito = 'Siquirres';
  st.verificacion = [{ elemento: 'Lindero ESTE', plano: '12.00', sitio: '12.15', dif: '+0.15' }];
  const h = ctx.buildReportHTML(st);
  assert(h.includes('INFORME TÉCNICO DE UBICACIÓN'), 'título');
  assert(h.includes('7-90252-000'), 'folio en informe');
  assert(h.includes('1. Datos generales del trámite'), 'sección 1');
  assert(h.includes('5. Verificación'), 'sección 5');
  assert(h.includes('IT-30674'), 'encabezado profesional');
  assert(/svg|data:image/.test(h), 'logos presentes');
  assert(!/MUCAP/i.test(ctx.reportHead()), 'sin logo/marca MUCAP en el encabezado');
});

test('Compatibilidad histórica: campos eliminados van a _legacy y no al payload', () => {
  const legacy = {
    meta: { id: 'old1' },
    tramite: { expediente: 'X', fechaSolicitud: '2025-01-01' },
    inmueble: { folioFinca: '2-1-1', planoConsulta: 'L-1', origenDato: 'Registro', fechaConsultaRegistral: '2025-02-02' },
    ubicacion: {}
  };
  const m = ctx.migrateRecord(legacy);
  assert(m._legacy['tramite.fechaSolicitud'] === '2025-01-01', 'preserva fechaSolicitud');
  assert(m._legacy['inmueble.planoConsulta'] === 'L-1', 'preserva planoConsulta');
  assert(m._legacy['inmueble.origenDato'] === 'Registro', 'preserva origenDato');
  assert(m._legacy['inmueble.fechaConsultaRegistral'] === '2025-02-02', 'preserva fechaConsultaRegistral');
  assert(m.tramite.fechaSolicitud === undefined, 'fechaSolicitud NO en payload activo');
  assert(m.inmueble.planoConsulta === undefined, 'planoConsulta NO en payload activo');
});

console.log('\n  Pruebas — Ubicación de Bien Inmueble\n');
for (const [status, name, detail] of results) {
  console.log(`  ${status === 'PASS' ? '✓' : '✗'} [${status}] ${name}${detail ? '  → ' + detail : ''}`);
}
console.log(`\n  Resultado: ${pass} aprobadas, ${fail} fallidas, ${pass + fail} total\n`);
process.exit(fail ? 1 : 0);
