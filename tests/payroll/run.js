const fs=require('fs'),path=require('path');
const {runCase}=require('./lib');
(async()=>{
  const only=process.argv[2]||'';
  let files=fs.readdirSync(__dirname).filter(f=>/\.test\.js$/.test(f)&&true).sort();
  /* CI: SHARD=i/N runs every N-th test file starting at i (0-based) so the suite can run in parallel jobs */
  const sh=String(process.env.SHARD||'').match(/^(\d+)\/(\d+)$/);
  if(sh){const i=+sh[1],n=+sh[2];files=files.filter((f,k)=>k%n===i);console.log('shard '+i+'/'+n+': '+files.join(', '));}
  let failed=0,total=0;
  for(const f of files){
    const cases=require(path.join(__dirname,f));
    for(const t of cases){
      if(!t)continue;
      if(only&&!f.includes(only)&&!t.name.includes(only))continue;
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
