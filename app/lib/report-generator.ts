import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ROBOTO_REGULAR } from "./fonts/roboto-regular";

export interface CampaignRow {
  name: string;
  status: string;
  dailyBudget: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  costPerLead: number;
}

export interface PostRow {
  caption: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

export interface ReportData {
  campaigns: CampaignRow[];
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    leads: number;
    costPerLead: number;
  };
  posts?: PostRow[];
  dateFrom: string;
  dateTo: string;
}

function initPdf(): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Embed Cyrillic font
  doc.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  return doc;
}

export function generatePDFReport(data: ReportData) {
  const doc = initPdf();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.text("Маркетинг отчёт", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Период: ${data.dateFrom} — ${data.dateTo}`, pageWidth / 2, 28, {
    align: "center",
  });
  doc.text(
    `Создан: ${new Date().toLocaleDateString("ru")}`,
    pageWidth / 2,
    33,
    { align: "center" }
  );
  doc.setTextColor(0);

  // KPI Summary
  doc.setFontSize(13);
  doc.text("Сводка", 14, 44);

  autoTable(doc, {
    startY: 48,
    head: [["Метрика", "Значение"]],
    body: [
      ["Расходы", `$${data.totals.spend.toFixed(2)}`],
      ["Показы", data.totals.impressions.toLocaleString("ru")],
      ["Клики", data.totals.clicks.toLocaleString("ru")],
      ["CTR", `${data.totals.ctr.toFixed(2)}%`],
      ["CPC", `$${data.totals.cpc.toFixed(2)}`],
      ["Лиды", data.totals.leads.toString()],
      [
        "Стоимость лида",
        data.totals.costPerLead > 0
          ? `$${data.totals.costPerLead.toFixed(2)}`
          : "—",
      ],
    ],
    styles: { font: "Roboto", fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    theme: "grid",
    margin: { left: 14, right: 14 },
  });

  // Campaign table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterKpi = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFontSize(13);
  doc.text("Кампании", 14, afterKpi + 10);

  autoTable(doc, {
    startY: afterKpi + 14,
    head: [
      [
        "Кампания",
        "Статус",
        "Расходы",
        "Показы",
        "Клики",
        "CTR",
        "CPC",
        "Лиды",
      ],
    ],
    body: data.campaigns.map((c) => [
      c.name.length > 25 ? c.name.slice(0, 25) + "…" : c.name,
      c.status,
      `$${c.spend.toFixed(2)}`,
      c.impressions.toLocaleString("ru"),
      c.clicks.toString(),
      `${c.ctr.toFixed(2)}%`,
      `$${c.cpc.toFixed(2)}`,
      c.leads.toString(),
    ]),
    styles: { font: "Roboto", fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    theme: "grid",
    margin: { left: 14, right: 14 },
  });

  // Instagram posts table (if available)
  if (data.posts && data.posts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterCampaigns = (doc as any).lastAutoTable?.finalY || 200;

    if (afterCampaigns > 240) doc.addPage();
    const startY = afterCampaigns > 240 ? 20 : afterCampaigns + 10;

    doc.setFontSize(13);
    doc.text("Посты Instagram", 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [["Дата", "Подпись", "❤️ Лайки", "💬 Комм."]],
      body: data.posts.map((p) => [
        new Date(p.timestamp).toLocaleDateString("ru"),
        p.caption.length > 50 ? p.caption.slice(0, 50) + "…" : p.caption,
        p.likeCount.toString(),
        p.commentsCount.toString(),
      ]),
      styles: { font: "Roboto", fontSize: 8 },
      headStyles: { fillColor: [168, 85, 247] },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`маркетинг-отчёт-${data.dateFrom}-${data.dateTo}.pdf`);
}

export function generateExcelReport(data: ReportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Campaigns
  const campaignData = data.campaigns.map((c) => ({
    Кампания: c.name,
    Статус: c.status,
    "Бюджет/день": c.dailyBudget ? `$${c.dailyBudget}` : "—",
    Расходы: c.spend,
    Показы: c.impressions,
    Клики: c.clicks,
    "CTR%": c.ctr,
    CPC: c.cpc,
    Лиды: c.leads,
    "Стоимость лида": c.costPerLead,
  }));

  const ws1 = XLSX.utils.json_to_sheet(campaignData);
  ws1["!cols"] = [
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Кампании");

  // Sheet 2: Posts (if available)
  if (data.posts && data.posts.length > 0) {
    const postData = data.posts.map((p) => ({
      Дата: new Date(p.timestamp).toLocaleDateString("ru"),
      Подпись: p.caption,
      Лайки: p.likeCount,
      Комментарии: p.commentsCount,
    }));

    const ws2 = XLSX.utils.json_to_sheet(postData);
    ws2["!cols"] = [{ wch: 12 }, { wch: 60 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Посты Instagram");
  }

  // Sheet 3: Summary
  const summaryData = [
    { Метрика: "Период", Значение: `${data.dateFrom} — ${data.dateTo}` },
    { Метрика: "Расходы", Значение: `$${data.totals.spend.toFixed(2)}` },
    {
      Метрика: "Показы",
      Значение: data.totals.impressions.toLocaleString("ru"),
    },
    { Метрика: "Клики", Значение: data.totals.clicks.toLocaleString("ru") },
    { Метрика: "CTR", Значение: `${data.totals.ctr.toFixed(2)}%` },
    { Метрика: "CPC", Значение: `$${data.totals.cpc.toFixed(2)}` },
    { Метрика: "Лиды", Значение: data.totals.leads.toString() },
    {
      Метрика: "Стоимость лида",
      Значение:
        data.totals.costPerLead > 0
          ? `$${data.totals.costPerLead.toFixed(2)}`
          : "—",
    },
  ];

  const ws3 = XLSX.utils.json_to_sheet(summaryData);
  ws3["!cols"] = [{ wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Сводка");

  XLSX.writeFile(
    wb,
    `маркетинг-отчёт-${data.dateFrom}-${data.dateTo}.xlsx`
  );
}
