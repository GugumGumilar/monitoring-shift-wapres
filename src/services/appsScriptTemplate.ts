/**
 * Google Apps Script template for Google Sheets Database integration.
 * Matches PLN Wapres & Rumdin official spreadsheet formats.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ========================================================================
 * SKRIP RESMI DATABASE GOOGLE SHEETS PLN WAPRES & RUMDIN
 * ========================================================================
 * Skrip ini menerima laporan langsung dari aplikasi & otomatis merapikan
 * tabel dengan standar format resmi PLN:
 *
 * LEMBAR KERJA RESMI:
 * 1. LAPORAN_CETAK (Pantauan ACO TR Rumdin Wapres ST12, Rumdin Dipo, & ACO TM Wapres Gardu D 126)
 *    - Baris 6..98   : Pantauan Beban & Tegangan ACO TM Wapres (Gardu D 126)
 *    - Baris 105..197: Pantauan Inspeksi ACO TR Rumdin Wapres (Situbondo 12 / ST12)
 *    - Baris 204..296: Pantauan Inspeksi ACO TR Rumdin Wapres (Dipo)
 *
 * 2. LAPORAN_CETAK_UPS (Pantauan Beban & Tegangan UPS Wapres & Rumdin)
 *    - Baris 7..99   : Beban UPS 30 KVA Wapres (Lt 1)
 *    - Baris 107..199: Beban UPS 40 KVA Wapres (Lt 2)
 *    - Baris 207..299: Beban UPS 60 KVA Wapres (Lt 3)
 *    - Baris 307..399: Beban UPS 40 KVA Rumdin Wapres (Dipo)
 *    - Baris 407..499: Beban UPS 100 KVA Rumdin Wapres (ST12)
 *
 * LEMBAR INDIVIDUAL (Bila ingin melihat per unit terpisah):
 * - ACO TM D 126, ACO TR DIPO, ACO TR ST 12
 * - UPS 30 KVA WAPRES, UPS 40 KVA WAPRES, UPS 60 KVA WAPRES
 * - UPS 40 KVA DIPO, UPS 100 KVA ST 12
 *
 * CARA PASANG (1 KALI SAJA):
 * 1. Buka Google Sheet Anda.
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'.
 * 3. Hapus semua kode bawaan, lalu TEMPEL seluruh kode ini.
 * 4. Klik ikon Simpan (Disk / Ctrl+S).
 * 5. Klik 'Terapkan' (Deploy) -> 'Penerapan Baru' (New Deployment).
 * 6. Pilih Jenis: 'Aplikasi Web' (Web App).
 * 7. Konfigurasi:
 *    - Jalankan sebagai (Execute as): 'Saya' (Me)
 *    - Siapa yang memiliki akses (Who has access): 'Siapa saja' (Anyone)  <-- WAJIB!
 * 8. Klik 'Terapkan' (Deploy) -> 'Beri Akses' (Authorize Access).
 * 9. Salin URL Aplikasi Web (/exec) dan tempel ke menu Google Sheets di aplikasi.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ PLN Shift")
    .addItem("✨ Rapikan Semua Tampilan Sheet (Standar Resmi)", "rapikanSemuaSheet")
    .addSeparator()
    .addItem("🚀 Aktifkan Semua Otomasi (Arsip Jam 06:00 & Reset Jam 07:00)", "buatSemuaTriggerOtomatis")
    .addItem("⏰ Pasang Trigger Arsip Otomatis (Tgl 1 Jam 06:00)", "buatTriggerArsipBulanan")
    .addItem("⏰ Pasang Trigger Reset Otomatis (Tgl 1 Jam 07:00)", "buatTriggerResetLaporan")
    .addSeparator()
    .addItem("📁 Buat Arsip Bulanan Sekarang (Manual)", "buatArsipBulananManual")
    .addItem("🔄 Reset Laporan Bulanan (Manual)", "resetLaporanBulananOtomatis")
    .addToUi();
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";
  if (action === "GET_SHIFT_DATA" || action === "CHECK_SUBMISSION") {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var shiftData = getShiftDataFromSheets(
        ss,
        e.parameter.inspectionDate,
        e.parameter.shift,
        e.parameter.dayOfMonth
      );
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: shiftData
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Webhook Monitoring Shift PLN Aktif dan Siap Digunakan!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === "PING") {
      return responseSuccess("Koneksi Webhook Google Sheets Berhasil dan Aktif!");
    }

    // 0. BACA DATA SHIFT & CEK STATUS SUBMISSION DARI DATABASE SPREADSHEET
    if (data.action === "GET_SHIFT_DATA" || data.action === "CHECK_SUBMISSION") {
      var shiftData = getShiftDataFromSheets(ss, data.inspectionDate, data.shift, data.dayOfMonth);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: shiftData
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "TIDY_SHEETS" || data.action === "FORMAT_ALL") {
      rapikanSemuaSheet(ss);
      return responseSuccess("Seluruh lembar Google Sheets berhasil dirapikan dengan format resmi!");
    }

    // Aksi Arsip & Reset Bulanan
    if (data.action === "BUAT_ARSIP" || data.action === "ARCHIVE_MONTHLY") {
      var urlArsip = buatArsipBulanan();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Arsip bulanan berhasil dibuat dan tersimpan di Google Drive!",
        archiveUrl: urlArsip
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "RESET_BULANAN" || data.action === "RESET_MONTHLY") {
      var urlArsipReset = resetLaporanBulananOtomatis();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Laporan bulanan berhasil direset & data bulan lalu telah diarsipkan!",
        archiveUrl: urlArsipReset
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "PASANG_TRIGGER_ARSIP" || data.action === "SETUP_ARCHIVE_TRIGGER") {
      buatTriggerArsipBulanan();
      return responseSuccess("Trigger arsip otomatis bulanan (Tanggal 1 Jam 06:00) berhasil dipasang!");
    }

    if (data.action === "PASANG_TRIGGER" || data.action === "SETUP_TRIGGER") {
      buatTriggerResetLaporan();
      return responseSuccess("Trigger otomatis tanggal 1 jam 07:00 berhasil dipasang!");
    }

    if (data.action === "PASANG_SEMUA_TRIGGER" || data.action === "SETUP_ALL_TRIGGERS") {
      buatSemuaTriggerOtomatis();
      return responseSuccess("Seluruh otomasi bulanan (Arsip Jam 06:00 & Reset Jam 07:00) berhasil dipasang!");
    }

    // 1. ACO TM GARDU D 126 (Wapres)
    if ((data.action === "ACO_TM" || data.action === "Wapres_Gardu_D126") && data.row) {
      upsertAcoRow(ss, "Wapres_Gardu_D126", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data ACO TM Gardu D 126 berhasil diperbarui di spreadsheet!");
    }

    // 2. ACO TR RUMDIN ST12 (Situbondo 12)
    if ((data.action === "ACO_ST12" || data.action === "Rumdin_Situbondo") && data.row) {
      upsertAcoRow(ss, "Rumdin_Situbondo", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data ACO TR Rumdin Situbondo (ST12) berhasil diperbarui di spreadsheet!");
    }

    // 3. ACO TR RUMDIN DIPO
    if ((data.action === "ACO_DIPO" || data.action === "Rumdin_Dipo") && data.row) {
      upsertAcoRow(ss, "Rumdin_Dipo", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data ACO TR Rumdin Dipo berhasil diperbarui di spreadsheet!");
    }

    // 4. UPS WAPRES (30, 40, 60 KVA)
    if (data.action === "UPS_WAPRES" && data.rows) {
      var wapresUnits = ["Wapres_UPS_30", "Wapres_UPS_40", "Wapres_UPS_60"];
      for (var w = 0; w < data.rows.length; w++) {
        if (data.rows[w]) {
          upsertSingleUpsUnit(ss, wapresUnits[w], data.rows[w], data.inspectionDate, data.shift, data.dayOfMonth);
        }
      }
      return responseSuccess("Data UPS Wapres (30, 40, 60 KVA) berhasil diperbarui di spreadsheet!");
    }

    // 5. UPS RUMDIN (40 KVA Dipo & 100 KVA ST12)
    if (data.action === "UPS_RUMDIN" && data.rows) {
      var rumdinUnits = ["Rumdin_UPS_40", "Rumdin_UPS_100"];
      for (var r = 0; r < data.rows.length; r++) {
        if (data.rows[r]) {
          upsertSingleUpsUnit(ss, rumdinUnits[r], data.rows[r], data.inspectionDate, data.shift, data.dayOfMonth);
        }
      }
      return responseSuccess("Data UPS Rumdin (Dipo 40 & ST12 100 KVA) berhasil diperbarui di spreadsheet!");
    }

    // 6. INDIVIDUAL UPS
    if (data.action === "UPS_30" || data.action === "Wapres_UPS_30") {
      upsertSingleUpsUnit(ss, "Wapres_UPS_30", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 30 KVA Wapres berhasil diperbarui!");
    }
    if (data.action === "UPS_40_WAPRES" || data.action === "Wapres_UPS_40") {
      upsertSingleUpsUnit(ss, "Wapres_UPS_40", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 40 KVA Wapres berhasil diperbarui!");
    }
    if (data.action === "UPS_60_WAPRES" || data.action === "Wapres_UPS_60") {
      upsertSingleUpsUnit(ss, "Wapres_UPS_60", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 60 KVA Wapres berhasil diperbarui!");
    }
    if (data.action === "UPS_40_DIPO" || data.action === "Rumdin_UPS_40") {
      upsertSingleUpsUnit(ss, "Rumdin_UPS_40", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 40 KVA Rumdin Dipo berhasil diperbarui!");
    }
    if (data.action === "UPS_100_ST12" || data.action === "Rumdin_UPS_100") {
      upsertSingleUpsUnit(ss, "Rumdin_UPS_100", data.row, data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data UPS 100 KVA Rumdin ST 12 berhasil diperbarui!");
    }

    // 7. SYNC ALL (Semua Laporan Sekaligus)
    if (data.action === "SYNC_ALL") {
      if (data.acoTmRow) upsertAcoRow(ss, "Wapres_Gardu_D126", data.acoTmRow, data.inspectionDate, data.shift, data.dayOfMonth);
      if (data.acoST12Row) upsertAcoRow(ss, "Rumdin_Situbondo", data.acoST12Row, data.inspectionDate, data.shift, data.dayOfMonth);
      if (data.acoDipoRow) upsertAcoRow(ss, "Rumdin_Dipo", data.acoDipoRow, data.inspectionDate, data.shift, data.dayOfMonth);

      if (data.upsRows && data.upsRows.length > 0) {
        var allUnits = ["Wapres_UPS_30", "Wapres_UPS_40", "Wapres_UPS_60", "Rumdin_UPS_40", "Rumdin_UPS_100"];
        for (var u = 0; u < data.upsRows.length; u++) {
          if (data.upsRows[u] && allUnits[u]) {
            upsertSingleUpsUnit(ss, allUnits[u], data.upsRows[u], data.inspectionDate, data.shift, data.dayOfMonth);
          }
        }
      }
      return responseSuccess("Semua data monitoring shift berhasil disimpan & diperbarui di spreadsheet!");
    }

    // 8. CLEAR SHIFT
    if (data.action === "CLEAR_SHIFT") {
      clearShiftRow(ss, data.target || "ALL", data.inspectionDate, data.shift, data.dayOfMonth);
      return responseSuccess("Data shift berhasil dikosongkan dari spreadsheet tanpa merusak tabel!");
    }

    return responseSuccess("Data diterima");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function responseSuccess(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================================================
// MENGHITUNG OFFSET TANGGAL & SHIFT
// ========================================================================
function parseDayOfMonth(inspectionDate, dayOfMonth) {
  var d = parseInt(dayOfMonth);
  if (isNaN(d) || d < 1 || d > 31) {
    if (inspectionDate) {
      var parts = String(inspectionDate).split(/[\\/\\-]/);
      if (parts.length >= 3) {
        d = parseInt(parts[0].length === 4 ? parts[2] : parts[0]);
      }
    }
    if (isNaN(d) || d < 1 || d > 31) d = new Date().getDate();
  }
  return d;
}

function getShiftOffset(shift) {
  var s = String(shift || "").toUpperCase();
  if (s.indexOf("SIANG") !== -1) return 1;
  if (s.indexOf("MALAM") !== -1) return 2;
  return 0; // Pagi
}

// Helper: Cari sheet tanpa sensitif huruf besar/kecil atau spasi/garis bawah
function findSheetCaseInsensitive(ss, targetName) {
  if (!ss || !targetName) return null;
  var direct = ss.getSheetByName(targetName);
  if (direct) return direct;
  var targetNorm = String(targetName).toUpperCase().replace(/[\s_]+/g, "");
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sNorm = String(sheets[i].getName() || "").toUpperCase().replace(/[\s_]+/g, "");
    if (sNorm === targetNorm) {
      return sheets[i];
    }
  }
  return null;
}

// ========================================================================
// MENULIS DATA ACO (TM D 126, ST 12, DIPO)
// ========================================================================
function upsertAcoRow(ss, unitName, rowData, inspectionDate, shift, dayOfMonth) {
  var d = parseDayOfMonth(inspectionDate, dayOfMonth);
  var offset = getShiftOffset(shift);

  // Lembar Gabungan LAPORAN_CETAK
  var lapCetak = findSheetCaseInsensitive(ss, "LAPORAN_CETAK");
  if (!lapCetak) {
    lapCetak = setupAcoSheetLayout(ss, "LAPORAN_CETAK");
  }
  if (lapCetak.getMaxRows() < 320) {
    lapCetak.insertRowsAfter(lapCetak.getMaxRows(), 320 - lapCetak.getMaxRows());
  }
  if (lapCetak.getMaxColumns() < 18) {
    lapCetak.insertColumnsAfter(lapCetak.getMaxColumns(), 18 - lapCetak.getMaxColumns());
  }

  // Tentukan baris awal sesuai spesifikasi resmi:
  // Wapres Gardu D 126 (ACO TM)              -> baris 6
  // Rumdin Situbondo 12 (ACO TR ST12)        -> baris 105
  // Rumdin Dipo (ACO TR DIPO)                 -> baris 204
  var baseRow = 6;
  var u = String(unitName || "").toUpperCase();
  if (u.indexOf("SITUBONDO") !== -1 || u.indexOf("ST12") !== -1 || u.indexOf("ST 12") !== -1) {
    baseRow = 105;
  } else if (u.indexOf("DIPO") !== -1) {
    baseRow = 204;
  }

  var targetRow = baseRow + (d - 1) * 3 + offset;
  var startR = baseRow + (d - 1) * 3;

  if (targetRow > lapCetak.getMaxRows()) {
    lapCetak.insertRowsAfter(lapCetak.getMaxRows(), targetRow + 10 - lapCetak.getMaxRows());
  }

  writeRowValues(lapCetak, targetRow, startR, d, inspectionDate, offset, rowData, 17);

  // Periksa jika ada lembar terpisah (misal 'ACO TM D 126')
  var individualSheetName = "";
  if (u.indexOf("D126") !== -1 || u.indexOf("TM") !== -1 || u.indexOf("WAPRES") !== -1) individualSheetName = "ACO TM D 126";
  else if (u.indexOf("SITUBONDO") !== -1 || u.indexOf("ST12") !== -1 || u.indexOf("ST 12") !== -1) individualSheetName = "ACO TR ST 12";
  else if (u.indexOf("DIPO") !== -1) individualSheetName = "ACO TR DIPO";

  if (individualSheetName) {
    var indSheet = findSheetCaseInsensitive(ss, individualSheetName);
    if (indSheet && indSheet.getName() !== lapCetak.getName()) {
      var indTargetRow = 6 + (d - 1) * 3 + offset;
      var indStartR = 6 + (d - 1) * 3;
      if (indSheet.getMaxRows() < indTargetRow + 5) {
        indSheet.insertRowsAfter(indSheet.getMaxRows(), indTargetRow + 10 - indSheet.getMaxRows());
      }
      writeRowValues(indSheet, indTargetRow, indStartR, d, inspectionDate, offset, rowData, 17);
    }
  }
}

// ========================================================================
// MENULIS DATA UPS (30, 40, 60 WAPRES & 40 DIPO, 100 ST12)
// ========================================================================
function upsertSingleUpsUnit(ss, unitName, rowData, inspectionDate, shift, dayOfMonth) {
  var d = parseDayOfMonth(inspectionDate, dayOfMonth);
  var offset = getShiftOffset(shift);

  // Lembar Gabungan LAPORAN_CETAK_UPS
  var lapUps = findSheetCaseInsensitive(ss, "LAPORAN_CETAK_UPS");
  if (!lapUps) {
    lapUps = setupUpsSheetLayout(ss, "LAPORAN_CETAK_UPS");
  }
  if (lapUps.getMaxRows() < 520) {
    lapUps.insertRowsAfter(lapUps.getMaxRows(), 520 - lapUps.getMaxRows());
  }
  if (lapUps.getMaxColumns() < 19) {
    lapUps.insertColumnsAfter(lapUps.getMaxColumns(), 19 - lapUps.getMaxColumns());
  }

  // Tentukan baris awal sesuai spesifikasi resmi:
  // Wapres UPS 30              -> baris 7
  // Wapres UPS 40              -> baris 107
  // Wapres UPS 60              -> baris 207
  // Rumdin UPS 40  (Dipo)      -> baris 307
  // Rumdin UPS 100 (ST12)      -> baris 407
  var baseRow = 7;
  var u = String(unitName || "").toUpperCase();
  if (u.indexOf("30") !== -1) {
    baseRow = 7;
  } else if (u.indexOf("40") !== -1 && (u.indexOf("DIPO") !== -1 || u.indexOf("RUMDIN") !== -1)) {
    baseRow = 307;
  } else if (u.indexOf("40") !== -1) {
    baseRow = 107;
  } else if (u.indexOf("60") !== -1) {
    baseRow = 207;
  } else if (u.indexOf("100") !== -1 || u.indexOf("ST12") !== -1 || u.indexOf("SITUBONDO") !== -1) {
    baseRow = 407;
  }

  var targetRow = baseRow + (d - 1) * 3 + offset;
  var startR = baseRow + (d - 1) * 3;

  if (targetRow > lapUps.getMaxRows()) {
    lapUps.insertRowsAfter(lapUps.getMaxRows(), targetRow + 10 - lapUps.getMaxRows());
  }

  writeRowValues(lapUps, targetRow, startR, d, inspectionDate, offset, rowData, 18);

  // Periksa jika ada lembar terpisah (misal 'UPS 30 KVA WAPRES')
  var indUpsName = "";
  if (u.indexOf("30") !== -1) indUpsName = "UPS 30 KVA WAPRES";
  else if (u.indexOf("40") !== -1 && (u.indexOf("DIPO") !== -1 || u.indexOf("RUMDIN") !== -1)) indUpsName = "UPS 40 KVA DIPO";
  else if (u.indexOf("40") !== -1) indUpsName = "UPS 40 KVA WAPRES";
  else if (u.indexOf("60") !== -1) indUpsName = "UPS 60 KVA WAPRES";
  else if (u.indexOf("100") !== -1 || u.indexOf("ST12") !== -1) indUpsName = "UPS 100 KVA ST 12";

  if (indUpsName) {
    var indSheet = findSheetCaseInsensitive(ss, indUpsName);
    if (indSheet && indSheet.getName() !== lapUps.getName()) {
      var indTargetRow = 7 + (d - 1) * 3 + offset;
      var indStartR = 7 + (d - 1) * 3;
      if (indSheet.getMaxRows() < indTargetRow + 5) {
        indSheet.insertRowsAfter(indSheet.getMaxRows(), indTargetRow + 10 - indSheet.getMaxRows());
      }
      writeRowValues(indSheet, indTargetRow, indStartR, d, inspectionDate, offset, rowData, 18);
    }
  }
}

function writeRowValues(sheet, targetRow, startR, dayNum, inspectionDate, offset, rowData, totalCols) {
  if (!sheet) return;

  if (offset === 0) {
    // Shift Pagi: Baris pertama hari ini
    rowData[0] = String(dayNum);
    if (inspectionDate) rowData[2] = String(inspectionDate);
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Shift Siang atau Malam: Update Petugas (B), Jam (D), dan Kolom Hasil (E ke kanan)
    if (rowData[1]) sheet.getRange(targetRow, 2).setValue(rowData[1]);
    if (rowData[3]) sheet.getRange(targetRow, 4).setValue(rowData[3]);
    if (rowData.length > 4) {
      sheet.getRange(targetRow, 5, 1, rowData.length - 4).setValues([rowData.slice(4)]);
    }
  }

  // Pertahankan penggabungan Kolom A (NO) dan Kolom C (TANGGAL) per 3 baris
  try {
    sheet.getRange(startR, 1, 3, 1).merge();
    sheet.getRange(startR, 3, 3, 1).merge();
  } catch (e) {}

  // Format Rapi: Times New Roman 10, Alignment Tengah, Border Hitam Solid
  var rowRange = sheet.getRange(targetRow, 1, 1, totalCols);
  rowRange
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Times New Roman")
    .setFontSize(10)
    .setFontColor("#000000")
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(targetRow, 2).setWrap(true);
  sheet.getRange(targetRow, totalCols).setWrap(true);
  sheet.setRowHeight(targetRow, 26);
}

// ========================================================================
// FORMAT DAN PENATAAN SEMUA LEMBAR (1-KLIK RAPI)
// ========================================================================
function rapikanSemuaSheet(spreadsheet) {
  var ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tata lembar utama gabungan sesuai gambar
  setupAcoSheetLayout(ss, "LAPORAN_CETAK");
  setupUpsSheetLayout(ss, "LAPORAN_CETAK_UPS");

  // 2. Tata juga lembar individual jika pengguna menggunakannya
  if (ss.getSheetByName("ACO TM D 126")) setupAcoSheetLayout(ss, "ACO TM D 126");
  if (ss.getSheetByName("ACO TR DIPO")) setupAcoSheetLayout(ss, "ACO TR DIPO");
  if (ss.getSheetByName("ACO TR ST 12")) setupAcoSheetLayout(ss, "ACO TR ST 12");
  if (ss.getSheetByName("UPS 30 KVA WAPRES")) setupUpsSheetLayout(ss, "UPS 30 KVA WAPRES");
  if (ss.getSheetByName("UPS 40 KVA WAPRES")) setupUpsSheetLayout(ss, "UPS 40 KVA WAPRES");
  if (ss.getSheetByName("UPS 60 KVA WAPRES")) setupUpsSheetLayout(ss, "UPS 60 KVA WAPRES");
  if (ss.getSheetByName("UPS 40 KVA DIPO")) setupUpsSheetLayout(ss, "UPS 40 KVA DIPO");
  if (ss.getSheetByName("UPS 100 KVA ST 12")) setupUpsSheetLayout(ss, "UPS 100 KVA ST 12");

  try {
    ss.toast("Tampilan Google Sheets berhasil dirapikan dengan standar resmi PLN!", "✨ Sukses", 4);
  } catch (e) {}
}

// ========================================================================
// PENATAAN LEMBAR ACO (LAPORAN_CETAK)
// ========================================================================
function setupAcoSheetLayout(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var currentMonth = Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy");

  // Definisi 3 Bagian Inspeksi ACO:
  var sections = [
    {
      startHeaderRow: 2,
      title: "PANTAUAN INSPEKSI ACO TM GARDU D 126 ( ISTANA WAPRES )",
      powerTitle: "STATUS POWER ACO TM D 126",
      penyulang1: "CLOSE",
      penyulang2: "OPEN",
      dataStartRow: 6
    },
    {
      startHeaderRow: 101,
      title: "PANTAUAN INSPEKSI ACO TR RUMAH DINAS (SITUBONDO 12)",
      powerTitle: "STATUS POWER ACO TR ST 12",
      penyulang1: "CLOSE",
      penyulang2: "OPEN",
      dataStartRow: 105
    },
    {
      startHeaderRow: 200,
      title: "PANTAUAN INSPEKSI ACO TR RUMAH DINAS (DIPO)",
      powerTitle: "STATUS POWER ACO TR DIPO",
      penyulang1: "GARDU T15N",
      penyulang2: "GARDU T135",
      dataStartRow: 204
    }
  ];

  if (sheetName === "ACO TM D 126") sections = [sections[0]];
  else if (sheetName === "ACO TR ST 12") sections = [sections[1]];
  else if (sheetName === "ACO TR DIPO") sections = [sections[2]];

  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    var hRow = sec.startHeaderRow;

    // Judul Utama
    try { sheet.getRange(hRow, 1, 1, 17).breakApart(); } catch (e) {}
    sheet.getRange(hRow, 1, 1, 17).merge();
    sheet.getRange(hRow, 1).setValue(sec.title)
      .setFontFamily("Arial")
      .setFontSize(13)
      .setFontWeight("bold")
      .setFontLine("underline")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(hRow, 32);

    // Bulan
    sheet.getRange(hRow + 1, 2).setValue("Bulan : " + currentMonth)
      .setFontFamily("Arial")
      .setFontSize(11)
      .setFontWeight("bold");
    sheet.setRowHeight(hRow + 1, 22);

    // Header Tingkat 1 & 2
    var row4 = hRow + 2;
    var row5 = hRow + 3;

    var headerRow1 = [
      "NO", "NAMA PETUGAS", "TANGGAL/\\nBULAN/\\nTAHUN", "JAM\\nINSPEKSI",
      "STATUS PENYULANG", "", "ALARM STATUS", "",
      sec.powerTitle, "",
      "STATUS CHARGING KUBIKEL", "", "STATUS REMOTE KUBIKEL", "",
      "LAMPU INDIKATOR", "", "KETERANGAN"
    ];

    var headerRow2 = [
      "", "", "", "",
      sec.penyulang1, sec.penyulang2,
      "ALARM", "NORMAL",
      "ON", "OFF",
      "YA", "TIDAK",
      "LOCAL", "AUTO",
      "ON", "OFF",
      ""
    ];

    sheet.getRange(row4, 1, 1, 17).setValues([headerRow1]);
    sheet.getRange(row5, 1, 1, 17).setValues([headerRow2]);

    sheet.getRange(row4, 1, 2, 1).merge(); // NO
    sheet.getRange(row4, 2, 2, 1).merge(); // PETUGAS
    sheet.getRange(row4, 3, 2, 1).merge(); // TANGGAL
    sheet.getRange(row4, 4, 2, 1).merge(); // JAM
    sheet.getRange(row4, 5, 1, 2).merge(); // STATUS PENYULANG
    sheet.getRange(row4, 7, 1, 2).merge(); // ALARM
    sheet.getRange(row4, 9, 1, 2).merge(); // POWER
    sheet.getRange(row4, 11, 1, 2).merge(); // CHARGING
    sheet.getRange(row4, 13, 1, 2).merge(); // REMOTE
    sheet.getRange(row4, 15, 1, 2).merge(); // LAMPU
    sheet.getRange(row4, 17, 2, 1).merge(); // KETERANGAN

    var headerRange = sheet.getRange(row4, 1, 2, 17);
    headerRange
      .setBackground("#FFC000")
      .setFontColor("#000000")
      .setFontFamily("Arial")
      .setFontSize(10)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true)
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

    sheet.setRowHeight(row4, 28);
    sheet.setRowHeight(row5, 24);

    // Format 31 Hari (93 baris data)
    var curDate = new Date();
    var curMonthNum = ("0" + (curDate.getMonth() + 1)).slice(-2);
    var curYearNum = curDate.getFullYear();

    for (var d = 1; d <= 31; d++) {
      var dRow = sec.dataStartRow + (d - 1) * 3;
      var dayStr = ("0" + d).slice(-2) + "/" + curMonthNum + "/" + curYearNum;

      try {
        var noRange = sheet.getRange(dRow, 1, 3, 1);
        noRange.merge();
        if (!sheet.getRange(dRow, 1).getValue()) sheet.getRange(dRow, 1).setValue(d);
      } catch (e) {}

      try {
        var dateRange = sheet.getRange(dRow, 3, 3, 1);
        dateRange.merge();
        if (!sheet.getRange(dRow, 3).getValue()) sheet.getRange(dRow, 3).setValue(dayStr);
      } catch (e) {}
    }

    var dataRange = sheet.getRange(sec.dataStartRow, 1, 93, 17);
    dataRange
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setFontFamily("Times New Roman")
      .setFontSize(10)
      .setFontColor("#000000")
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(sec.dataStartRow, 2, 93, 1).setWrap(true);
    sheet.getRange(sec.dataStartRow, 17, 93, 1).setWrap(true);

    for (var r = sec.dataStartRow; r < sec.dataStartRow + 93; r++) {
      sheet.setRowHeight(r, 26);
    }
  }

  // Atur Lebar Kolom
  sheet.setColumnWidth(1, 45);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 115);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 120);
  for (var c = 7; c <= 16; c++) sheet.setColumnWidth(c, 55);
  sheet.setColumnWidth(17, 160);

  sheet.setHiddenGridlines(false);
  return sheet;
}

// ========================================================================
// PENATAAN LEMBAR UPS (LAPORAN_CETAK_UPS)
// ========================================================================
function setupUpsSheetLayout(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var currentMonth = Utilities.formatDate(new Date(), "Asia/Jakarta", "MMMM yyyy");

  // Definisi 5 Bagian Inspeksi UPS:
  var sections = [
    {
      startHeaderRow: 2,
      mainTitle: "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN",
      bebanTitle: "BEBAN UPS 30 KVA WAKIL PRESIDEN (LT 1)",
      dataStartRow: 7
    },
    {
      startHeaderRow: 102,
      mainTitle: "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN",
      bebanTitle: "BEBAN UPS 40 KVA WAKIL PRESIDEN (LT 2)",
      dataStartRow: 107
    },
    {
      startHeaderRow: 202,
      mainTitle: "PANTAUAN INSPEKSI UPS DI ISTANA WAKIL PRESIDEN",
      bebanTitle: "BEBAN UPS 60 KVA WAKIL PRESIDEN (LT 3)",
      dataStartRow: 207
    },
    {
      startHeaderRow: 302,
      mainTitle: "PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (DIPO)",
      bebanTitle: "BEBAN UPS 40 KVA RUMAH DINAS (DIPO)",
      dataStartRow: 307
    },
    {
      startHeaderRow: 402,
      mainTitle: "PANTAUAN INSPEKSI UPS DI RUMAH DINAS WAKIL PRESIDEN (SITUBONDO 12)",
      bebanTitle: "BEBAN UPS 100 KVA RUMAH DINAS (SITUBONDO 12)",
      dataStartRow: 407
    }
  ];

  if (sheetName.indexOf("30") !== -1 && sheetName.indexOf("WAPRES") !== -1) sections = [sections[0]];
  else if (sheetName.indexOf("40") !== -1 && sheetName.indexOf("WAPRES") !== -1) sections = [sections[1]];
  else if (sheetName.indexOf("60") !== -1 && sheetName.indexOf("WAPRES") !== -1) sections = [sections[2]];
  else if (sheetName.indexOf("DIPO") !== -1) sections = [sections[3]];
  else if (sheetName.indexOf("ST 12") !== -1 || sheetName.indexOf("ST12") !== -1) sections = [sections[4]];

  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    var hRow = sec.startHeaderRow;

    // Judul Utama (Baris 2, 102, 202, ...)
    try { sheet.getRange(hRow, 1, 1, 18).breakApart(); } catch (e) {}
    sheet.getRange(hRow, 1, 1, 18).merge();
    sheet.getRange(hRow, 1).setValue(sec.mainTitle)
      .setFontFamily("Arial")
      .setFontSize(13)
      .setFontWeight("bold")
      .setFontLine("underline")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(hRow, 32);

    // Bulan (Baris 3, 103, ...)
    sheet.getRange(hRow + 1, 2).setValue("Bulan : " + currentMonth)
      .setFontFamily("Arial")
      .setFontSize(11)
      .setFontWeight("bold");
    sheet.setRowHeight(hRow + 1, 22);

    // Header 3 Tingkat (Baris 4..6, 104..106, ...)
    var row4 = hRow + 2;
    var row5 = hRow + 3;
    var row6 = hRow + 4;

    var headerRow1 = [
      "NO", "NAMA PETUGAS", "TANGGAL/\\nBULAN/\\nTAHUN", "JAM\\nINSPEKSI",
      sec.bebanTitle, "", "", "", "", "", "", "", "",
      "TEMPERAT\\nUR UPS", "ALARM\\nUPS", "BACK UP TIME UPS", "", "KETERANGAN"
    ];

    var headerRow2 = [
      "", "", "", "",
      "R", "S", "T", "R", "S", "T", "R", "S", "T",
      "", "", "", "", ""
    ];

    var headerRow3 = [
      "", "", "", "",
      "(A)", "(A)", "(A)",
      "(R-N)", "(S-N)", "(T-N)",
      "(R-S)", "(R-T)", "(S-T)",
      "", "",
      "HOURS", "MINUTES",
      ""
    ];

    sheet.getRange(row4, 1, 1, 18).setValues([headerRow1]);
    sheet.getRange(row5, 1, 1, 18).setValues([headerRow2]);
    sheet.getRange(row6, 1, 1, 18).setValues([headerRow3]);

    sheet.getRange(row4, 1, 3, 1).merge(); // NO
    sheet.getRange(row4, 2, 3, 1).merge(); // PETUGAS
    sheet.getRange(row4, 3, 3, 1).merge(); // TANGGAL
    sheet.getRange(row4, 4, 3, 1).merge(); // JAM
    sheet.getRange(row4, 5, 1, 9).merge(); // BEBAN UPS
    sheet.getRange(row4, 14, 3, 1).merge(); // TEMPERATUR
    sheet.getRange(row4, 15, 3, 1).merge(); // ALARM
    sheet.getRange(row4, 16, 2, 2).merge(); // BACK UP TIME
    sheet.getRange(row4, 18, 3, 1).merge(); // KETERANGAN

    var headerRange = sheet.getRange(row4, 1, 3, 18);
    headerRange
      .setBackground("#00B0F0")
      .setFontColor("#000000")
      .setFontFamily("Arial")
      .setFontSize(10)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrap(true)
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

    // Warna Khusus Beban UPS: Orange Gold (#FFA500)
    sheet.getRange(row4, 5, 1, 9).setBackground("#FFA500");

    sheet.setRowHeight(row4, 28);
    sheet.setRowHeight(row5, 24);
    sheet.setRowHeight(row6, 24);

    // Format 31 Hari (93 baris data)
    var curDate = new Date();
    var curMonthNum = ("0" + (curDate.getMonth() + 1)).slice(-2);
    var curYearNum = curDate.getFullYear();

    for (var d = 1; d <= 31; d++) {
      var dRow = sec.dataStartRow + (d - 1) * 3;
      var dayStr = ("0" + d).slice(-2) + "/" + curMonthNum + "/" + curYearNum;

      try {
        var noRange = sheet.getRange(dRow, 1, 3, 1);
        noRange.merge();
        if (!sheet.getRange(dRow, 1).getValue()) sheet.getRange(dRow, 1).setValue(d);
      } catch (e) {}

      try {
        var dateRange = sheet.getRange(dRow, 3, 3, 1);
        dateRange.merge();
        if (!sheet.getRange(dRow, 3).getValue()) sheet.getRange(dRow, 3).setValue(dayStr);
      } catch (e) {}
    }

    var dataRange = sheet.getRange(sec.dataStartRow, 1, 93, 18);
    dataRange
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setFontFamily("Times New Roman")
      .setFontSize(10)
      .setFontColor("#000000")
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

    sheet.getRange(sec.dataStartRow, 2, 93, 1).setWrap(true);
    sheet.getRange(sec.dataStartRow, 18, 93, 1).setWrap(true);

    for (var r = sec.dataStartRow; r < sec.dataStartRow + 93; r++) {
      sheet.setRowHeight(r, 26);
    }
  }

  // Atur Lebar Kolom Presisi
  sheet.setColumnWidth(1, 45);   // A: NO
  sheet.setColumnWidth(2, 180);  // B: PETUGAS
  sheet.setColumnWidth(3, 115);  // C: TANGGAL
  sheet.setColumnWidth(4, 90);   // D: JAM
  sheet.setColumnWidth(5, 75);   // E: R (A)
  sheet.setColumnWidth(6, 75);   // F: S (A)
  sheet.setColumnWidth(7, 75);   // G: T (A)
  sheet.setColumnWidth(8, 75);   // H: R (R-N)
  sheet.setColumnWidth(9, 75);   // I: VOLT S-N
  sheet.setColumnWidth(10, 75);  // J: VOLT T-N
  sheet.setColumnWidth(11, 75);  // K: VOLT R-S
  sheet.setColumnWidth(12, 75);  // L: VOLT R-T
  sheet.setColumnWidth(13, 75);  // M: VOLT S-T
  sheet.setColumnWidth(14, 90);  // N: SUHU
  sheet.setColumnWidth(15, 85);  // O: ALARM
  sheet.setColumnWidth(16, 75);  // P: HOURS
  sheet.setColumnWidth(17, 75);  // Q: MINUTES
  sheet.setColumnWidth(18, 190); // R: KETERANGAN & LOKASI

  sheet.setHiddenGridlines(false);
  return sheet;
}

// Menghapus data baris shift tertentu tanpa merusak layout tabel
function clearShiftRow(ss, target, inspectionDate, shift, dayOfMonth) {
  var d = parseDayOfMonth(inspectionDate, dayOfMonth);
  var offset = getShiftOffset(shift);

  var lapCetak = ss.getSheetByName("LAPORAN_CETAK");
  var lapUps = ss.getSheetByName("LAPORAN_CETAK_UPS");

  if (lapCetak) {
    var acoBases = [6, 105, 204];
    for (var b = 0; b < acoBases.length; b++) {
      var r = acoBases[b] + (d - 1) * 3 + offset;
      var emptyAco = new Array(17).fill("-");
      emptyAco[0] = (offset === 0) ? String(d) : "";
      lapCetak.getRange(r, 1, 1, 17).setValues([emptyAco]);
    }
  }

  if (lapUps) {
    var upsBases = [7, 107, 207, 307, 407];
    for (var u = 0; u < upsBases.length; u++) {
      var ur = upsBases[u] + (d - 1) * 3 + offset;
      var emptyUps = new Array(18).fill("-");
      emptyUps[0] = (offset === 0) ? String(d) : "";
      lapUps.getRange(ur, 1, 1, 18).setValues([emptyUps]);
    }
  }
}

// ========================================================================
// ARSIP BULANAN & RESET OTOMATIS
// ========================================================================

/**
 * Mendapatkan atau membuat folder khusus arsip di Google Drive
 */
function dapatkanFolderArsip() {
  try {
    var namaFolder = "ARSIP_REKAP_MONITORING_UPS";
    var folders = DriveApp.getFoldersByName(namaFolder);
    if (folders.hasNext()) {
      return folders.next();
    }
    return DriveApp.createFolder(namaFolder);
  } catch (e) {
    Logger.log("Peringatan akses Google Drive: " + e);
    return null;
  }
}

/**
 * Membuat spreadsheet arsip baru di Google Drive berisi data bulan lalu.
 * Lembar LAPORAN_CETAK dan LAPORAN_CETAK_UPS disalin sebagai nilai statis.
 */
function buatArsipBulanan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sekarang = new Date();
  var bulanLalu = new Date(sekarang.getFullYear(), sekarang.getMonth() - 1, 1);
  var namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var labelWaktu = namaBulan[bulanLalu.getMonth()] + " " + bulanLalu.getFullYear();
  var namaFileArsip = "REKAP_MONITORING_UPS_" + labelWaktu;

  // Cek apakah file arsip bulan tersebut sudah pernah dibuat sebelumnya agar tidak duplikat
  try {
    var existingFiles = DriveApp.getFilesByName(namaFileArsip);
    if (existingFiles.hasNext()) {
      var existing = existingFiles.next();
      Logger.log("File arsip sudah ada: " + existing.getUrl());
      return existing.getUrl();
    }
  } catch (e) {}

  var fileArsip = SpreadsheetApp.create(namaFileArsip);

  ["LAPORAN_CETAK", "LAPORAN_CETAK_UPS"].forEach(function(sName) {
    var sheetAsli = ss.getSheetByName(sName);
    if (sheetAsli) {
      var copySheet = sheetAsli.copyTo(fileArsip);
      copySheet.setName(sName);
      var range = copySheet.getDataRange();
      range.setValues(range.getValues());
    }
  });

  // Pindahkan file ke folder khusus "ARSIP_REKAP_MONITORING_UPS" jika tersedia
  try {
    var targetFolder = dapatkanFolderArsip();
    if (targetFolder) {
      var fileInDrive = DriveApp.getFileById(fileArsip.getId());
      fileInDrive.moveTo(targetFolder);
    }
  } catch (e) {
    Logger.log("Info folder: " + e);
  }

  // Hapus lembar bawaan Sheet1 jika ada
  try {
    var defaultSheet = fileArsip.getSheetByName("Sheet1") || fileArsip.getSheetByName("Sheet 1");
    if (defaultSheet && fileArsip.getSheets().length > 1) {
      fileArsip.deleteSheet(defaultSheet);
    }
  } catch (e) {}

  return fileArsip.getUrl();
}

function buatArsipBulananManual() {
  var url = buatArsipBulanan();
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast("Arsip bulanan berhasil disimpan di Google Drive: " + url, "📁 Arsip Sukses", 10);
  } catch (e) {}
  return url;
}

/**
 * Mengarsipkan bulan lalu lalu mengosongkan tabel input untuk bulan baru
 */
function resetLaporanBulananOtomatis() {
  var urlArsip = "";
  try {
    urlArsip = buatArsipBulanan(); 
  } catch (errArsip) {
    Logger.log("Peringatan pembuatan arsip: " + errArsip);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sekarang = new Date();
  var tahun = sekarang.getFullYear();
  var bulan = sekarang.getMonth();
  var namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var labelBulanBaru = namaBulan[bulan] + " " + tahun;
  
  var cetakACO = ss.getSheetByName("LAPORAN_CETAK");
  if (cetakACO) {
    ["B6:B98", "D6:Q98", "B105:B197", "D105:Q197", "B204:B296", "D204:Q296"].forEach(function(r) {
      try { cetakACO.getRange(r).clearContent(); } catch (e) {}
    });
    isiTanggalKolomC(cetakACO, [6, 105, 204], tahun, bulan);

    try {
      [3, 102, 201].forEach(function(r) {
        cetakACO.getRange(r, 2).setValue("Bulan : " + labelBulanBaru);
      });
    } catch (e) {}
  }

  var cetakUPS = ss.getSheetByName("LAPORAN_CETAK_UPS");
  if (cetakUPS) {
    ["B7:B99", "D7:R99", "B107:B199", "D107:R199", "B207:B299", "D207:R299", "B307:B399", "D307:R399", "B407:B499", "D407:R499"].forEach(function(r) {
      try { cetakUPS.getRange(r).clearContent(); } catch (e) {}
    });
    isiTanggalKolomC(cetakUPS, [7, 107, 207, 307, 407], tahun, bulan);

    try {
      [3, 103, 203, 303, 403].forEach(function(r) {
        cetakUPS.getRange(r, 2).setValue("Bulan : " + labelBulanBaru);
      });
    } catch (e) {}
  }

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast("Laporan bulan baru siap! Arsip tersimpan di: " + urlArsip, "🔄 Reset Sukses", 10);
  } catch (e) {}

  return urlArsip;
}

/**
 * Mengisi ulang Kolom C (Tanggal DD/MM/YYYY) dan Kolom A (No) secara rapi untuk 31 hari
 */
function isiTanggalKolomC(sheet, startRows, tahun, bulan) {
  if (!sheet) return;
  var monthNum = ("0" + (bulan + 1)).slice(-2);
  var yearNum = tahun;

  for (var s = 0; s < startRows.length; s++) {
    var startRow = startRows[s];
    for (var d = 1; d <= 31; d++) {
      var dRow = startRow + (d - 1) * 3;
      var dayStr = ("0" + d).slice(-2) + "/" + monthNum + "/" + yearNum;

      try {
        var noRange = sheet.getRange(dRow, 1, 3, 1);
        noRange.merge();
        sheet.getRange(dRow, 1).setValue(d);
      } catch (e) {}

      try {
        var dateRange = sheet.getRange(dRow, 3, 3, 1);
        dateRange.merge();
        sheet.getRange(dRow, 3).setValue(dayStr);
      } catch (e) {}
    }
  }
}

/**
 * Memasang Trigger Arsip Otomatis: Dijalankan setiap tanggal 1 jam 06:00 pagi
 */
function buatTriggerArsipBulanan() {
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === "buatArsipBulanan") {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
  ScriptApp.newTrigger("buatArsipBulanan")
    .timeBased()
    .onMonthDay(1)
    .atHour(6)
    .create();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast("Trigger arsip otomatis bulanan (Tanggal 1 Jam 06:00) berhasil dipasang!", "⏰ Trigger Arsip Aktif", 8);
  } catch (e) {}
}

/**
 * Memasang Trigger Reset Otomatis: Dijalankan setiap tanggal 1 jam 07:00 pagi
 */
function buatTriggerResetLaporan() {
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === "resetLaporanBulananOtomatis") {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
  ScriptApp.newTrigger("resetLaporanBulananOtomatis")
    .timeBased()
    .onMonthDay(1)
    .atHour(7)
    .create();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast("Trigger reset otomatis tanggal 1 jam 07:00 berhasil dipasang!", "⏰ Trigger Reset Aktif", 8);
  } catch (e) {}
}

/**
 * Memasang Seluruh Otomasi Sekaligus:
 * 1. Arsip Otomatis (Tanggal 1 Jam 06:00)
 * 2. Reset Otomatis (Tanggal 1 Jam 07:00)
 */
function buatSemuaTriggerOtomatis() {
  buatTriggerArsipBulanan();
  buatTriggerResetLaporan();
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast("Semua otomasi bulanan aktif! Arsip (Tgl 1 Jam 06:00) & Reset (Tgl 1 Jam 07:00)", "🚀 Otomasi Penuh Aktif", 10);
  } catch (e) {}
}

/**
 * Membaca data shift dari spreadsheet untuk mendeteksi status submit & mengambil data WA
 */
function getShiftDataFromSheets(ss, inspectionDate, shift, dayOfMonth) {
  var d = parseDayOfMonth(inspectionDate, dayOfMonth);
  var offset = getShiftOffset(shift);

  var lapCetak = ss.getSheetByName("LAPORAN_CETAK");
  var lapUps = ss.getSheetByName("LAPORAN_CETAK_UPS");

  var tmRow = 6 + (d - 1) * 3 + offset;
  var st12Row = 105 + (d - 1) * 3 + offset;
  var dipoRow = 204 + (d - 1) * 3 + offset;

  var ups30Row = 7 + (d - 1) * 3 + offset;
  var ups40WRow = 107 + (d - 1) * 3 + offset;
  var ups60WRow = 207 + (d - 1) * 3 + offset;
  var ups40DRow = 307 + (d - 1) * 3 + offset;
  var ups100SRow = 407 + (d - 1) * 3 + offset;

  var acoTmValues = (lapCetak && tmRow <= lapCetak.getLastRow()) ? lapCetak.getRange(tmRow, 1, 1, 17).getValues()[0] : [];
  var acoSt12Values = (lapCetak && st12Row <= lapCetak.getLastRow()) ? lapCetak.getRange(st12Row, 1, 1, 17).getValues()[0] : [];
  var acoDipoValues = (lapCetak && dipoRow <= lapCetak.getLastRow()) ? lapCetak.getRange(dipoRow, 1, 1, 17).getValues()[0] : [];

  var ups30Values = (lapUps && ups30Row <= lapUps.getLastRow()) ? lapUps.getRange(ups30Row, 1, 1, 18).getValues()[0] : [];
  var ups40WValues = (lapUps && ups40WRow <= lapUps.getLastRow()) ? lapUps.getRange(ups40WRow, 1, 1, 18).getValues()[0] : [];
  var ups60WValues = (lapUps && ups60WRow <= lapUps.getLastRow()) ? lapUps.getRange(ups60WRow, 1, 1, 18).getValues()[0] : [];
  var ups40DValues = (lapUps && ups40DRow <= lapUps.getLastRow()) ? lapUps.getRange(ups40DRow, 1, 1, 18).getValues()[0] : [];
  var ups100SValues = (lapUps && ups100SRow <= lapUps.getLastRow()) ? lapUps.getRange(ups100SRow, 1, 1, 18).getValues()[0] : [];

  function isFilled(row) {
    if (!row || row.length < 4) return false;
    var off = String(row[1] || "").trim();
    var jam = String(row[3] || "").trim();
    if (off && off !== "-" && off !== "NAMA PETUGAS") return true;
    if (jam && jam !== "-" && jam !== "WIB") return true;
    for (var i = 4; i < Math.min(row.length, 18); i++) {
      var v = String(row[i] || "").trim();
      if (v && v !== "-" && v !== "0") return true;
    }
    return false;
  }

  function cleanVal(v) {
    if (v === undefined || v === null) return "";
    var s = String(v).trim();
    if (s === "-" || s.toLowerCase() === "null") return "";
    return s.replace(/\\s*(A|V|°C|Jam|Menit)\\b/gi, "").trim();
  }

  function parseOfficers(cell) {
    if (!cell) return ["", ""];
    var s = String(cell).trim();
    if (!s || s === "-") return ["", ""];
    var p = s.split(/[,/&]/);
    var o1 = (p[0] || "").trim();
    var o2 = (p[1] || "").trim();
    return [o1, o2];
  }

  function parseUps(row) {
    var alarm = String(row[14] || "").toUpperCase().indexOf("ALARM") !== -1 ? "ALARM" : "NORMAL";
    return {
      loadR: cleanVal(row[4]),
      loadS: cleanVal(row[5]),
      loadT: cleanVal(row[6]),
      voltRN: cleanVal(row[7]),
      voltSN: cleanVal(row[8]),
      voltTN: cleanVal(row[9]),
      voltRS: cleanVal(row[10]),
      voltRT: cleanVal(row[11]),
      voltST: cleanVal(row[12]),
      temperature: cleanVal(row[13]),
      alarm: alarm,
      backupHours: cleanVal(row[15]),
      backupMinutes: cleanVal(row[16]),
      keterangan: String(row[17] || "-").trim() || "-"
    };
  }

  var isWapresSubmitted = isFilled(acoTmValues) || isFilled(ups30Values) || isFilled(ups40WValues) || isFilled(ups60WValues);
  var isRumdinSubmitted = isFilled(acoDipoValues) || isFilled(acoSt12Values) || isFilled(ups40DValues) || isFilled(ups100SValues);

  var wapres = null;
  if (isWapresSubmitted) {
    var offW = parseOfficers(acoTmValues[1] || ups30Values[1]);
    var tglW = String(acoTmValues[2] || ups30Values[2] || inspectionDate || "").trim();
    var jamW = String(acoTmValues[3] || ups30Values[3] || "WIB").trim();
    if (jamW.toUpperCase().indexOf("WIB") === -1) jamW += " WIB";

    var penyClose = String(acoTmValues[4] || "").trim();
    var penyOpen = String(acoTmValues[5] || "").trim();
    var alW = String(acoTmValues[6] || "").toUpperCase().indexOf("ALARM") !== -1 ? "ALARM" : "NORMAL";
    var pwrW = String(acoTmValues[9] || "").toUpperCase().indexOf("OFF") !== -1 ? "OFF" : "ON";
    var chgW = String(acoTmValues[11] || "").toUpperCase().indexOf("TIDAK") !== -1 ? "TIDAK" : "YA";
    var rmtW = String(acoTmValues[12] || "").toUpperCase().indexOf("LOCAL") !== -1 ? "LOCAL" : "AUTO";
    var lmpW = String(acoTmValues[15] || "").toUpperCase().indexOf("OFF") !== -1 ? "OFF" : "ON";

    wapres = {
      officers: offW,
      inspectionDate: tglW,
      inspectionTime: jamW,
      ups30: parseUps(ups30Values),
      ups40: parseUps(ups40WValues),
      ups60: parseUps(ups60WValues),
      acoTM: {
        penyulangClose: penyClose || "P HAYAM WURUK GI GAMBIR LAMA",
        penyulangOpen: penyOpen || "KOPEL ACO (KS19 P KALINGGA GI GAMBIR LAMA)",
        alarmStatus: alW,
        powerACO: pwrW,
        chargingKubikel: chgW,
        remoteKubikel: rmtW,
        lampuIndikator: lmpW,
        keterangan: String(acoTmValues[16] || "-").trim() || "-"
      },
      submittedAt: new Date().toISOString()
    };
  }

  var rumdin = null;
  if (isRumdinSubmitted) {
    var offR = parseOfficers(acoDipoValues[1] || acoSt12Values[1] || ups40DValues[1]);
    var tglR = String(acoDipoValues[2] || acoSt12Values[2] || ups40DValues[2] || inspectionDate || "").trim();
    var jamR = String(acoDipoValues[3] || acoSt12Values[3] || ups40DValues[3] || "WIB").trim();
    if (jamR.toUpperCase().indexOf("WIB") === -1) jamR += " WIB";

    var d15 = String(acoDipoValues[4] || "").toUpperCase().indexOf("OPEN") !== -1 ? "OPEN" : "CLOSE";
    var d135 = String(acoDipoValues[5] || "").toUpperCase().indexOf("CLOSE") !== -1 ? "CLOSE" : "OPEN";
    var dAl = String(acoDipoValues[6] || "").toUpperCase().indexOf("ALARM") !== -1 ? "ALARM" : "NORMAL";
    var dPwr = String(acoDipoValues[9] || "").toUpperCase().indexOf("OFF") !== -1 ? "OFF" : "ON";
    var dLmp = String(acoDipoValues[15] || "").toUpperCase().indexOf("OFF") !== -1 ? "OFF" : "ON";

    var sClose = String(acoSt12Values[4] || "").trim();
    var sOpen = String(acoSt12Values[5] || "").trim();
    var sAl = String(acoSt12Values[6] || "").toUpperCase().indexOf("ALARM") !== -1 ? "ALARM" : "NORMAL";
    var sPwr = String(acoSt12Values[9] || "").toUpperCase().indexOf("OFF") !== -1 ? "OFF" : "ON";
    var sLmp = String(acoSt12Values[15] || "").toUpperCase().indexOf("OFF") !== -1 ? "OFF" : "ON";
    var isT93 = sClose.toUpperCase().indexOf("T93") !== -1 || (!sOpen.toUpperCase().indexOf("T10B") && !sClose.toUpperCase().indexOf("T10B"));

    rumdin = {
      officers: offR,
      inspectionDate: tglR,
      inspectionTime: jamR,
      acoTRDipo: {
        garduT15NStatus: d15,
        garduT135Status: d135,
        alarmStatus: dAl,
        powerACO: dPwr,
        lampuIndikator: dLmp,
        keterangan: String(acoDipoValues[16] || "-").trim() || "-"
      },
      acoTRST12: {
        garduT93Status: isT93 ? "CLOSE" : "OPEN",
        garduT10BStatus: isT93 ? "OPEN" : "CLOSE",
        penyulangClose: sClose || (isT93 ? "GARDU T93" : "GARDU T10B"),
        penyulangOpen: sOpen || (isT93 ? "GARDU T10B" : "GARDU T93"),
        alarmStatus: sAl,
        powerACO: sPwr,
        lampuIndikator: sLmp,
        keterangan: String(acoSt12Values[16] || "-").trim() || "-"
      },
      ups40Dipo: parseUps(ups40DValues),
      ups100ST12: parseUps(ups100SValues),
      submittedAt: new Date().toISOString()
    };
  }

  return {
    isWapresSubmitted: isWapresSubmitted,
    isRumdinSubmitted: isRumdinSubmitted,
    isBothSubmitted: isWapresSubmitted && isRumdinSubmitted,
    wapres: wapres,
    rumdin: rumdin
  };
}
`;
