import { memo, ReactNode, useEffect, useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import { VirtualTable } from './VirtualTable';

export interface GridFilter {
  key: string;
  label: string;
  allLabel?: string;
  options: Array<{ value: string; label: string }>;
  match: (row: Record<string, unknown>, value: string) => boolean;
}

interface TableProps {
  rows: Record<string, unknown>[];
  columns: Array<[string, (row: Record<string, unknown>) => ReactNode]>;
  loading?: boolean;
  filters?: GridFilter[];
  searchPlaceholder?: string;
}

const VIRTUAL_THRESHOLD = 50;

function EmptyState({ text = 'Sin datos para mostrar.' }: { text?: string }) {
  return (
    <div className="admin-empty">
      <Inbox size={28} />
      <span>{text}</span>
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

function GridFooter({ total, pageSize, page, onPageSizeChange, onPrev, onNext }: {
  total: number; pageSize: number; page: number; onPageSizeChange: (n: number) => void; onPrev: () => void; onNext: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="grid-footer">
      <span>{total} registro{total !== 1 ? 's' : ''}</span>
      <label>
        Ver
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <div className="pager">
        <button disabled={page <= 1} onClick={onPrev}>‹</button>
        <span>Pág. {page}</span>
        <button disabled={page >= totalPages} onClick={onNext}>›</button>
      </div>
    </div>
  );
}

export const Table = memo(function Table({
  rows,
  columns,
  loading = false,
  filters = [],
  searchPlaceholder = 'Buscar'
}: TableProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => { setPage(1); }, [query, pageSize, filterValues, rows]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (rows || []).filter((row) => {
      const matchesSearch = !normalized || JSON.stringify(row).toLowerCase().includes(normalized);
      const matchesFilters = filters.every((filter) => {
        const value = filterValues[filter.key];
        return !value || filter.match(row, value);
      });
      return matchesSearch && matchesFilters;
    });
  }, [rows, query, filterValues, filters]);

  const useVirtual = filteredRows.length > VIRTUAL_THRESHOLD;
  const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = useVirtual ? filteredRows : filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading) return <TableSkeleton columns={columns.length} />;

  return (
    <>
      <div className="grid-toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} />
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={filterValues[filter.key] || ''}
            onChange={(e) => setFilterValues((current) => ({ ...current, [filter.key]: e.target.value }))}
          >
            <option value="">{filter.allLabel || filter.label}</option>
            {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ))}
      </div>

      {!filteredRows.length ? <EmptyState text="No hay registros con esos filtros." /> : useVirtual ? (
        <VirtualTable rows={filteredRows as Record<string, unknown>[]} columns={columns as Array<[string, (row: Record<string, unknown>) => ReactNode]>} />
      ) : (
        <>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={String(row._id || row.id || index)}>
                    {columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GridFooter
            total={filteredRows.length}
            pageSize={pageSize}
            page={safePage}
            onPageSizeChange={setPageSize}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(pages, p + 1))}
          />
        </>
      )}
    </>
  );
});