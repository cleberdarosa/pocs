/**
 * Proxy de desenvolvimento para a Web.
 *
 * O navegador bloqueia chamadas diretas à API da Unimed por CORS (ela só aceita
 * a origem id-hml.unimedpoa.com.br). Esta rota roda no servidor do Expo e repassa
 * a requisição, onde CORS não se aplica. No Android/iOS o app chama a API direto.
 *
 * /api/proxy/<caminho>?<query>  →  https://api-hml.unimedpoa.com.br/<caminho>?<query>
 */
import { ApiConstants } from '@/core/constants/api';

const PREFIX = '/api/proxy';

// Apenas os cabeçalhos que a API realmente usa são repassados.
const FORWARDED_HEADERS = ['content-type', 'authorization', 'x-authorization', 'accept'];

async function proxy(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const url = new URL(request.url);
  const target = `${ApiConstants.baseUrl}${url.pathname.slice(PREFIX.length)}${url.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[PROXY][ERROR] ${request.method} ${target}: ${message}`);
    return Response.json({ error: 'Proxy falhou ao contactar a API.', detail: message }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
