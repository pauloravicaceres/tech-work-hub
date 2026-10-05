import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

// QA-AUTO HU-035 — contrato estático de estilos globales (FR-008..FR-011, SC-006).
// Escanea el código fuente real de src/ (sin specs) y falla si se rompe la regla "una sola declaración".
const SRC = join(__dirname, '..', '..', '..');

function* sourceFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* sourceFiles(p);
    else if (/\.(css|scss|html|ts)$/.test(name) && !name.endsWith('.spec.ts')) yield p;
  }
}

const stripComments = (text: string): string =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const files = Array.from(sourceFiles(SRC)).map((file) => ({ file, text: stripComments(readFileSync(file, 'utf8')) }));
const hitsOf = (re: RegExp) => files.filter(({ text }) => re.test(text)).map(({ file }) => file.replace(SRC, ''));

describe('HU-035 contrato de estilos globales (QA)', () => {
  it('FontFamily_EnTodoElFrontend_DebeDeclararseExactamenteUnaVezEnStylesCss', () => {
    // Arrange
    const total = files.reduce((n, { text }) => n + (text.match(/font-family\s*:/g)?.length ?? 0), 0);

    // Act
    const archivos = hitsOf(/font-family\s*:/);

    // Assert
    expect(total).toBe(1);
    expect(archivos).toEqual([`${sep}styles.css`]);
  });

  it('MargenDeBody_EnTodoElFrontend_DebeDeclararseUnaSolaVezEnStylesCss', () => {
    // Arrange
    const re = /(?:^|[}\s,])body\s*\{[^}]*\bmargin\s*:/;

    // Act
    const archivos = hitsOf(re);

    // Assert
    expect(archivos).toHaveLength(1);
    expect(archivos[0]).toMatch(/styles\.css$/);
  });

  it('StylesCss_DebeUsarFuenteSansDelTemaYNoDescargarFuentesExternas', () => {
    // Arrange
    const css = readFileSync(join(SRC, 'styles.css'), 'utf8');

    // Act / Assert
    expect(css).toMatch(/font-family:\s*var\(--font-sans\)/);
    expect(css).not.toMatch(/@font-face|fonts\.googleapis|fonts\.gstatic|@import\s+url\(/);
  });

  it.each([
    ['::ng-deep', /::ng-deep/],
    ['!important', /!important/],
    ['ed-grid', /\bed-grid\b/],
    ['primeflex', /primeflex/i],
  ])('CodigoFuente_NoDebeContener_%s', (_nombre, re) => {
    // Act
    const archivos = hitsOf(re);

    // Assert
    expect(archivos).toEqual([]);
  });

  it('CodigoFuente_NoDebeReutilizarLaPlantillaAntiguaTemplatePrimeng', () => {
    // Act
    const archivos = hitsOf(/template-primeng/);

    // Assert
    expect(archivos).toEqual([]);
  });

  it('EsqueletoUi_NoDebeDefinirColoresBordesSombrasNiEstilosEnLinea', () => {
    // Arrange
    const layoutFiles = files.filter(({ file }) => file.includes(join('core', 'layout')));

    // Act
    const infractores = layoutFiles
      .filter(({ text }) => /\sstyle\s*=|#[0-9a-fA-F]{3,8}\b|rgba?\(|box-shadow|\sstyles\s*:/.test(text.replace(/&#\d+;/g, '')))
      .map(({ file }) => file.replace(SRC, ''));

    // Assert
    expect(layoutFiles.length).toBeGreaterThan(0);
    expect(infractores).toEqual([]);
  });

  it('ComponentesDelEsqueleto_NoDebenTenerHojasDeEstiloPropias', () => {
    // Act
    const css = files.filter(({ file }) => file.includes(join('core', 'layout')) && /\.s?css$/.test(file));

    // Assert
    expect(css).toEqual([]);
  });
});
