import { memo, ReactNode, CSSProperties, useRef, useState, useEffect } from 'react';

interface VirtualTableProps {
  rows: Record<string, unknown>[];
  columns: Array<[string, (row: Record<string, unknown>) => ReactNode]>;
  rowHeight?: number;
  maxHeight?: number;
  onSelect?: (row: Record<string, unknown>) => void;
  rowClassName?: (row: Record<string, unknown>) => string | undefined;
}

export const VirtualTable = memo(function VirtualTable({
  rows,
  columns,
  rowHeight = 56,
  maxHeight = 400,
  onSelect,
  rowClassName
}: VirtualTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const totalHeight = rows.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
  const visibleCount = Math.ceil(maxHeight / rowHeight) + 4;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);
  const visibleRows = rows.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map(([label]) => <th key={label}>{label}</th>)}
          </tr>
        </thead>
      </table>
      <div
        ref={containerRef}
        style={{ height: Math.min(maxHeight, totalHeight), overflow: 'auto' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: offsetY, width: '100%' }}>
            {visibleRows.map((row, i) => (
              <div
                key={startIndex + i}
                className={[onSelect ? 'selectable' : '', rowClassName?.(row) || ''].filter(Boolean).join(' ') || undefined}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                style={{ display: 'table-row', height: rowHeight }}
                onClick={onSelect ? () => onSelect(row) : undefined}
                onKeyDown={onSelect ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(row);
                  }
                } : undefined}
              >
                {columns.map(([label, render]) => (
                  <div key={label} style={{ display: 'table-cell', padding: '12px 8px', verticalAlign: 'middle' }}>
                    {render(row)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
