const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Only checks the password for the login screen's UX.
// The real protection lives in products.js, which independently re-checks
// the x-admin-password header before accepting any write.
export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();
    const ok = !!env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD;
    return new Response(JSON.stringify({ ok }), { status: ok ? 200 : 401, headers: HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: HEADERS });
  }
}

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: HEADERS });
}
