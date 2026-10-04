from services.workflow_service import WorkflowService

CICLO_1_COMPLETO = """
### [03-10-2026] Product Manager
- **Hora:** 09:00:00
- **Handoff:** @HUMANO: valida las épicas
### [03-10-2026] HUMANO
- **Hora:** 09:10:00
- **Estado:** APPROVE
- **Handoff:** @WATCHER: GITOPS-BRANCH-CREATE feat/001-HU_a
@BA: arranca
### [03-10-2026] Business Analyst
- **Hora:** 09:20:00
- **Handoff:** @QA: audita
### [03-10-2026] QA Documental
- **Hora:** 09:30:00
- **Handoff:** @UX: diseña
### [03-10-2026] Designer UX
- **Hora:** 09:40:00
- **Handoff:** @SA: arquitectura
### [03-10-2026] Solutions Architect
- **Hora:** 09:50:00
- **Handoff:** @DA: modelo
### [03-10-2026] Data Architect
- **Hora:** 10:00:00
- **Handoff:** @API: contratos
### [03-10-2026] API Architect
- **Hora:** 10:10:00
- **Handoff:** @QT: audita
### [03-10-2026] QA Tech
- **Hora:** 10:20:00
- **Handoff:** @DEV-BACK: arquitectura validada
### [03-10-2026] Senior Backend Developer
- **Hora:** 10:30:00
- **Handoff:** @DEV-FRONT: sigue
### [03-10-2026] Senior Frontend Developer
- **Hora:** 10:40:00
- **Handoff:** @QA-AUTO: pruebas
### [03-10-2026] QA Automation
- **Hora:** 10:50:00
- **Handoff:** @CODE-REVIEW: revisa
### [03-10-2026] Code Review
- **Hora:** 11:00:00
- **Estado:** APROBADO
- **Handoff:** @PM: siguiente historia
"""

PM_ABRE_CICLO_2 = """
### [03-10-2026] Product Manager
- **Hora:** 11:10:00
- **Estado:** Ledger actualizado.
@WATCHER: GITOPS-BRANCH-CREATE feat/002-HU_b
- **Handoff:** @BA: Iniciar el análisis de la épica 002.
"""


def _stages(tmp_path, texto):
    tracker = tmp_path / "tracker_bmad.md"
    tracker.write_text(texto, encoding="utf-8")
    resp = WorkflowService(tracker).get_workflow_status()
    return resp, {s.stage_key: s for s in resp.stages}


def test_una_hu_completa_se_ve_con_todas_las_etapas_en_verde(tmp_path):
    resp, st = _stages(tmp_path, CICLO_1_COMPLETO)

    assert st["PM"].status == "COMPLETED" and st["BA"].status == "COMPLETED"
    assert st["QA-AUTO"].status == "COMPLETED" and st["CR"].status == "COMPLETED"


def test_al_abrir_la_hu_siguiente_el_pipeline_se_reinicia(tmp_path):
    resp, st = _stages(tmp_path, CICLO_1_COMPLETO + PM_ABRE_CICLO_2)

    assert resp.active_stage == "BA"
    assert resp.overall_status == "IN_PROGRESS"
    assert st["PM"].status == "COMPLETED"
    assert st["BA"].status == "IN_PROGRESS" and st["BA"].is_active
    for clave in ("QA", "UX", "SA", "DA", "API", "QT", "DEV-BACK", "DEV-FRONT", "QA-AUTO", "CR"):
        assert st[clave].status == "PENDING", f"{clave} no debe arrastrar el verde de la HU anterior"
    assert resp.completed_stages == 1


def test_el_historial_conserva_todos_los_ciclos(tmp_path):
    resp, _ = _stages(tmp_path, CICLO_1_COMPLETO + PM_ABRE_CICLO_2)

    assert len(resp.history) == 14  # 13 bloques de la HU anterior + el PM que abre la siguiente
    assert resp.history[0]["author_role"] == "Product Manager"
    assert resp.history[-1]["author_role"] == "Product Manager"


def test_cuando_la_macro_esta_en_el_bloque_humano_el_pm_previo_se_conserva(tmp_path):
    # Primer ciclo real: el PM termina y la macro la emite el HUMANO que aprueba. El PM debe seguir en verde.
    texto = CICLO_1_COMPLETO.split("### [03-10-2026] Business Analyst")[0] + """
### [03-10-2026] Business Analyst
- **Hora:** 09:20:00
- **Handoff:** @QA: audita
"""
    resp, st = _stages(tmp_path, texto)

    assert st["PM"].status == "COMPLETED"
    assert st["BA"].status == "COMPLETED"
    assert resp.active_stage == "QA"


def test_una_mencion_de_la_macro_en_prosa_no_reinicia_el_pipeline(tmp_path):
    prosa = """
### [03-10-2026] Code Review
- **Hora:** 11:05:00
- **Estado:** APROBADO. Confirmar si se emite `@WATCHER: GITOPS-BRANCH-CREATE feat/003-x` más adelante.
- **Handoff:** @PM: siguiente
"""
    resp, st = _stages(tmp_path, CICLO_1_COMPLETO + prosa)

    assert st["QA-AUTO"].status == "COMPLETED", "una cita en prosa no debe abrir un ciclo nuevo"
