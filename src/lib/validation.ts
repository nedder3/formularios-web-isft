import type { ModalidadExamen } from '../types/academic';

export interface Step1Input {
  apellidoNombre: string;
  dni: string;
  cohorte: string;
  telefono: string;
  email: string;
}

export interface Step2Input {
  carreraCode: string;
  anioMateria: number;
  modalidad: string;
  materiaCodigo: string;
  anioCursado: string;
  profesor: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  errors: Record<string, string>;
  firstError?: string;
  data?: T;
}

/**
 * Strips non-numeric characters from a DNI string.
 */
export function sanitizeDni(raw: unknown): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * Prevents CSV / Excel Formula Injection (CWE-1236) by escaping strings
 * that begin with spreadsheet formula triggers (=, +, -, @, tab, CR).
 */
export function sanitizeSpreadsheetCell(value: string): string {
  const trimmed = String(value ?? '').trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export function validateFieldStep1(
  field: keyof Step1Input,
  value: string
): string | null {
  const trimmed = String(value ?? '').trim();
  switch (field) {
    case 'apellidoNombre':
      if (trimmed.length < 3 || !trimmed.includes(' ')) {
        return 'Ingresá tu Apellido y Nombre completos (al menos nombre y apellido).';
      }
      return null;
    case 'dni': {
      const digits = sanitizeDni(trimmed);
      if (!/^\d{7,9}$/.test(digits)) {
        return 'El DNI debe contener entre 7 y 9 dígitos numéricos sin puntos.';
      }
      return null;
    }
    case 'cohorte':
      if (!/^\d{4}$/.test(trimmed)) {
        return 'Seleccioná un año de cohorte válido (4 dígitos).';
      }
      return null;
    case 'telefono': {
      const phoneDigits = trimmed.replace(/\D/g, '');
      if (phoneDigits.length < 6 || phoneDigits.length > 15) {
        return 'Ingresá un número de teléfono válido (con código de área).';
      }
      return null;
    }
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.toLowerCase())) {
        return 'Ingresá una dirección de correo electrónico válida.';
      }
      return null;
    default:
      return null;
  }
}

export function validateStep1Personal(raw: Partial<Step1Input>): ValidationResult<Step1Input> {
  const sanitized: Step1Input = {
    apellidoNombre: String(raw.apellidoNombre ?? '').trim().replace(/\s+/g, ' '),
    dni: sanitizeDni(raw.dni),
    cohorte: String(raw.cohorte ?? '').trim(),
    telefono: String(raw.telefono ?? '').trim(),
    email: String(raw.email ?? '').trim().toLowerCase(),
  };

  const errors: Record<string, string> = {};
  const fields: (keyof Step1Input)[] = [
    'apellidoNombre',
    'dni',
    'cohorte',
    'telefono',
    'email',
  ];

  for (const field of fields) {
    const err = validateFieldStep1(field, sanitized[field]);
    if (err) errors[field] = err;
  }

  const errorValues = Object.values(errors);
  if (errorValues.length > 0) {
    return {
      ok: false,
      errors,
      firstError: errorValues[0],
    };
  }

  return {
    ok: true,
    errors: {},
    data: sanitized,
  };
}

export function validateStep2Academic(
  raw: Partial<Step2Input>
): ValidationResult<{
  carreraCode: string;
  anioMateria: 1 | 2 | 3;
  modalidad: ModalidadExamen;
  materiaCodigo: string;
  anioCursado: string;
  profesor: string;
}> {
  const carreraCode = String(raw.carreraCode ?? '').trim().toUpperCase();
  const anioMateriaNum = Number(raw.anioMateria);
  const modalidadRaw = String(raw.modalidad ?? '').trim();
  const materiaCodigo = String(raw.materiaCodigo ?? '').trim().toUpperCase();
  const anioCursado = String(raw.anioCursado ?? '').trim();
  const profesor = String(raw.profesor ?? '').trim().replace(/\s+/g, ' ');

  const errors: Record<string, string> = {};

  if (!carreraCode) {
    errors.carreraCode = 'Seleccioná tu carrera y plan de estudios.';
  }

  if (![1, 2, 3].includes(anioMateriaNum)) {
    errors.anioMateria = 'El año de la materia debe ser 1°, 2° o 3°.';
  }

  if (!materiaCodigo) {
    errors.materiaCodigo = 'Seleccioná la materia que deseás rendir.';
  }

  if (modalidadRaw !== 'Regular' && modalidadRaw !== 'Libre') {
    errors.modalidad = 'La modalidad debe ser Regular o Libre.';
  }

  if (!/^\d{4}$/.test(anioCursado)) {
    errors.anioCursado = 'Indicá un año de cursado válido (4 dígitos).';
  }

  if (!profesor || profesor.length < 2) {
    errors.profesor = 'Indicá el apellido/nombre del profesor de la cátedra.';
  }

  const errorValues = Object.values(errors);
  if (errorValues.length > 0) {
    return {
      ok: false,
      errors,
      firstError: errorValues[0],
    };
  }

  return {
    ok: true,
    errors: {},
    data: {
      carreraCode,
      anioMateria: anioMateriaNum as 1 | 2 | 3,
      modalidad: modalidadRaw as ModalidadExamen,
      materiaCodigo,
      anioCursado,
      profesor,
    },
  };
}
