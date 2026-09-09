import fs from 'node:fs';
import crypto from 'node:crypto';
const source = 'public/case-studies/groupconv-atlas/rtx4090-shapes.json';
const rows = JSON.parse(fs.readFileSync(source, 'utf8'));
const current = JSON.parse(fs.readFileSync('public/case-studies/groupconv-atlas/rtx4090-atlas.json','utf8'));

const geo = v => Math.exp(v.reduce((sum,n)=>sum+Math.log(n),0)/v.length);
const result = [];
const channelsPerGroup = [...new Set(rows.map(r => r.cin/r.groups))].sort((a,b)=>a-b);
for (const baseline of ['k0','torch_cuda_tuned']) for (const cpg of channelsPerGroup) {
  const selected = rows.filter(r => r.cin/r.groups===cpg && current.comparisons.some(c=>c.shape_id===r.shape_id && c.baseline===baseline && c.candidate==='k3' && c.candidate_status==='PASS' && c.baseline_status==='PASS'));
  if (!selected.length) continue;
  const ratio = key => geo(selected.map(r => current.comparisons.find(c=>c.shape_id===r.shape_id && c.baseline===baseline && c.candidate==='k3' && c.boundary===key).ratio));
  result.push({baseline,cpg,shapes:selected.length,graph:ratio('t_device_op_graph_us'),eager:ratio('t_api_us')});
}
const data = {rows:result,shape_count:new Set(rows.map(r=>r.shape_id)).size,record_count:Object.values(current.status_counts).reduce((a,b)=>a+b,0),status_counts:current.status_counts,definition:'median of batch medians baseline / candidate; geometric mean across shapes per cpg'};
const details = {shapes:rows, comparisons:current.comparisons.filter(c=>['k1','k2','k3'].includes(c.candidate)).map(c=>({shape_id:c.shape_id,baseline:c.baseline,candidate:c.candidate,boundary:c.boundary,ratio:c.ratio,ci95:c.ci95,classification:c.candidate_status==='UNSUPPORTED'?'UNSUPPORTED':c.classification}))};
const detailPath='public/case-studies/groupconv-atlas/map-details.json';
const detailText=JSON.stringify(details)+'\n';
if(process.argv.includes('--check')) { if(fs.readFileSync(detailPath,'utf8')!==detailText) throw new Error('GroupConv detail drift'); } else fs.writeFileSync(detailPath,detailText);
const output = 'src/data/groupconv-summary.json';
const text = JSON.stringify(data,null,2)+'\n';
if(process.argv.includes('--check')) {
  if(fs.readFileSync(output,'utf8')!==text) throw new Error('GroupConv summary drift');
  const manifest=JSON.parse(fs.readFileSync('public/case-studies/groupconv-atlas/provenance.json','utf8'));
  for (const [name,hash] of Object.entries(manifest.files)) if(crypto.createHash('sha256').update(fs.readFileSync(`public/case-studies/groupconv-atlas/${name}`)).digest('hex')!==hash) throw new Error(`GroupConv asset hash drift: ${name}`);
  if(manifest.files['rtx4090-atlas.json']!==crypto.createHash('sha256').update(fs.readFileSync('public/case-studies/groupconv-atlas/rtx4090-atlas.json')).digest('hex')) throw new Error('Current GroupConv source hash drift');
  if(manifest.files['rtx4090-shapes.json']!==crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')) throw new Error('GroupConv source hash drift');
} else fs.writeFileSync(output,text);
console.log('GroupConv summary verified: '+data.shape_count+' shapes');
