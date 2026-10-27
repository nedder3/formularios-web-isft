# Especificación de Diseño UX/UI y Exportación a Figma - ISFT N° 191

Este documento consolida la investigación UX, User Personas, Branding Kit, Design System, Tipografía, Paleta de Colores y Wireframes del **Sistema de Inscripción a Exámenes Finales del ISFT N° 191**, junto con los **3 métodos listos en este repositorio para llevarlo a Figma**.

---

## 1. Cómo Exportar / Importar este Diseño en Figma (3 Alternativas Listas)

> **Nota sobre la API de Figma:** La API REST pública de Figma (`api.figma.com/v1`) es de **solo lectura** para nodos de diseño; la creación programática de Frames, Auto-Layouts y capas editables en Figma se realiza mediante la **Plugin API de Figma**, mediante **W3C Design Tokens** o mediante plugins de captura DOM como **`html.to.design`**. En este proyecto tenés las **3 opciones ya construidas**:

### Opción A (Más rápida - Captura exacta del DOM real): Plugin `html.to.design`
1. Con el servidor corriendo (`npm run dev`), tenés dos vistas listas para capturar:
   - **Formulario interactivo real:** `http://localhost:4321/`
   - **Tablero completo de UX, Personas, Branding, Tokens y Wireframes:** `http://localhost:4321/figma-board`
2. En Figma, abrí el plugin gratuito **`html.to.design`** (por ‹div›RIOTS) e instalá su extensión de Chrome.
3. Capturá `http://localhost:4321/` y `http://localhost:4321/figma-board` e importalos en tu archivo de Figma: convierte cada tarjeta *Double-Bezel*, tipografía, píldora e ícono SVG en capas editables con Auto-Layout.

### Opción B (Generador Nativo Programático incluido en este repo): Plugin Propio de Figma
En la carpeta [`design-system/figma-plugin-generator/`](./figma-plugin-generator/) incluimos un plugin nativo de Figma escrito con la API oficial de Figma (`figma.createFrame`, `layoutMode = 'VERTICAL'`, etc.):
1. Abrí **Figma Desktop**.
2. Menú superior -> **Plugins -> Development -> Import plugin from manifest...**
3. Seleccioná el archivo `design-system/figma-plugin-generator/manifest.json`.
4. Ejecutalo desde **Plugins -> Development -> ISFT 191 - Generador de Design System y Wireframes**: creará automáticamente en tu lienzo los **7 Frames organizados con Auto-Layout**.

### Opción C (Variables y Estilos): W3C Design Tokens JSON
En [`design-system/figma-tokens.json`](./figma-tokens.json) se encuentran todos los colores institucionales, radios, tipografías y métricas de layout en el estándar W3C Design Tokens, listos para importar con 1 clic en **Tokens Studio for Figma** o en las **Variables nativas de Figma**.

---

## 2. Investigación y Concepto (*Framer Academic Portal*)

- **Problema:** La dispersión de formularios por carrera/año generaba errores de carga, inscripciones duplicadas y trabajo manual en Secretaría para separar los inscriptos de cada docente.
- **Concepto Visual:** *Framer Academic Portal* — combina una estética institucional limpia (escudo oficial del ISFT N° 191, azul `#3438AA` y ocre `#C97026`) con contenedores de doble bisel (*Double-Bezel*) y una columna lateral fija de resumen (65% formulario / 35% resumen).
- **Leyes de UX:**
  - **Ley de Hick-Hyman:** Cascada progresiva (`Tecnicatura -> Año -> Asignatura`) + buscador instantáneo para reducir 211 materias a ~8 opciones por año.
  - **Ley de Proximidad (Gestalt):** Agrupación en sub-bloques semánticos (*Titularidad y Cohorte*, *Contacto*, *Padrón Curricular*, *Condición y Cátedra*).
  - **Heurística de Prevención de Errores:** Autocompletado automático de `"Docente + Nombre de Materia"` para garantizar un cruce 100% exacto con el Excel de correos docentes.

---

## 3. User Personas

| Arquetipo | Perfil | Necesidad Clave | Solución en el Producto |
| :--- | :--- | :--- | :--- |
| **1. Estudiante Técnico** | 19 a 38 años, cursa alguna de las 8 tecnicaturas, suele inscribirse desde el celular a 2-4 finales. | No tipear sus datos personales 4 veces seguidas y tener un comprobante válido. | Guardado local de legajo (`localStorage`), botón *"Inscribirme a otra asignatura"* y comprobante PDF verificable (`SHA-256`). |
| **2. Docente de Cátedra** | Profesor/a que necesita la lista oficial de alumnos para armar la mesa examinadora. | Recibir la nómina limpia en su mail sin entrar a sistemas complejos ni filtrar hojas ajenas. | Envío programado cada 15 días al correo del docente con tabla en el cuerpo del mail + archivo `.csv`/Excel adjunto de su materia. |
| **3. Secretaría Académica** | Personal administrativo y directivo del ISFT N° 191. | Evitar duplicados, asegurar horarios oficiales (`GMT-3`) y auditar inscripciones. | Deduplicación automática por `(DNI + Materia)`, hora oficial `America/Argentina/Buenos_Aires (GMT-3)` y menú `ISFT 191 - Secretaría` en Google Sheets. |

---

## 4. Branding Kit, Paleta de Colores y Tipografía

### 4.1 Paleta de Colores y Ratios de Contraste (WCAG 2.1)
- **Brand Primary (`#3438AA`):** Azul institucional principal — Contraste sobre `#FFFFFF`: **8.65:1 (AAA)**.
- **Brand Primary Dark (`#252882`):** Estado hover/activo de botones primarios — Contraste sobre `#FFFFFF`: **11.4:1 (AAA)**.
- **Brand Primary Soft (`#EEF0FF`):** Fondos de píldoras seleccionadas e íconos activos.
- **Brand Accent (`#C97026`):** Dorado ocre institucional para filete superior de cabecera, etiquetas de sección y acentos.
- **Canvas & Surfaces:** Fondo general `#F6F8FC`, marco *Double-Bezel* `#EEF2F9` (borde `#DDE3F0`), tarjeta interior `#FFFFFF`.
- **Textos:** Primario `#1B1F3B` (**14.8:1 AAA**), Secundario `#4A516D` (**7.4:1 AAA**), Muted `#646D8C` (**4.9:1 AA**).

### 4.2 Sistema Tipográfico
- **Display / Encabezados:** `Plus Jakarta Sans` (`700`, `800`), `letter-spacing: -0.02em`.
- **Interfaz y Cuerpo:** `Inter` (`400`, `500`, `600`, `700`).
- **Datos Tabulares y Códigos:** `JetBrains Mono` (`600`, `700`) con `font-variant-numeric: tabular-nums` para DNI, teléfono, códigos de materia y hashes de comprobante.
