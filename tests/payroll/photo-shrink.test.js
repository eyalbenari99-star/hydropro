/* v21.96: photos never fill the browser — every image read as a data URL is resized to 1280 px JPEG */
module.exports=[
{ name:'📷 Photo v21.96: a 2400×1800 noisy photo (>1 MB) read by any upload screen comes back ≤1280 px wide and under 300 KB; a small icon passes unchanged; an oversized photo already saved in hydroPro_calls is shrunk by hnxShrinkStoredPhotos (v21.96)',
  seed:function(){localStorage.setItem('hnxlocal_photo_shrink_v1','1');},
  run:async()=>{
    await sleep(4000);
    const c=document.createElement('canvas');c.width=2400;c.height=1800;const x=c.getContext('2d');const id=x.createImageData(2400,1800);for(let i=0;i<id.data.length;i+=4){const px=(i/4)%2400,py=((i/4)/2400)|0;id.data[i]=(px/10+Math.random()*40)|0;id.data[i+1]=(py/8+Math.random()*40)|0;id.data[i+2]=((px+py)/20+Math.random()*40)|0;id.data[i+3]=255;}x.putImageData(id,0,0);
    const big=await new Promise(r=>c.toBlob(r,'image/jpeg',0.95));
    const read=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);});
    const out=await read(big);const img=new Image();await new Promise(r=>{img.onload=r;img.src=out;});
    const s=document.createElement('canvas');s.width=16;s.height=16;const small=await new Promise(r=>s.toBlob(r,'image/png'));const so=await read(small);
    const bigUrl=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);FileReader.prototype.readAsDataURL.call(f,new Blob([new Uint8Array(1)]));}).then(()=>{const t=document.createElement('canvas');t.width=2000;t.height=1500;const tx=t.getContext('2d');const d=tx.createImageData(2000,1500);for(let i=0;i<d.data.length;i++)d.data[i]=(Math.random()*255)|0;tx.putImageData(d,0,0);return t.toDataURL('image/jpeg',0.95);});
    localStorage.setItem('hydroPro_calls',JSON.stringify([{id:'C1',photo:bigUrl}]));const before=localStorage.getItem('hydroPro_calls').length;
    const r=await window.hnxShrinkStoredPhotos();const after=localStorage.getItem('hydroPro_calls').length;const still=JSON.parse(localStorage.getItem('hydroPro_calls'))[0].photo.indexOf('data:image/jpeg;base64,')===0;
    return {bigIn:big.size>1000000,w:img.naturalWidth<=1280,kb:out.length*0.75<300*1024,smallSame:so.length<2000,stored:after<before/3,still,photos:r.photos};},
  expect:{bigIn:true,w:true,kb:true,smallSame:true,stored:true,still:true,photos:1} }
];
