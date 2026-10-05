// Falla si algún .html de src/ usa patrones de formulario prohibidos por la constitución
// (sección "Patrón Obligatorio de Formularios PrimeNG 22"). Uso: npm run lint:primeng
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src', import.meta.url));

const LINE_RULES = [
  { re: /class="[^"]*\bp-error\b/, why: '`p-error` no existe en PrimeNG 22: usar <p-message severity="error" variant="simple" size="small">' },
  { re: /class="[^"]*\bp-fluid\b/, why: '`class="p-fluid"` no aplica: usar el componente <p-fluid> (import Fluid de primeng/fluid)' },
  { re: /class="[^"]*\bp-(?:field|formgrid|grid|col-\d+|inputtext-(?:lg|sm))\b/, why: 'Clase heredada de PrimeNG ≤15: usar grid-cols-*/col-span-* de Tailwind o el input `size`' },
  { re: /(?:class|styleClass)="[^"]*\b(?:col-\d+|(?:sm|md|lg|xl):col-\d+|justify-content-\w+|align-items-\w+|text-secondary|border-round(?:-\w+)?|flex-column|flex-row-reverse)\b/, why: 'Clase de PrimeFlex (ya no está en el stack): usar Tailwind (col-span-*, justify-*, items-*, text-muted-color, rounded-*, flex-col)' },
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

// Reglas globales (HU-035, ADR-010) sobre .css/.scss/.html/.ts de src/ (sin specs).
// Los comentarios se descartan antes de analizar; aun así, no escribir `font-family` en comentarios ni cadenas.
const GLOBAL_EXT = /\.(?:css|scss|html|ts)$/;
const FORBIDDEN = [
  { re: /::ng-deep/g, why: '`::ng-deep` prohibido: ajustar PrimeNG con [style], [class] o styleClass' },
  { re: /!important/g, why: '`!important` prohibido' },
  { re: /\bed-grid\b/g, why: '`ed-grid` es del template de referencia: usar grid de Tailwind' },
  { re: /primeng\/(?:dropdown|calendar)\b/g, why: 'Componente retirado en PrimeNG 22: usar primeng/select y primeng/datepicker' },
];
const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function* sourceFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* sourceFiles(p);
    else if (GLOBAL_EXT.test(name) && !name.endsWith('.spec.ts')) yield p;
  }
}

const fontFamilyHits = [];
const bodyMarginHits = [];
for (const file of sourceFiles(ROOT)) {
  const text = stripComments(readFileSync(file, 'utf8'));
  const lineOf = (index) => text.slice(0, index).split('\n').length;
  for (const { re, why } of FORBIDDEN)
    for (const m of text.matchAll(re)) report(file, lineOf(m.index), why, m[0]);
  for (const m of text.matchAll(/font-family\s*:/g)) fontFamilyHits.push([file, lineOf(m.index)]);
  for (const m of text.matchAll(/(?:^|[}\s,])body\s*\{[^}]*\bmargin\s*:/g)) bodyMarginHits.push([file, lineOf(m.index)]);
}
for (const [label, hits] of [['font-family', fontFamilyHits], ['margen de body', bodyMarginHits]]) {
  if (hits.length > 1)
    for (const [file, line] of hits) report(file, line, `Más de una declaración de ${label}: solo se permite una, en src/styles.css`, label);
}

if (violations) {
  console.error(`\n✖ lint:primeng — ${violations} violación(es). Ver constitución: "Patrón Obligatorio de Formularios PrimeNG 22".`);
  process.exit(1);
}
console.log('✔ lint:primeng — sin violaciones.');
