<div align="center">

# Sistema de Inscripción a Exámenes Finales — ISFT N° 191

**Plataforma Académica SSR de Autogestión de Mesas Examinadoras con Persistencia Excel Homogénea y Preparación para SIU Guaraní**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro SSR](https://img.shields.io/badge/Astro-7.4_SSR-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![Platform](https://img.shields.io/badge/Target-Node.js_Standalone_%7C_WordPress_%7C_SIU_Guaran%C3%AD-3438AA?style=for-the-badge)](https://isft191.edu.ar)
[![License](https://img.shields.io/badge/License-ISC-0F172A?style=for-the-badge)](./package.json)
[![Conventional Commits](https://img.shields.io/badge/Commits-Conventional_1.0.0-FE5196?style=for-the-badge&logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/)
[![Concurrency Guarantee](https://img.shields.io/badge/I%2FO_Guarantee-Mutex_Serialized_Excel-16A34A?style=for-the-badge)](#3-arquitectura-del-sistema-y-modelo-de-concurrencia)

</div>

---

## 1. Descripción General y Capacidades Clave

El **Sistema de Inscripción a Exámenes Finales del ISFT N° 191 (Bahía Blanca)** resuelve la fragmentación de formularios estáticos mediante un motor **Server-Side Rendered (Astro SSR)** que unifica las **8 carreras (planes vigentes y en transición) y sus 211 asignaturas** en una única interfaz reactiva. Cada solicitud se valida contra el padrón curricular oficial en el servidor e impacta de forma atómica en libros Excel homogéneos separados por carrera, respetando el esquema estricto de 10 columnas requerido por Secretaría Académica y preparando los payloads para la futura ingesta en **SIU Guaraní**.

### Características Principales
- **Catálogo Académico Verificado (8 Carreras / 211 Materias):** Sincronización 1:1 con el diseño curricular oficial del instituto (`RS 5847/19`, `RS 5309/24`, `RS 1896/09`, `RS 5312-24`, `RS 1557-07`, `RS 455-23`, `RS 273-03` y `RS 4103/03`), incluyendo el desglose individualizado de los Espacios de Definición Institucional (`EDI 1`, `EDI 2` y `EDI 3`).
- **Filtrado Dinámico en Cascada Zero-Reload:** Selección progresiva en memoria (`Carrera` $\rightarrow$ `Año de Cursada (1°, 2°, 3°)` $\rightarrow$ `Materias Habilitadas`) que impide inscripciones cruzadas o errores de tipeo en nombres de asignaturas.
- **Persistencia Excel Homogénea con Cola Mutex por Carrera:** Generación y actualización de archivos `Inscripciones_<CODIGO_CARRERA>.xlsx` mediante `ExcelJS`, protegida por colas de promesas encadenadas en memoria (`writeLocks`) que serializan el acceso a disco y eliminan condiciones de carrera ante picos de inscripción simultáneos.
- **Persistencia Local de Legajo (Draft Caching):** Almacenamiento automático en `localStorage` de los datos personales del alumno (`Apellido y Nombre`, `DNI`, `Teléfono`, `Email`, `Cohorte`) para permitir la inscripción consecutiva a múltiples materias en segundos.
- **Comprobante Criptográfico Instantáneo:** Emisión de ticket único (`ISFT191-<CARRERA>-<SHA256_8>`) con hoja de estilo `@media print` dedicada para descarga directa en PDF.
- **Integración Nativa con WordPress (`isft191.edu.ar`):** Identidad visual alineada con los tokens de color institucionales (`#3438AA`) y soporte de query flags (`?carrera=<CODE>&embed=1`) para incrustación transparente vía `<iframe>` o Reverse Proxy.

---

## 2. Padrón Curricular Sincronizado

| ID | Código | Carrera | Resolución Oficial | 1° Año | 2° Año | 3° Año | Total Materias |
| :-: | :-: | :--- | :-: | :-: | :-: | :-: | :-: |
| 1 | `SOFT` | Tecnicatura Superior en Desarrollo de Software | `RS 5847/19` | 8 | 8 | 6 | **22** |
| 2 | `ADU-5309` | Tecnicatura Superior en Régimen Aduanero | `RS 5309/24` | 8 | 8 | 7 | **23** |
| 3 | `ADU-1896` | Tecnicatura Superior en Régimen Aduanero | `RS 1896/09` | 10 | 8 | 7 | **25** |
| 4 | `LOG-5312` | Tecnicatura Superior en Logística | `RS 5312-24` | 11 | 9 | 9 | **29** |
| 5 | `LOG-1557` | Tecnicatura Superior en Logística | `RS 1557-07` | 9 | 8 | 7 | **24** |
| 6 | `CONT-455` | Tecnicatura Superior en Administración Contable | `RS 455-23` | 8 | 9 | 7 | **24** |
| 7 | `CONT-273` | Tecnicatura Superior en Administración Contable | `RS 273-03` | 13 | 13 | 12 | **38** |
| 8 | `GEST` | Tecnicatura Superior en Gestoría | `RS 4103/03` | 9 | 9 | 8 | **26** |
| — | **Total** | **8 Planes de Estudio** | **Verificados** | **76** | **72** | **63** | **211** |

---

## 3. Arquitectura del Sistema y Modelo de Concurrencia

### 3.1 Diagrama de Flujo de Arquitectura (`flowchart TD`)

```mermaid
flowchart TD
    subgraph ClientLayer["Capa Cliente (Navegador / Móvil / WordPress)"]
        WP["Portal Institucional WordPress\n(isft191.edu.ar)"]
        UI["Wizard Astro SSR + Islas Interactivas\n(Paso 1: Legajo -> Paso 2: Materia -> Paso 3: Ticket)"]
        Draft["LocalStorage Draft Cache\n(isft191_student_draft_v1)"]
    end

    subgraph ServerLayer["Motor Astro SSR (Node.js Standalone)"]
        Router["SSR Page Router\n(GET /?carrera=CODE&embed=1)"]
        APIPost["Endpoint de Registro\n(POST /api/inscripcion)"]
        APIGet["Endpoint de Exportación\n(GET /api/excel/:carrera)"]
        Catalog["Academic Catalog Service\n(src/lib/academicService.ts)"]
        Mutex["Per-Career Promise Mutex Queue\n(writeLocks Map<filePath, Promise>)"]
        ExcelEngine["ExcelJS Homogeneous Writer\n(src/lib/excelService.ts)"]
    end

    subgraph StorageLayer["Capa de Datos y Persistencia"]
        JSON[("isft_191_scaffolding.json\n(8 Carreras / 211 Materias)")]
        XLSX[("data/output/Inscripciones_<CODE>.xlsx\n(10 Columnas Homogéneas)")]
    end

    WP -->|Iframe / Reverse Proxy| Router
    Router --> Catalog
    Catalog --> JSON
    Router --> UI
    UI <--> Draft
    UI -->|JSON Payload| APIPost
    APIPost -->|Valida Carrera, Año y Materia| Catalog
    APIPost -->|Encola Escritura Serializada| Mutex
    Mutex --> ExcelEngine
    ExcelEngine -->|Lectura/Escritura Atómica| XLSX
    UI -->|Descarga Planilla| APIGet
    APIGet --> XLSX
```

### 3.2 Modelo de Concurrencia y Serialización I/O (`sequenceDiagram`)

Para garantizar que dos alumnos de la misma carrera que envían el formulario en el mismo milisegundo no sobrescriban ni corrompan el archivo `.xlsx`, `src/lib/excelService.ts` implementa una cola de exclusión mutua asíncrona por ruta de archivo (`writeLocks`):

```mermaid
sequenceDiagram
    autonumber
    participant C1 as Cliente A (Navegador)
    participant C2 as Cliente B (Navegador)
    participant API as Astro SSR Thread (/api/inscripcion)
    participant Q as Mutex Queue (writeLocks[GEST])
    participant FS as FileSystem (Inscripciones_GEST.xlsx)

    C1->>API: POST /api/inscripcion (GEST - Derecho Privado I)
    C2->>API: POST /api/inscripcion (GEST - Derecho Constitucional)
    API->>API: Validación de esquema y pertenencia curricular (O(1))
    API->>Q: Encola Transacción A (previousLock.then)
    API->>Q: Encola Transacción B (espera resolución de A)
    activate Q
    Q->>FS: readFile(Inscripciones_GEST.xlsx) [Tx A]
    FS-->>Q: Workbook Buffer
    Q->>FS: addRow() + writeFile(Inscripciones_GEST.xlsx) [Tx A]
    FS-->>Q: Write OK + Hash SHA-256
    Q-->>C1: 200 OK (ISFT191-GEST-A1B2C3D4)
    Q->>FS: readFile(Inscripciones_GEST.xlsx) [Tx B]
    FS-->>Q: Workbook Buffer (con fila A incluida)
    Q->>FS: addRow() + writeFile(Inscripciones_GEST.xlsx) [Tx B]
    FS-->>Q: Write OK + Hash SHA-256
    Q-->>C2: 200 OK (ISFT191-GEST-E5F60718)
    deactivate Q
```

---

## 4. Especificación de Interfaces y API HTTP

### 4.1 Parámetros de Vista SSR (`GET /`)

| Query Flag | Tipo | Ejemplo | Descripción |
| :--- | :---: | :--- | :--- |
| `carrera` | `string` | `?carrera=GEST` | Preselecciona automáticamente la carrera en el Paso 2 del formulario. |
| `embed` | `0 \| 1` | `?carrera=SOFT&embed=1` | Oculta el encabezado y pie de página institucional para incrustación limpia dentro de WordPress. |

### 4.2 Registro de Inscripción (`POST /api/inscripcion`)

Valida los datos del alumno y la correlación estricta `Carrera` $\rightarrow$ `Año` $\rightarrow$ `Materia` antes de impactar en el archivo Excel de la carrera.

#### Request Payload (`application/json`)
```json
{
  "apellidoNombre": "Cricelli Candela Juliana",
  "dni": "43596839",
  "telefono": "2914058716",
  "email": "candecricelli21@gmail.com",
  "cohorte": "2023",
  "carreraCode": "GEST",
  "anioMateria": 1,
  "modalidad": "Regular",
  "materiaCodigo": "GEST-102",
  "anioCursado": "2023",
  "profesor": "Crivelli"
}
```

#### Response `200 OK` (`application/json`)
```json
{
  "ok": true,
  "comprobanteId": "ISFT191-GEST-9F4A2C1B",
  "fechaIso": "2026-10-27T13:05:12.410Z",
  "archivoCarrera": "Inscripciones_GEST.xlsx",
  "datos": {
    "carreraCode": "GEST",
    "carreraNombre": "Tecnicatura Superior en Gestoría",
    "carreraResolucion": "RS 4103/03",
    "apellidoNombre": "Cricelli Candela Juliana",
    "dni": "43596839",
    "telefono": "2914058716",
    "email": "candecricelli21@gmail.com",
    "cohorte": "2023",
    "anioMateria": 1,
    "anioMateriaLabel": "Primero",
    "modalidad": "Regular",
    "materiaCodigo": "GEST-102",
    "materiaNombre": "Derecho Constitucional",
    "anioCursado": "2023",
    "profesor": "Crivelli"
  }
}
```

#### Códigos de Estado y Manejo de Errores
- **`200 OK`**: Inscripción persistida en el libro Excel de la carrera y comprobante emitido.
- **`400 Bad Request`**: Fallo de validación defensiva (DNI fuera de rango de 7–9 dígitos, email inválido, cohorte/año de cursado con formato incorrecto, o materia inexistente para la carrera y año indicados).
- **`500 Internal Server Error`**: Error de permisos de sistema de archivos o fallo inesperado en motor de serialización Excel.

### 4.3 Descarga de Planilla Homogénea (`GET /api/excel/:carrera`)

- **Ruta:** `GET /api/excel/GEST` (acepta cualquiera de los 8 códigos: `SOFT`, `ADU-5309`, `ADU-1896`, `LOG-5312`, `LOG-1557`, `CONT-455`, `CONT-273`, `GEST`).
- **Respuesta `200 OK`:** Flujo binario `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` con las **10 columnas homogéneas exactas**:
  1. `Apellido y Nombre`
  2. `DNI`
  3. `Teléfono`
  4. `Dirección de correo electrónico`
  5. `Cohorte`
  6. `Año al que pertenece la materia que quiere rendir` (`Primero` | `Segundo` | `Tercero`)
  7. `MODALIDAD` (`Regular` | `Libre`)
  8. `MATERIA`
  9. `AÑO DE CURSADO`
  10. `PROFESOR`
- **Respuesta `404 Not Found`:** Código de carrera inválido o carrera aún sin inscripciones registradas en disco.

---

## 5. Runbook: Instalación, Compilación y Verificación

### 5.1 Requisitos Previos
- **Node.js:** `>= 20.0.0` (probado en `v26.11.1`)
- **npm:** `>= 10.0.0`

### 5.2 Clonación e Instalación
```bash
git clone git@github.com:nedder3/formularios-web-isft.git
cd formularios-web-isft
npm install
```

### 5.3 Ejecución en Desarrollo y Compilación de Producción (Release)
```bash
# Servidor de desarrollo con Hot-Reload en http://localhost:4321
npm run dev

# Compilación SSR para producción (salida en ./dist/server/entry.mjs)
npm run build

# Ejecución del servidor Node.js Standalone en producción
npm start
```

### 5.4 Verificación de Integridad del Padrón y Prueba End-to-End
```bash
# 1. Verificar integridad del catálogo JSON (8 carreras, 211 materias)
node -e '
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("./isft_191_scaffolding.json", "utf8"));
const total = data.carreras.reduce((acc, c) => acc + c.materias.length, 0);
console.log(`Carreras: ${data.carreras.length} | Materias totales: ${total}`);
'

# 2. Compilar el proyecto verificando tipos y bundle SSR
npm run build
```


---

## 6. Roadmap de Evolución y Checklist de Auditoría Senior

A continuación se documenta el relevamiento integral de mejoras técnicas, arquitectónicas, de seguridad, testing y experiencia de usuario detectadas sobre la base actual, preservando la identidad institucional del **ISFT N° 191 (`#3438AA` / `#D97706`)** y la compatibilidad con **WordPress** y **SIU Guaraní**.

### 6.1 Estructura de Datos, Complejidad y Persistencia (`academicService.ts` / `excelService.ts`)
- [ ] **Indexación en Memoria $O(1)$ (`Map` Lookup):** Reemplazar las búsquedas lineales `.find()` y `.filter()` repetidas en `getCarreraByCode()`, `getMateriasByCarreraAndYear()` y `POST /api/inscripcion` por estructuras `Map<CarreraCode, Carrera>` y `Map<string, Materia>` precomputadas al hidratar `isft_191_scaffolding.json`.
- [ ] **Proyección de DTO Ligero para el Cliente:** Evitar serializar campos internos innecesarios (`id`, `carrera_id`, `source_sheet`) en el HTML SSR; inyectar únicamente un payload compacto (`code`, `name`, `resolution`, `materias: [{ code, name, year }]`) reduciendo el tamaño del documento inicial.
- [ ] **Control de Idempotencia y Deduplicación (`DNI + materiaCodigo`):** Validar antes de insertar en `Inscripciones_<CARRERA>.xlsx` si ya existe una inscripción idéntica para el mismo estudiante y asignatura en el turno vigente, evitando filas duplicadas por doble clic o reenvío de red.
- [ ] **Registro Transaccional Append-Only (JSONL / SQLite WAL):** Incorporar un log de auditoría ligero (`data/output/audit_log.jsonl`) en paralelo a la escritura de `ExcelJS` para evitar depender únicamente del re-parseo completo del archivo ZIP/XLSX ($O(R)$ por fila) ante volúmenes altos de inscripción.

### 6.2 Subdivisión Modular y Patrones de Diseño
- [ ] **Descomposición del Monolito `src/pages/index.astro` (941 líneas):** Subdividir la vista principal en componentes cohesivos bajo `src/components/`:
  - [ ] `src/components/NoticeBanner.astro` (Avisos institucionales y estado de sesión recordada).
  - [ ] `src/components/WizardStepper.astro` (Indicador de progreso accesible e interactivo).
  - [ ] `src/components/StepPersonalData.astro` (Formulario del Paso 1: Identidad y Contacto).
  - [ ] `src/components/StepSubjectSelection.astro` (Formulario del Paso 2: Selección en cascada y datos de cátedra).
  - [ ] `src/components/ReceiptTicket.astro` (Vista del Paso 3: Comprobante criptográfico e historial de sesión).
- [ ] **Single Source of Truth (SSOT) en Validación (Specification / Schema Pattern):** Extraer las reglas de validación duplicadas entre el cliente (`index.astro`) y el servidor (`src/pages/api/inscripcion.ts`) hacia un módulo compartido `src/lib/validation.ts` (o esquema `Zod`/`Valibot`), garantizando simetría exacta en mensajes de error y sanitización.
- [ ] **Patrón Repository (`IInscripcionRepository`):** Abstraer `registrarInscripcionEnExcel` detrás de un contrato de dominio que permita combinar o conmutar `ExcelInscripcionRepository` con un futuro `SiuGuaraniRepository` sin acoplar el endpoint HTTP.
- [ ] **Máquina de Estados Finita (FSM) en Cliente:** Reemplazar la mutación imperativa dispersa de atributos `.hidden` y clases `.active/.done` por un controlador declarativo de transiciones (`STEP_1_PERSONAL` $\rightarrow$ `STEP_2_ACADEMIC` $\rightarrow$ `STEP_3_RECEIPT`).

### 6.3 Seguridad, Buenas Prácticas y Manejo de Recursos
- [ ] **Protección de Datos Personales (PII) en `GET /api/excel/[carrera].ts`:** Restringir la descarga del padrón completo `.xlsx` (que contiene DNI, teléfono y correo de todos los inscriptos) mediante autenticación para Secretaría Académica (Token / Basic Auth) y remover el enlace público de descarga masiva de la vista del alumno, dejando al estudiante únicamente su comprobante individual.
- [ ] **Mitigación de CSV / Excel Formula Injection:** Sanitizar en `excelService.ts` cualquier cadena de entrada (`apellidoNombre`, `profesor`, `email`) que comience con caracteres ejecutables de planilla (`=`, `+`, `-`, `@`, `\t`, `\r`) anteponiendo un apóstrofo de escape (`'`).
- [ ] **Operaciones de Disco 100% Asíncronas (`node:fs/promises`):** Sustituir `fs.readFileSync`, `fs.existsSync` y `fs.mkdirSync` en `academicService.ts`, `excelService.ts` y `[carrera].ts` por operaciones no bloqueantes del Event Loop y streaming de archivos en la descarga HTTP.
- [ ] **Rate Limiting por IP / DNI en `POST /api/inscripcion`:** Implementar un limitador en memoria (Token Bucket / Sliding Window) para prevenir abuso automatizado o saturación de la cola `writeLocks`.
- [ ] **Scripts Multiplataforma en `package.json`:** Reemplazar el prefijo POSIX `ASTRO_TELEMETRY_DISABLED=1` en los scripts `dev`, `build` y `preview` por configuración nativa compatible con Windows PowerShell/CMD y Linux/macOS.

### 6.4 Server-Side Rendering (SSR) y Eficiencia de Carga
- [ ] **Eliminación de `define:vars` Inline para Habilitar Bundling Vite:** Pasar el catálogo inicial mediante un bloque `<script type="application/json" id="isft-catalog">` o endpoint cacheado (`GET /api/catalogo.json` con `Cache-Control: public, max-age=86400, stale-while-revalidate`), permitiendo que el script del wizard sea compilado, minificado y tipado con TypeScript por Astro.
- [ ] **Pre-hidratación SSR de Carrera Preseleccionada (`?carrera=CODE`):** Cuando el usuario accede desde WordPress con `?carrera=GEST`, renderizar directamente en el servidor el estado preseleccionado y los contadores de materias por año sin esperar a la ejecución de JavaScript.
- [ ] **Optimización de Fuentes y Critical Rendering Path (`Layout.astro`):** Unificar las fuentes externas (`Open Sans` + `Roboto` se solicitan juntas aunque `Roboto` actúa solo como fallback) en una única familia tipográfica optimizada con `font-display: swap` o fuentes autoalojadas para eliminar bloqueos de renderizado externo.

### 6.5 Suite de Testing Automatizado (QA)
- [ ] **Tests Unitarios de Dominio y Padrón (`Vitest`):**
  - [ ] Verificar invariantes de `isft_191_scaffolding.json` (8 carreras exactas, 211 materias, unicidad de códigos `code`, años válidos `1 | 2 | 3`).
  - [ ] Probar casos borde del validador (DNI con puntos/espacios, cohortes fuera de rango, materias cruzadas entre carreras o años distintos).
- [ ] **Test de Estrés y Concurrencia sobre `writeLocks` (`Vitest`):**
  - [ ] Ejecutar 25 escrituras paralelas (`Promise.all`) sobre una misma carrera y verificar que el archivo `.xlsx` resultante contenga exactamente las 25 filas íntegras y las 10 columnas homogéneas.
- [ ] **Tests End-to-End del Flujo Académico (`Playwright`):**
  - [ ] Simular inscripción completa Paso 1 $\rightarrow$ Paso 2 $\rightarrow$ Paso 3, recarga con persistencia `localStorage` y flujo de inscripción consecutiva (`+ Inscribirme a otra materia`).

### 6.6 Rediseño UX/UI: Leyes de UX, Heurísticas, Accesibilidad y Estilo Visual

#### A. Aplicación de Leyes de UX/UI y Heurísticas de Nielsen
- [ ] **Ley de Proximidad (Gestalt) y Orden Mental en Paso 2:** Reordenar los campos del Paso 2 para respetar el modelo mental del estudiante: `1. Carrera` $\rightarrow$ `2. Año de la Materia` $\rightarrow$ `3. Materia a Rendir` $\rightarrow$ `4. Condición de Cursada (Modalidad, Año de Cursado y Profesor)`. Actualmente `Modalidad` interrumpe la cascada entre `Año` y `Materia`.
- [ ] **Ley de Hick-Hyman (Reducción de Tiempo de Búsqueda):** Incorporar filtro rápido de texto o agrupación clara en el selector de materias (especialmente crítico en planes con hasta 13 asignaturas por año como `CONT-273`) y autocompletado (`<datalist>`) con los profesores ingresados previamente por el alumno en la sesión.
- [ ] **Efecto del Gradiente de Meta y Visibilidad del Estado (Heurística H1):**
  - [ ] Añadir en la cabecera del Paso 2 una **Píldora de Legajo Activo** (`"Inscribiendo a: Pérez Juan (DNI 43.596.839) — [Editar]"`), evitando que el alumno dude de qué datos personales se están enviando.
  - [ ] Mostrar un aviso explícito con acción de limpieza (`"Datos recordados en este dispositivo • [Cambiar de alumno]"`) cuando `localStorage` autocompleta el Paso 1 (Heurística H3: Control y libertad del usuario, clave en PCs compartidas del instituto).
- [ ] **Prevención de Errores Inline (Heurística H5):** Validar cada campo en tiempo real (`blur` / `input`) con indicadores visuales por campo y formateo automático (limpieza de puntos en DNI mientras escribe), en vez de mostrar un único cartel de error general al final del formulario.
- [ ] **Regla del Pico-Final (Peak-End Rule) en Paso 3:** Agregar en la vista del comprobante un historial acumulativo de **"Mesas inscriptas en esta sesión"**, brindando certeza inmediata al estudiante que se anota a 3 o 4 finales seguidos.

#### B. Accesibilidad Web (WCAG 2.1 Nivel AA)
- [ ] **Gestión Programática de Foco entre Pasos:** Al avanzar o retroceder entre Paso 1, Paso 2 y el Comprobante, trasladar el foco (`element.focus()`) al título del nuevo paso (`tabindex="-1"`) y hacer scroll suave al inicio de la tarjeta.
- [ ] **Semántica ARIA en Validaciones y Stepper:** Vincular cada `<input>` con su texto de ayuda y error mediante `aria-describedby`, marcar campos inválidos con `aria-invalid="true"`, añadir `role="alert"` a los contenedores de error y `aria-current="step"` al indicador activo del wizard.
- [ ] **Soporte de Movimiento Reducido:** Respetar `@media (prefers-reduced-motion: reduce)` en todas las micro-transiciones del formulario.

#### C. Propuesta de Estilo Estético: *Institutional Bento Grid + Subtle Liquid Glass*
Sin alterar los colores oficiales del **ISFT N° 191** (`#3438AA` Azul Institucional y `#D97706` Ámbar Académico), se propone evolucionar la interfaz hacia una fusión de **Bento Grid Modular** + **Subtle Glassmorphism / Liquid Glass** con detalles de **Swiss Editorial Ticket** para el comprobante:
- [ ] **1. Estructura Bento Grid Modular (Pasos 1 y 2):** Organizar los bloques del formulario en celdas modulares claramente delimitadas (*Bento Cards*: celda de Identidad Académica, celda de Contacto, celda de Resumen de Legajo Activo, celda de Cascada Curricular y celda de Cátedra), mejorando el escaneo visual tanto en escritorio como dentro del `<iframe>` de WordPress.
- [ ] **2. Superficies Subtle Liquid Glass (Header & Stepper):** Aplicar traslucidez sutil (`backdrop-filter: blur(12px)`, bordes luminosos de `1px` y sombras multicapa suaves teñidas con el azul `#3438AA`) en la barra de progreso flotante y en las píldoras interactivas de selección de año (`1°`, `2°`, `3°`) y modalidad (`Regular`, `Libre`).
- [ ] **3. Comprobante estilo *Swiss Precision Ticket* (Paso 3):** Rediseñar el comprobante final como un pase oficial de alta legibilidad con tipografía monoespaciada tabular (`font-variant-numeric: tabular-nums`), bordes troquelados académicos, sello de verificación SHA-256 destacado y hoja de impresión `@media print` optimizada en una sola carilla A4.
