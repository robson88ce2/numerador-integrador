import { ReactNode } from 'react';

interface TableProps {
  columns: string[];
  rows: ReactNode[];
  emptyMessage?: string;
}

export function Table({ columns, rows, emptyMessage = 'Sem dados para exibir.' }: TableProps) {
  return (
    <div className="table-shell">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
