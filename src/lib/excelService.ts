import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import type {
  IInscripcionRepository,
  InscripcionFinalPayload,
  InscripcionResult,
} from '../types/academic';
import { sanitizeSpreadsheetCell } from './validation';

const OUTPUT_DIR = path.resolve(process.cwd(), 'data/output');
const AUDIT_LOG_PATH = path.join(OUTPUT_DIR, 'audit_log.jsonl');
const SHEET_NAME = 'Respuestas de formulario 1';

/**
 * Columnas exactas según formato_final_a_enviar.xlsx (10 columnas homogéneas)
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

// Cola en memoria por archivo para serializar escrituras concurrentes
const writeLocks = new Map<string, Promise<void>>();

async function ensureOutputDirAsync(): Promise<void> {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
}

async function fileExistsAsync(targetPath: string): Promise<boolean> {
  try {
    await fsp.access(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function getExcelFilePathForCarrera(carreraCode: string): string {
  const safeCode = carreraCode.replace(/[^A-Za-z0-9_-]/g, '_');
  return path.join(OUTPUT_DIR, `Inscripciones_${safeCode}.xlsx`);
}

export class ExcelInscripcionRepository implements IInscripcionRepository {
  async registrar(payload: InscripcionFinalPayload): Promise<InscripcionResult> {
    await ensureOutputDirAsync();
    const filePath = getExcelFilePathForCarrera(payload.carreraCode);
    const previousLock = writeLocks.get(filePath) ?? Promise.resolve();

    let result!: InscripcionResult;

    const nextLock = previousLock.then(async () => {
      const workbook = new ExcelJS.Workbook();
      let worksheet: ExcelJS.Worksheet | undefined;

      if (await fileExistsAsync(filePath)) {
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

      const safeRowData = {
        apellidoNombre: sanitizeSpreadsheetCell(payload.apellidoNombre),
        dni: sanitizeSpreadsheetCell(payload.dni),
        telefono: sanitizeSpreadsheetCell(payload.telefono),
        email: sanitizeSpreadsheetCell(payload.email),
        cohorte: sanitizeSpreadsheetCell(payload.cohorte),
        anioMateriaLabel: payload.anioMateriaLabel,
        modalidad: payload.modalidad,
        materiaNombre: sanitizeSpreadsheetCell(payload.materiaNombre),
        anioCursado: sanitizeSpreadsheetCell(payload.anioCursado),
        profesor: sanitizeSpreadsheetCell(payload.profesor),
      };

      // Idempotency / Deduplication check by (DNI + MATERIA)
      let duplicateRow: ExcelJS.Row | undefined;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowDni = String(row.getCell(2).value ?? '').trim();
        const rowMateria = String(row.getCell(8).value ?? '').trim();
        if (
          rowDni === safeRowData.dni &&
          rowMateria.toLowerCase() === safeRowData.materiaNombre.toLowerCase()
        ) {
          duplicateRow = row;
        }
      });

      const isDuplicate = Boolean(duplicateRow);

      if (duplicateRow) {
        // Update existing registration row in-place rather than duplicating
        duplicateRow.values = [
          safeRowData.apellidoNombre,
          safeRowData.dni,
          safeRowData.telefono,
          safeRowData.email,
          safeRowData.cohorte,
          safeRowData.anioMateriaLabel,
          safeRowData.modalidad,
          safeRowData.materiaNombre,
          safeRowData.anioCursado,
          safeRowData.profesor,
        ];
        duplicateRow.commit();
      } else {
        worksheet.addRow(safeRowData);
      }

      await workbook.xlsx.writeFile(filePath);

      const fechaIso = new Date().toISOString();
      const hash = crypto
        .createHash('sha256')
        .update(`${payload.dni}-${payload.materiaCodigo}-${fechaIso}`)
        .digest('hex')
        .slice(0, 8)
        .toUpperCase();

      const comprobanteId = `ISFT191-${payload.carreraCode}-${hash}`;

      // Append-only JSONL transactional audit log
      const auditEntry = JSON.stringify({
        comprobanteId,
        fechaIso,
        duplicadoActualizado: isDuplicate,
        ...payload,
      });
      await fsp.appendFile(AUDIT_LOG_PATH, `${auditEntry}\n`, 'utf-8');

      result = {
        ok: true,
        comprobanteId,
        fechaIso,
        archivoCarrera: path.basename(filePath),
        duplicado: isDuplicate,
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
}

export const inscripcionRepository: IInscripcionRepository =
  new ExcelInscripcionRepository();

export async function registrarInscripcionEnExcel(
  payload: InscripcionFinalPayload
): Promise<InscripcionResult> {
  return inscripcionRepository.registrar(payload);
}
