// Falla si algún .html de src/ usa patrones de formulario prohibidos por la constitución
// (sección "Patrón Obligatorio de Formularios PrimeNG 22"). Uso: npm run lint:primeng
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// LINT_ROOT permite apuntar a otra raíz de `src/` (lo usa lint-gobernanza.spec.ts con directorios temporales).
const ROOT = process.env.LINT_ROOT ? resolve(process.env.LINT_ROOT) : fileURLToPath(new URL('../src', import.meta.url));

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

// Gobernanza del tema (HU-036): `app/core/theme/app-theme.ts` es la única fuente de colores; el resto
// usa tokens semánticos. Contrato: specs/036-HU_theming_claro_oscuro_ui/contracts/lint-gobernanza.md.
const posix = (p) => p.split('\\').join('/');
const THEME_FILE = 'app/core/theme/app-theme.ts';
const LAYOUT_DIR = 'app/core/layout/';
const GLOBAL_STYLES = 'styles.css';

const HEX_COLOR = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const COLOR_FUNCTION = /(?<![\w$.-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;
const COLOR_NAMES = '(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)';
const TAILWIND_PALETTE = new RegExp(
  `(?<![\\w-])(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|placeholder)-(?:${COLOR_NAMES}(?:-\\d{2,3})?|white|black)(?:/\\d+)?(?![\\w-])`,
  'g',
);
const STYLE_PROP = '(?:color|background[\\w-]*|border[\\w-]*|outline[\\w-]*|box-?[sS]hadow|text-?[sS]hadow|fill|stroke|accent-?[cC]olor|caret-?[cC]olor)';
const INLINE_STYLE_DECL = new RegExp(`(?<![\\w-])${STYLE_PROP}['"]?\\s*:`, 'g');
const STYLE_BINDING_NAME = new RegExp(`^\\[style\\.${STYLE_PROP}(?![\\w-])`);
// `color-scheme` / `style.colorScheme` quedan fuera: el `\b` tras `color` no coincide con `colorScheme`.
const STYLE_ASSIGNMENT = /\.style\.(?:color|background\w*|border\w*|outline\w*|boxShadow|textShadow|fill|stroke|accentColor|caretColor)\b/g;
const STYLE_SETTER = new RegExp(`(?:setProperty|setStyle)\\([^)]*['"\`]${STYLE_PROP}['"\`]`, 'g');
const CSS_DECL = /(?<![\w-])(?:color|background[\w-]*|border[\w-]*|outline[\w-]*|box-shadow|text-shadow|fill|stroke)\s*:/g;
const THEME_UTILITY = /(?<![\w-])(?:(?:bg|text|border)-surface-\d+|bg-primary(?:-[\w-]+)?|text-primary(?:-[\w-]+)?|text-muted-color|text-color|dark:[\w:/[\]-]+)(?![\w-])/g;
const SHAPE_UTILITY = /(?<![\w-])(?:rounded|shadow)(?:-[\w/[\].-]+)?(?![\w-])/g;
const CLASS_ATTR_NAME = /^(?:class|\w*[cC]lass|\[class(?:\.[^\]]+)?\]|\[ngClass\]|\[\w*[cC]lass\])$/;
const ATTRIBUTE = /([[(*]?[\w.:@-]+[\])]?)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
const TS_CLASS_PROP = /\b(?:class|\w*Class)\s*[:=]\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;

for (const file of sourceFiles(ROOT)) {
  const rel = posix(relative(ROOT, file));
  const raw = stripComments(readFileSync(file, 'utf8'));
  const lineAt = (index) => raw.slice(0, index).split('\n').length;
  const hit = (regex, text, offset, why) => {
    for (const m of text.matchAll(regex)) report(file, lineAt(offset + m.index), why, m[0]);
  };
  const colorLiterals = (text, offset) => {
    if (rel === THEME_FILE) return;
    hit(HEX_COLOR, text, offset, 'Color literal fuera de app-theme.ts: usar tokens del tema');
    hit(COLOR_FUNCTION, text, offset, 'Función de color fuera de app-theme.ts: usar tokens del tema');
  };
  const classUtilities = (text, offset) => {
    hit(TAILWIND_PALETTE, text, offset, 'Clase de paleta de Tailwind: los colores salen del tema (bg-surface-*, text-color…)');
    if (rel.startsWith(LAYOUT_DIR)) hit(SHAPE_UTILITY, text, offset, 'Radio o sombra por clase: los radios los define el tema (el shell no usa rounded*/shadow*)');
    else hit(new RegExp(`${THEME_UTILITY.source}|${SHAPE_UTILITY.source}`, 'g'), text, offset, 'Utilidad de color, radio o sombra fuera de core/layout: el tema (o el shell) la resuelve');
  };

  if (file.endsWith('.ts')) {
    for (const m of raw.matchAll(STRING_LITERAL)) {
      const offset = m.index + 1;
      if (rel !== THEME_FILE) hit(HEX_COLOR, m[2], offset, 'Color literal fuera de app-theme.ts: usar tokens del tema');
      hit(TAILWIND_PALETTE, m[2], offset, 'Clase de paleta de Tailwind: los colores salen del tema (bg-surface-*, text-color…)');
    }
    if (rel !== THEME_FILE) hit(COLOR_FUNCTION, raw, 0, 'Función de color fuera de app-theme.ts: usar tokens del tema');
    hit(STYLE_ASSIGNMENT, raw, 0, 'Estilo de color en línea: usar clases del tema');
    hit(STYLE_SETTER, raw, 0, 'Estilo de color en línea: usar clases del tema');
    for (const m of raw.matchAll(TS_CLASS_PROP)) classUtilities(m[2], m.index + m[0].indexOf(m[2]));
  } else if (file.endsWith('.html')) {
    hit(STYLE_ASSIGNMENT, raw, 0, 'Estilo de color en línea: usar clases del tema');
    hit(STYLE_SETTER, raw, 0, 'Estilo de color en línea: usar clases del tema');
    for (const m of raw.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) colorLiterals(m[1], m.index + m[0].indexOf(m[1]));
    const sinScripts = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (s) => s.replace(/[^\n]/g, ' '));
    for (const m of sinScripts.matchAll(ATTRIBUTE)) {
      const [whole, name, dq, sq] = m;
      const value = dq ?? sq ?? '';
      const valueOffset = m.index + whole.indexOf(value, name.length);
      colorLiterals(value, valueOffset);
      if (name === 'style' || name === '[style]' || name === '[ngStyle]')
        hit(INLINE_STYLE_DECL, value, valueOffset, 'Estilo de color en línea: usar clases del tema');
      if (STYLE_BINDING_NAME.test(name)) report(file, lineAt(m.index), 'Estilo de color en línea: usar clases del tema', whole);
      if (CLASS_ATTR_NAME.test(name)) classUtilities(`${name} ${value}`, m.index);
    }
  } else {
    colorLiterals(raw, 0);
    if (rel !== GLOBAL_STYLES) hit(CSS_DECL, raw, 0, 'Declaración de color, borde o sombra en CSS/SCSS: usar tokens del tema');
  }
}

if (violations) {
  console.error(`\n✖ lint:primeng — ${violations} violación(es). Ver constitución: "Patrón Obligatorio de Formularios PrimeNG 22".`);
  process.exit(1);
}
console.log('✔ lint:primeng — sin violaciones.');
