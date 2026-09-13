import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  extractIdFromUrl,
  serverParseGviz,
  serverParseFullSheets,
  serverParseRowRanges,
  serverParseAllHistory,
} from "./server/sheetParser";

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const PORT = 3000;

  app.use(express.json());

  // Health check for Cloud Run and monitoring
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Shift submission detection & read endpoint directly from spreadsheet database
  app.post("/api/sheets/read-shift", async (req, res) => {
    try {
      const { webhookUrl, spreadsheetId, sheetLink, dayOfMonth, shift, dateKey, accessToken } = req.body;
      const targetDay = Number(dayOfMonth) || (dateKey ? parseInt(String(dateKey).split('-')[2], 10) : new Date().getDate());
      const targetShift = String(shift || 'PAGI').toUpperCase();
      const offset = targetShift === 'SIANG' ? 1 : targetShift === 'MALAM' ? 2 : 0;

      // Channel 1: Webhook
      if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('https://script.google.com/')) {
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'GET_SHIFT_DATA',
              inspectionDate: dateKey || '',
              shift: targetShift,
              dayOfMonth: targetDay,
            }),
          });
          if (response.ok) {
            const data: any = await response.json();
            if (data.status === 'success' && data.data) {
              return res.json({
                success: true,
                source: 'webhook',
                isWapresSubmitted: Boolean(data.data.isWapresSubmitted),
                isRumdinSubmitted: Boolean(data.data.isRumdinSubmitted),
                wapres: data.data.wapres || null,
                rumdin: data.data.rumdin || null,
                data: data.data,
              });
            }
          }
        } catch {
          // Fall through to other channels
        }
      }

      // Channel 2: Spreadsheet ID via Sheets API or GVIZ
      const sheetId = spreadsheetId || (sheetLink ? extractIdFromUrl(sheetLink) : null);
      if (sheetId) {
        if (accessToken) {
          try {
            const tmRow = 6 + (targetDay - 1) * 3 + offset;
            const st12Row = 105 + (targetDay - 1) * 3 + offset;
            const dipoRow = 204 + (targetDay - 1) * 3 + offset;
            const ups30Row = 7 + (targetDay - 1) * 3 + offset;
            const ups40WRow = 107 + (targetDay - 1) * 3 + offset;
            const ups60WRow = 207 + (targetDay - 1) * 3 + offset;
            const ups40DRow = 307 + (targetDay - 1) * 3 + offset;
            const ups100SRow = 407 + (targetDay - 1) * 3 + offset;

            const ranges = [
              `LAPORAN_CETAK!A${tmRow}:Q${tmRow}`,
              `LAPORAN_CETAK!A${st12Row}:Q${st12Row}`,
              `LAPORAN_CETAK!A${dipoRow}:Q${dipoRow}`,
              `LAPORAN_CETAK_UPS!A${ups30Row}:R${ups30Row}`,
              `LAPORAN_CETAK_UPS!A${ups40WRow}:R${ups40WRow}`,
              `LAPORAN_CETAK_UPS!A${ups60WRow}:R${ups60WRow}`,
              `LAPORAN_CETAK_UPS!A${ups40DRow}:R${ups40DRow}`,
              `LAPORAN_CETAK_UPS!A${ups100SRow}:R${ups100SRow}`,
            ];

            const apiRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${ranges
                .map((r) => `ranges=${encodeURIComponent(r)}`)
                .join('&')}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (apiRes.ok) {
              const apiJson: any = await apiRes.json();
              const valueRanges = apiJson.valueRanges || [];
              const parsed = serverParseRowRanges(valueRanges, targetDay, targetShift, dateKey || '');
              return res.json({ success: true, source: 'sheets_api', ...parsed });
            }
          } catch {
            // Fall through to GVIZ
          }
        }

        // Try GVIZ query
        try {
          const gvizCetak = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK`;
          const gvizUps = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK_UPS`;

          const [rCetak, rUps] = await Promise.all([
            fetch(gvizCetak).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
            fetch(gvizUps).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
          ]);

          const rowsCetak = serverParseGviz(rCetak);
          const rowsUps = serverParseGviz(rUps);

          if (rowsCetak.length > 0 || rowsUps.length > 0) {
            const parsed = serverParseFullSheets(rowsCetak, rowsUps, targetDay, offset, targetShift, dateKey || '');
            return res.json({ success: true, source: 'gviz', ...parsed });
          }
        } catch {
          // Gviz failed
        }
      }

      return res.json({
        success: false,
        isWapresSubmitted: false,
        isRumdinSubmitted: false,
        message: 'Tidak ada data ditemukan di database spreadsheet.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Shift history read endpoint directly from spreadsheet database
  app.post("/api/sheets/read-history", async (req, res) => {
    try {
      const { spreadsheetId, sheetLink, year, month } = req.body;
      const sheetId = spreadsheetId || (sheetLink ? extractIdFromUrl(sheetLink) : null);

      if (!sheetId) {
        return res.status(400).json({ success: false, message: 'ID Spreadsheet / Link belum disediakan.' });
      }

      const gvizCetak = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK`;
      const gvizUps = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=LAPORAN_CETAK_UPS`;

      const [rCetak, rUps] = await Promise.all([
        fetch(gvizCetak).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
        fetch(gvizUps).then((r) => (r.ok ? r.text() : '')).catch(() => ''),
      ]);

      const rowsCetak = serverParseGviz(rCetak);
      const rowsUps = serverParseGviz(rUps);

      if (rowsCetak.length === 0 && rowsUps.length === 0) {
        return res.json({ success: false, reports: [], message: 'Tab LAPORAN_CETAK / LAPORAN_CETAK_UPS tidak dapat dibaca atau kosong.' });
      }

      const reports = serverParseAllHistory(rowsCetak, rowsUps, year, month);
      return res.json({
        success: true,
        count: reports.length,
        reports,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, reports: [] });
    }
  });

  // Vite middleware for development vs static files for production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in ${isProduction ? "production" : "development"} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
