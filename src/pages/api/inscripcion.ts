import type { APIRoute } from 'astro';
import {
  getCarreraByCode,
  getMateriaInCarrera,
  yearNumberToLabel,
} from '../../lib/academicService.ts';
import { inscripcionRepository } from '../../lib/excelService.ts';
import { checkRateLimit } from '../../lib/rateLimit.ts';
import { validateStep1Personal, validateStep2Academic } from '../../lib/validation.ts';
import type { InscripcionFinalPayload } from '../../types/academic.ts';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      clientAddress ||
      'local';

    const rate = checkRateLimit(`ip:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Demasiadas solicitudes seguidas. Por favor aguardá ${rate.retryAfterSec} segundos.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rate.retryAfterSec),
          },
        }
      );
    }

    const body = await request.json();

    const step1Check = validateStep1Personal(body);
    if (!step1Check.ok || !step1Check.data) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: step1Check.firstError ?? 'Datos personales inválidos.',
          fieldErrors: step1Check.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const step2Check = validateStep2Academic(body);
    if (!step2Check.ok || !step2Check.data) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: step2Check.firstError ?? 'Datos académicos inválidos.',
          fieldErrors: step2Check.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const personal = step1Check.data;
    const academic = step2Check.data;

    // O(1) Map lookup for Career
    const carrera = getCarreraByCode(academic.carreraCode);
    if (!carrera) {
      return new Response(
        JSON.stringify({ ok: false, error: 'La carrera seleccionada no es válida.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // O(1) Map lookup for Subject within Career and Year
    const materia = getMateriaInCarrera(
      carrera.code,
      academic.materiaCodigo,
      academic.anioMateria
    );
    if (!materia) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'La materia seleccionada no corresponde a la carrera y año indicados.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload: InscripcionFinalPayload = {
      carreraCode: carrera.code,
      carreraNombre: carrera.name,
      carreraResolucion: carrera.resolution ?? 'S/R',
      apellidoNombre: personal.apellidoNombre,
      dni: personal.dni,
      telefono: personal.telefono,
      email: personal.email,
      cohorte: personal.cohorte,
      anioMateria: academic.anioMateria,
      anioMateriaLabel: yearNumberToLabel(academic.anioMateria),
      modalidad: academic.modalidad,
      materiaCodigo: materia.code,
      materiaNombre: materia.name,
      anioCursado: academic.anioCursado,
      profesor: academic.profesor,
    };

    const resultado = await inscripcionRepository.registrar(payload);

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error al procesar inscripción:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Ocurrió un error interno al guardar la inscripción en el Excel.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
