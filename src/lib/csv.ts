export interface CsvColumn {
  key: string;
  header: string;
}

export function exportToCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
  filename: string,
): void {
  const headers = columns.map((column) => column.header);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const value = row[column.key];
          const text = value == null ? "" : String(value);
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
