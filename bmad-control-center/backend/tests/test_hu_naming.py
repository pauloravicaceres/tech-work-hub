"""Convención única de nombres de HU (hu_naming.py) y su uso en el Watcher, utils/approve_step.py y la aprobación
PM -> BA del Control Center.

Sin agentes reales ni llamadas a modelos: Spec Kit y el tracker se sustituyen por mocks / archivos temporales.
"""
import importlib.util
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import hu_naming
import watcher_bmad
import api.routes as routes
from main import app
from services.tracker_service import TrackerService

VALIDOS = [
    "001-registro-de-clientes.md",
    "002-inicio-de-sesion.md",
    "003-generar-cotizacion.md",
    "010-consultar-historial.md",
    "999-oauth2.md",
]
INVALIDOS = [
    "001-HU_registro_de_clientes.md",   # prefijo HU + snake_case
    "001-HU-registro-de-clientes.md",   # prefijo HU
    "HU-001-registro-de-clientes.md",   # prefijo HU delante
    "001_registro_de_clientes.md",      # snake_case
    "001-registro_de_clientes.md",      # guion bajo
    "001-Registro-De-Clientes.md",      # mayúsculas
    "001-registro de clientes.md",      # espacios
    "001-registro--de-clientes.md",     # separador doble
    "001-registro-de-clientes-.md",     # guion final
    "1-registro-de-clientes.md",        # un dígito
    "01-registro-de-clientes.md",       # dos dígitos
    "0001-registro-de-clientes.md",     # cuatro dígitos
    "001registro.md",                   # sin guion tras el número
    "001-.md",                          # sin nombre
    "001-registro-de-clientes",         # sin extensión
    "001-registro-de-clientes.MD",      # extensión en mayúsculas
    "001-registro-de-clientes.md\n",    # salto de línea final
    "٠٠١-registro.md",                  # dígitos no ASCII
    "001-inicio-de-sesión.md",          # no ASCII
]


@pytest.mark.parametrize("nombre", VALIDOS)
def test_acepta_kebab_case(nombre):
    assert hu_naming.es_nombre_hu_valido(nombre)
    assert hu_naming.validar_nombre_hu(nombre) == nombre


@pytest.mark.parametrize("nombre", INVALIDOS)
def test_rechaza_formatos_antiguos_e_invalidos_con_mensaje_claro(nombre):
    assert not hu_naming.es_nombre_hu_valido(nombre)
    with pytest.raises(hu_naming.NombreHUInvalido) as e:
        hu_naming.validar_nombre_hu(nombre)
    assert "NNN-nombre-en-kebab-case.md" in str(e.value)
    assert "001-registro-de-clientes.md" in str(e.value)


def test_hu_spec_kit_y_rama_comparten_numero_y_nombre():
    ruta = "docs/business-analyst/001-registro-de-clientes.md"
    assert hu_naming.identificador_hu(ruta) == "001-registro-de-clientes"
    assert hu_naming.carpeta_spec_hu(ruta) == "specs/001-registro-de-clientes"
    assert hu_naming.rama_hu(ruta) == "feat/001-registro-de-clientes"
    assert hu_naming.identificador_hu("docs\\business-analyst\\001-registro-de-clientes.md") == "001-registro-de-clientes"


def test_no_deriva_carpeta_ni_rama_de_un_nombre_antiguo():
    for derivar in (hu_naming.identificador_hu, hu_naming.carpeta_spec_hu, hu_naming.rama_hu):
        with pytest.raises(hu_naming.NombreHUInvalido):
            derivar("docs/business-analyst/001-HU_registro_de_clientes.md")


def test_extrae_la_hu_de_una_linea_del_tracker_sin_confundir_otros_artefactos():
    linea = ("- **Handoff:** @SA: Aprobado por QA en aprobado-qa-001-registro.md y ux-001-registro.md "
             "para docs/business-analyst/001-registro-de-clientes.md.")
    assert hu_naming.extraer_nombre_hu(linea) == "001-registro-de-clientes.md"
    assert hu_naming.extraer_nombre_hu("@SA: aprobado en aprobado-qa-001-registro.md") is None
    assert hu_naming.extraer_nombre_hu("@SA: aprobado en aprobado_qa_001_registro.md") is None


@pytest.mark.parametrize("nombre", ["001-HU_registro.md", "HU-001-registro.md", "001_registro.md", "001-Registro.md"])
def test_extraer_rechaza_hu_citada_con_formato_invalido(nombre):
    with pytest.raises(hu_naming.NombreHUInvalido):
        hu_naming.extraer_nombre_hu(f"@SA: Aprobado por QA: docs/business-analyst/{nombre}")


def test_identificador_delegado_por_el_pm_usa_la_ultima_delegacion():
    texto = ("La próxima épica a delegar es 001-HU_antigua.\n...\n"
             "La próxima épica a delegar es `002-inicio-de-sesion`. Las historias quedaron en BACKLOG.")
    assert hu_naming.extraer_identificador_delegado(texto) == "002-inicio-de-sesion"
    assert hu_naming.extraer_identificador_delegado("sin delegación") is None
    with pytest.raises(hu_naming.NombreHUInvalido):
        hu_naming.extraer_identificador_delegado("La próxima épica a delegar es 002-HU_inicio_de_sesion.")


# ---------- Watcher: gatekeeper de negocio (Spec Kit mockeado) ----------

@pytest.fixture
def watcher(tmp_path, monkeypatch):
    tracker = tmp_path / "tracker_bmad.md"
    tracker.write_text("", encoding="utf-8")
    monkeypatch.setattr(watcher_bmad, "TRACKER_PATH", str(tracker))
    monkeypatch.setattr(watcher_bmad, "contexto_bloque", {"autor": "QA Documental", "hora": "10:00:00"})
    llamadas = []
    monkeypatch.setattr(watcher_bmad, "ejecutar_sdd_fase_negocio", lambda ruta: llamadas.append(ruta) or True)
    return tracker, llamadas


def test_gatekeeper_negocio_avanza_con_hu_kebab_case(watcher):
    tracker, llamadas = watcher
    watcher_bmad.extraer_instrucciones(
        "- **Handoff:** @SA: HU aprobada por QA en docs/business-analyst/001-registro-de-clientes.md.")
    assert llamadas == ["docs/business-analyst/001-registro-de-clientes.md"]
    assert "inválido" not in tracker.read_text(encoding="utf-8")


def test_gatekeeper_negocio_rechaza_hu_antigua_sin_renombrarla(watcher, tmp_path):
    tracker, llamadas = watcher
    hu = tmp_path / "001-HU_registro_de_clientes.md"
    hu.write_text("# HU", encoding="utf-8")
    watcher_bmad.extraer_instrucciones(
        "- **Handoff:** @SA: HU aprobada por QA en docs/business-analyst/001-HU_registro_de_clientes.md.")
    assert llamadas == []
    log = tracker.read_text(encoding="utf-8")
    assert "Nombre de HU inválido: '001-HU_registro_de_clientes.md'" in log
    assert "NNN-nombre-en-kebab-case.md" in log
    assert hu.exists() and sorted(p.name for p in tmp_path.iterdir()) == ["001-HU_registro_de_clientes.md", "tracker_bmad.md"]


def test_fase_negocio_fija_la_carpeta_spec_con_el_mismo_identificador(tmp_path, monkeypatch):
    monkeypatch.setattr(watcher_bmad, "TRACKER_PATH", str(tmp_path / "tracker_bmad.md"))
    vistos = []

    class _Res:
        returncode = 1
        stdout = ""

    def falso_speckit(skill, argumentos="", directiva=None, entorno=None):
        vistos.append((skill, argumentos, entorno))
        return _Res()

    monkeypatch.setattr(watcher_bmad, "ejecutar_speckit", falso_speckit)
    assert watcher_bmad.ejecutar_sdd_fase_negocio("docs/business-analyst/001-registro-de-clientes.md") is False
    assert vistos[0][0] == "specify"
    assert vistos[0][2] == {"SPECIFY_FEATURE_DIRECTORY": "specs/001-registro-de-clientes"}


def test_fase_negocio_no_invoca_spec_kit_con_hu_antigua(tmp_path, monkeypatch):
    monkeypatch.setattr(watcher_bmad, "TRACKER_PATH", str(tmp_path / "tracker_bmad.md"))
    vistos = []
    monkeypatch.setattr(watcher_bmad, "ejecutar_speckit", lambda *a, **k: vistos.append(a))
    assert watcher_bmad.ejecutar_sdd_fase_negocio("docs/business-analyst/001-HU_registro.md") is False
    assert vistos == []
    assert "kebab-case" in (tmp_path / "tracker_bmad.md").read_text(encoding="utf-8")


# ---------- Aprobación PM -> BA (Control Center) ----------

@pytest.fixture
def cliente(tmp_path):
    ruta = tmp_path / "tracker_bmad.md"
    servicio = TrackerService(str(ruta))
    routes.tracker_service = servicio
    return TestClient(app), servicio, ruta


def _bloque_pm(identificador):
    return ("### [14-10-2026] Product Manager\n- **Hora:** 10:00:00\n"
            "- **Artefacto generado:** `docs/product-manager/mvp-x.md`\n"
            f"- **Handoff:** @HUMANO: La próxima épica a delegar es {identificador}. Valida el backlog.")


def test_aprobacion_pm_crea_rama_coherente_con_la_hu(cliente):
    client, servicio, ruta = cliente
    servicio.append_decision(_bloque_pm("001-registro-de-clientes"))
    r = client.post("/api/v1/gates/1/decision", json={"action": "APPROVE"})
    assert r.status_code == 200
    contenido = ruta.read_text(encoding="utf-8")
    assert "@WATCHER: GITOPS-BRANCH-CREATE feat/001-registro-de-clientes\n" in contenido


@pytest.mark.parametrize("payload_extra, identificador", [
    ({}, "001-HU_registro_de_clientes"),
    ({"epic_id": "HU-001-registro"}, "001-registro-de-clientes"),
])
def test_aprobacion_pm_rechaza_identificador_invalido_sin_fallback(cliente, payload_extra, identificador):
    client, servicio, ruta = cliente
    servicio.append_decision(_bloque_pm(identificador))
    antes = ruta.read_text(encoding="utf-8")
    r = client.post("/api/v1/gates/1/decision", json={"action": "APPROVE", **payload_extra})
    assert r.status_code == 422
    assert "NNN-nombre-en-kebab-case" in r.json()["detail"]
    assert ruta.read_text(encoding="utf-8") == antes
    assert "epic_generica" not in ruta.read_text(encoding="utf-8")


# ---------- utils/approve_step.py (input y apertura de archivos mockeados) ----------

def _cargar_approve_step():
    ruta = Path(watcher_bmad.__file__).resolve().parent / "utils" / "approve_step.py"
    spec = importlib.util.spec_from_file_location("approve_step_bajo_prueba", ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


@pytest.fixture
def aprobador(tmp_path, monkeypatch):
    modulo = _cargar_approve_step()
    tracker = tmp_path / "tracker_bmad.md"
    monkeypatch.setattr(modulo, "TRACKER_PATH", tracker)
    monkeypatch.setattr(modulo, "DIRECTORIO_RAIZ", tmp_path)
    monkeypatch.setattr(modulo, "abrir_archivo_en_so", lambda ruta: None)

    def ejecutar(contenido_tracker, respuestas):
        tracker.write_text(contenido_tracker, encoding="utf-8")
        entradas = iter(respuestas)
        monkeypatch.setattr("builtins.input", lambda *_: next(entradas))
        modulo.main()
        return tracker.read_text(encoding="utf-8")

    return modulo, ejecutar, tracker


def test_aprobador_pm_a_ba_usa_el_identificador_kebab_delegado(aprobador):
    _, ejecutar, _ = aprobador
    salida = ejecutar("Plan en mvp-x.md. La próxima épica a delegar es 002-inicio-de-sesion. Valida.\n", ["3", "s"])
    assert "@WATCHER: GITOPS-BRANCH-CREATE feat/002-inicio-de-sesion\n" in salida


def test_aprobador_pm_a_ba_rechaza_identificador_antiguo_sin_fallback(aprobador):
    _, ejecutar, tracker = aprobador
    inicial = "Plan en mvp-x.md. La próxima épica a delegar es 001-HU_registro. Valida.\n"
    with pytest.raises(SystemExit):
        ejecutar(inicial, ["3", "001-HU_registro"])
    assert tracker.read_text(encoding="utf-8") == inicial


def test_aprobador_ba_a_qa_detecta_solo_hu_kebab_case(aprobador):
    modulo, ejecutar, _ = aprobador
    salida = ejecutar("HU en 001-HU_vieja.md y luego en docs/business-analyst/001-registro-de-clientes.md\n", ["4", "s"])
    assert "@QA: La Historia de Usuario ha sido revisada en el archivo 001-registro-de-clientes.md." in salida


def test_aprobador_ba_a_qa_rechaza_hu_antigua_ingresada_a_mano(aprobador):
    _, ejecutar, tracker = aprobador
    inicial = "HU en docs/business-analyst/001-HU_registro_de_clientes.md\n"
    with pytest.raises(SystemExit):
        ejecutar(inicial, ["4", "001-HU_registro_de_clientes.md"])
    assert tracker.read_text(encoding="utf-8") == inicial


# ---------- Artefactos de los agentes (kebab-case) ----------

ARTEFACTOS_VALIDOS = [
    "idea-tech-work-hub.md", "pb-tech-work-hub.md", "mvp-tech-work-hub.md", "tech-guidelines.md",
    "api-001-registro-elementos-backlog-multitipo.md", "db-001-registro-elementos-backlog-multitipo.md",
    "ux-001-registro-elementos-backlog-multitipo.md", "tech-design-001-registro-elementos-backlog-multitipo.md",
    "feedback-tech-036-theming-claro-oscuro-ui.md", "aprobado-qa-003-gestion-sprint-dos-semanas.md",
    "feedback-qa-003-gestion-sprint-dos-semanas.md", "hu-002-componentes.component.json", "hu-002-componentes.html",
    "qa-report.md", "impact-analysis-report.md", "api-contract.md", "tracker_bmad.md", "AGENTS.md",
]
ARTEFACTOS_INVALIDOS = {
    "idea_TechWorkHub.md": "idea-tech-work-hub.md",
    "pb_tech_work_hub.md": "pb-tech-work-hub.md",
    "mvp_tech_work_hub.md": "mvp-tech-work-hub.md",
    "tech_guidelines.md": "tech-guidelines.md",
    "api_001_registro_elementos_backlog_multitipo.md": "api-001-registro-elementos-backlog-multitipo.md",
    "tech-design_001_registro_elementos_backlog_multitipo.md": "tech-design-001-registro-elementos-backlog-multitipo.md",
    "feedback_tech_036_theming_claro_oscuro_ui.md": "feedback-tech-036-theming-claro-oscuro-ui.md",
    "aprobado_qa_003_gestion_sprint_dos_semanas.md": "aprobado-qa-003-gestion-sprint-dos-semanas.md",
    "hu002_componentes.component.json": "hu-002-componentes.component.json",
    "Diseño Técnico.md": "diseno-tecnico.md",
}


@pytest.mark.parametrize("nombre", ARTEFACTOS_VALIDOS)
def test_artefacto_kebab_es_valido(nombre):
    assert hu_naming.es_nombre_artefacto_valido(nombre)
    assert hu_naming.validar_nombre_artefacto(f"docs/x/{nombre}") == nombre


@pytest.mark.parametrize("nombre, sugerido", ARTEFACTOS_INVALIDOS.items())
def test_artefacto_no_kebab_se_rechaza_con_sugerencia_valida(nombre, sugerido):
    assert not hu_naming.es_nombre_artefacto_valido(nombre)
    with pytest.raises(hu_naming.NombreArtefactoInvalido, match=sugerido):
        hu_naming.validar_nombre_artefacto(f"docs/x/{nombre}")
    assert hu_naming.sugerir_nombre_kebab(nombre) == sugerido
    assert hu_naming.es_nombre_artefacto_valido(sugerido)


@pytest.mark.parametrize("nombre", ["ux-12-registro.md", "ux-012.md", "x--y.md", "-x.md", "x-.md", "x.MD", "sin-extension"])
def test_artefacto_mal_formado_se_rechaza(nombre):
    assert not hu_naming.es_nombre_artefacto_valido(nombre)


def test_nombre_de_artefacto_derivado_de_la_hu():
    hu = "docs/business-analyst/036-theming-claro-oscuro-ui.md"
    assert hu_naming.nombre_artefacto_hu("feedback-tech", hu) == "feedback-tech-036-theming-claro-oscuro-ui.md"
    assert hu_naming.nombre_artefacto_hu("hu", hu, ".component.json") == "hu-036-theming-claro-oscuro-ui.component.json"
    with pytest.raises(ValueError):
        hu_naming.nombre_artefacto_hu("tech_design", hu)


def test_watcher_reporta_artefacto_no_kebab_sin_tocar_el_tracker(capsys):
    linea = "- **Artefacto generado:** `docs/designer-ux/ux_001_registro.md`, `docs/qa-tech/diagrams/hu-001-x.html`"
    assert watcher_bmad.vigilar_nombre_artefacto(linea) == ["docs/designer-ux/ux_001_registro.md"]
    assert "ux-001-registro.md" in capsys.readouterr().out
    assert watcher_bmad.vigilar_nombre_artefacto("- **Artefacto generado:** `docs/designer-ux/ux-001-registro.md`") == []
    assert watcher_bmad.vigilar_nombre_artefacto("- **Artefacto generado:** `src/Features/CrearItem.cs`") == []


def test_aprobador_detecta_solo_artefactos_kebab(aprobador):
    _, ejecutar, _ = aprobador
    salida = ejecutar("Brief en pb_viejo.md y luego en docs/product-analyst/pb-tech-work-hub.md\n", ["2", "s"])
    assert "aprobado formalmente en el archivo pb-tech-work-hub.md." in salida


def test_aprobador_rechaza_artefacto_no_kebab_ingresado_a_mano(aprobador):
    _, ejecutar, tracker = aprobador
    inicial = "Brief en docs/product-analyst/pb_tech_work_hub.md\n"
    with pytest.raises(SystemExit):
        ejecutar(inicial, ["2", "pb_tech_work_hub.md"])
    assert tracker.read_text(encoding="utf-8") == inicial


# =========================================================================
# VALIDACIÓN EXHAUSTIVA DE LAS 20 REGLAS DE LA SECCIÓN 10
# =========================================================================

def test_req_01_business_storyteller_naming():
    valido = "idea-tech-work-hub.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.validar_nombre_artefacto(valido) == valido
    assert hu_naming.sugerir_nombre_kebab("idea_TechWorkHub.md") == valido
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("idea_TechWorkHub.md")


def test_req_02_product_analyst_naming():
    valido = "pb-tech-work-hub.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.validar_nombre_artefacto(valido) == valido
    assert hu_naming.sugerir_nombre_kebab("pb_tech_work_hub.md") == valido
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("pb_tech_work_hub.md")


def test_req_03_product_manager_naming():
    valido = "mvp-tech-work-hub.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.validar_nombre_artefacto(valido) == valido
    assert hu_naming.sugerir_nombre_kebab("mvp_tech_work_hub.md") == valido
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("mvp_tech_work_hub.md")


def test_req_04_business_analyst_naming():
    valido = "001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_hu_valido(valido)
    assert hu_naming.validar_nombre_hu(valido) == valido
    assert hu_naming.sugerir_nombre_kebab("001-HU_registro_elementos_backlog_multitipo.md") == valido
    with pytest.raises(hu_naming.NombreHUInvalido):
        hu_naming.validar_nombre_hu("001-HU_registro_elementos_backlog_multitipo.md")


def test_req_05_api_architect_naming():
    valido = "api-001-registro-elementos-backlog-multitipo.md"
    hu = "docs/business-analyst/001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.nombre_artefacto_hu("api", hu) == valido
    assert hu_naming.sugerir_nombre_kebab("api_001_registro_elementos_backlog_multitipo.md") == valido
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("api_001_registro_elementos_backlog_multitipo.md")


def test_req_06_data_architect_naming():
    valido = "db-001-registro-elementos-backlog-multitipo.md"
    hu = "docs/business-analyst/001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.nombre_artefacto_hu("db", hu) == valido
    assert hu_naming.sugerir_nombre_kebab("db_001_registro_elementos_backlog_multitipo.md") == valido
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("db_001_registro_elementos_backlog_multitipo.md")


def test_req_07_designer_ux_naming():
    valido = "ux-001-registro-elementos-backlog-multitipo.md"
    hu = "docs/business-analyst/001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.nombre_artefacto_hu("ux", hu) == valido
    assert hu_naming.sugerir_nombre_kebab("ux_001_registro_elementos_backlog_multitipo.md") == valido
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("ux_001_registro_elementos_backlog_multitipo.md")


def test_req_08_solutions_architect_naming():
    valido_global = "tech-guidelines.md"
    valido_hu = "001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_artefacto_valido(valido_global)
    assert hu_naming.es_nombre_artefacto_valido(valido_hu)
    assert hu_naming.sugerir_nombre_kebab("tech_guidelines.md") == valido_global
    with pytest.raises(hu_naming.NombreArtefactoInvalido):
        hu_naming.validar_nombre_artefacto("tech_guidelines.md")


def test_req_09_code_review_naming():
    valido = "impact-analysis-report.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.validar_nombre_artefacto(valido) == valido


def test_req_10_qa_auto_naming():
    valido = "qa-report.md"
    assert hu_naming.es_nombre_artefacto_valido(valido)
    assert hu_naming.validar_nombre_artefacto(valido) == valido


def test_req_11_qa_documental_naming():
    valido_aprobado = "aprobado-qa-001-registro-elementos-backlog-multitipo.md"
    valido_feedback = "feedback-qa-001-registro-elementos-backlog-multitipo.md"
    hu = "docs/business-analyst/001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_artefacto_valido(valido_aprobado)
    assert hu_naming.es_nombre_artefacto_valido(valido_feedback)
    assert hu_naming.nombre_artefacto_hu("aprobado-qa", hu) == valido_aprobado
    assert hu_naming.nombre_artefacto_hu("feedback-qa", hu) == valido_feedback
    assert hu_naming.sugerir_nombre_kebab("aprobado_qa_001_registro_elementos_backlog_multitipo.md") == valido_aprobado
    assert hu_naming.sugerir_nombre_kebab("feedback_qa_001_registro_elementos_backlog_multitipo.md") == valido_feedback


def test_req_12_qa_tech_naming():
    valido_td = "tech-design-001-registro-elementos-backlog-multitipo.md"
    valido_fb = "feedback-tech-001-registro-elementos-backlog-multitipo.md"
    hu = "docs/business-analyst/001-registro-elementos-backlog-multitipo.md"
    assert hu_naming.es_nombre_artefacto_valido(valido_td)
    assert hu_naming.es_nombre_artefacto_valido(valido_fb)
    assert hu_naming.nombre_artefacto_hu("tech-design", hu) == valido_td
    assert hu_naming.nombre_artefacto_hu("feedback-tech", hu) == valido_fb
    assert hu_naming.sugerir_nombre_kebab("tech-design_001_registro_elementos_backlog_multitipo.md") == valido_td
    assert hu_naming.sugerir_nombre_kebab("feedback_tech_001_registro_elementos_backlog_multitipo.md") == valido_fb


def test_req_13_diagrams_naming():
    diagramas = [
        ("hu-002-componentes.component.json", "hu002_componentes.component.json"),
        ("hu-002-componentes.html", "hu002_componentes.html"),
        ("hu-002-despliegue.component.json", "hu002_despliegue.component.json"),
        ("hu-002-secuencia-e2e.html", "hu002_secuencia_e2e.html"),
        ("hu-002-secuencia-e2e.sequence.json", "hu002_secuencia_e2e.sequence.json"),
    ]
    for valido, antiguo in diagramas:
        assert hu_naming.es_nombre_artefacto_valido(valido)
        assert hu_naming.validar_nombre_artefacto(valido) == valido
        assert hu_naming.sugerir_nombre_kebab(antiguo) == valido
        with pytest.raises(hu_naming.NombreArtefactoInvalido):
            hu_naming.validar_nombre_artefacto(antiguo)


def test_req_14_conservacion_prefijos():
    prefijos_esperados = ["ux", "db", "api", "tech-design", "feedback-tech", "hu", "aprobado-qa", "feedback-qa"]
    for p in prefijos_esperados:
        assert p in hu_naming.PREFIJOS_ARTEFACTO_HU
        assert hu_naming.PREFIJOS_ARTEFACTO_HU[p]


def test_req_15_conservacion_numero_hu():
    for num in ["001", "002", "012", "036", "999"]:
        hu = f"docs/business-analyst/{num}-funcionalidad-critica.md"
        assert hu_naming.identificador_hu(hu) == f"{num}-funcionalidad-critica"
        assert hu_naming.nombre_artefacto_hu("api", hu) == f"api-{num}-funcionalidad-critica.md"
        assert hu_naming.nombre_artefacto_hu("db", hu) == f"db-{num}-funcionalidad-critica.md"
        assert hu_naming.nombre_artefacto_hu("ux", hu) == f"ux-{num}-funcionalidad-critica.md"


def test_req_16_deteccion_nombres_invalidos():
    invalidos = [
        "con espacios.md",
        "CON_MAYUSCULAS.md",
        "con_snake_case.md",
        "con--doble-guion.md",
        "-con-guion-inicial.md",
        "con-guion-final-.md",
        "con_acentos_áéíóú.md",
        "api_001_invalido.md",
        "ux-01-demasiado-corto.md",
    ]
    for inv in invalidos:
        assert not hu_naming.es_nombre_artefacto_valido(inv)
        with pytest.raises(hu_naming.NombreArtefactoInvalido):
            hu_naming.validar_nombre_artefacto(inv)


def test_req_17_deteccion_colisiones():
    archivos_legacy = [
        "idea_TechWorkHub.md", "pb_tech_work_hub.md", "mvp_tech_work_hub.md",
        "api_001_registro_elementos_backlog_multitipo.md", "db_001_registro_elementos_backlog_multitipo.md",
        "ux_001_registro_elementos_backlog_multitipo.md", "tech-design_001_registro_elementos_backlog_multitipo.md",
        "feedback_tech_001_registro_elementos_backlog_multitipo.md", "aprobado_qa_001_registro_elementos_backlog_multitipo.md",
        "hu002_componentes.component.json", "hu002_componentes.html", "tech_guidelines.md"
    ]
    kebab_names = [hu_naming.sugerir_nombre_kebab(a) for a in archivos_legacy]
    assert len(kebab_names) == len(set(kebab_names)), "No deben existir colisiones entre nombres migrados"


def test_req_18_compatibilidad_con_watcher(capsys):
    linea_valida = "- **Artefacto generado:** `docs/api-architect/api-001-registro-elementos-backlog-multitipo.md`"
    assert watcher_bmad.vigilar_nombre_artefacto(linea_valida) == []
    
    linea_invalida = "- **Artefacto generado:** `docs/api-architect/api_001_registro_elementos_backlog_multitipo.md`"
    assert watcher_bmad.vigilar_nombre_artefacto(linea_invalida) == ["docs/api-architect/api_001_registro_elementos_backlog_multitipo.md"]


def test_req_19_compatibilidad_con_handoffs():
    texto_handoff = "@PA: Idea aprobada en idea-tech-work-hub.md. Procede con pb-tech-work-hub.md."
    assert "idea-tech-work-hub.md" in texto_handoff
    assert hu_naming.es_nombre_artefacto_valido("idea-tech-work-hub.md")
    assert hu_naming.es_nombre_artefacto_valido("pb-tech-work-hub.md")


def test_req_20_integridad_referencias_entre_documentos():
    texto = "Consulte [API](docs/api-architect/api-001-registro-elementos-backlog-multitipo.md) y [UX](docs/designer-ux/ux-001-registro-elementos-backlog-multitipo.md)."
    import re as regex_mod
    links = regex_mod.findall(r"docs/([^)]+)", texto)
    for link in links:
        filename = link.split("/")[-1]
        assert hu_naming.es_nombre_artefacto_valido(filename)
