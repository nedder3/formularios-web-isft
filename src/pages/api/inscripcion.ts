import type { APIRoute } from 'astro';
import { getCarreraByCode, yearNumberToLabel } from '../../lib/academicService';
import { registrarInscripcionEnExcel } from '../../lib/excelService';
import type { InscripcionFinalPayload, ModalidadExamen } from '../../types/academic';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const carreraCode = String(body.carreraCode ?? '').trim();
    const apellidoNombre = String(body.apellidoNombre ?? '').trim();
    const dni = String(body.dni ?? '').replace(/\D/g, '');
    const telefono = String(body.telefono ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const cohorte = String(body.cohorte ?? '').trim();
    const anioMateriaNum = Number(body.anioMateria) as 1 | 2 | 3;
    const modalidad = String(body.modalidad ?? '').trim() as ModalidadExamen;
    const materiaCodigo = String(body.materiaCodigo ?? '').trim();
    const anioCursado = String(body.anioCursado ?? '').trim();
    const profesor = String(body.profesor ?? '').trim();

    if (!apellidoNombre || apellidoNombre.length < 3) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Ingresá tu Apellido y Nombre completo.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/^\d{7,9}$/.test(dni)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'El DNI debe contener entre 7 y 9 dígitos numéricos sin puntos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!telefono || telefono.length < 6) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Ingresá un número de teléfono válido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Ingresá una dirección de correo electrónico válida.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/^\d{4}$/.test(cohorte)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Seleccioná un año de cohorte válido (4 dígitos).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const carrera = getCarreraByCode(carreraCode);
    if (!carrera) {
      return new Response(
        JSON.stringify({ ok: false, error: 'La carrera seleccionada no es válida.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (![1, 2, 3].includes(anioMateriaNum)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'El año de la materia debe ser 1°, 2° o 3°.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const materia = carrera.materias.find(
      (m) => m.code === materiaCodigo && m.year === anioMateriaNum
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

    if (modalidad !== 'Regular' && modalidad !== 'Libre') {
      return new Response(
        JSON.stringify({ ok: false, error: 'La modalidad debe ser Regular o Libre.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!/^\d{4}$/.test(anioCursado)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Indicá un año de cursado válido (4 dígitos).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!profesor || profesor.length < 2) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Indicá el apellido/nombre del profesor de la cátedra.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload: InscripcionFinalPayload = {
      carreraCode: carrera.code,
      carreraNombre: carrera.name,
      carreraResolucion: carrera.resolution ?? 'S/R',
      apellidoNombre,
      dni,
      telefono,
      email,
      cohorte,
      anioMateria: anioMateriaNum,
      anioMateriaLabel: yearNumberToLabel(anioMateriaNum),
      modalidad,
      materiaCodigo: materia.code,
      materiaNombre: materia.name,
      anioCursado,
      profesor,
    };

    const resultado = await registrarInscripcionEnExcel(payload);

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
