export interface Materia {
  id: number;
  carrera_id: number;
  code: string;
  name: string;
  year: 1 | 2 | 3;
}

export interface Carrera {
  id: number;
  code: string;
  name: string;
  resolution: string | null;
  source_sheet: string;
  materias: Materia[];
}

export interface AcademicScaffolding {
  institucion: string;
  carreras: Carrera[];
}

/**
 * Lightweight DTO projected for the browser client (strips internal DB/Sheet IDs).
 */
export interface ClientMateriaDto {
  code: string;
  name: string;
  year: 1 | 2 | 3;
}

export interface ClientCarreraDto {
  code: string;
  name: string;
  resolution: string | null;
  countsByYear: Record<1 | 2 | 3, number>;
  materias: ClientMateriaDto[];
}

export type ModalidadExamen = 'Regular' | 'Libre';

export type AnioMateriaLabel = 'Primero' | 'Segundo' | 'Tercero';

/**
 * Representa el payload de inscripción validado que se persiste en el Excel
 * homogéneo por carrera (10 columnas exactas según formato_final_a_enviar.xlsx)
 * y preparado para futura sincronización con SIU Guaraní.
 */
export interface InscripcionFinalPayload {
  carreraCode: string;
  carreraNombre: string;
  carreraResolucion: string;
  apellidoNombre: string;
  dni: string;
  telefono: string;
  email: string;
  cohorte: string;
  anioMateria: 1 | 2 | 3;
  anioMateriaLabel: AnioMateriaLabel;
  modalidad: ModalidadExamen;
  materiaCodigo: string;
  materiaNombre: string;
  anioCursado: string;
  profesor: string;
}

export interface InscripcionResult {
  ok: boolean;
  comprobanteId: string;
  fechaIso: string;
  archivoCarrera: string;
  duplicado?: boolean;
  datos: InscripcionFinalPayload;
}

export interface IInscripcionRepository {
  registrar(payload: InscripcionFinalPayload): Promise<InscripcionResult>;
}
