const fs=require('fs'),path=require('path');
const {runCase}=require('./lib');
(async()=>{
  const only=process.argv[2]||'';
  const files=fs.readdirSync(__dirname).filter(f=>/\.test\.js$/.test(f)&&(!only||f.includes(only))).sort();
  let failed=0,total=0;
  for(const f of files){
    const cases=require(path.join(__dirname,f));
    for(const t of cases){
      if(!t)continue;
      total++;
      const r=await runCase(t);
      if(r.ok)console.log('  ✓ '+t.name);
      else{failed++;console.log('  ✗ '+t.name);r.fails.forEach(x=>console.log('      '+x.path+': expected '+JSON.stringify(x.expected)+' got '+JSON.stringify(x.actual)));
        if(r.out&&r.out.__threw)console.log('      threw: '+r.out.__threw);}
    }
  }
  console.log('\n'+(total-failed)+'/'+total+' passed');
  process.exit(failed?1:0);
})();
