/**
 * ============================================================================
 * ISFT N° 191 - SISTEMA AUTOMATIZADO DE MESAS EXAMINADORAS (FASE 1 - PoC)
 * ============================================================================
 * Planilla vinculada en Google Drive:
 * ID: 1yufAbB4DEeZ5Z8HXAx7YZp2eb-NRUx37iUm1x_Hc15A
 *
 * Funcionalidades:
 * 1. doPost(e): Recibe las inscripciones desde el formulario web (GitHub Pages o Local),
 *    aplica deduplicación por (DNI + Materia_Codigo) e impacta en la pestaña
 *    "Inscripciones_Finales".
 * 2. enviarNominasDocentes(): Cruza los alumnos inscriptos hasta la fecha con la
 *    pestaña "Directorio_Docentes" (Docente + Nombre de Materia) y envía por correo
 *    electrónico a cada docente la planilla consolidada de su asignatura (.csv adjunto
 *    + tabla institucional en el cuerpo del mail).
 * 3. instalarTriggerQuincenal(): Programa el disparo automático cada 15 días.
 * 4. Menú "ISFT 191 - Secretaría": Permite disparar el envío en vivo con 1 clic
 *    durante la presentación del PoC.
 */

const SPREADSHEET_ID = '1yufAbB4DEeZ5Z8HXAx7YZp2eb-NRUx37iUm1x_Hc15A';
const SHEET_INSCRIPCIONES = 'Inscripciones_Finales';
const SHEET_DOCENTES = 'Directorio_Docentes';

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Crea el menú institucional en la barra superior de Google Sheets para la Demo en vivo.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ISFT 191 - Secretaría')
    .addItem('1. Enviar Nóminas a Docentes Ahora (Demo PoC)', 'enviarNominasDocentes')
    .addSeparator()
    .addItem('2. Activar Envío Programado (Cada 15 días)', 'instalarTriggerQuincenal')
    .addItem('3. Cargar Alumno de Prueba (Simulación)', 'simularInscripcionDemo')
    .addToUi();
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

    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_INSCRIPCIONES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_INSCRIPCIONES);
    }

    const dni = String(data.dni || '').trim();
    const materiaCodigo = String(data.materiaCodigo || '').trim().toUpperCase();
    const fechaIso = data.fechaIso || new Date().toISOString();
    const comprobanteId = data.comprobanteId || ('ISFT-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase());

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
      data.anioMateriaLabel ? (data.anioMateriaLabel + ' (' + data.anioMateria + '° Año)') : String(data.anioMateria || ''),
      materiaCodigo,
      data.materiaNombre || '',
      data.modalidad || 'Regular',
      data.anioCursado || '',
      data.profesor || ('Docente ' + (data.materiaNombre || '')),
      'Pendiente de envío quincenal'
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
        fechaIso: fechaIso
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
 * Lee los alumnos inscriptos hasta la fecha, los agrupa por Materia_Codigo,
 * busca el correo del docente en "Directorio_Docentes" y envía la nómina oficial.
 */
function enviarNominasDocentes() {
  const ss = getSpreadsheet();
  const sheetIns = ss.getSheetByName(SHEET_INSCRIPCIONES);
  const sheetDoc = ss.getSheetByName(SHEET_DOCENTES);

  if (!sheetIns || !sheetDoc) {
    throw new Error('No se encontraron las hojas Inscripciones_Finales o Directorio_Docentes.');
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
        docente: docenteTitular || ('Docente ' + materiaNombre),
        email: emailDocente
      };
    }
  }

  const insData = sheetIns.getDataRange().getValues();
  if (insData.length <= 1) {
    Logger.log('No hay inscripciones registradas para enviar.');
    return;
  }

  const gruposPorMateria = {};

  for (let r = 1; r < insData.length; r++) {
    const row = insData[r];
    const carreraCode = String(row[7] || '').trim().toUpperCase();
    const materiaCode = String(row[10] || '').trim().toUpperCase();
    if (!materiaCode) continue;

    const key = carreraCode + ':' + materiaCode;
    if (!gruposPorMateria[key]) {
      gruposPorMateria[key] = [];
    }
    gruposPorMateria[key].push({
      rowNumber: r + 1,
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

  const fechaCorte = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');
  let emailsEnviados = 0;

  for (const key in gruposPorMateria) {
    const alumnos = gruposPorMateria[key];
    const infoDocente = directorioPorMateria[key] || {
      carreraCode: alumnos[0].carreraCode,
      carreraNombre: alumnos[0].carreraNombre,
      materiaCode: alumnos[0].materiaCode,
      materiaNombre: alumnos[0].materiaNombre,
      docente: alumnos[0].profesor || ('Docente ' + alumnos[0].materiaNombre),
      email: 'arij.dev@gmail.com'
    };

    // Construir CSV adjunto compatible con Excel
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
      '<h2 style="margin:6px 0 0;font-size:18px;">Nómina de Inscriptos a Mesa Examinadora</h2>' +
      '</div>' +
      '<div style="padding:20px 24px;background:#ffffff;color:#1b1f3b;">' +
      '<p style="margin-top:0;">Estimado/a <strong>' + infoDocente.docente + '</strong>,</p>' +
      '<p>Se remite el listado actualizado de estudiantes inscriptos hasta el <strong>' + fechaCorte + '</strong> para la mesa examinadora de:</p>' +
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
      sheetIns.getRange(alumnos[j].rowNumber, 16).setValue('Enviado a docente (' + fechaCorte + ')');
    }

    emailsEnviados++;
  }

  Logger.log('Proceso finalizado. Correos enviados a docentes: ' + emailsEnviados);
}

/**
 * Configura el disparo programado cada 15 días de manera automática.
 */
function instalarTriggerQuincenal() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'enviarNominasDocentes') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('enviarNominasDocentes')
    .timeBased()
    .everyDays(15)
    .atHour(8)
    .create();

  Logger.log('Trigger programado cada 15 días a las 08:00 hs instalado correctamente.');
}

/**
 * Función auxiliar para insertar una fila de prueba con 1 clic si se desea probar desde Google Sheets.
 */
function simularInscripcionDemo() {
  doPost({
    postData: {
      contents: JSON.stringify({
        comprobanteId: 'ISFT-2026-DEMO01',
        fechaIso: new Date().toISOString(),
        apellidoNombre: 'Jaime Ariel',
        dni: '34945012',
        telefono: '2914400469',
        email: 'arij.dev@gmail.com',
        cohorte: '2023',
        carreraCode: 'SOFT',
        carreraNombre: 'Tecnicatura Superior en Desarrollo de Software',
        anioMateria: 2,
        anioMateriaLabel: 'Segundo',
        materiaCodigo: 'SOFT-203',
        materiaNombre: 'Algebra y lógica',
        modalidad: 'Regular',
        anioCursado: '2026',
        profesor: 'Docente Algebra y lógica'
      })
    }
  });
}
