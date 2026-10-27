import test from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import ExcelJS from 'exceljs';
import {
  getExcelFilePathForCarrera,
  registrarInscripcionEnExcel,
} from '../src/lib/excelService.ts';
import type { InscripcionFinalPayload } from '../src/types/academic.ts';

test('Concurrencia Mutex + Idempotencia en ExcelJS (25 escrituras simultáneas)', async () => {
  const testCareerCode = 'TEST_CONCURRENCY';
  const filePath = getExcelFilePathForCarrera(testCareerCode);

  await fsp.rm(filePath, { force: true });

  const totalConcurrent = 25;
  const tasks = Array.from({ length: totalConcurrent }, (_, i) => {
    const payload: InscripcionFinalPayload = {
      carreraCode: testCareerCode,
      carreraNombre: 'Tecnicatura de Prueba Concurrencia',
      carreraResolucion: 'RS 0000/26',
      apellidoNombre: `Estudiante Concurrente ${i + 1}`,
      dni: String(40000000 + i),
      telefono: `29140000${String(i).padStart(2, '0')}`,
      email: `alumno${i + 1}@isft191.edu.ar`,
      cohorte: '2024',
      anioMateria: 1,
      anioMateriaLabel: 'Primero',
      modalidad: i % 2 === 0 ? 'Regular' : 'Libre',
      materiaCodigo: `MAT-${100 + i}`,
      materiaNombre: `Materia Concurrente ${i + 1}`,
      anioCursado: '2024',
      profesor: '=ProfesorConFormulaInyectada',
    };
    return registrarInscripcionEnExcel(payload);
  });

  const results = await Promise.all(tasks);
  assert.equal(results.length, totalConcurrent);
  for (const res of results) {
    assert.equal(res.ok, true);
    assert.equal(res.duplicado, false);
  }

  // Probar idempotencia: reenviar el alumno 1 en la misma materia actualiza sin duplicar fila
  const duplicateAttempt = await registrarInscripcionEnExcel({
    carreraCode: testCareerCode,
    carreraNombre: 'Tecnicatura de Prueba Concurrencia',
    carreraResolucion: 'RS 0000/26',
    apellidoNombre: 'Estudiante Concurrente 1',
    dni: '40000000',
    telefono: '2914999999',
    email: 'alumno1@isft191.edu.ar',
    cohorte: '2024',
    anioMateria: 1,
    anioMateriaLabel: 'Primero',
    modalidad: 'Libre',
    materiaCodigo: 'MAT-100',
    materiaNombre: 'Materia Concurrente 1',
    anioCursado: '2025',
    profesor: 'Crivelli Actualizado',
  });

  assert.equal(duplicateAttempt.ok, true);
  assert.equal(duplicateAttempt.duplicado, true, 'Debe detectar inscripción duplicada');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('Respuestas de formulario 1');
  assert.ok(sheet, 'La hoja homogénea debe existir');

  // 1 fila de cabecera + 25 filas únicas de estudiantes = 26 filas exactas
  assert.equal(
    sheet.rowCount,
    totalConcurrent + 1,
    'No deben perderse filas por carrera ni agregarse duplicados'
  );

  // Verificar sanitización de Formula Injection en columna 10 (PROFESOR) de la fila 3
  const profCell = String(sheet.getRow(3).getCell(10).value ?? '');
  assert.equal(
    profCell.startsWith("'="),
    true,
    'El texto que inicia con = debe quedar escapado con apóstrofo'
  );

  await fsp.rm(filePath, { force: true });
});
