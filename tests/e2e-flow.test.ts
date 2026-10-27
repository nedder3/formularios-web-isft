import test from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import { POST as postInscripcion } from '../src/pages/api/inscripcion.ts';
import { GET as getExcel } from '../src/pages/api/excel/[carrera].ts';
import { GET as getCatalogo } from '../src/pages/api/catalogo.json.ts';
import { getExcelFilePathForCarrera } from '../src/lib/excelService.ts';
import { resetRateLimitsForTest } from '../src/lib/rateLimit.ts';

test('Flujo E2E HTTP: GET /api/catalogo.json -> POST /api/inscripcion -> GET /api/excel/:carrera', async () => {
  resetRateLimitsForTest();

  // 1. Obtener catálogo ligero desde endpoint cacheado
  const catRes = await getCatalogo({} as never);
  assert.equal(catRes.status, 200);
  const catJson = (await catRes.json()) as { carreras: Array<{ code: string }> };
  assert.equal(catJson.carreras.length, 8);

  // 2. Enviar inscripción válida a Gestoría (GEST-102)
  const validPayload = {
    apellidoNombre: 'Cricelli Candela Juliana',
    dni: '43.596.839',
    telefono: '2914058716',
    email: 'candecricelli21@gmail.com',
    cohorte: '2023',
    carreraCode: 'GEST',
    anioMateria: 1,
    modalidad: 'Regular',
    materiaCodigo: 'GEST-102',
    anioCursado: '2023',
    profesor: 'Crivelli',
  };

  const req = new Request('http://localhost:4321/api/inscripcion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload),
  });

  const postRes = await postInscripcion({
    request: req,
    clientAddress: '127.0.0.1',
  } as never);

  assert.equal(postRes.status, 200);
  const postData = (await postRes.json()) as {
    ok: boolean;
    comprobanteId: string;
    datos: { materiaNombre: string; dni: string };
  };
  assert.equal(postData.ok, true);
  assert.match(postData.comprobanteId, /^ISFT191-GEST-[0-9A-F]{8}$/);
  assert.equal(postData.datos.materiaNombre, 'Derecho Constitucional');
  assert.equal(postData.datos.dni, '43596839');

  // 3. Verificar rechazo 400 ante materia de otro año/carrera
  const badReq = new Request('http://localhost:4321/api/inscripcion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...validPayload,
      anioMateria: 3, // GEST-102 es de 1° año
    }),
  });
  const badRes = await postInscripcion({
    request: badReq,
    clientAddress: '127.0.0.1',
  } as never);
  assert.equal(badRes.status, 400);

  // 4. Descargar el archivo Excel generado vía GET /api/excel/GEST
  const excelRes = await getExcel({
    params: { carrera: 'GEST' },
    request: new Request('http://localhost:4321/api/excel/GEST'),
    url: new URL('http://localhost:4321/api/excel/GEST'),
  } as never);

  assert.equal(excelRes.status, 200);
  assert.equal(
    excelRes.headers.get('Content-Type'),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  const buf = await excelRes.arrayBuffer();
  assert.ok(buf.byteLength > 1000, 'El archivo XLSX descargado debe tener contenido binario válido');

  // Limpiar archivo de prueba si corresponde
  await fsp.rm(getExcelFilePathForCarrera('GEST'), { force: true });
});
