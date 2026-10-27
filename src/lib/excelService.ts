import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import type { InscripcionFinalPayload, InscripcionResult } from '../types/academic';

const OUTPUT_DIR = path.resolve(process.cwd(), 'data/output');
const SHEET_NAME = 'Respuestas de formulario 1';

/**
 * Columnas exactas según formato_final_a_enviar.xlsx
 */
const HOMOGENEOUS_COLUMNS = [
  { header: 'Apellido y Nombre', key: 'apellidoNombre', width: 32 },
  { header: 'DNI', key: 'dni', width: 15 },
  { header: 'Teléfono', key: 'telefono', width: 18 },
  { header: 'Dirección de correo electrónico', key: 'email', width: 34 },
  { header: 'Cohorte', key: 'cohorte', width: 12 },
  {
    header: 'Año al que pertenece la materia que quiere rendir',
    key: 'anioMateriaLabel',
    width: 44,
  },
  { header: 'MODALIDAD', key: 'modalidad', width: 15 },
  { header: 'MATERIA', key: 'materiaNombre', width: 48 },
  { header: 'AÑO DE CURSADO', key: 'anioCursado', width: 18 },
  { header: 'PROFESOR', key: 'profesor', width: 28 },
];

// Cola en memoria por archivo para evitar condiciones de carrera en escrituras concurrentes
const writeLocks = new Map<string, Promise<void>>();

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

export function getExcelFilePathForCarrera(carreraCode: string): string {
  ensureOutputDir();
  const safeCode = carreraCode.replace(/[^A-Za-z0-9_-]/g, '_');
  return path.join(OUTPUT_DIR, `Inscripciones_${safeCode}.xlsx`);
}

export async function registrarInscripcionEnExcel(
  payload: InscripcionFinalPayload
): Promise<InscripcionResult> {
  const filePath = getExcelFilePathForCarrera(payload.carreraCode);
  const previousLock = writeLocks.get(filePath) ?? Promise.resolve();

  let result!: InscripcionResult;

  const nextLock = previousLock.then(async () => {
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet | undefined;

    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets[0];
    }

    if (!worksheet) {
      worksheet = workbook.addWorksheet(SHEET_NAME);
      worksheet.columns = HOMOGENEOUS_COLUMNS;

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3438AA' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
      headerRow.height = 24;
    } else {
      worksheet.columns = HOMOGENEOUS_COLUMNS;
    }

    worksheet.addRow({
      apellidoNombre: payload.apellidoNombre,
      dni: payload.dni,
      telefono: payload.telefono,
      email: payload.email,
      cohorte: payload.cohorte,
      anioMateriaLabel: payload.anioMateriaLabel,
      modalidad: payload.modalidad,
      materiaNombre: payload.materiaNombre,
      anioCursado: payload.anioCursado,
      profesor: payload.profesor,
    });

    await workbook.xlsx.writeFile(filePath);

    const fechaIso = new Date().toISOString();
    const hash = crypto
      .createHash('sha256')
      .update(`${payload.dni}-${payload.materiaCodigo}-${fechaIso}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();

    result = {
      ok: true,
      comprobanteId: `ISFT191-${payload.carreraCode}-${hash}`,
      fechaIso,
      archivoCarrera: path.basename(filePath),
      datos: payload,
    };
  });

  writeLocks.set(
    filePath,
    nextLock.catch(() => {})
  );

  await nextLock;
  return result;
}
