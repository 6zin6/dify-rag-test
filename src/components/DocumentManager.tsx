'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Document } from '@/lib/dify';

const ACCEPTED_TYPES = ['.md', '.txt', '.pdf', '.docx'];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    indexing: 'bg-yellow-100 text-yellow-700',
    parsing: 'bg-yellow-100 text-yellow-700',
    splitting: 'bg-yellow-100 text-yellow-700',
    cleaning: 'bg-yellow-100 text-yellow-700',
    waiting: 'bg-gray-100 text-gray-600',
    error: 'bg-red-100 text-red-600',
    paused: 'bg-gray-100 text-gray-600',
  };
  const style = styles[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

function formatDate(unixTs: number) {
  return new Date(unixTs * 1000).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger a refetch by incrementing the key watched by useEffect
  const fetchDocuments = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/documents');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { data: Document[] };
        if (!cancelled) setDocuments(data.data);
      } catch {
        if (!cancelled) setError('ドキュメント一覧の取得に失敗しました。');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  function validateFile(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `非対応のファイル形式です。対応形式: ${ACCEPTED_TYPES.join(', ')}`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `ファイルサイズが上限（15MB）を超えています。`;
    }
    return null;
  }

  function uploadFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        fetchDocuments();
      } else {
        setError('アップロードに失敗しました。もう一度お試しください。');
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setError('ネットワークエラーが発生しました。');
    };

    xhr.open('POST', '/api/documents');
    xhr.send(formData);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleDelete(doc: Document) {
    if (!window.confirm(`「${doc.name}」を削除しますか？`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchDocuments();
    } catch {
      setError('削除に失敗しました。もう一度お試しください。');
    }
  }

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Upload area */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">📤 ファイルをアップロード</h2>

        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : isUploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="w-full max-w-xs space-y-3">
              <p className="text-sm text-gray-600">アップロード中...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-3">📁</div>
              <p className="text-sm font-medium text-gray-700">
                ここにファイルをドラッグ、またはクリックして選択
              </p>
              <p className="text-xs text-gray-400 mt-1">
                対応形式: {ACCEPTED_TYPES.join(', ')} &nbsp;|&nbsp; 上限 15MB
              </p>
            </>
          )}
        </div>
      </section>

      {/* Document list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">📚 アップロード済みドキュメント</h2>
          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40"
          >
            {isLoading ? '更新中...' : '↺ 更新'}
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">読み込み中...</div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              ドキュメントがまだありません
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ファイル名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">単語数</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">作成日</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium max-w-xs truncate">
                      {doc.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.indexing_status} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                      {doc.word_count?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(doc)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
