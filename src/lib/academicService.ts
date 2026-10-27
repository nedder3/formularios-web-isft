import fs from 'node:fs';
import path from 'node:path';
import type { AcademicScaffolding, AnioMateriaLabel, Carrera, Materia } from '../types/academic';

let cachedData: AcademicScaffolding | null = null;

export function getAcademicData(): AcademicScaffolding {
  if (cachedData) return cachedData;
  const filePath = path.resolve(process.cwd(), 'isft_191_scaffolding.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedData = JSON.parse(raw) as AcademicScaffolding;
  return cachedData;
}

export function getCarreras(): Carrera[] {
  return getAcademicData().carreras;
}

export function getCarreraByCode(code: string): Carrera | undefined {
  return getCarreras().find((c) => c.code === code);
}

export function getMateriasByCarreraAndYear(code: string, year: number): Materia[] {
  const carrera = getCarreraByCode(code);
  if (!carrera) return [];
  return carrera.materias.filter((m) => m.year === year);
}

export function yearNumberToLabel(year: 1 | 2 | 3): AnioMateriaLabel {
  const map: Record<1 | 2 | 3, AnioMateriaLabel> = {
    1: 'Primero',
    2: 'Segundo',
    3: 'Tercero',
  };
  return map[year];
}
