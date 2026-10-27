import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { APIRoute } from 'astro';
import { getCarreraByCode } from '../../../lib/academicService.ts';
import { getExcelFilePathForCarrera } from '../../../lib/excelService.ts';

export const GET: APIRoute = async ({ params, request, url }) => {
  // Optional Admin Key guard for production PII protection
  const requiredKey = process.env.ISFT_ADMIN_KEY;
  if (requiredKey) {
    const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const queryToken = url.searchParams.get('token');
    if (authHeader !== requiredKey && queryToken !== requiredKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Acceso restringido a Secretaría Académica (token requerido).',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const code = params.carrera ?? '';
  const carrera = getCarreraByCode(code);

  if (!carrera) {
    return new Response('Carrera no encontrada', { status: 404 });
  }

  const filePath = getExcelFilePathForCarrera(carrera.code);
  try {
    await fsp.access(filePath, fs.constants.R_OK);
  } catch {
    return new Response('Aún no hay inscripciones registradas para esta carrera.', {
      status: 404,
    });
  }

  const fileBuffer = await fsp.readFile(filePath);
  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Inscripciones_${carrera.code}.xlsx"`,
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};
