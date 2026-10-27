// ============================================================================
// PLUGIN NATIVO DE FIGMA - ISFT N° 191 DESIGN SYSTEM & WIREFRAMES GENERATOR
// ============================================================================
// Cómo usarlo en Figma Desktop:
// 1. Abrir Figma -> Menú superior -> Plugins -> Development -> Import plugin from manifest...
// 2. Seleccionar el archivo `design-system/figma-plugin-generator/manifest.json`
// 3. Ejecutar el plugin: creará automáticamente los 7 Frames editables con Auto-Layout.

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

async function generateIsftBoard() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const COLORS = {
    primary: hexToRgb('#3438AA'),
    primaryDark: hexToRgb('#252882'),
    primarySoft: hexToRgb('#EEF0FF'),
    accent: hexToRgb('#C97026'),
    accentLight: hexToRgb('#FDF3E7'),
    canvas: hexToRgb('#F6F8FC'),
    white: hexToRgb('#FFFFFF'),
    textMain: hexToRgb('#1B1F3B'),
    textMuted: hexToRgb('#646D8C'),
    border: hexToRgb('#DBE2EF'),
    success: hexToRgb('#15803D'),
  };

  const framesSpec = [
    {
      title: '01 - Investigación UX y Concepto Arquitectónico',
      subtitle: 'Unificación de 8 carreras y 211 asignaturas en un único portal reactivo',
      items: [
        'Problema Resuelto: Eliminación de formularios dispersos y carga manual propensa a errores de tipeo.',
        'Concepto Visual: Framer Academic Portal (Marco Double-Bezel + Resumen Fijo 65%/35%).',
        'Leyes de UX Aplicadas: Ley de Hick-Hyman (Cascada Carrera -> Año -> Materia), Proximidad Gestalt y Peak-End Rule.',
        'Privacidad de Datos: El estudiante sólo accede a su comprobante SHA-256; el docente recibe su nómina por mail cada 15 días.',
      ],
    },
    {
      title: '02 - User Personas (Arquetipos del Instituto)',
      subtitle: 'Perfiles de usuarios reales del ISFT N° 191 Bahía Blanca',
      items: [
        'Persona A - Estudiante Técnico (19 a 35 años): Rinde 2 a 4 finales por llamado desde el celular; necesita recordar su legajo y descargar comprobante PDF.',
        'Persona B - Docente de Cátedra: No quiere entrar a sistemas complejos; necesita recibir en su correo la planilla Excel sólo de su materia cada 15 días.',
        'Persona C - Secretaría Académica: Necesita un padrón homogéneo sin duplicados (DNI + Materia) y trazabilidad por código de comprobante.',
      ],
    },
    {
      title: '03 - Branding Kit Institucional (isft191.edu.ar)',
      subtitle: 'Alineación con la identidad oficial del Instituto Superior de Formación Técnica N° 191',
      items: [
        'Emblema Oficial: Escudo ISFT N° 191 Bahía Blanca en cabecera y comprobante criptográfico.',
        'Tono de Comunicación: Institucional, claro, directo, sin emojis de sistema ni jerga técnica innecesaria.',
        'Separadores Estandarizados: Uso exclusivo de guion medio (" - ") en lugar de barras ASCII o puntos medios.',
      ],
    },
    {
      title: '04 - Paleta de Colores y Tokens Semánticos (WCAG AA/AAA)',
      subtitle: 'Variables de color verificadas por contraste',
      items: [
        'Brand Primary: #3438AA (Contraste 8.65:1 AAA) | Brand Primary Dark: #252882 (11.4:1 AAA)',
        'Brand Accent (Ocre Institucional): #C97026 | Accent Surface: #FDF3E7',
        'Canvas Background: #F6F8FC | Framer Double-Bezel Shell: #EEF2F9 | Card Surface: #FFFFFF',
        'Text Main: #1B1F3B (14.8:1 AAA) | Text Secondary: #4A516D | Semantic Success: #15803D | Danger: #DC2626',
      ],
    },
    {
      title: '05 - Tipografía y Escala Modular',
      subtitle: 'Jerarquía tipográfica de alta legibilidad académica y precisión tabular',
      items: [
        'Display / Títulos: Plus Jakarta Sans (700 / 800) - Encabezados de paso y tarjetas.',
        'UI & Lectura: Inter (400 / 500 / 600 / 700) - Etiquetas, ayudas contextuales y selectores.',
        'Datos Tabulares: JetBrains Mono (600 / 700, font-variant-numeric: tabular-nums) - DNI, Códigos de Materia y Comprobantes SHA-256.',
      ],
    },
    {
      title: '06 - Design System & Componentes UI',
      subtitle: 'Átomos y moléculas reutilizables con área táctil mínima de 48x48px',
      items: [
        'Framer Double-Bezel Container: Contenedor exterior #EEF2F9 (radius 20px, padding 6px) + Tarjeta blanca interior (radius 15px).',
        'Radio Pills con Contador Curricular: Botones de selección de 1°, 2° y 3° Año con badge dinámico de cantidad de asignaturas.',
        'Autocompletado Determinista: Al elegir asignatura se asigna "Docente + Nombre de Materia" para cruce exacto con planilla de mails.',
        'Swiss Editorial Receipt Ticket: Comprobante oficial imprimible en PDF (@media print) con sello SHA-256.',
      ],
    },
    {
      title: '07 - Wireframes y Flujo End-to-End (Web + Excel + Mail Docente)',
      subtitle: 'Arquitectura de pantalla 65% / 35% y circuito automatizado de planillas',
      items: [
        'Vista Paso 1 (65% Izq) + Resumen Fijo (35% Der): Identificación Personal (Nombre, DNI, Cohorte, Teléfono, Correo) con guardado en LocalStorage.',
        'Vista Paso 2 (65% Izq) + Resumen Fijo (35% Der): Píldora de Legajo Activo + Carrera -> Año -> Materia con buscador -> Condición y Docente.',
        'Vista Paso 3 (Comprobante): Ticket oficial con código ISFT-YYYY-XXXXXX + Historial de mesas registradas en la sesión.',
        'Backoffice Automatizado: Impacto en Hoja Inscripciones_Finales + Cruce con Directorio_Docentes + Envío de correo cada 15 días al profesor.',
      ],
    },
  ];

  const createdFrames = [];
  let offsetX = 0;

  for (const spec of framesSpec) {
    const frame = figma.createFrame();
    frame.name = spec.title;
    frame.resize(680, 460);
    frame.x = offsetX;
    frame.y = 0;
    frame.fills = [{ type: 'SOLID', color: COLORS.canvas }];
    frame.cornerRadius = 16;
    frame.layoutMode = 'VERTICAL';
    frame.paddingTop = 28;
    frame.paddingBottom = 28;
    frame.paddingLeft = 28;
    frame.paddingRight = 28;
    frame.itemSpacing = 14;

    const headerBox = figma.createFrame();
    headerBox.layoutMode = 'VERTICAL';
    headerBox.paddingTop = 16;
    headerBox.paddingBottom = 16;
    headerBox.paddingLeft = 20;
    headerBox.paddingRight = 20;
    headerBox.itemSpacing = 4;
    headerBox.cornerRadius = 10;
    headerBox.fills = [{ type: 'SOLID', color: COLORS.primary }];
    headerBox.layoutAlign = 'STRETCH';

    const titleNode = figma.createText();
    titleNode.fontName = { family: 'Inter', style: 'Bold' };
    titleNode.fontSize = 18;
    titleNode.characters = spec.title;
    titleNode.fills = [{ type: 'SOLID', color: COLORS.white }];

    const subNode = figma.createText();
    subNode.fontName = { family: 'Inter', style: 'Regular' };
    subNode.fontSize = 12;
    subNode.characters = spec.subtitle;
    subNode.fills = [{ type: 'SOLID', color: COLORS.primarySoft }];

    headerBox.appendChild(titleNode);
    headerBox.appendChild(subNode);
    frame.appendChild(headerBox);

    for (const itemText of spec.items) {
      const card = figma.createFrame();
      card.layoutMode = 'HORIZONTAL';
      card.paddingTop = 12;
      card.paddingBottom = 12;
      card.paddingLeft = 16;
      card.paddingRight = 16;
      card.cornerRadius = 8;
      card.fills = [{ type: 'SOLID', color: COLORS.white }];
      card.strokes = [{ type: 'SOLID', color: COLORS.border }];
      card.strokeWeight = 1;
      card.layoutAlign = 'STRETCH';

      const txt = figma.createText();
      txt.fontName = { family: 'Inter', style: 'Regular' };
      txt.fontSize = 13;
      txt.characters = itemText;
      txt.fills = [{ type: 'SOLID', color: COLORS.textMain }];
      txt.layoutGrow = 1;

      card.appendChild(txt);
      frame.appendChild(card);
    }

    createdFrames.push(frame);
    offsetX += 740;
  }

  figma.currentPage.selection = createdFrames;
  figma.viewport.scrollAndZoomIntoView(createdFrames);
  figma.closePlugin('Design System y Wireframes del ISFT N° 191 generados correctamente.');
}

generateIsftBoard();
