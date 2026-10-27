import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.cwd(), 'design-system/html-to-design');
const h1 = fs.readFileSync(path.join(outDir, '1-investigacion.html'), 'utf8');
const h2 = fs.readFileSync(path.join(outDir, '2-sistema-diseno.html'), 'utf8');
const h3 = fs.readFileSync(path.join(outDir, '3-prototipo.html'), 'utf8');

function extractStyles(html) {
  const matches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  return matches.join('\n');
}

function extractMain(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return m ? m[1] : '';
}

const headMatch = h1.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const baseHead = headMatch ? headMatch[1] : '';

const combined = `<!DOCTYPE html>
<html lang="es">
<head>
${baseHead}
${extractStyles(h2)}
${extractStyles(h3)}
<style>
  .all-boards-stack {
    display: flex;
    flex-direction: column;
    gap: 120px;
    background: #1E1E1E;
    padding: 60px;
  }
</style>
</head>
<body class="is-embed">
  <div class="all-boards-stack">
    <div id="PAGINA_1_INVESTIGACION_Y_CONCEPTO">${extractMain(h1)}</div>
    <div id="PAGINA_2_SISTEMA_DE_DISENO">${extractMain(h2)}</div>
    <div id="PAGINA_3_PROTOTIPO_ALTA_FIDELIDAD">${extractMain(h3)}</div>
  </div>
</body>
</html>`;

const outFile = path.join(outDir, 'todo-en-1-import.html');
fs.writeFileSync(outFile, combined, 'utf8');
console.log(`Generado: ${outFile} (${combined.length} bytes)`);
