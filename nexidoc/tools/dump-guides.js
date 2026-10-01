const fs=require('fs');const vm=require('vm');
const code=fs.readFileSync('guides.js','utf8');
const win={};const doc={getElementById:()=>null,createElement:()=>({style:{},appendChild(){},setAttribute(){}}),body:{appendChild(){}},head:{appendChild(){}},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};
const ctx={window:win,document:doc,localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},console,navigator:{},location:{}};
ctx.window.document=doc;vm.createContext(ctx);
try{vm.runInContext(code,ctx);}catch(e){console.error('run error:',String(e).slice(0,200));}
const G=ctx.window.HNX_HELP_GUIDES||[];fs.writeFileSync('guides.json',JSON.stringify(G));console.log('guides',G.length);
