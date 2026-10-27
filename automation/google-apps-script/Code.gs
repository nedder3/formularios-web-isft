/**
 * ============================================================================
 * ISFT N° 191 - SISTEMA AUTOMATIZADO DE MESAS EXAMINADORAS (FASE 1 - PoC)
 * ============================================================================
 * Planilla vinculada en Google Drive (arij.dev@gmail.com):
 * ID: 12u9N-3c9aKF51JstFVpH7KREZHHwkhqceWRQq4Uha2g
 *
 * Funcionalidades:
 * 1. Parametrización de Ventana de Inscripción (Pestaña "Configuracion_Turnos"):
 *    Permite a Secretaría Académica definir sin tocar código:
 *    - DIA_APERTURA (ej. 15): Día en que se habilita la recepción de inscripciones.
 *    - DIA_CIERRE (ej. 19): Último día habilitado para que los alumnos se anoten.
 *    - DIA_ENVIO_DOCENTES (ej. 20): Día en que se dispara automáticamente el mail
 *      con el padrón definitivo a cada docente.
 *    - MODO_VENTANA: "DEMO_SIEMPRE_ABIERTO" | "POR_CALENDARIO" | "CERRADO_MANUAL".
 * 2. doGet(e): Devuelve al frontend el estado actual de la ventana y las fechas
 *    configuradas por Secretaría.
 * 3. doPost(e): Verifica que la ventana esté abierta, aplica deduplicación por
 *    (DNI + Materia_Codigo) e impacta en "Inscripciones_Finales" con hora GMT-3.
 * 4. enviarNominasDocentes(): Cruza los inscriptos con "Directorio_Docentes"
 *    (Docente + Nombre de Materia) y envía el correo con tabla HTML + CSV adjunto.
 */

const SPREADSHEET_ID = '12u9N-3c9aKF51JstFVpH7KREZHHwkhqceWRQq4Uha2g';
const SHEET_INSCRIPCIONES = 'Inscripciones_Finales';
const SHEET_HISTORICO = 'Historico';
const SHEET_DOCENTES = 'Directorio_Docentes';
const SHEET_CONFIG = 'Configuracion_Turnos';

// Parámetros por defecto (editables desde la pestaña "Configuracion_Turnos" del Excel)
const DEFAULT_CONFIG = {
  MODO_VENTANA: 'DEMO_SIEMPRE_ABIERTO', // Opciones: DEMO_SIEMPRE_ABIERTO | POR_CALENDARIO | CERRADO_MANUAL
  DIA_APERTURA: 15,                     // Ej: Día 15 abre la inscripción
  DIA_CIERRE: 19,                       // Ej: Día 19 a las 23:59 cierra la inscripción
  DIA_ENVIO_DOCENTES: 20,               // Ej: Día 20 se dispara la nómina por mail a los docentes
  HORA_ENVIO_DOCENTES: 8                // 08:00 hs (America/Argentina/Buenos_Aires GMT-3)
};

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Crea el menú institucional en la barra superior de Google Sheets.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ISFT 191 - Secretaría')
    .addItem('1. Enviar Nóminas Pendientes y Archivar en Histórico', 'enviarNominasDocentes')
    .addSeparator()
    .addItem('2. Configurar Fechas de Apertura y Envío (Día 15 al 20)', 'abrirHojaConfiguracionTurnos')
    .addItem('3. Ver Pestaña de Histórico de Inscripciones', 'abrirHojaHistorico')
    .addItem('4. Activar Cron Automático por Calendario (Evalúa Día 20)', 'instalarTriggerCalendarioParametrizable')
    .addSeparator()
    .addItem('5. Cargar Alumno de Prueba (Simulación)', 'simularInscripcionDemo')
    .addToUi();
}

/**
 * Obtiene (o crea automáticamente si no existe) la pestaña "Configuracion_Turnos"
 * para que Secretaría Académica modifique los días de apertura/cierre/envío en celdas simples.
 */
function obtenerConfiguracionVentana() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_CONFIG);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CONFIG);
    const rows = [
      ['Parámetro', 'Valor', 'Descripción para Secretaría Académica'],
      [
        'MODO_VENTANA',
        DEFAULT_CONFIG.MODO_VENTANA,
        'DEMO_SIEMPRE_ABIERTO (permite probar hoy) | POR_CALENDARIO (respeta días de apertura y cierre) | CERRADO_MANUAL'
      ],
      [
        'DIA_APERTURA',
        DEFAULT_CONFIG.DIA_APERTURA,
        'Día del mes en que se habilita el formulario para los estudiantes (Ej: 15)'
      ],
      [
        'DIA_CIERRE',
        DEFAULT_CONFIG.DIA_CIERRE,
        'Último día inclusive en que se reciben inscripciones (Ej: 19)'
      ],
      [
        'DIA_ENVIO_DOCENTES',
        DEFAULT_CONFIG.DIA_ENVIO_DOCENTES,
        'Día del mes en que se dispara automáticamente el correo con la planilla a cada docente (Ej: 20)'
      ],
      [
        'HORA_ENVIO_DOCENTES',
        DEFAULT_CONFIG.HORA_ENVIO_DOCENTES,
        'Hora del día de envío automático en huso horario Buenos Aires GMT-3 (Ej: 8 para 08:00 hs)'
      ]
    ];
    sheet.getRange(1, 1, rows.length, 3).setValues(rows);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#3438AA').setFontColor('#FFFFFF');
    sheet.setColumnWidth(1, 220);
    sheet.setColumnWidth(2, 220);
    sheet.setColumnWidth(3, 520);
  }

  const values = sheet.getDataRange().getValues();
  const cfg = {
    modoVentana: DEFAULT_CONFIG.MODO_VENTANA,
    diaApertura: DEFAULT_CONFIG.DIA_APERTURA,
    diaCierre: DEFAULT_CONFIG.DIA_CIERRE,
    diaEnvioDocentes: DEFAULT_CONFIG.DIA_ENVIO_DOCENTES,
    horaEnvioDocentes: DEFAULT_CONFIG.HORA_ENVIO_DOCENTES
  };

  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '').trim().toUpperCase();
    const val = values[i][1];
    if (key === 'MODO_VENTANA' && val) cfg.modoVentana = String(val).trim().toUpperCase();
    if (key === 'DIA_APERTURA' && val !== '') cfg.diaApertura = Number(val) || DEFAULT_CONFIG.DIA_APERTURA;
    if (key === 'DIA_CIERRE' && val !== '') cfg.diaCierre = Number(val) || DEFAULT_CONFIG.DIA_CIERRE;
    if (key === 'DIA_ENVIO_DOCENTES' && val !== '') cfg.diaEnvioDocentes = Number(val) || DEFAULT_CONFIG.DIA_ENVIO_DOCENTES;
    if (key === 'HORA_ENVIO_DOCENTES' && val !== '') cfg.horaEnvioDocentes = Number(val) || DEFAULT_CONFIG.HORA_ENVIO_DOCENTES;
  }

  const now = new Date();
  const diaActualAr = Number(
    Utilities.formatDate(now, 'America/Argentina/Buenos_Aires', 'd')
  );

  let inscripcionAbierta = true;
  if (cfg.modoVentana === 'CERRADO_MANUAL') {
    inscripcionAbierta = false;
  } else if (cfg.modoVentana === 'POR_CALENDARIO') {
    inscripcionAbierta = diaActualAr >= cfg.diaApertura && diaActualAr <= cfg.diaCierre;
  }

  return {
    modoVentana: cfg.modoVentana,
    diaApertura: cfg.diaApertura,
    diaCierre: cfg.diaCierre,
    diaEnvioDocentes: cfg.diaEnvioDocentes,
    horaEnvioDocentes: cfg.horaEnvioDocentes,
    diaActualAr: diaActualAr,
    inscripcionAbierta: inscripcionAbierta,
    mensajeCronograma:
      'Inscripción habilitada del día ' +
      cfg.diaApertura +
      ' al ' +
      cfg.diaCierre +
      ' - Envío de nóminas a docentes: día ' +
      cfg.diaEnvioDocentes
  };
}

/**
 * Abre y posiciona a Secretaría en la pestaña "Configuracion_Turnos".
 */
function abrirHojaConfiguracionTurnos() {
  obtenerConfiguracionVentana();
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  if (sheet) {
    ss.setActiveSheet(sheet);
    ss.toast(
      'Modificá los días en la columna B (Valor) para ajustar la apertura y el disparo automático.',
      'Configuración de Turnos Activa',
      6
    );
  }
}

/**
 * Obtiene (o crea automáticamente si no existe) la pestaña "Historico" donde se archivan
 * las inscripciones una vez que sus nóminas fueron enviadas por correo a los docentes.
 */
function obtenerOCrearHojaHistorico() {
  const ss = getSpreadsheet();
  let sheetHist = ss.getSheetByName(SHEET_HISTORICO);
  if (!sheetHist) {
    sheetHist = ss.insertSheet(SHEET_HISTORICO);
    const headers = [
      'ID Comprobante',
      'Fecha y Hora (GMT-3)',
      'Apellido y Nombre',
      'DNI',
      'Teléfono',
      'Correo Electrónico',
      'Cohorte',
      'Carrera_Codigo',
      'Carrera_Nombre',
      'Año de la Materia',
      'Código Materia',
      'Asignatura a Rendir',
      'Modalidad Examen',
      'Año de Cursada',
      'Docente Cátedra',
      'Estado Envío Docente',
      'Fecha Despacho Docente (GMT-3)',
      'Email Docente Destino'
    ];
    sheetHist.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheetHist
      .getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#3438AA')
      .setFontColor('#FFFFFF');
    sheetHist.setFrozenRows(1);
  }
  return sheetHist;
}

/**
 * Abre y posiciona a Secretaría en la pestaña "Historico".
 */
function abrirHojaHistorico() {
  const sheetHist = obtenerOCrearHojaHistorico();
  const ss = getSpreadsheet();
  ss.setActiveSheet(sheetHist);
  ss.toast(
    'Aquí se archivan todas las inscripciones cuyas nóminas ya fueron enviadas a los docentes.',
    'Histórico de Inscripciones',
    5
  );
}

/**
 * Endpoint GET para que el formulario web consulte si la ventana de inscripción está abierta
 * y muestre el cronograma vigente.
 */
function doGet() {
  const status = obtenerConfiguracionVentana();
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      ...status
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Webhook receptor (POST desde GitHub Pages o entorno local).
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(rawBody);

    const estadoVentana = obtenerConfiguracionVentana();
    if (data && data.action === 'status') {
      return ContentService.createTextOutput(
        JSON.stringify({
          ok: true,
          ...estadoVentana
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!estadoVentana.inscripcionAbierta && !data.forzarDemo) {
      return ContentService.createTextOutput(
        JSON.stringify({
          ok: false,
          cerrada: true,
          error:
            'El período de inscripción se encuentra cerrado. (' +
            estadoVentana.mensajeCronograma +
            ').'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_INSCRIPCIONES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_INSCRIPCIONES);
    }

    const dni = String(data.dni || '').trim();
    const materiaCodigo = String(data.materiaCodigo || '').trim().toUpperCase();
    const fechaIso =
      data.fechaIso && String(data.fechaIso).indexOf('GMT-3') !== -1
        ? data.fechaIso
        : Utilities.formatDate(
            new Date(),
            'America/Argentina/Buenos_Aires',
            "dd/MM/yyyy HH:mm:ss '(GMT-3)'"
          );
    const comprobanteId =
      data.comprobanteId ||
      'ISFT-' +
        new Date().getFullYear() +
        '-' +
        Math.random().toString(36).substring(2, 8).toUpperCase();

    const values = sheet.getDataRange().getValues();
    let existingRowIndex = -1;

    for (let i = 1; i < values.length; i++) {
      const rowDni = String(values[i][3] || '').trim();
      const rowMateria = String(values[i][10] || '').trim().toUpperCase();
      if (rowDni === dni && rowMateria === materiaCodigo) {
        existingRowIndex = i + 1;
        break;
      }
    }

    const rowValues = [
      comprobanteId,
      fechaIso,
      data.apellidoNombre || '',
      dni,
      data.telefono || '',
      data.email || '',
      data.cohorte || '',
      data.carreraCode || '',
      data.carreraNombre || '',
      data.anioMateriaLabel
        ? data.anioMateriaLabel + ' (' + data.anioMateria + '° Año)'
        : String(data.anioMateria || ''),
      materiaCodigo,
      data.materiaNombre || '',
      data.modalidad || 'Regular',
      data.anioCursado || '',
      data.profesor || 'Docente ' + (data.materiaNombre || ''),
      'Pendiente de envío (Corte día ' + estadoVentana.diaEnvioDocentes + ')'
    ];

    if (existingRowIndex > 0) {
      sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        comprobanteId: comprobanteId,
        duplicado: existingRowIndex > 0,
        fechaIso: fechaIso,
        cronograma: estadoVentana.mensajeCronograma
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error) })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Función ejecutada diariamente por el Trigger de Google Apps Script.
 * Si el día actual en Buenos Aires (GMT-3) coincide con DIA_ENVIO_DOCENTES (ej. día 20),
 * dispara automáticamente el envío de las planillas a todos los profesores.
 */
function evaluarCronDiarioVentana() {
  const cfg = obtenerConfiguracionVentana();
  if (cfg.diaActualAr === cfg.diaEnvioDocentes) {
    Logger.log(
      'Día de corte alcanzado (Día ' +
        cfg.diaEnvioDocentes +
        '). Disparando envío automático de nóminas a docentes...'
    );
    enviarNominasDocentes();
  } else {
    Logger.log(
      'Hoy es día ' +
        cfg.diaActualAr +
        '. El envío automático está programado para el día ' +
        cfg.diaEnvioDocentes +
        '.'
    );
  }
}

/**
 * Lee únicamente los alumnos pendientes en "Inscripciones_Finales", envía el correo a cada
 * docente según "Directorio_Docentes" y traslada los registros enviados a la pestaña "Historico"
 * para que nunca se vuelvan a enviar duplicados en futuros disparos.
 */
function enviarNominasDocentes() {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const ss = getSpreadsheet();
    const sheetIns = ss.getSheetByName(SHEET_INSCRIPCIONES);
    const sheetDoc = ss.getSheetByName(SHEET_DOCENTES);
    const sheetHist = obtenerOCrearHojaHistorico();
    const cfg = obtenerConfiguracionVentana();

    if (!sheetIns || !sheetDoc) {
      throw new Error('No se encontraron las hojas Inscripciones_Finales o Directorio_Docentes.');
    }

    const insData = sheetIns.getDataRange().getValues();
    if (insData.length <= 1) {
      Logger.log('No hay inscripciones pendientes en Inscripciones_Finales.');
      try {
        ss.toast(
          'No hay inscripciones pendientes en Inscripciones_Finales (los envíos previos ya están en Historico).',
          'Sin Pendientes',
          5
        );
      } catch (e) {}
      return;
    }

    const docentesData = sheetDoc.getDataRange().getValues();
    const directorioPorMateria = {};

    for (let i = 1; i < docentesData.length; i++) {
      const carreraCode = String(docentesData[i][0] || '').trim().toUpperCase();
      const materiaCode = String(docentesData[i][4] || '').trim().toUpperCase();
      const materiaNombre = String(docentesData[i][5] || '').trim();
      const docenteTitular = String(docentesData[i][6] || '').trim();
      const emailDocente = String(docentesData[i][7] || '').trim();
      const activo = String(docentesData[i][8] || 'SI').trim().toUpperCase();

      if (materiaCode && emailDocente && activo === 'SI') {
        directorioPorMateria[carreraCode + ':' + materiaCode] = {
          carreraCode: carreraCode,
          carreraNombre: String(docentesData[i][1] || ''),
          resolucion: String(docentesData[i][2] || ''),
          anioPlan: String(docentesData[i][3] || ''),
          materiaCode: materiaCode,
          materiaNombre: materiaNombre,
          docente: docenteTitular || 'Docente ' + materiaNombre,
          email: emailDocente
        };
      }
    }

    const fechaCorte = Utilities.formatDate(
      new Date(),
      'America/Argentina/Buenos_Aires',
      "dd/MM/yyyy HH:mm:ss '(GMT-3)'"
    );

    const gruposPorMateria = {};
    const filasParaHistorico = [];
    let migradosPrevios = 0;

    for (let r = 1; r < insData.length; r++) {
      const row = insData[r];
      const carreraCode = String(row[7] || '').trim().toUpperCase();
      const materiaCode = String(row[10] || '').trim().toUpperCase();
      const estadoActual = String(row[15] || '').trim();
      if (!materiaCode && !row[0]) continue;

      const key = carreraCode + ':' + materiaCode;
      const infoDoc = directorioPorMateria[key];
      const emailDestino = infoDoc ? infoDoc.email : 'arij.dev@gmail.com';

      // Si el registro ya había sido marcado como "Enviado..." anteriormente (ej. los 36 previos),
      // se pasa directo a "Historico" sin volver a enviarle el mail al docente.
      if (estadoActual.toUpperCase().indexOf('ENVIADO') === 0) {
        filasParaHistorico.push([
          row[0],
          row[1],
          row[2],
          row[3],
          row[4],
          row[5],
          row[6],
          row[7],
          row[8],
          row[9],
          row[10],
          row[11],
          row[12],
          row[13],
          row[14],
          estadoActual,
          fechaCorte,
          emailDestino
        ]);
        migradosPrevios++;
        continue;
      }

      if (!gruposPorMateria[key]) {
        gruposPorMateria[key] = [];
      }
      gruposPorMateria[key].push({
        rawRow: row,
        comprobanteId: row[0],
        fechaIso: row[1],
        apellidoNombre: row[2],
        dni: row[3],
        telefono: row[4],
        email: row[5],
        cohorte: row[6],
        carreraCode: carreraCode,
        carreraNombre: row[8],
        anioMateria: row[9],
        materiaCode: materiaCode,
        materiaNombre: row[11],
        modalidad: row[12],
        anioCursado: row[13],
        profesor: row[14]
      });
    }

    let emailsEnviados = 0;
    let alumnosNuevosEnviados = 0;

    for (const key in gruposPorMateria) {
      const alumnos = gruposPorMateria[key];
      const infoDocente = directorioPorMateria[key] || {
        carreraCode: alumnos[0].carreraCode,
        carreraNombre: alumnos[0].carreraNombre,
        materiaCode: alumnos[0].materiaCode,
        materiaNombre: alumnos[0].materiaNombre,
        docente: alumnos[0].profesor || 'Docente ' + alumnos[0].materiaNombre,
        email: 'arij.dev@gmail.com'
      };

      const csvHeader = [
        'Comprobante_ID',
        'Fecha_Inscripcion',
        'DNI',
        'Apellido_y_Nombre',
        'Condicion',
        'Anio_Cursada',
        'Cohorte_Ingreso',
        'Correo_Alumno',
        'Telefono',
        'Docente_Catedra'
      ].join(';');

      const csvRows = alumnos.map(function (a) {
        return [
          a.comprobanteId,
          a.fechaIso,
          a.dni,
          '"' + String(a.apellidoNombre).replace(/"/g, '""') + '"',
          a.modalidad,
          a.anioCursado,
          a.cohorte,
          a.email,
          a.telefono,
          '"' + String(infoDocente.docente).replace(/"/g, '""') + '"'
        ].join(';');
      });

      const csvContent = '\uFEFF' + [csvHeader].concat(csvRows).join('\r\n');
      const attachmentBlob = Utilities.newBlob(
        csvContent,
        'text/csv;charset=utf-8',
        'Nomina_Inscriptos_' + infoDocente.materiaCode + '.csv'
      );

      const filasHtml = alumnos
        .map(function (a, idx) {
          return (
            '<tr>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">' + (idx + 1) + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">' + a.dni + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;">' + a.apellidoNombre + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">' + a.modalidad + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">' + a.anioCursado + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">' + a.email + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;">' + a.comprobanteId + '</td>' +
            '</tr>'
          );
        })
        .join('');

      const htmlBody =
        '<div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #dbe2ef;border-radius:10px;overflow:hidden;">' +
        '<div style="background:#3438AA;color:#ffffff;padding:18px 24px;border-bottom:4px solid #C97026;">' +
        '<div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">ISFT N° 191 - Bahía Blanca - Secretaría Académica</div>' +
        '<h2 style="margin:6px 0 0;font-size:18px;">Nómina Oficial de Inscriptos a Mesa Examinadora</h2>' +
        '</div>' +
        '<div style="padding:20px 24px;background:#ffffff;color:#1b1f3b;">' +
        '<p style="margin-top:0;">Estimado/a <strong>' + infoDocente.docente + '</strong>,</p>' +
        '<p>Habiendo finalizado la ventana de inscripción (del día <strong>' + cfg.diaApertura + '</strong> al <strong>' + cfg.diaCierre + '</strong>), se remite el padrón definitivo al <strong>' + fechaCorte + '</strong> para la mesa examinadora de:</p>' +
        '<div style="background:#f8fafc;border-left:4px solid #3438AA;padding:12px 16px;margin:14px 0;border-radius:4px;">' +
        '<div><strong>Carrera:</strong> ' + infoDocente.carreraNombre + ' (' + infoDocente.carreraCode + ')</div>' +
        '<div><strong>Asignatura:</strong> ' + infoDocente.materiaNombre + ' [' + infoDocente.materiaCode + ']</div>' +
        '<div><strong>Total de inscriptos registrados:</strong> ' + alumnos.length + ' estudiante(s)</div>' +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">' +
        '<thead>' +
        '<tr style="background:#f1f5f9;color:#334155;text-align:left;">' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">#</th>' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">DNI</th>' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">Apellido y Nombre</th>' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">Condición</th>' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">Cursada</th>' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">Correo</th>' +
        '<th style="padding:8px 10px;border-bottom:2px solid #cbd5e1;">Comprobante</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' + filasHtml + '</tbody>' +
        '</table>' +
        '<p style="font-size:12px;color:#64748b;margin-top:20px;">Se adjunta a este correo la planilla compatible con Excel (<code>Nomina_Inscriptos_' + infoDocente.materiaCode + '.csv</code>).</p>' +
        '</div>' +
        '</div>';

      MailApp.sendEmail({
        to: infoDocente.email,
        subject: '[ISFT N° 191] Nómina de Inscriptos - ' + infoDocente.materiaNombre + ' (' + alumnos.length + ' inscriptos)',
        htmlBody: htmlBody,
        attachments: [attachmentBlob]
      });

      for (let j = 0; j < alumnos.length; j++) {
        const raw = alumnos[j].rawRow;
        filasParaHistorico.push([
          raw[0],
          raw[1],
          raw[2],
          raw[3],
          raw[4],
          raw[5],
          raw[6],
          raw[7],
          raw[8],
          raw[9],
          raw[10],
          raw[11],
          raw[12],
          raw[13],
          raw[14],
          'Enviado a docente (' + fechaCorte + ')',
          fechaCorte,
          infoDocente.email
        ]);
        alumnosNuevosEnviados++;
      }

      emailsEnviados++;
    }

    // 1. Insertar en lote todas las filas procesadas en la pestaña "Historico"
    if (filasParaHistorico.length > 0) {
      const startRowHist = sheetHist.getLastRow() + 1;
      sheetHist
        .getRange(startRowHist, 1, filasParaHistorico.length, filasParaHistorico[0].length)
        .setValues(filasParaHistorico);
    }

    // 2. Vaciar las filas ya procesadas de "Inscripciones_Finales" (dejando intacto el encabezado en fila 1)
    const numRowsToDelete = insData.length - 1;
    if (numRowsToDelete > 0) {
      sheetIns.deleteRows(2, numRowsToDelete);
    }

    try {
      ss.toast(
        'Se enviaron ' +
          emailsEnviados +
          ' correo(s) (' +
          alumnosNuevosEnviados +
          ' inscriptos nuevos) y se archivaron ' +
          filasParaHistorico.length +
          ' registros en la pestaña Historico.',
        'Despacho y Pase a Histórico Completado',
        6
      );
    } catch (e) {}
  } finally {
    lock.releaseLock();
  }
}

/**
 * Instala el Trigger diario que evalúa los parámetros de "Configuracion_Turnos"
 * y dispara automáticamente las nóminas el día configurado (ej. día 20 a las 08:00 hs).
 */
function instalarTriggerCalendarioParametrizable() {
  const cfg = obtenerConfiguracionVentana();
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    const fn = triggers[i].getHandlerFunction();
    if (fn === 'enviarNominasDocentes' || fn === 'evaluarCronDiarioVentana') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('evaluarCronDiarioVentana')
    .timeBased()
    .everyDays(1)
    .atHour(cfg.horaEnvioDocentes)
    .create();

  try {
    getSpreadsheet().toast(
      'Cron activo: Inscripciones del día ' +
        cfg.diaApertura +
        ' al ' +
        cfg.diaCierre +
        '. Envío automático a docentes el día ' +
        cfg.diaEnvioDocentes +
        ' a las ' +
        cfg.horaEnvioDocentes +
        ':00 hs.',
      'Calendario Parametrizado Activado',
      6
    );
  } catch (e) {}
}

/**
 * Función auxiliar para insertar una fila de prueba nueva con 1 clic desde Google Sheets.
 */
function simularInscripcionDemo() {
  const muestras = [
    { nombre: 'Pérez Juan Ignacio', cohorte: '2024', mod: 'Regular' },
    { nombre: 'Gómez Lucía Valentina', cohorte: '2023', mod: 'Regular' },
    { nombre: 'Martínez Tomás Ezequiel', cohorte: '2024', mod: 'Libre' },
    { nombre: 'Rodríguez Sofía Belén', cohorte: '2022', mod: 'Regular' },
    { nombre: 'Fernández Mateo Nicolás', cohorte: '2025', mod: 'Regular' }
  ];
  const alumno = muestras[Math.floor(Math.random() * muestras.length)];
  const dniUnico = String(40000000 + Math.floor(Math.random() * 8999999));
  const codigoUnico = 'ISFT-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  doPost({
    postData: {
      contents: JSON.stringify({
        forzarDemo: true,
        comprobanteId: codigoUnico,
        apellidoNombre: alumno.nombre,
        dni: dniUnico,
        telefono: '2914' + Math.floor(100000 + Math.random() * 899999),
        email: 'alumno.' + dniUnico.slice(-4) + '@isft191.edu.ar',
        cohorte: alumno.cohorte,
        carreraCode: 'SOFT',
        carreraNombre: 'Tecnicatura Superior en Desarrollo de Software',
        anioMateria: 2,
        anioMateriaLabel: 'Segundo',
        materiaCodigo: 'SOFT-203',
        materiaNombre: 'Algebra y lógica',
        modalidad: alumno.mod,
        anioCursado: '2026',
        profesor: 'Docente Algebra y lógica'
      })
    }
  });

  try {
    getSpreadsheet().toast(
      'Se agregó a ' + alumno.nombre + ' (DNI ' + dniUnico + ') en SOFT-203.',
      'Alumno de Prueba Insertado',
      4
    );
  } catch (e) {}
}
