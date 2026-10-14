// One MCP stdio session for many tool calls (the per-call client logs in every time: ~75 s per call).
const { spawn } = require('child_process'); const fs = require('fs'), os = require('os'), path = require('path');
function open() {
  const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8')).mcpServers.horoshop;
  const child = spawn(cfg.command, cfg.args, { env: { ...process.env, ...cfg.env } });
  let buf = '', next = 1; const pending = new Map();
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue; let m; try { m = JSON.parse(line); } catch { continue; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } });
  child.stderr.on('data', () => {});
  const rpc = (method, params) => { const id = next++; child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout ' + method)), 600000); pending.set(id, m => { clearTimeout(t); res(m); }); }); };
  const ready = rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'session', version: '1' } }).then(() => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'));
  const call = async (name, args) => { await ready; const m = await rpc('tools/call', { name, arguments: { store: 'tlshop', ...args } }); const text = m.error ? JSON.stringify(m.error) : (m.result.content || []).map(c => c.text).join('\n'); try { return JSON.parse(text); } catch { return { raw: text, isError: !!(m.error || m.result.isError) }; } };
  return { call, close: () => child.kill() };
}
module.exports = { open };
