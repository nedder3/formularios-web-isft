import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type {
  AcademicScaffolding,
  AnioMateriaLabel,
  Carrera,
  ClientCarreraDto,
  Materia,
} from '../types/academic';

interface CatalogIndexes {
  scaffolding: AcademicScaffolding;
  carreraByCode: Map<string, Carrera>;
  materiaByCode: Map<string, Materia>;
  materiasByCarreraAndYear: Map<string, Materia[]>;
  clientDto: ClientCarreraDto[];
}

let cachedIndexes: CatalogIndexes | null = null;

function buildIndexes(scaffolding: AcademicScaffolding): CatalogIndexes {
  const carreraByCode = new Map<string, Carrera>();
  const materiaByCode = new Map<string, Materia>();
  const materiasByCarreraAndYear = new Map<string, Materia[]>();
  const clientDto: ClientCarreraDto[] = [];

  for (const carrera of scaffolding.carreras) {
    const normalizedCode = carrera.code.toUpperCase();
    carreraByCode.set(normalizedCode, carrera);

    const countsByYear: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };

    for (const year of [1, 2, 3] as const) {
      const list = carrera.materias.filter((m) => m.year === year);
      materiasByCarreraAndYear.set(`${normalizedCode}:${year}`, list);
      countsByYear[year] = list.length;
    }

    for (const materia of carrera.materias) {
      materiaByCode.set(`${normalizedCode}:${materia.code.toUpperCase()}`, materia);
    }

    clientDto.push({
      code: carrera.code,
      name: carrera.name,
      resolution: carrera.resolution,
      countsByYear,
      materias: carrera.materias.map((m) => ({
        code: m.code,
        name: m.name,
        year: m.year,
      })),
    });
  }

  return {
    scaffolding,
    carreraByCode,
    materiaByCode,
    materiasByCarreraAndYear,
    clientDto,
  };
}

function ensureIndexes(): CatalogIndexes {
  if (cachedIndexes) return cachedIndexes;
  const filePath = path.resolve(process.cwd(), 'isft_191_scaffolding.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as AcademicScaffolding;
  cachedIndexes = buildIndexes(parsed);
  return cachedIndexes;
}

export async function preloadAcademicDataAsync(): Promise<AcademicScaffolding> {
  if (cachedIndexes) return cachedIndexes.scaffolding;
  const filePath = path.resolve(process.cwd(), 'isft_191_scaffolding.json');
  const raw = await fsp.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as AcademicScaffolding;
  cachedIndexes = buildIndexes(parsed);
  return cachedIndexes.scaffolding;
}

export function getAcademicData(): AcademicScaffolding {
  return ensureIndexes().scaffolding;
}

export function getCarreras(): Carrera[] {
  return ensureIndexes().scaffolding.carreras;
}

export function getClientCarrerasDto(): ClientCarreraDto[] {
  return ensureIndexes().clientDto;
}

/**
 * O(1) Map lookup by career code (case-insensitive).
 */
export function getCarreraByCode(code: string): Carrera | undefined {
  if (!code) return undefined;
  return ensureIndexes().carreraByCode.get(code.trim().toUpperCase());
}

/**
 * O(1) Map lookup by (carreraCode, year).
 */
export function getMateriasByCarreraAndYear(code: string, year: number): Materia[] {
  if (!code || ![1, 2, 3].includes(year)) return [];
  return (
    ensureIndexes().materiasByCarreraAndYear.get(`${code.trim().toUpperCase()}:${year}`) ?? []
  );
}

/**
 * O(1) Map lookup for a specific subject within a career and year.
 */
export function getMateriaInCarrera(
  carreraCode: string,
  materiaCodigo: string,
  year?: number
): Materia | undefined {
  if (!carreraCode || !materiaCodigo) return undefined;
  const key = `${carreraCode.trim().toUpperCase()}:${materiaCodigo.trim().toUpperCase()}`;
  const materia = ensureIndexes().materiaByCode.get(key);
  if (!materia) return undefined;
  if (year !== undefined && materia.year !== year) return undefined;
  return materia;
}

export function yearNumberToLabel(year: 1 | 2 | 3): AnioMateriaLabel {
  const map: Record<1 | 2 | 3, AnioMateriaLabel> = {
    1: 'Primero',
    2: 'Segundo',
    3: 'Tercero',
  };
  return map[year];
}
