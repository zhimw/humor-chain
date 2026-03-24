'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

type InputMode = 'url' | 'file';
type StepState = 'idle' | 'active' | 'done' | 'error';

interface PipelineStep {
  key: string;
  label: string;
  state: StepState;
  detail?: string;
}

interface Caption {
  id?: string;
  content?: string;
  [key: string]: unknown;
}

interface Props {
  flavorId: number;
  flavorSlug: string;
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

function makeSteps(mode: InputMode): PipelineStep[] {
  if (mode === 'file') {
    return [
      { key: 'presign',   label: 'Get S3 upload URL',   state: 'idle' },
      { key: 's3',        label: 'Upload file to S3',    state: 'idle' },
      { key: 'register',  label: 'Register image',       state: 'idle' },
      { key: 'generate',  label: 'Generate captions',    state: 'idle' },
    ];
  }
  return [
    { key: 'register', label: 'Register image URL', state: 'idle' },
    { key: 'generate', label: 'Generate captions',  state: 'idle' },
  ];
}

const STEP_ICON: Record<StepState, string> = {
  idle: '○',
  active: '⟳',
  done: '✓',
  error: '✕',
};

const STEP_COLOR: Record<StepState, string> = {
  idle: 'var(--text-dim)',
  active: 'var(--primary)',
  done: 'var(--success)',
  error: 'var(--danger)',
};

export default function TestFlavorForm({ flavorId, flavorSlug }: Props) {
  const [mode, setMode] = useState<InputMode>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [steps, setSteps] = useState<PipelineStep[]>(makeSteps('url'));
  const [running, setRunning] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<Record<string, unknown> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function patchStep(key: string, patch: Partial<PipelineStep>) {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, ...patch } : s));
  }

  function switchMode(m: InputMode) {
    setMode(m);
    setSteps(makeSteps(m));
    setCaptions([]);
    setError(null);
    setErrorDetail(null);
    setFile(null);
    setPreviewUrl(null);
    setImageUrl('');
  }

  function handleFileSelect(f: File) {
    if (!SUPPORTED_TYPES.includes(f.type)) {
      setError(`Unsupported type: ${f.type}. Use JPEG, PNG, WebP, GIF, or HEIC.`);
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  // ── Step helpers ──────────────────────────────────────────────

  async function stepRegister(url: string): Promise<string> {
    patchStep('register', { state: 'active' });
    const res = await fetch('/api/test-flavor/register-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json();
    if (!res.ok) {
      patchStep('register', { state: 'error', detail: data.error });
      throw new Error(data.error ?? `Register failed (${res.status})`);
    }
    const imageId: string = data.imageId ?? data.id ?? data.image_id;
    if (!imageId) {
      patchStep('register', { state: 'error', detail: 'No imageId in response' });
      throw new Error(`API did not return an imageId. Response: ${JSON.stringify(data)}`);
    }
    patchStep('register', { state: 'done' });
    return imageId;
  }

  async function stepGenerate(imageId: string): Promise<Caption[]> {
    patchStep('generate', { state: 'active' });
    const res = await fetch('/api/test-flavor/generate-captions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, humor_flavor_id: flavorId }),
    });
    const data = await res.json();
    if (!res.ok) {
      patchStep('generate', { state: 'error', detail: data.error });
      setErrorDetail((data.detail as Record<string, unknown>) ?? null);
      throw new Error(data.error ?? `Generate failed (${res.status})`);
    }
    patchStep('generate', { state: 'done' });

    // Normalise various response shapes
    const arr: Caption[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.captions) ? data.captions
      : Array.isArray(data?.data)     ? data.data
      : data?.data                    ? [data.data]
      : [data];
    return arr;
  }

  // ── URL flow ──────────────────────────────────────────────────

  async function runUrl() {
    const fresh = makeSteps('url');
    setSteps(fresh);
    const imageId = await stepRegister(imageUrl);
    return await stepGenerate(imageId);
  }

  // ── File upload flow ──────────────────────────────────────────

  async function runFile() {
    if (!file) throw new Error('No file selected.');
    const fresh = makeSteps('file');
    setSteps(fresh);

    // Step 1: Get presigned URL
    patchStep('presign', { state: 'active' });
    const presignRes = await fetch('/api/test-flavor/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type }),
    });
    const presignData = await presignRes.json();
    if (!presignRes.ok) {
      patchStep('presign', { state: 'error' });
      throw new Error(presignData.error ?? `Presign failed (${presignRes.status})`);
    }
    const { presignedUrl, cdnUrl } = presignData;
    patchStep('presign', { state: 'done' });

    // Step 2: PUT directly to S3 (must be client-side — can't relay binary via server)
    patchStep('s3', { state: 'active' });
    const s3Res = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!s3Res.ok) {
      patchStep('s3', { state: 'error' });
      throw new Error(`S3 upload failed (${s3Res.status})`);
    }
    patchStep('s3', { state: 'done' });

    // Steps 3 & 4: register + generate
    const imageId = await stepRegister(cdnUrl);
    return await stepGenerate(imageId);
  }

  // ── Submit ────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    setError(null);
    setErrorDetail(null);
    setCaptions([]);

    try {
      const result = mode === 'url' ? await runUrl() : await runFile();
      setCaptions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setRunning(false);
    }
  }

  const canSubmit = !running && (mode === 'url' ? imageUrl.trim().length > 0 : file !== null);
  const hasStarted = steps.some(s => s.state !== 'idle');

  return (
    <div>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px', width: 'fit-content' }}>
        {(['url', 'file'] as InputMode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={mode === m ? 'button button-sm' : 'button-ghost button-sm'}
          >
            {m === 'url' ? '🔗 Image URL' : '📁 Upload File'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* URL input */}
        {mode === 'url' && (
          <div className="form-group">
            <label className="form-label" htmlFor="image-url">
              Image URL <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              id="image-url"
              type="url"
              className="input"
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setPreviewUrl(e.target.value || null); }}
              placeholder="https://example.com/photo.jpg"
              required
            />
            <p className="form-hint">Paste a publicly accessible image URL</p>
          </div>
        )}

        {/* File drop zone */}
        {mode === 'file' && (
          <div className="form-group">
            <label className="form-label">
              Image File <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(99,102,241,0.06)' : 'var(--surface-2)', transition: 'border-color 150ms, background 150ms' }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {file ? <strong style={{ color: 'var(--text)' }}>{file.name}</strong> : 'Drag & drop or click to browse'}
              </div>
              <div className="text-xs text-dim">JPEG · PNG · WebP · GIF · HEIC</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_TYPES.join(',')}
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="form-group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', objectFit: 'cover', display: 'block' }}
              onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>
        )}

        {/* Pipeline progress */}
        {hasStarted && (
          <div style={{ margin: '16px 0', padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div className="step-prompt-label" style={{ marginBottom: '10px' }}>Pipeline Progress</div>
            {steps.map((step, i) => (
              <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < steps.length - 1 ? '8px' : 0 }}>
                <span style={{ width: '18px', textAlign: 'center', flexShrink: 0, color: STEP_COLOR[step.state], fontWeight: 700, fontSize: '13px', paddingTop: '1px' }}>
                  {STEP_ICON[step.state]}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: STEP_COLOR[step.state], display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {step.label}
                    {step.state === 'active' && <span className="spinner" style={{ width: '12px', height: '12px' }} />}
                  </div>
                  {step.detail && step.state === 'error' && (
                    <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px', fontFamily: 'monospace' }}>
                      {String(step.detail)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error block */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: errorDetail ? '8px' : 0 }}>{error}</div>
            {errorDetail && (
              <details style={{ marginTop: '6px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.8 }}>API response detail</summary>
                <pre style={{ marginTop: '6px', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(errorDetail, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <button type="submit" className="button w-full" disabled={!canSubmit}>
          {running
            ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="spinner" />Running pipeline…</span>
            : '▶ Generate Captions'
          }
        </button>
      </form>

      {/* Caption results */}
      {captions.length > 0 && (
        <div className="mt-6">
          <div className="flex-between mb-4">
            <h3 className="section-title" style={{ fontSize: '16px' }}>
              {captions.length} caption{captions.length !== 1 ? 's' : ''} generated
            </h3>
            <Link href={`/flavors/${flavorId}/captions`} className="button-secondary button-sm">
              View all captions →
            </Link>
          </div>

          {captions.map((caption, i) => (
            <div key={caption.id ?? i} className="caption-card">
              <div className="caption-content">
                {typeof caption.content === 'string'
                  ? caption.content
                  : JSON.stringify(caption, null, 2)}
              </div>
              {caption.id && (
                <div className="caption-meta">
                  <span className="text-xs text-dim mono">id: {String(caption.id)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
