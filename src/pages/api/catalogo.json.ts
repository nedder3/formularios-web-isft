import type { APIRoute } from 'astro';
import { getClientCarrerasDto } from '../../lib/academicService';

export const GET: APIRoute = async () => {
  const dto = getClientCarrerasDto();
  return new Response(JSON.stringify({ carreras: dto }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
};
