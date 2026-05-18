const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync('/home/user/work/kcsv30/coloringbook/index.html', 'utf8');
const vc = new VirtualConsole();
vc.on('jsdomError', e => console.error('JSDOM_ERROR:', e && e.stack || e));
vc.on('error', e => console.error('CONSOLE_ERROR:', e));
vc.on('warn', e => console.error('CONSOLE_WARN:', e));
vc.on('log', e => console.log('CONSOLE_LOG:', e));
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'https://example.vercel.app/coloringbook/',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.alert = (...args) => console.log('ALERT:', ...args);
    window.fetch = async (...args) => ({ ok: true, json: async()=>({valid:true}) });
    window.requestAnimationFrame = cb => setTimeout(cb, 0);
    window.ResizeObserver = class { observe(){} disconnect(){} unobserve(){} };
    window.navigator.clipboard = { read: async()=>[], write: async()=>{}, readText: async()=>'', writeText: async()=>{} };
    window.open = (...args)=>console.log('WINDOW_OPEN', ...args);
  }
});
setTimeout(() => {
  const { window } = dom;
  console.log('loaded');
  const ids = ['addPageTopBtn','addPageRailBtn','viewerBtn','pasteClipboardBtn'];
  for (const id of ids) {
    const el = window.document.getElementById(id);
    console.log(id, !!el);
  }
  try {
    const btn = window.document.getElementById('addPageTopBtn');
    btn && btn.click();
    console.log('clicked addPageTopBtn');
  } catch (e) {
    console.error('CLICK_ERR', e && e.stack || e);
  }
  try {
    console.log('has window.state', !!window.state);
    console.log('has spreads', !!(window.state && window.state.spreads));
    console.log('spreads len', window.state && window.state.spreads && window.state.spreads.length);
  } catch (e) {
    console.error('STATE_ERR', e && e.stack || e);
  }
}, 1500);
setTimeout(()=>process.exit(0), 4000);
