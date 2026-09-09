import fs from 'node:fs';
import { routableProjects, repositoryNewTabLabel as canonicalLabel } from '../src/lib/projects.ts';
import { repositoryNewTabLabel } from '../src/lib/project-repository-labels.ts';
if(JSON.stringify(repositoryNewTabLabel)!==JSON.stringify(canonicalLabel))throw new Error('Repository label parity drift');
const output='src/data/generated/project-navigation.json';
const text=JSON.stringify(routableProjects.map(({slug,title,navigationLabel,glossZh})=>({slug,title,navigationLabel,glossZh})),null,2)+'\n';
if(process.argv.includes('--check')) { if(fs.readFileSync(output,'utf8')!==text)throw new Error('Project navigation projection drift'); } else fs.writeFileSync(output,text);
console.log('Project navigation projection verified.');
