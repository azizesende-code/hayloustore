const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};
const KEY = 'catalog';

// Public: anyone can read the catalog
export async function onRequestGet({ env, request }) {
  try {
    let products = await env.HAYLOUSTORE_KV.get(KEY, { type: 'json' });
    if (!products || !Array.isArray(products) || products.length === 0) {
      // First run: bootstrap from the static seed file (served as a normal
      // asset, not bundled into this function, so its size isn't limited
      // by the Worker script size cap).
      const assetUrl = new URL('/default-products.json', request.url);
      const assetRes = await env.ASSETS.fetch(assetUrl);
      if (!assetRes.ok) throw new Error('seed file not found');
      products = await assetRes.json();
      await env.HAYLOUSTORE_KV.put(KEY, JSON.stringify(products));
    }
    return new Response(JSON.stringify(products), { headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur de lecture du catalogue', detail: String(err && err.message || err) }), { status: 500, headers: HEADERS });
  }
}

// Protected: only requests with the correct admin password can overwrite the catalog
export async function onRequestPost({ request, env }) {
  const provided = request.headers.get('x-admin-password');
  if (!env.ADMIN_PASSWORD || provided !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Mot de passe administrateur invalide' }), { status: 401, headers: HEADERS });
  }
  try {
    const body = await request.json();
    if (!Array.isArray(body)) throw new Error('invalid payload');
    await env.HAYLOUSTORE_KV.put(KEY, JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true }), { headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Données invalides' }), { status: 400, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: HEADERS });
}
