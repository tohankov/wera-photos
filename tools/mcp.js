// Generic MCP stdio call: node mcp.js <tool> <argsJsonFile|-> <outFile>
// Prints only a short summary; full result goes to outFile.
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');
const [,, name, argsFile, outFile] = process.argv;
const args = argsFile === '-' ? {} : JSON.parse(fs.readFileSync(argsFile, 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8')).mcpServers.horoshop;
const child = spawn(cfg.command, cfg.args, { env: { ...process.env, ...cfg.env }});
let buf = ''; const pending = new Map(); let nextId = 1;
child.stdout.setEncoding('utf8');
child.stdout.on('data', d => { buf += d.toString(); let i;
  while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
    let m; try { m = JSON.parse(line); } catch { continue; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } });
child.stderr.on('data', () => {});
function rpc(method, params) { const id = nextId++; child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), 600000); pending.set(id, m => { clearTimeout(t); res(m); }); }); }
(async () => {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'tie', version: '1' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const m = await rpc('tools/call', { name, arguments: { store: 'tlshop', ...args } });
  const text = m.error ? JSON.stringify(m.error) : (m.result.content || []).map(c => c.text).join('\n');
  let data; try { data = JSON.parse(text); } catch { data = text; }
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
  console.log(`isError=${!!(m.error || m.result.isError)} bytes=${text.length}`);
  child.kill(); process.exit(0);
})().catch(e => { console.error(e.message); child.kill(); process.exit(1); });
