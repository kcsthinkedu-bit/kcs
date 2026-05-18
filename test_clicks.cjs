const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf8');
const vc = new VirtualConsole();
vc.on('jsdomError', e => console.error('JSDOM_ERROR:', e && e.message || e));
vc.on('error', e => console.error('CONSOLE_ERROR:', e));
const dom = new JSDOM(html, {
  runScripts: 'dangerously', resources: 'usable', url: 'https://example.vercel.app/coloringbook/', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(window) {
    window.alert = (...args) => console.log('ALERT:', ...args);
    window.fetch = async (...args) => ({ ok: true, json: async()=>({valid:true}) });
    window.requestAnimationFrame = cb => setTimeout(cb, 0);
    window.ResizeObserver = class { observe(){} disconnect(){} unobserve(){} };
    window.navigator.clipboard = { read: async()=>[], write: async()=>{}, readText: async()=>'', writeText: async()=>{} };
    window.open = ()=>{};
    const proto = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
    if (proto) proto.getContext = () => ({ measureText:()=>({width:10}), fillRect(){}, drawImage(){}, getImageData(){return {data:[]}}, putImageData(){}, createLinearGradient(){return {addColorStop(){}}}, fillText(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, arc(){}, closePath(){}, clearRect(){}, scale(){}, save(){}, restore(){}, translate(){}, rotate(){}, font:'', textAlign:'', textBaseline:'' });
  }
});
setTimeout(() => {
  const d = dom.window.document;
  const count = ()=>d.querySelectorAll('.page-item[data-select-kind="spread"]').length;
  console.log('before', count());
  const btn = d.getElementById('addPageTopBtn');
  if (btn) btn.click();
  setTimeout(()=>{
    console.log('after', count());
    process.exit(0);
  }, 500);
}, 1500);
