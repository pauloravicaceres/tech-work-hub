// Falla si algún .html de src/ usa patrones de formulario prohibidos por la constitución
// (sección "Patrón Obligatorio de Formularios PrimeNG 22"). Uso: npm run lint:primeng
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src', import.meta.url));

const LINE_RULES = [
  { re: /class="[^"]*\bp-error\b/, why: '`p-error` no existe en PrimeNG 22: usar <p-message severity="error" variant="simple" size="small">' },
  { re: /class="[^"]*\bp-fluid\b/, why: '`class="p-fluid"` no aplica: usar el componente <p-fluid> (import Fluid de primeng/fluid)' },
  { re: /class="[^"]*\bp-(?:field|formgrid|grid|col-\d+|inputtext-(?:lg|sm))\b/, why: 'Clase heredada de PrimeNG ≤15: usar grid/col-* de PrimeFlex o el input `size`' },
  { re: /<p-sidebar\b/, why: '<p-sidebar> fue reemplazado por <p-drawer>' },
  { re: /\*ngIf|\*ngFor|\[\(ngModel\)\]/, why: 'Usar @if/@for y Reactive Forms tipados' },
];

// Etiquetas que pueden ocupar varias líneas: se analizan sobre el texto completo.
const NATIVE_TAG = /<(input|textarea|select)\b[^>]*>/g;
const ALLOWED = /\b(?:pInputText|pTextarea|pInputNumber|pDatePicker)\b|type="(?:checkbox|radio|hidden|file)"/;

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith('.html')) yield p;
  }
}

let violations = 0;
const report = (file, line, why, snippet) => {
  violations++;
  console.error(`${relative(process.cwd(), file)}:${line}: ${why}\n    ${snippet.trim()}`);
};

for (const file of htmlFiles(ROOT)) {
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    for (const { re, why } of LINE_RULES) if (re.test(line)) report(file, i + 1, why, line);
  });
  for (const m of text.matchAll(NATIVE_TAG)) {
    if (!ALLOWED.test(m[0])) {
      const line = text.slice(0, m.index).split('\n').length;
      report(file, line, 'Control nativo sin directiva PrimeNG: usar pInputText/pTextarea/p-select/...', m[0].split('\n')[0]);
    }
  }
}

if (violations) {
  console.error(`\n✖ lint:primeng — ${violations} violación(es). Ver constitución: "Patrón Obligatorio de Formularios PrimeNG 22".`);
  process.exit(1);
}
console.log('✔ lint:primeng — sin violaciones.');
