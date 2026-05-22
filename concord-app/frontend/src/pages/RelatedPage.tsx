import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchData } from '../api/data';
import {
  initRelated,
  buildGraph,
  relatedFor,
  tierColor,
  type Property,
  type GraphNode,
  type GraphEdge,
} from '../lib/related';

// ---------------------------------------------------------------------------
// Force simulation (no external library)
// ---------------------------------------------------------------------------
type Vec2 = { x: number; y: number };

function runSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  onTick: (positions: Vec2[]) => void,
  onDone: (positions: Vec2[]) => void
) {
  const n = nodes.length;
  const pos: Vec2[] = nodes.map(() => ({
    x: width / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.55,
    y: height / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.55,
  }));
  const vel: Vec2[] = nodes.map(() => ({ x: 0, y: 0 }));

  const idToIdx = new Map(nodes.map((nd, i) => [nd.id, i]));
  const adjMap = new Map<string, { target: number; score: number }[]>();
  for (const e of edges) {
    const si = idToIdx.get(e.source);
    const ti = idToIdx.get(e.target);
    if (si == null || ti == null) continue;
    if (!adjMap.has(e.source)) adjMap.set(e.source, []);
    if (!adjMap.has(e.target)) adjMap.set(e.target, []);
    adjMap.get(e.source)!.push({ target: ti, score: e.score });
    adjMap.get(e.target)!.push({ target: si, score: e.score });
  }

  const REPEL = 4000;
  const SPRING_K = 0.035;
  const REST_LEN = 120;
  const CENTER_G = 0.008;
  const DAMP = 0.82;

  let alpha = 1.0;
  let frame = 0;
  let rafId: number;

  function tick() {
    alpha *= 0.993;
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < n; i++) {
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist2 = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(dist2);
        const str = REPEL / dist2;
        fx += (dx / dist) * str;
        fy += (dy / dist) * str;
      }

      const nbrs = adjMap.get(nodes[i].id) ?? [];
      for (const { target: j, score } of nbrs) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const stretch = dist - REST_LEN * (1 - score * 0.35);
        fx += (dx / dist) * SPRING_K * stretch;
        fy += (dy / dist) * SPRING_K * stretch;
      }

      fx += (cx - pos[i].x) * CENTER_G;
      fy += (cy - pos[i].y) * CENTER_G;

      vel[i].x = (vel[i].x + fx * alpha) * DAMP;
      vel[i].y = (vel[i].y + fy * alpha) * DAMP;
      pos[i].x = Math.max(20, Math.min(width - 20, pos[i].x + vel[i].x));
      pos[i].y = Math.max(20, Math.min(height - 20, pos[i].y + vel[i].y));
    }

    frame++;
    if (frame % 4 === 0) onTick([...pos.map((p) => ({ ...p }))]);

    if (alpha > 0.01 && frame < 700) {
      rafId = requestAnimationFrame(tick);
    } else {
      onDone([...pos.map((p) => ({ ...p }))]);
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ---------------------------------------------------------------------------
// Canvas renderer
// ---------------------------------------------------------------------------
const NODE_R = 6;
const NODE_R_SEL = 11;
const NODE_R_HOV = 9;

function drawGraph(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  edges: GraphEdge[],
  positions: Vec2[],
  idToIdx: Map<string, number>,
  selectedId: string | null,
  hoveredId: string | null
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d3b38';
  ctx.fillRect(0, 0, W, H);

  // Edges
  for (const e of edges) {
    const si = idToIdx.get(e.source);
    const ti = idToIdx.get(e.target);
    if (si == null || ti == null) continue;
    const sp = positions[si];
    const tp = positions[ti];
    if (!sp || !tp) continue;

    const isHi =
      e.source === selectedId || e.target === selectedId ||
      e.source === hoveredId  || e.target === hoveredId;

    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(tp.x, tp.y);
    if (isHi) {
      ctx.strokeStyle = `rgba(201,161,73,${0.25 + e.score * 0.45})`;
      ctx.lineWidth = 1 + e.score * 1.8;
    } else {
      ctx.strokeStyle = `rgba(250,250,245,${0.025 + e.score * 0.055})`;
      ctx.lineWidth = 0.4 + e.score * 0.7;
    }
    ctx.stroke();
  }

  // Draw regular nodes first, special on top
  const special = new Set([selectedId, hoveredId].filter(Boolean));

  const drawNode = (node: GraphNode, i: number) => {
    const p = positions[i];
    if (!p) return;
    const isSel = node.id === selectedId;
    const isHov = node.id === hoveredId;
    const r = isSel ? NODE_R_SEL : isHov ? NODE_R_HOV : NODE_R;
    const color = tierColor(node.tier);

    if (isSel) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201,161,73,0.18)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isSel
      ? '#c9a149'
      : isHov
      ? 'rgba(250,250,245,0.7)'
      : 'rgba(250,250,245,0.15)';
    ctx.lineWidth = isSel ? 2 : 0.8;
    ctx.stroke();

    if (isSel || isHov) {
      const label = node.name.length > 30 ? node.name.slice(0, 28) + '…' : node.name;
      ctx.font = `600 10px "Inter", sans-serif`;
      ctx.fillStyle = isSel ? '#c9a149' : '#fafaf5';
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y + r + 13);
      ctx.font = `10px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(250,250,245,0.45)';
      ctx.fillText(node.region, p.x, p.y + r + 24);
    }
  };

  nodes.forEach((node, i) => { if (!special.has(node.id)) drawNode(node, i); });
  nodes.forEach((node, i) => { if (special.has(node.id)) drawNode(node, i); });
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function RelatedPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef<Vec2[]>([]);
  const [positions, setPositions] = useState<Vec2[]>([]);
  const [simDone, setSimDone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const rafRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  const [size, setSize] = useState({ w: 900, h: 660 });
  useEffect(() => {
    function measure() {
      const el = canvasRef.current?.parentElement;
      if (el) setSize({ w: el.clientWidth, h: Math.min(el.clientWidth * 0.68, 660) });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    fetchData<{ properties: Property[] }>('/data/properties.json')
      .then((d) => {
        initRelated(d.properties);
        setReady(true);
      })
      .catch(() => {});
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!ready) return { nodes: [], edges: [] };
    return buildGraph();
  }, [ready]);

  const idToIdx = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);

  useEffect(() => {
    if (!ready || nodes.length === 0 || size.w < 100) return;
    setSimDone(false);
    posRef.current = [];
    const cleanup = runSimulation(
      nodes, edges, size.w, size.h,
      (pos) => { posRef.current = pos; setPositions([...pos]); },
      (pos) => { posRef.current = pos; setPositions([...pos]); setSimDone(true); }
    );
    return cleanup;
  }, [ready, nodes, edges, size.w, size.h]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || posRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    ctx.scale(dpr, dpr);

    cancelAnimationFrame(rafRef.current);

    function frame() {
      if (!ctx) return;
      const logW = canvas!.width / (window.devicePixelRatio || 1);
      const logH = canvas!.height / (window.devicePixelRatio || 1);

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      ctx.fillStyle = '#0d3b38';
      ctx.fillRect(0, 0, logW, logH);

      ctx.translate(transform.x + logW / 2, transform.y + logH / 2);
      ctx.scale(transform.scale, transform.scale);
      ctx.translate(-logW / 2, -logH / 2);

      drawGraph(ctx, nodes, edges, posRef.current, idToIdx, selectedId, hoveredId);
      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [positions, selectedId, hoveredId, transform, size, nodes, edges, idToIdx]);

  function toCanvas(clientX: number, clientY: number, canvas: HTMLCanvasElement): Vec2 {
    const rect = canvas.getBoundingClientRect();
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    const cx = size.w / 2;
    const cy = size.h / 2;
    return {
      x: (lx - cx - transform.x) / transform.scale + cx,
      y: (ly - cy - transform.y) / transform.scale + cy,
    };
  }

  function nearestNode(cx: number, cy: number): GraphNode | null {
    let best: GraphNode | null = null;
    let bestDist = 22;
    posRef.current.forEach((p, i) => {
      if (!p) return;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < bestDist) { bestDist = d; best = nodes[i]; }
    });
    return best;
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragging.current) {
      const dx = e.clientX - dragging.current.startX;
      const dy = e.clientY - dragging.current.startY;
      setTransform((t) => ({ ...t, x: dragging.current!.tx + dx, y: dragging.current!.ty + dy }));
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toCanvas(e.clientX, e.clientY, canvas);
    const node = nearestNode(x, y);
    setHoveredId(node?.id ?? null);
    canvas.style.cursor = node ? 'pointer' : 'grab';
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    dragging.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y };
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    const moved = dragging.current
      ? Math.hypot(e.clientX - dragging.current.startX, e.clientY - dragging.current.startY) > 4
      : false;
    dragging.current = null;
    if (!moved) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = toCanvas(e.clientX, e.clientY, canvas);
      const node = nearestNode(x, y);
      setSelectedId(node?.id ?? null);
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((t) => ({ ...t, scale: Math.max(0.25, Math.min(5, t.scale * factor)) }));
  }

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null;
  const selectedNeighbors = selectedId ? relatedFor(selectedId) : [];

  const TIER_LABELS: Record<string, string> = {
    luxury: 'Luxury',
    upscale: 'Upscale',
    'upper-upscale': 'Upper-upscale',
    'upper-midscale': 'Upper-midscale',
    midscale: 'Midscale',
  };

  const LEGEND = [
    { tier: 'luxury',         label: 'Luxury (Grand / Resorts)' },
    { tier: 'upscale',        label: 'Upscale (Heritage)' },
    { tier: 'upper-upscale',  label: 'Upper-upscale (Ardmore)' },
    { tier: 'upper-midscale', label: 'Upper-midscale (Select)' },
    { tier: 'midscale',       label: 'Midscale (Express)' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="eyebrow mb-1">Portfolio Network</div>
        <h1 className="font-serif text-4xl tracking-tight">Related Properties Constellation</h1>
        <p className="mt-3 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Every Ardmore property is a node. Edges connect the most similar properties by brand tier,
          market type, region, and ADR band. Stronger edges mean higher similarity. Clusters form
          naturally — luxury resorts in one corner, midscale select in another. Drag to pan, scroll
          to zoom, click any property.
        </p>
        <p className="mt-1 text-[11px] text-[var(--ink-soft)] font-mono uppercase tracking-wider">
          {nodes.length} properties · {edges.length} similarity edges
          {!simDone && nodes.length > 0 ? ' · settling…' : simDone ? ' · settled' : ''}
        </p>
      </header>

      <div className="research-card overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: `${size.h}px` }}>
        {/* Canvas */}
        <div className="flex-1 min-w-0 relative" style={{ background: '#0d3b38', minHeight: `${size.h}px` }}>
          <canvas
            ref={canvasRef}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={() => { setHoveredId(null); dragging.current = null; }}
            onWheel={onWheel}
            style={{ display: 'block', cursor: 'grab', userSelect: 'none' }}
          />
          {!simDone && nodes.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 animate-pulse">
                Building similarity graph…
              </p>
            </div>
          )}
          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            {LEGEND.map(({ tier, label }) => (
              <span key={tier} className="flex items-center gap-1.5">
                <span
                  className="inline-block rounded-full shrink-0"
                  style={{ width: 8, height: 8, background: tierColor(tier) }}
                />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <aside
          className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--hairline)] flex-none overflow-y-auto bg-white"
          style={{ maxHeight: `${size.h}px` }}
        >
          {selectedNode ? (
            <div className="p-5">
              <div className="mb-4">
                <div className="eyebrow mb-1">{selectedNode.region}</div>
                <h2 className="font-serif text-lg leading-tight text-[var(--ink-strong)]">
                  {selectedNode.name}
                </h2>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-soft)] mt-1">
                  {selectedNode.brand}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span
                    className="inline-block text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 border rounded-sm"
                    style={{
                      color: tierColor(selectedNode.tier),
                      borderColor: tierColor(selectedNode.tier) + '55',
                      background: tierColor(selectedNode.tier) + '11',
                    }}
                  >
                    {TIER_LABELS[selectedNode.tier] ?? selectedNode.tier}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/portfolio')}
                className="mb-5 inline-block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--brass-dim)] border border-[var(--brass)]/40 px-3 py-1.5 hover:bg-[var(--brass-bg)] transition rounded-sm"
              >
                View in portfolio
              </button>

              <div className="border-t border-[var(--hairline)] pt-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--ink-soft)] mb-2">
                  Nearest neighbors
                </p>
                <ol className="space-y-1">
                  {selectedNeighbors.map((nb) => (
                    <li key={nb.property.property_id}>
                      <button
                        onClick={() => setSelectedId(nb.property.property_id)}
                        className="w-full text-left px-2 py-1.5 border-l-2 border-[var(--hairline)] hover:border-[var(--brass)] hover:bg-[var(--ivory-deep)] transition rounded-r-sm"
                      >
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-serif text-sm text-[var(--ink-strong)] truncate leading-snug">
                            {nb.property.name}
                          </span>
                          <span className="font-mono text-[9px] text-[var(--brass-dim)] flex-none">
                            {Math.round(nb.score * 100)}%
                          </span>
                        </div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ink-soft)] truncate mt-0.5">
                          {nb.property.region} · {nb.property.brand}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--brass-dim)] truncate mt-0.5">
                          {nb.why}
                        </p>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 border-t border-[var(--hairline)] pt-4">
                <p className="text-[11px] leading-relaxed text-[var(--ink-soft)]">
                  Similarity computed over brand tier, market type, region, ADR band, and inferred
                  amenity tags. Weights:{' '}
                  <span className="text-[var(--brass-dim)]">brand tier 1.6</span>,{' '}
                  market type 1.4, region 0.9, ADR band 0.7, amenities 0.6.
                  Top-8 neighbors per property, edges shown above {Math.round(0.35 * 100)}%.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ink-soft)]">
                Click any node to explore
              </p>
              <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                Each node is an Ardmore property. Edges connect the most similar properties by brand
                tier, market type, region, and rate positioning. Clusters form naturally — Grand and
                Resorts properties attract each other; Express properties form their own constellation.
                Drag to pan, scroll to zoom.
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ink-soft)] mt-1">
                {nodes.length} properties · {edges.length} edges
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
