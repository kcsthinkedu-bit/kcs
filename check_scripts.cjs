const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('/home/user/work/kcsv30/coloringbook/index.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:[^>]*id="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/g)];
for (let i = 0; i < scripts.length; i++) {
  const id = scripts[i][1] || `script_${i+1}`;
  const code = scripts[i][2];
  try {
    new vm.Script(code, { filename: id + '.js' });
    console.log('OK', id);
  } catch (e) {
    console.log('ERR', id, e.name, e.message);
    const line = e.stack && /:(\d+):(\d+)/.exec(e.stack);
    if (line) {
      const ln = Number(line[1]);
      const col = Number(line[2]);
      const lines = code.split('\n');
      for (let j = Math.max(1, ln-2); j <= Math.min(lines.length, ln+2); j++) {
        console.log(String(j).padStart(4), (j===ln?'>':' '), lines[j-1]);
      }
      console.log('col', col);
    }
  }
}
