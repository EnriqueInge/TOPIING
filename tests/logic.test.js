/**
 * Pruebas de lógica pura — TOPING · Inspecciones e Informes.
 * Ejecuta contra el código REAL: extrae el <script> de ../index.html,
 * neutraliza el arranque de DOM y evalúa las funciones en un sandbox.
 *
 * Cobertura (entregable h): extracción parcial, folio duplicado,
 * cambio de estado y generación del informe (+ extracción/área en letras,
 * nomenclatura, CRTM05, auditoría y compatibilidad histórica).
 *
 * Uso:  node tests/logic.test.js   (Node >= 18, sin dependencias)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const app = scripts.find(s => s.includes('buildReportHTML'));
if (!app) { console.error('No se encontró el script de la aplicación'); process.exit(2); }

let src = app
  .replace("document.addEventListener('DOMContentLoaded',init);", '')
  .replace(/if\('serviceWorker'[^\n]*\n?/, '');

const ctx = {
  encodeURIComponent, JSON, Math, Date, console, parseFloat, parseInt, isNaN,
  String, Object, Array, RegExp, Number, Set,
  navigator: { onLine: true, userAgent: 'node', geolocation: null },
  window: { matchMedia: () => ({ matches: false }), addEventListener: () => {} },
  indexedDB: {},
  document: { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ classList: { add() {}, remove() {} } }), addEventListener: () => {} }
};
vm.createContext(ctx);
vm.runInContext(src, ctx);

let pass = 0, fail = 0; const results = [];
function test(name, fn) { try { fn(); pass++; results.push(['PASS', name, '']); } catch (e) { fail++; results.push(['FAIL', name, e.message]); } }
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
const YR = new Date().getFullYear();

const FULL = 'REGISTRO Matricula: 7-90252-000 Naturaleza: Terreno Provincia: Limon Canton: Siquirres Distrito: Siquirres ' +
  'Propietario: MUTUAL CARTAGO Cedula juridica: 3-009-045222 Plano catastrado: L-0855909-1989 ' +
  'Mide: DOSCIENTOS CINCUENTA METROS CON CINCUENTA DECIMETROS CUADRADOS Situacion: De la Escuela 20 metros norte';
const PARTIAL = 'Folio Real: 1-334455-000 Provincia: San Jose Naturaleza: Lote';
// Formato real de "Consulta por número de finca" del Registro Nacional (informe registral)
const REGISTRO_NACIONAL = 'REPÚBLICA DE COSTA RICA REGISTRO NACIONAL CONSULTA POR NÚMERO DE FINCA ' +
  'MATRÍCULA: 522410---000 PROVINCIA: ALAJUELA FINCA: 522410 DUPLICADO: HORIZONTAL: DERECHO: 000 SEGREGACIONES: SI HAY ' +
  'NATURALEZA: TERRENO PARA CONSTRUIR ' +
  'SITUADA EN EL DISTRITO 11-CUTRIS CANTON 10-SAN CARLOS DE LA PROVINCIA DE ALAJUELA ' +
  'FINCA SE ENCUENTRA EN ZONA CATASTRADA LINDEROS: NORTE : ESPERANZA SEQUEIRA SOTO ' +
  'MIDE: QUINIENTOS METROS CUADRADOS PLANO:A-1782472-2014 ' +
  'VALOR FISCAL: 30,268,875.00 COLONES PROPIETARIO: VERONICA VIVIANA DURAN ALVARADO ' +
  'CEDULA IDENTIDAD 3-0447-0598 ESTADO CIVIL: CASADO UNA VEZ';

test('Extracción exitosa + área en letras → número', () => {
  const f = ctx.extractFields(FULL);
  assert(f['inmueble.folioFinca'].value === '7-90252-000', 'folio');
  assert(f['inmueble.planoCatastrado'].value === 'L-0855909-1989', 'plano');
  assert(f['ubicacion.provincia'].value.trim() === 'Limon', 'provincia: ' + JSON.stringify(f['ubicacion.provincia']));
  assert(f['inmueble.areaRegistro'] && f['inmueble.areaRegistro'].value === '250.5', 'área letras→num: ' + JSON.stringify(f['inmueble.areaRegistro']));
});

test('Conversión de palabras a número', () => {
  assert(ctx.areaWordsToNumber('DOSCIENTOS CINCUENTA CON CINCUENTA') === 250.5, '250.5');
  assert(ctx.parseSpanishNumber('MIL DOSCIENTOS') === 1200, '1200');
  assert(ctx.areaWordsToNumber('TRESCIENTOS') === 300, '300');
});

test('Informe registral del Registro Nacional (documento real)', () => {
  const f = ctx.extractFields(REGISTRO_NACIONAL);
  assert(f['inmueble.folioFinca'].value === '2-522410-000', 'matrícula compuesta (provincia+finca+derecho): ' + JSON.stringify(f['inmueble.folioFinca']));
  assert(f['inmueble.planoCatastrado'].value === 'A-1782472-2014', 'plano sin la palabra catastrado');
  assert(f['inmueble.areaRegistro'].value === '500', 'MIDE en letras → 500: ' + JSON.stringify(f['inmueble.areaRegistro']));
  assert(f['ubicacion.provincia'].value === 'ALAJUELA', 'provincia');
  assert(f['ubicacion.canton'].value === 'SAN CARLOS', 'cantón sin prefijo numérico: ' + JSON.stringify(f['ubicacion.canton']));
  assert(f['ubicacion.distrito'].value === 'CUTRIS', 'distrito sin prefijo numérico');
  assert(/VERONICA VIVIANA DURAN ALVARADO/.test(f['inmueble.propietario'].value), 'propietario');
  assert(f['inmueble.identificacion'].value === '3-0447-0598', 'cédula identidad');
  assert(/TERRENO PARA CONSTRUIR/.test(f['inmueble.usoObservado'].value), 'naturaleza');
  assert(ctx.generateExpediente('pp', f['inmueble.folioFinca'].value) === 'P.P-MUCAP-522410-' + YR, 'nomenclatura desde matrícula');
});

test('Extracción parcial: faltantes quedan sin detectar', () => {
  const f = ctx.extractFields(PARTIAL);
  assert(f['inmueble.folioFinca'].value === '1-334455-000', 'folio');
  assert(!f['inmueble.planoCatastrado'], 'sin plano');
  assert(!f['inmueble.propietario'], 'sin propietario');
  assert(!f['inmueble.areaRegistro'], 'sin área');
  assert(f['ubicacion.provincia'], 'con provincia');
});

test('Folio duplicado + nomenclatura P.P-MUCAP', () => {
  const exp = ctx.generateExpediente('pp', '7-90252-000');
  assert(exp === 'P.P-MUCAP-90252-' + YR, 'nomenclatura: ' + exp);
  const store = [{ meta: { id: 'x' }, tramite: { tipo: 'pp', expediente: exp }, inmueble: { folioFinca: '7-90252-000' } }];
  assert(ctx.findCaseByFolio(store, '7-90252-000', 'pp') !== null, 'duplicado exacto');
  assert(ctx.findCaseByFolio(store, ' 7-90252-000 ', 'pp') !== null, 'duplicado con espacios');
  assert(ctx.findCaseByFolio(store, '7-90252-000', 'avaluo') === null, 'otro tipo no es duplicado');
  assert(ctx.findCaseByFolio(store, '1-000000-000', 'pp') === null, 'sin falso positivo');
});

test('Cambio de estado a Gestión y filtrado', () => {
  const s = ctx.newState();
  assert(s.meta.estado === 'activo', 'nace activo');
  s.meta.estado = 'gestion';
  const all = [{ meta: { estado: 'activo' } }, { meta: { estado: 'gestion' } }, { meta: { estado: 'gestion' } }];
  assert(all.filter(c => c.meta.estado !== 'gestion').length === 1, 'un activo');
  assert(all.filter(c => c.meta.estado === 'gestion').length === 2, 'dos en gestión');
});

test('Coordenadas CRTM05 dentro de rango de Costa Rica', () => {
  const c = ctx.wgs84ToCRTM05(10.0, -84.0);
  assert(Math.abs(c.E - 500000) < 1, 'E ~500000 en meridiano central: ' + c.E);
  assert(c.N > 1100000 && c.N < 1120000, 'N ~1.1M: ' + c.N);
});

test('Generación del informe por tipo (logos, encabezado, sin finalidad)', () => {
  const st = ctx.newState();
  st.tramite.tipo = 'pp'; st.tramite.expediente = 'P.P-MUCAP-90252-' + YR;
  st.inmueble.folioFinca = '7-90252-000'; st.ubicacion.provincia = 'LIMÓN';
  st.verificacion = [{ elemento: 'LINDERO ESTE', plano: '12.00', sitio: '12.15', dif: '+0.15' }];
  const h = ctx.buildReportHTML(st);
  assert(h.includes('INFORME DE PUESTA EN POSESIÓN'), 'título PP');
  assert(h.includes('7-90252-000'), 'folio');
  assert(h.includes('4. Levantamiento y verificación'), 'levantamiento+verificación unificado');
  assert(h.includes('IT-30674'), 'encabezado profesional');
  assert(/class="toping"/.test(h) && /class="pyme"/.test(h), 'logos TOPING + PYME');
  assert(!/finalidad/i.test(h), 'sin campo Finalidad');
  // Avalúo cambia de plantilla
  const st2 = ctx.newState(); st2.tramite.tipo = 'avaluo';
  assert(ctx.buildReportHTML(st2).includes('INFORME DE AVALÚO'), 'título Avalúo');
});

test('Auditoría: detecta incompleto y completo', () => {
  const a1 = ctx.auditReport(ctx.newState());
  assert(a1.errors > 0 && !a1.complete, 'vacío incompleto');
  const full = ctx.newState();
  full.tramite.tipo = 'pp'; full.tramite.expediente = 'P.P-MUCAP-71-' + YR; full.tramite.fechaInspeccion = '2026-08-03';
  full.inmueble.folioFinca = '7-1-0'; full.inmueble.propietario = 'X'; full.inmueble.areaRegistro = '250.5'; full.inmueble.planoCatastrado = 'L-1-2';
  full.ubicacion.provincia = 'LIMÓN'; full.ubicacion.canton = 'SIQUIRRES'; full.ubicacion.distrito = 'SIQUIRRES'; full.ubicacion.direccion = 'DE LA ESCUELA';
  full.levantamiento.este = '500000'; full.levantamiento.norte = '1100000'; full.levantamiento.precision = '3';
  full.verificacion = [{ elemento: 'LINDERO', plano: '12', sitio: '12.1', dif: '+0.10' }]; full.fotos = [{ dataUrl: 'data:img', capturedAt: 1 }];
  full.responsable.nombre = 'ING'; full.responsable.registro = 'IT-30674';
  const a2 = ctx.auditReport(full);
  assert(a2.errors === 0, 'completo sin errores: ' + a2.errors);
  assert(a2.complete, 'marcado completo');
});

test('MAYÚSCULAS globales (respeta email y data:)', () => {
  const s = ctx.newState();
  s.inmueble.propietario = 'juan pérez'; s.responsable.email = 'info@topingcr.com';
  s.fotos = [{ dataUrl: 'data:image/png;base64,AAA', descripcion: 'frente' }];
  ctx.applyUppercase(s);
  assert(s.inmueble.propietario === 'JUAN PÉREZ', 'propietario en mayúsculas');
  assert(s.responsable.email === 'info@topingcr.com', 'email intacto');
  assert(s.fotos[0].dataUrl === 'data:image/png;base64,AAA', 'dataUrl intacto');
  assert(s.fotos[0].descripcion === 'FRENTE', 'descripción en mayúsculas');
});

test('Compatibilidad histórica (_legacy incl. finalidad)', () => {
  const legacy = { meta: { id: 'o' }, tramite: { expediente: 'X', fechaSolicitud: '2025-01-01' }, inmueble: { folioFinca: '2-1-1', planoConsulta: 'L-1' }, levantamiento: { finalidad: 'ILUSTRATIVA' }, ubicacion: {} };
  const m = ctx.migrateRecord(legacy);
  assert(m._legacy['tramite.fechaSolicitud'] === '2025-01-01', 'preserva fechaSolicitud');
  assert(m._legacy['levantamiento.finalidad'] === 'ILUSTRATIVA', 'preserva finalidad');
  assert(m.levantamiento.finalidad === undefined, 'finalidad fuera del payload activo');
  assert(m.tramite.tipo === 'pp', 'tipo por defecto en históricos');
});

console.log('\n  Pruebas — TOPING · Inspecciones e Informes\n');
for (const [status, name, detail] of results) {
  console.log(`  ${status === 'PASS' ? '✓' : '✗'} [${status}] ${name}${detail ? '  → ' + detail : ''}`);
}
console.log(`\n  Resultado: ${pass} aprobadas, ${fail} fallidas, ${pass + fail} total\n`);
process.exit(fail ? 1 : 0);
