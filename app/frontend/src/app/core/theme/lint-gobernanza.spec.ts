import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Gobernanza del tema (FR-013, SC-005): `lint:primeng` rechaza colores y utilidades de color fuera del tema.
 * Solo usa directorios temporales (LINT_ROOT): el código real se comprueba en la verificación final.
 */
const SCRIPT = join(process.cwd(), 'scripts', 'lint-primeng.mjs');

describe('lint:primeng — gobernanza del tema', () => {
  let raiz: string;

  beforeEach(() => {
    raiz = mkdtempSync(join(tmpdir(), 'lint-gobernanza-'));
  });

  afterEach(() => {
    rmSync(raiz, { recursive: true, force: true });
  });

  function escribir(ruta: string, contenido: string): void {
    const destino = join(raiz, ...ruta.split('/'));
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, contenido, 'utf8');
  }

  function lint() {
    const r = spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, LINT_ROOT: raiz }, encoding: 'utf8' });
    return { codigo: r.status, salida: `${r.stdout}${r.stderr}` };
  }

  it('un archivo limpio termina con código 0', () => {
    escribir('app/features/pagina/pagina.component.html', '<p class="flex items-center gap-2">Hola</p>\n');
    escribir('app/features/pagina/pagina.component.ts', 'export const x = 1;\n');
    expect(lint().codigo).toBe(0);
  });

  describe.each([
    ['#fff en .ts', 'app/features/a/a.ts', "export const c = '#fff';\n", 'a.ts:1'],
    ['bg-red-500 en .html', 'app/features/a/a.html', '<p>x</p>\n<p class="bg-red-500">x</p>\n', 'a.html:2'],
    ['style="color: red"', 'app/features/a/a.html', '<p>x</p>\n<p style="color: red">x</p>\n', 'a.html:2'],
    ['[style.background-color] en .html', 'app/features/a/a.html', '<p [style.background-color]="c">x</p>\n', 'a.html:1'],
    ['el.style.color en .ts', 'app/features/a/a.ts', "const el = document.body;\nel.style.color = 'red';\n", 'a.ts:2'],
    ['.scss con border', 'app/features/a/a.scss', '.x {\n  border: 1px solid;\n}\n', 'a.scss:2'],
    ['bg-surface-100 en una página', 'app/features/a/a.html', '<tr [class.bg-surface-100]="x">x</tr>\n', 'a.html:1'],
    ['rounded-lg en core/layout', 'app/core/layout/a.html', '<div class="rounded-lg">x</div>\n', 'a.html:1'],
    ['shadow-md en core/layout', 'app/core/layout/a.html', '<div class="shadow-md">x</div>\n', 'a.html:1'],
    ['text-muted-color en una página', 'app/features/a/a.html', '<small class="block text-muted-color">x</small>\n', 'a.html:1'],
    ['rgb() en .css', 'app/features/a/a.css', '.x {\n  --c: rgb(1 2 3);\n}\n', 'a.css:2'],
  ])('rechaza %s', (_nombre, ruta, contenido, ubicacion) => {
    it('código ≠ 0 e imprime archivo y línea', () => {
      escribir(ruta, contenido);
      const { codigo, salida } = lint();
      expect(codigo).not.toBe(0);
      expect(salida).toContain(ubicacion);
    });
  });

  describe.each([
    ['colorScheme en .ts', 'app/core/theme/a.ts', "document.documentElement.style.colorScheme = 'dark';\n"],
    ['colorScheme en index.html', 'index.html', '<html><head><script>document.documentElement.style.colorScheme = "dark";</script></head></html>\n'],
    ['getColor(x) en .ts', 'app/features/a/a.ts', 'const v = getColor(x);\n'],
    ['.color( en .ts', 'app/features/a/a.ts', 'const v = token.color(x);\n'],
    ['#end y #add como referencias', 'app/features/a/a.html', '<ng-template #end><p-button #add /></ng-template>\n'],
    ['[style] solo con width', 'app/features/a/a.html', '<p-select [style]="{ width: \'100%\' }" />\n'],
    ['[rounded]="true"', 'app/features/a/a.html', '<p-button [rounded]="true" />\n'],
    ['tokens semánticos con dark: en el shell', 'app/core/layout/a.html', '<div class="bg-surface-50 dark:bg-surface-900 text-color">x</div>\n'],
    ['colores literales en app-theme.ts', 'app/core/theme/app-theme.ts', "export const c = '#0092b8';\n"],
  ])('no rechaza %s', (_nombre, ruta, contenido) => {
    it('código 0', () => {
      escribir(ruta, contenido);
      const { codigo, salida } = lint();
      expect({ codigo, salida: codigo === 0 ? '' : salida }).toEqual({ codigo: 0, salida: '' });
    });
  });

  it('ignora los *.spec.ts', () => {
    escribir('app/features/a/a.spec.ts', "const c = '#fff';\n");
    expect(lint().codigo).toBe(0);
  });
});
