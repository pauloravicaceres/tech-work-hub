import { appThemePreset } from './app-theme';

export type ThemeModeName = 'light' | 'dark';

type TokenTree = { [key: string]: string | number | TokenTree };

const MAX_DEPTH = 12;

/** Aplana un árbol de tokens a rutas con puntos; `hoverColor` pasa a `hover.color` como en las referencias `{a.b}`. */
function flatten(tree: TokenTree | undefined, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (!tree) return out;
  for (const [key, value] of Object.entries(tree)) {
    const segment = key.replace(/([A-Z])/g, '.$1').toLowerCase();
    const path = prefix ? `${prefix}.${segment}` : segment;
    if (typeof value === 'object') flatten(value, path, out);
    else out[path] = String(value);
  }
  return out;
}

const preset = appThemePreset as unknown as {
  primitive: TokenTree;
  semantic: TokenTree & { colorScheme: Record<ThemeModeName, TokenTree> };
  components: Record<string, TokenTree & { colorScheme?: Record<ThemeModeName, TokenTree> }>;
};

const { colorScheme: semanticSchemes, ...semanticBase } = preset.semantic;
const primitiveTokens = flatten(preset.primitive);

/** Tokens semánticos efectivos de un modo: base de Aura y, encima, los del esquema de color. */
export function semanticTokens(mode: ThemeModeName): Record<string, string> {
  return { ...flatten(semanticBase), ...flatten(semanticSchemes[mode]) };
}

/** Tokens efectivos de un componente en un modo (base y, encima, el esquema de color). */
export function componentTokens(component: string, mode: ThemeModeName): Record<string, string> {
  const { colorScheme, ...base } = preset.components[component];
  return { ...flatten(base), ...flatten(colorScheme?.[mode]) };
}

/** Resuelve un valor con referencias `{ruta}` hasta un literal (hex, rem, etc.). */
export function resolveValue(value: string, mode: ThemeModeName, depth = 0): string {
  if (depth > MAX_DEPTH) throw new Error(`Referencia circular al resolver "${value}"`);
  const semantic = semanticTokens(mode);
  return value.replace(/\{([^}]+)\}/g, (_match, ref: string) => {
    const next = semantic[ref] ?? primitiveTokens[ref];
    if (next === undefined) throw new Error(`Token no definido: {${ref}}`);
    return resolveValue(next, mode, depth + 1);
  });
}

/** Valor literal de un token semántico en un modo (p. ej. `content.background`). */
export function semanticValue(path: string, mode: ThemeModeName): string {
  const value = semanticTokens(mode)[path];
  if (value === undefined) throw new Error(`Token semántico no definido: ${path}`);
  if (value.includes('light-dark(')) throw new Error(`El token ${path} no está fijado por el tema en modo ${mode}`);
  return resolveValue(value, mode);
}

/** Valor literal de un token de componente en un modo (p. ej. `button`, `outlined.danger.color`). */
export function componentValue(component: string, path: string, mode: ThemeModeName): string {
  const value = componentTokens(component, mode)[path];
  if (value === undefined) throw new Error(`Token de ${component} no definido: ${path}`);
  if (value.includes('light-dark(')) throw new Error(`El token ${component}.${path} no está fijado por el tema en modo ${mode}`);
  return resolveValue(value, mode);
}

/** Valor literal de un token primitivo (p. ej. `cyan.600`). */
export function primitiveValue(path: string): string {
  const value = primitiveTokens[path];
  if (value === undefined) throw new Error(`Token primitivo no definido: ${path}`);
  return value;
}
