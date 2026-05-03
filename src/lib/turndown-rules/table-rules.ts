/**
 * turndown-rules 表格规则
 * 将 HTML 表格转换为 Markdown 表格语法，
 * 处理 thead/tbody 结构、单元格对齐和列宽对齐。
 */

import type TurndownService from "turndown";

/** 注册表格相关的 Turndown 转换规则，包括单元格、行、表头和表格容器的处理 */
export function registerTableRules(td: TurndownService) {
  td.addRule("tableCell", {
    filter: ["th", "td"],
    replacement: (content) => content,
  });
  td.addRule("tableRow", {
    filter: "tr",
    replacement: (content) => content,
  });
  td.addRule("tableSection", {
    filter: ["thead", "tbody", "tfoot"],
    replacement: (content) => content,
  });

  td.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLElement;
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return _content;

      const matrix: { text: string; isHeader: boolean; align: string }[][] = [];

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const rowData = cells.map(cell => {
          const el = cell as HTMLElement;
          const isHeader = cell.nodeName === "TH";
          const align = el.style.textAlign || el.getAttribute("align") || "";
          const text = (el.textContent || "").trim().replace(/\|/g, "\\|").replace(/\n/g, " ");
          return { text, isHeader, align };
        });
        matrix.push(rowData);
      });

      if (matrix.length === 0) return _content;

      const colCount = Math.max(...matrix.map(r => r.length));
      const colWidths: number[] = Array(colCount).fill(3);

      matrix.forEach(row => {
        row.forEach((cell, i) => {
          colWidths[i] = Math.max(colWidths[i], cell.text.length);
        });
      });

      const pad = (text: string, width: number) => text + " ".repeat(Math.max(0, width - text.length));

      const formatRow = (row: { text: string }[]) => {
        const cells = [];
        for (let i = 0; i < colCount; i++) {
          cells.push(pad(row[i]?.text || "", colWidths[i]));
        }
        return `| ${cells.join(" | ")} |`;
      };

      const firstRow = matrix[0];
      const hasHeader = firstRow.some(c => c.isHeader) || table.querySelector("thead") !== null;

      let headerRow: typeof firstRow;
      let bodyRows: typeof matrix;

      if (hasHeader) {
        headerRow = firstRow;
        bodyRows = matrix.slice(1);
      } else {
        headerRow = Array(colCount).fill(null).map(() => ({ text: "", isHeader: true, align: "" }));
        bodyRows = matrix;
      }

      const headerLine = formatRow(headerRow);

      const separatorCells: string[] = [];
      for (let i = 0; i < colCount; i++) {
        const align = headerRow[i]?.align || "";
        const w = colWidths[i];
        if (align === "center") {
          separatorCells.push(":" + "-".repeat(Math.max(1, w - 2)) + ":");
        } else if (align === "right") {
          separatorCells.push("-".repeat(Math.max(1, w - 1)) + ":");
        } else {
          separatorCells.push("-".repeat(w));
        }
      }
      const separatorLine = `| ${separatorCells.join(" | ")} |`;

      const lines = [headerLine, separatorLine];
      bodyRows.forEach(row => lines.push(formatRow(row)));

      return `\n\n${lines.join("\n")}\n\n`;
    },
  });

  td.addRule("tableContainer", {
    filter: (node) =>
      node.nodeName === "DIV" && (node as HTMLElement).classList.contains("table-container"),
    replacement: (content) => content,
  });
}
