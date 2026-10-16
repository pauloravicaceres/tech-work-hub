---
description: 'Usar para estructurar el contenido que se guarda físicamente en el archivo idea-[nombre-corto].md en la carpeta business-storyteller. Establece el formato de texto plano puro sin XML ni bloques de código.'
applyTo: '**'
---

# Plantilla y Reglas del Entregable Físico (Archivo de Idea)

> Contrato determinista para la persistencia física del archivo `idea-[nombre-corto].md`.

---

## Convención de Nombres de Archivo
```
idea-[nombre-corto].md
```
- `nombre-corto`: kebab-case (minúsculas ASCII sin tildes, palabras separadas por un único guion medio (`-`); prohibidos guiones bajos, espacios, mayúsculas, guiones consecutivos y guiones al inicio o al final), máximo 4 palabras, representativo del producto o iniciativa (ej. `idea-reserva-citas.md`, `idea-gestion-pedidos.md`). El nombre completo debe cumplir `^idea-[a-z0-9]+(-[a-z0-9]+)*\.md$`.

---

## Regla Crítica del Formato Físico en Disco

> [!CRITICAL]
> El archivo `idea-[nombre-corto].md` guardado físicamente en disco debe contener **ÚNICA Y EXCLUSIVAMENTE EL TEXTO NARRATIVO PURO**.

### Restricciones Absolutas del Archivo `.md` en Disco:
- ❌ **NO incluir etiquetas XML:** Tienes estrictamente prohibido incluir `<idea_usuario>` o `</idea_usuario>` dentro del archivo guardado en disco (esas etiquetas son exclusivas de la salida visual en pantalla).
- ❌ **NO incluir bloques de código Markdown:** No envuelvas el texto en triple backtick (\`\`\` o \`\`\`xml).
- ❌ **NO incluir encabezados Markdown decorativos:** No agregues títulos `# IDEA OPTIMIZADA` ni subtítulos en el archivo físico.
- ❌ **NO incluir justificaciones analíticas:** La sección *"¿Por qué esta versión es mejor para el agente PA?"* **NO debe guardarse** en el archivo `.md`.

### Estructura del Contenido a Guardar:
El contenido del archivo debe ser exclusivamente texto plano continuo en primera persona estructurado en párrafos fluidos:
1. Párrafo 1: Identidad del stakeholder, contexto del negocio y declaración explícita del dolor o fricción operativa.
2. Párrafo 2: Mapeo de actores involucrados en el flujo.
3. Párrafo 3 a N: Descripción agrupada de los módulos funcionales requeridos para resolver el dolor, integrando las restricciones de forma natural.


[IMPORT_SKILL: skills/tracker-logger/SKILL.md]
