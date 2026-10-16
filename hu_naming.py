"""
Convención única de nombres de Historias de Usuario (HU), independiente del orquestador.

Solo usa la biblioteca estándar. El Watcher, utils/approve_step.py y el backend del Control Center la importan
para validar el nombre de la HU y derivar de él, con el mismo número y nombre descriptivo:

  HU:               docs/business-analyst/001-registro-de-clientes.md
  Carpeta Spec Kit: specs/001-registro-de-clientes/
  Rama GitOps:      feat/001-registro-de-clientes

Formato obligatorio: NNN-nombre-en-kebab-case.md (tres dígitos, un guion, palabras en minúsculas ASCII separadas
por un único guion, extensión .md). No hay prefijo HU ni compatibilidad con snake_case: un nombre que no cumple se
rechaza con NombreHUInvalido; nunca se renombra ni se sustituye.

La misma regla kebab-case rige los artefactos que generan los agentes en docs/ (ver "Artefactos de los agentes"):
los ligados a una HU llevan su prefijo funcional y el identificador de la HU (ux-001-registro-de-clientes.md,
tech-design-001-registro-de-clientes.md, diagrams/hu-001-componentes.component.json). Un nombre inválido se
rechaza con NombreArtefactoInvalido y una sugerencia; tampoco se renombra automáticamente.
"""
import re
import unicodedata
from pathlib import Path
from typing import Optional, Union

RutaLike = Union[str, Path]

FORMATO_HU = "NNN-nombre-en-kebab-case.md"
EJEMPLO_HU = "001-registro-de-clientes.md"

KEBAB = r"[a-z0-9]+(?:-[a-z0-9]+)*"
_ID = rf"\d{{3}}-{KEBAB}"
ID_HU = _ID
PATRON_NOMBRE_HU = re.compile(rf"^{_ID}\.md$", re.ASCII)
PATRON_ID_HU = re.compile(rf"^{_ID}$", re.ASCII)

# Búsqueda dentro de un texto libre (líneas del tracker): el nombre no puede formar parte de otra palabra
# (p. ej. aprobado-qa-012-x.md o ux-012-x.md no son HU).
PATRON_HU_EN_TEXTO = re.compile(rf"(?<![\w-])({_ID}\.md)(?![\w-])", re.ASCII)
# Cualquier archivo con aspecto de HU (número o prefijo HU al inicio), válido o no: sirve para detectar los inválidos.
_CANDIDATO_HU_EN_TEXTO = re.compile(r"(?<![\w-])((?:\d+[-_]|HU[-_])[\w-]*\.md)", re.ASCII | re.IGNORECASE)
_DELEGACION = re.compile(r"delegar es\s+[`*\"']*([^\s`*\"']+)")


class NombreHUInvalido(ValueError):
    """El nombre de la HU no cumple el formato NNN-nombre-en-kebab-case.md."""


def _mensaje(nombre: str, formato: str, ejemplo: str) -> str:
    return (f"Nombre de HU inválido: '{nombre}'. Formato obligatorio: {formato} (ej. {ejemplo}): tres dígitos, "
            "un guion y el nombre en minúsculas ASCII con palabras separadas por un único guion; "
            "sin prefijo HU, sin guiones bajos, sin espacios ni mayúsculas.")


def es_nombre_hu_valido(nombre: str) -> bool:
    """True si `nombre` (solo el nombre de archivo, sin carpeta) cumple NNN-nombre-en-kebab-case.md."""
    return bool(PATRON_NOMBRE_HU.fullmatch(nombre))


def es_identificador_hu_valido(identificador: str) -> bool:
    """True si `identificador` (nombre sin .md: el de la rama y la carpeta Spec Kit) cumple NNN-nombre-en-kebab-case."""
    return bool(PATRON_ID_HU.fullmatch(identificador))


def validar_nombre_hu(nombre: str) -> str:
    """Devuelve `nombre` si es válido; si no, lanza NombreHUInvalido con el formato esperado."""
    if not es_nombre_hu_valido(nombre):
        raise NombreHUInvalido(_mensaje(nombre, FORMATO_HU, EJEMPLO_HU))
    return nombre


def validar_identificador_hu(identificador: str) -> str:
    """Devuelve `identificador` si es válido; si no, lanza NombreHUInvalido con el formato esperado."""
    if not es_identificador_hu_valido(identificador):
        raise NombreHUInvalido(_mensaje(identificador, FORMATO_HU[:-3], EJEMPLO_HU[:-3]))
    return identificador


def identificador_hu(ruta_hu: RutaLike) -> str:
    """Identificador universal de la HU (nombre sin .md). Lanza NombreHUInvalido si el archivo no cumple el formato."""
    nombre = Path(str(ruta_hu).replace("\\", "/")).name
    return validar_nombre_hu(nombre)[:-3]


def carpeta_spec_hu(ruta_hu: RutaLike) -> str:
    """Carpeta Spec Kit de la HU: specs/<identificador>."""
    return f"specs/{identificador_hu(ruta_hu)}"


def rama_hu(ruta_hu: RutaLike) -> str:
    """Rama GitOps de la HU: feat/<identificador>."""
    return f"feat/{identificador_hu(ruta_hu)}"


def extraer_nombre_hu(texto: str) -> Optional[str]:
    """
    Primer nombre de HU válido citado en `texto`. Si no hay ninguno válido pero sí un archivo con aspecto de HU
    (p. ej. 001-HU_x.md, HU-001-x.md, 001_x.md), lanza NombreHUInvalido. Si no se cita ninguna HU, devuelve None.
    """
    valido = PATRON_HU_EN_TEXTO.search(texto)
    if valido:
        return valido.group(1)
    candidato = _CANDIDATO_HU_EN_TEXTO.search(texto)
    if candidato:
        validar_nombre_hu(candidato.group(1))
    return None


def extraer_identificador_delegado(texto: str) -> Optional[str]:
    """
    Identificador de la HU en la última frase del PM "... a delegar es NNN-nombre" (la más reciente del tracker).
    Devuelve None si la frase no aparece; lanza NombreHUInvalido si su identificador no cumple el formato.
    """
    delegaciones = _DELEGACION.findall(texto)
    if not delegaciones:
        return None
    return validar_identificador_hu(delegaciones[-1].rstrip(".,;:"))


# ==========================================
# ARTEFACTOS DE LOS AGENTES
# ==========================================
# Todo artefacto que un agente genera en docs/ tiene un nombre base kebab-case ([a-z0-9]+(-[a-z0-9]+)*) seguido de
# su extensión original, que puede ser compuesta (p. ej. .component.json de archify). Los artefactos ligados a una
# HU anteponen su prefijo funcional al identificador de la HU: <prefijo>-NNN-nombre-de-la-historia.<ext>.
PREFIJOS_ARTEFACTO_HU = {
    "ux": "designer-ux",
    "db": "data-architect",
    "api": "api-architect",
    "tech-design": "qa-tech",
    "feedback-tech": "qa-tech",
    "hu": "qa-tech (diagrams/)",
    "aprobado-qa": "qa-documental",
    "feedback-qa": "qa-documental",
}
# Nombres fijos que exigen el orquestador o herramientas externas: se aceptan tal cual.
NOMBRES_RESERVADOS = frozenset({"tracker_bmad.md", "config_bmad.json", "AGENTS.md", "README.md", "SKILL.md", "CLAUDE.md", ".gitkeep"})

FORMATO_ARTEFACTO = "nombre-en-kebab-case.<ext> (artefactos de HU: <prefijo>-NNN-nombre-de-la-historia.<ext>)"

PATRON_NOMBRE_ARTEFACTO = re.compile(rf"^{KEBAB}(?:\.[a-z0-9]+)+$", re.ASCII)
_PREFIJOS = "|".join(re.escape(p) for p in sorted(PREFIJOS_ARTEFACTO_HU, key=len, reverse=True))
# Un nombre que empieza por un prefijo de HU seguido de un número debe llevar el identificador completo de la HU.
_CON_PREFIJO_HU = re.compile(rf"^(?:{_PREFIJOS})-\d", re.ASCII)
_ARTEFACTO_HU = re.compile(rf"^(?:{_PREFIJOS})-{_ID}$", re.ASCII)


class NombreArtefactoInvalido(ValueError):
    """El nombre de un artefacto generado por un agente no cumple kebab-case."""


def sugerir_nombre_kebab(nombre: str) -> str:
    """
    Propuesta kebab-case para `nombre` (solo el nombre de archivo): quita tildes, separa CamelCase, pasa a minúsculas,
    sustituye cualquier separador por un guion y conserva las extensiones. Sirve para informar y para planificar la
    migración; nunca se usa para renombrar sin autorización.
    """
    base, punto, extensiones = nombre.partition(".")
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
    base = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", base)
    base = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1-\2", base)
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    base = re.sub(r"^hu(\d{3})(?=-|$)", r"hu-\1", base)
    base = re.sub(r"^(\d{3})-hu-(.+)$", r"\1-\2", base)
    return f"{base}{punto}{extensiones.lower()}"


def es_nombre_artefacto_valido(nombre: str) -> bool:
    """True si `nombre` (solo el nombre de archivo) es kebab-case con extensión, o es un nombre reservado."""
    if nombre in NOMBRES_RESERVADOS:
        return True
    if not PATRON_NOMBRE_ARTEFACTO.fullmatch(nombre):
        return False
    base = nombre.split(".", 1)[0]
    return not _CON_PREFIJO_HU.match(base) or bool(_ARTEFACTO_HU.fullmatch(base))


def validar_nombre_artefacto(ruta: RutaLike) -> str:
    """Devuelve el nombre de archivo de `ruta` si es válido; si no, lanza NombreArtefactoInvalido con una sugerencia."""
    nombre = Path(str(ruta).replace("\\", "/")).name
    if not es_nombre_artefacto_valido(nombre):
        raise NombreArtefactoInvalido(
            f"Nombre de artefacto inválido: '{nombre}'. Formato obligatorio: {FORMATO_ARTEFACTO}: minúsculas ASCII, "
            f"palabras separadas por un único guion, sin guiones bajos, espacios, mayúsculas ni tildes. "
            f"Sugerencia: '{sugerir_nombre_kebab(nombre)}' (no se renombra automáticamente).")
    return nombre


def nombre_artefacto_hu(prefijo: str, ruta_hu: RutaLike, extension: str = ".md") -> str:
    """Nombre del artefacto de `prefijo` para la HU: p. ej. ('ux', '001-registro.md') -> 'ux-001-registro.md'."""
    if prefijo not in PREFIJOS_ARTEFACTO_HU:
        raise ValueError(f"Prefijo de artefacto desconocido: '{prefijo}'. Válidos: {sorted(PREFIJOS_ARTEFACTO_HU)}")
    return f"{prefijo}-{identificador_hu(ruta_hu)}{extension}"
