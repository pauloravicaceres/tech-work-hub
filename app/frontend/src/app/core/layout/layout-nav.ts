import { MenuItem } from 'primeng/api';
import { LAYOUT_TEXTS } from './layout.texts';

export type NavModuleId = 'backlog' | 'sprints' | 'equipos';

/** Entradas de la navegación lateral; agregar un módulo nuevo es agregar una entrada aquí. */
export const NAV_ITEMS: MenuItem[] = [
  { id: 'backlog', label: LAYOUT_TEXTS.nav.backlog, icon: 'pi pi-list', routerLink: '/backlog/nuevo', routerLinkActiveOptions: { exact: false } },
  { id: 'sprints', label: LAYOUT_TEXTS.nav.sprints, icon: 'pi pi-calendar', routerLink: '/sprints', routerLinkActiveOptions: { exact: false } },
  { id: 'equipos', label: LAYOUT_TEXTS.nav.equipos, icon: 'pi pi-users', routerLink: '/equipos', routerLinkActiveOptions: { exact: false } },
];

const MODULES: readonly NavModuleId[] = ['backlog', 'sprints', 'equipos'];

/** Módulo activo según el primer segmento de la URL; `null` si no corresponde a ninguno. */
export function resolveActiveModule(url: string): NavModuleId | null {
  const segment = url.split(/[?#]/)[0].split('/').filter(Boolean)[0];
  return MODULES.find((id) => id === segment) ?? null;
}
