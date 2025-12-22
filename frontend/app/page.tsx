import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
        AI Content Generator
      </h1>
      <p style={{ color: '#888', marginBottom: '32px', fontSize: '1.1rem' }}>
        Generate content and images with AI. Powered by Claude and Replicate.
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link
          href="/admin/generate"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 32px',
            background: 'var(--accent)',
            color: '#000',
            borderRadius: '8px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Start Generating
        </Link>

        <Link
          href="/auth/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 32px',
            background: 'var(--border)',
            color: 'var(--foreground)',
            borderRadius: '8px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Login
        </Link>
      </div>

      <div style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Features</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>Text Generation</h3>
            <p style={{ color: '#888' }}>
              Generate recipes, product descriptions, blog posts, and more using Claude.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>Image Generation</h3>
            <p style={{ color: '#888' }}>
              Create stunning images with Replicate models (Recraft, Flux, Ideogram).
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '8px' }}>Image Optimization</h3>
            <p style={{ color: '#888' }}>
              Automatically optimize images to WebP and JPEG with Sharp.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
