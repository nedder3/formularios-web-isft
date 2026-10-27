import fs from 'node:fs';
import type { APIRoute } from 'astro';
import { getCarreraByCode } from '../../../lib/academicService';
import { getExcelFilePathForCarrera } from '../../../lib/excelService';

export const GET: APIRoute = async ({ params }) => {
  const code = params.carrera ?? '';
  const carrera = getCarreraByCode(code);

  if (!carrera) {
    return new Response('Carrera no encontrada', { status: 404 });
  }

  const filePath = getExcelFilePathForCarrera(carrera.code);
  if (!fs.existsSync(filePath)) {
    return new Response('Aún no hay inscripciones registradas para esta carrera.', {
      status: 404,
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Inscripciones_${carrera.code}.xlsx"`,
    },
  });
};
