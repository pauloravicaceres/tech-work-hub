/** Textos visibles del esqueleto de la aplicación (ADR-009): único punto a migrar si se incorpora i18n. */
export const LAYOUT_TEXTS = {
  appName: 'TechWorkHub',
  nav: {
    backlog: 'Backlog',
    sprints: 'Sprints',
    equipos: 'Equipo',
  },
  navAriaLabel: 'Navegación principal',
  toggleNavAriaLabel: 'Alternar navegación',
  profileFallback: 'Usuario',
  profileMenuAriaLabel: 'Menú de perfil',
  logout: 'Cerrar sesión',
  logoutError: 'No se pudo cerrar la sesión. Intente de nuevo.',
  footer: 'TechWorkHub · Gestión de proyectos y backlog',
  notFound: {
    title: 'Página no encontrada',
    message: 'La dirección solicitada no existe. Use la navegación para elegir un módulo.',
  },
} as const;
