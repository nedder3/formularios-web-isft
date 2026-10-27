import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

const scaffoldingPath = path.resolve(process.cwd(), 'isft_191_scaffolding.json');
const scaffolding = JSON.parse(fs.readFileSync(scaffoldingPath, 'utf-8'));

const outDir = path.resolve(process.cwd(), 'planillas-generadas');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'ISFT191_Padron_Docentes_e_Inscripciones.xlsx');

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Secretaría Académica ISFT N° 191';
workbook.created = new Date();

// Hoja 1: Directorio de Mails de Docentes (211 asignaturas de las 8 carreras)
const sheetDocentes = workbook.addWorksheet('Directorio_Docentes');
sheetDocentes.columns = [
  { header: 'Carrera_Codigo', key: 'carreraCode', width: 16 },
  { header: 'Carrera_Nombre', key: 'carreraName', width: 42 },
  { header: 'Resolucion', key: 'resolution', width: 16 },
  { header: 'Anio_Plan', key: 'year', width: 12 },
  { header: 'Materia_Codigo', key: 'materiaCode', width: 16 },
  { header: 'Materia_Nombre', key: 'materiaName', width: 40 },
  { header: 'Docente_Titular', key: 'docente', width: 45 },
  { header: 'Email_Docente', key: 'email', width: 28 },
  { header: 'Envio_Activo', key: 'activo', width: 14 },
  { header: 'Frecuencia', key: 'frecuencia', width: 18 },
];

sheetDocentes.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
sheetDocentes.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF3438AA' },
};

let count = 0;
for (const carrera of scaffolding.carreras) {
  for (const materia of carrera.materias) {
    sheetDocentes.addRow({
      carreraCode: carrera.code,
      carreraName: carrera.name,
      resolution: carrera.resolution ?? 'Vigente',
      year: `${materia.year}° Año`,
      materiaCode: materia.code,
      materiaName: materia.name,
      docente: `Docente ${materia.name}`,
      email: 'arij.dev@gmail.com',
      activo: 'SI',
      frecuencia: 'Cada 15 dias',
    });
    count++;
  }
}

// Hoja 2: Padrón Consolidado de Inscripciones a Exámenes Finales
const sheetInscripciones = workbook.addWorksheet('Inscripciones_Finales');
sheetInscripciones.columns = [
  { header: 'ID Comprobante', key: 'comprobanteId', width: 20 },
  { header: 'Fecha y Hora (ISO)', key: 'fechaIso', width: 24 },
  { header: 'Apellido y Nombre', key: 'apellidoNombre', width: 30 },
  { header: 'DNI', key: 'dni', width: 15 },
  { header: 'Teléfono', key: 'telefono', width: 16 },
  { header: 'Correo Electrónico', key: 'email', width: 28 },
  { header: 'Cohorte', key: 'cohorte', width: 12 },
  { header: 'Carrera_Codigo', key: 'carreraCode', width: 16 },
  { header: 'Carrera_Nombre', key: 'carreraNombre', width: 38 },
  { header: 'Año de la Materia', key: 'anioMateriaLabel', width: 18 },
  { header: 'Código Materia', key: 'materiaCodigo', width: 16 },
  { header: 'Asignatura a Rendir', key: 'materiaNombre', width: 36 },
  { header: 'Modalidad Examen', key: 'modalidad', width: 16 },
  { header: 'Año de Cursada', key: 'anioCursado', width: 15 },
  { header: 'Docente Cátedra', key: 'profesor', width: 40 },
  { header: 'Estado Envío Docente', key: 'estadoEnvio', width: 22 },
];

sheetInscripciones.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
sheetInscripciones.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF3438AA' },
};

await workbook.xlsx.writeFile(outFile);
console.log(`Generado: ${outFile} (${count} asignaturas con 'Docente + Nombre de Materia')`);
