// fetch a storefront page passing the JS cookie challenges (any number of rounds)
module.exports = async function get(url) {
  const jar = {};
  const hdr = () => ({ 'User-Agent': 'Mozilla/5.0', Cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') });
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { headers: hdr(), redirect: 'follow' });
    for (const c of r.headers.getSetCookie?.() || []) { const [kv] = c.split(';'); const j = kv.indexOf('='); jar[kv.slice(0, j)] = kv.slice(j + 1); }
    const t = await r.text();
    const h = t.match(/defaultHash = "([a-f0-9]+)"/), n = t.match(/document\.cookie = "([a-z_]+)=/);
    if (!h || t.length > 2000) return { status: r.status, html: t };
    jar[n ? n[1] : 'challenge_passed'] = h[1];
    await new Promise(r => setTimeout(r, 1300));
  }
  throw new Error('challenge loop ' + url);
};
