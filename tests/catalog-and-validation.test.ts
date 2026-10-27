import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCarreras,
  getCarreraByCode,
  getClientCarrerasDto,
  getMateriaInCarrera,
  getMateriasByCarreraAndYear,
} from '../src/lib/academicService.ts';
import {
  sanitizeDni,
  sanitizeSpreadsheetCell,
  validateStep1Personal,
  validateStep2Academic,
} from '../src/lib/validation.ts';

test('Catálogo Académico ISFT N° 191: verifica 8 carreras y 211 materias con búsqueda O(1)', () => {
  const carreras = getCarreras();
  assert.equal(carreras.length, 8, 'Debe contener exactamente 8 planes de estudio');

  const totalMaterias = carreras.reduce((acc, c) => acc + c.materias.length, 0);
  assert.equal(totalMaterias, 211, 'El padrón total debe sumar exactamente 211 materias');

  const gest = getCarreraByCode('gest');
  assert.ok(gest, 'Búsqueda O(1) case-insensitive debe encontrar GEST');
  assert.equal(gest.materias.length, 26);

  const mat = getMateriaInCarrera('GEST', 'GEST-102', 1);
  assert.ok(mat, 'Debe encontrar GEST-102 en 1° año de Gestoría');
  assert.equal(mat.name, 'Derecho Constitucional');

  const wrongYear = getMateriaInCarrera('GEST', 'GEST-102', 2);
  assert.equal(wrongYear, undefined, 'No debe validar una materia de 1° año como de 2° año');

  const softYear1 = getMateriasByCarreraAndYear('SOFT', 1);
  assert.equal(softYear1.length, 8);
});

test('Proyección DTO Cliente: omite IDs internos de base de datos y calcula contadores por año', () => {
  const dto = getClientCarrerasDto();
  assert.equal(dto.length, 8);
  const first = dto[0] as Record<string, unknown>;
  assert.equal('source_sheet' in first, false);
  assert.equal('id' in first, false);
  assert.deepEqual(dto[0].countsByYear, { 1: 8, 2: 8, 3: 6 });
});

test('Validador SSOT y Sanitizador Anti-Formula Injection', () => {
  assert.equal(sanitizeDni('43.596.839 '), '43596839');
  assert.equal(sanitizeSpreadsheetCell('=CMD|" /C calc"!A0'), "'=CMD|\" /C calc\"!A0");
  assert.equal(sanitizeSpreadsheetCell('+2914058716'), "'+2914058716");
  assert.equal(sanitizeSpreadsheetCell('Crivelli'), 'Crivelli');

  const validStep1 = validateStep1Personal({
    apellidoNombre: 'Cricelli Candela Juliana',
    dni: '43.596.839',
    cohorte: '2023',
    telefono: '2914058716',
    email: 'CandeCricelli21@gmail.com ',
  });
  assert.equal(validStep1.ok, true);
  assert.equal(validStep1.data?.dni, '43596839');
  assert.equal(validStep1.data?.email, 'candecricelli21@gmail.com');

  const invalidStep1 = validateStep1Personal({
    apellidoNombre: 'Juan',
    dni: '123',
    cohorte: '23',
    telefono: '12',
    email: 'invalido',
  });
  assert.equal(invalidStep1.ok, false);
  assert.ok(invalidStep1.errors.apellidoNombre);
  assert.ok(invalidStep1.errors.dni);

  const validStep2 = validateStep2Academic({
    carreraCode: 'gest',
    anioMateria: 1,
    modalidad: 'Regular',
    materiaCodigo: 'gest-102',
    anioCursado: '2023',
    profesor: 'Crivelli',
  });
  assert.equal(validStep2.ok, true);
  assert.equal(validStep2.data?.carreraCode, 'GEST');
});
