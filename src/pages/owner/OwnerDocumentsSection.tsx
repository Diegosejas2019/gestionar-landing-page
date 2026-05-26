import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel } from '../admin/adminFormat';
import { Empty } from '../admin/adminComponents';

const CATEGORY_LABELS: Record<string, string> = {
  regulation: 'Reglamento', map: 'Plano', rules: 'Normas', assembly: 'Actas de asamblea',
  insurance: 'Seguro', payment: 'Liquidaciones', contract: 'Contratos', other: 'Otros',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OwnerDocumentsSection() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    ownerApi.documents.list()
      .then((r) => setDocuments(r?.data?.documents || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar documentos.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(doc: any) {
    setDownloading(doc._id);
    try {
      const blob = await ownerApi.documents.download(doc._id);
      const ext = doc.file?.name?.split('.').pop() || 'pdf';
      downloadBlob(blob, `${doc.title || 'documento'}.${ext}`);
    } catch {
      // ignore
    } finally {
      setDownloading(null);
    }
  }

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))];

  const filtered = documents.filter(d => {
    const matchCat = category === 'all' || d.category === category;
    const matchSearch = !search || (d.title || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="admin-page-head">
        <div><h1 className="admin-page-title">Documentos</h1></div>
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar documento…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}
        >
          <option value="all">Todas las categorías</option>
          {categories.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
          ))}
        </select>
      </div>

      <section className="card">
        <div className="card-h">
          <div>
            <h3>Documentos del consorcio</h3>
            <div className="card-sub">{filtered.length} documento{filtered.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 60, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Empty text="Sin documentos disponibles." />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filtered.map((doc) => (
                <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <FileText size={18} color="var(--green)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                      {CATEGORY_LABELS[doc.category] || doc.category || 'General'}
                      {doc.createdAt ? ` · ${dateLabel(doc.createdAt)}` : ''}
                    </div>
                    {doc.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>{doc.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc._id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--green-soft)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--green)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                  >
                    <Download size={14} />
                    {downloading === doc._id ? 'Descargando…' : 'Descargar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
