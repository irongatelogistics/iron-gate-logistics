// Iron Gate Logistics — compiled site script
// All JSX compiled by Babel standalone in the browser.

const { useState, useEffect, useRef, useCallback } = React;

// ── Banner-aware scroll offset ────────────────────────────────────────────────
// Returns the total height of the fixed chrome (announcement banner + nav bar)
// so smooth-scroll targets are never hidden behind either element.
function getScrollOffset() {
  const bannerH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--banner-h') || '0'
  ) || 0;
  return 70 + bannerH; // 70 = nav bar height
}

// Map named image resources
window.__resources = {
  logoMark: "assets/logo-mark.png",
  logoLockup: "assets/logo-lockup.png",
  handshake: "assets/handshake.png",
};

// ═══════════════════ TWEAKS-PANEL ═══════════════════

// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-noncommentable=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

function TweakColor({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <input type="color" className="twk-swatch" value={value}
             onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}



// ═══════════════════ SHARED-LOGO-ICONS ═══════════════════

// =============================================================
// LOGO — uses the user-provided shield/truck mark with wordmark
// =============================================================
function IGLLogo({ variant = "horizontal", color = "navy", className = "" }) {
  const ink = color === "light" ? "#f4f1ec" : "#1a2c4e";
  const accent = color === "light" ? "#3a82d4" : "#2d6cb3";

  const logoMarkSrc = (window.__resources && window.__resources.logoMark) || "assets/logo-mark.png";
  const Mark = (
    <img
      src={logoMarkSrc}
      alt="Iron Gate Logistics"
      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
    />
  );

  if (variant === "mark") {
    return <div className={className} style={{ width: 48, height: 48 }}>{Mark}</div>;
  }

  if (variant === "stacked") {
    return (
      <div className={className} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 80, height: 80 }}>{Mark}</div>
        <div style={{ fontFamily: "var(--display)", color: ink, fontSize: 22, letterSpacing: "0.04em", lineHeight: 1, textAlign: "center" }}>
          IRON GATE
          <div style={{ fontSize: 11, color: accent, letterSpacing: "0.32em", marginTop: 4 }}>LOGISTICS</div>
        </div>
      </div>
    );
  }

  // horizontal default — uses the full lockup logo
  const logoLockupSrc = (window.__resources && window.__resources.logoLockup) || "assets/logo-lockup.png";
  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center" }}>
      <img
        src={logoLockupSrc}
        alt="Iron Gate Logistics"
        style={{ height: 44, width: "auto", display: "block", objectFit: "contain" }}
      />
    </div>
  );
}

// =============================================================
// REVEAL on scroll
// =============================================================
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    el.querySelectorAll(".reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

// =============================================================
// ICONS — small, line-style
// =============================================================
const Icon = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7h11v9H2zM13 10h5l3 3v3h-8z"/>
      <circle cx="6" cy="18" r="2"/>
      <circle cx="17" cy="18" r="2"/>
    </svg>
  ),
  fleet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="8" height="6"/>
      <rect x="11" y="6" width="8" height="6"/>
      <rect x="2" y="13" width="8" height="6"/>
      <rect x="11" y="13" width="8" height="6"/>
    </svg>
  ),
  light: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v3M12 19v3M3 12H0M24 12h-3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12l-8 8-9-9V3h8z"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Left cuff */}
      <path d="M2 11.5l3-3 3.5 3.5"/>
      <path d="M2 11.5l1.5 1.5"/>
      {/* Right cuff */}
      <path d="M22 11.5l-3-3-3.5 3.5"/>
      <path d="M22 11.5l-1.5 1.5"/>
      {/* Left forearm/hand */}
      <path d="M5 8.5l4.2-2.2c.6-.3 1.3-.2 1.8.2l3.5 3"/>
      {/* Right forearm/hand */}
      <path d="M19 8.5l-4.2-2.2c-.6-.3-1.3-.2-1.8.2"/>
      {/* Clasped hands - thumbs and fingers meeting */}
      <path d="M8.5 12c.6-.6 1.4-.9 2.2-.7l1.8.5c.7.2 1.4.7 1.9 1.3l1.6 2c.4.5 1.1.7 1.7.4.7-.3 1-1.1.7-1.8L17 12"/>
      <path d="M11 14.5c.5.4 1.1.6 1.7.5"/>
      <path d="M9.5 16c.5.3 1 .4 1.5.3"/>
      {/* Shake motion lines */}
      <path d="M12 4.5v-1.5M9 4l-.5-1.2M15 4l.5-1.2" opacity="0.5"/>
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14"/>
      <path d="M3 7l9 6 9-6"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 7h18M3 12h18M3 17h18"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
};

function PhotoPlaceholder({ label = "PHOTO", icon = "truck", aspect = "4 / 3", style = {} }) {
  return (
    <div className="photo-placeholder" style={{ aspectRatio: aspect, ...style }}>
      <span className="ph-label">{label}</span>
      <div className="ph-icon" style={{ color: "var(--navy)" }}>{Icon[icon]}</div>
    </div>
  );
}



// ═══════════════════ NAV-HERO-MARQUEE ═══════════════════

// =============================================================
// NAV
// =============================================================
function Nav({ onCTAClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Services", href: "#services" },
    { label: "Rates", href: "#rates" },
    { label: "Why Us", href: "#why" },
    { label: "Location", href: "#location" },
    { label: "Contact", href: "#contact" },
  ];

  const goTo = (href) => (e) => {
    e.preventDefault();
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - getScrollOffset(), behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 'var(--banner-h, 0px)', left: 0, right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(244, 241, 236, 0.92)" : "transparent",
        backdropFilter: scrolled ? "saturate(140%) blur(10px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(140%) blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(26,44,78,0.08)" : "1px solid transparent",
        transition: "background .3s ease, border-color .3s ease",
      }}
    >
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px var(--gutter)",
      }}>
        <a href="#top" onClick={goTo("#top")} aria-label="Iron Gate Logistics — Home">
          <IGLLogo variant="horizontal" />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 28 }} className="desktop-nav">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={goTo(l.href)}
              style={{
                fontFamily: "var(--sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--navy)",
                position: "relative",
              }}
              className="nav-link"
            >
              {l.label}
            </a>
          ))}
          <a href="tel:9712450654" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 12 }}>
            <span style={{ width: 14, height: 14 }}>{Icon.phone}</span>
            (971) 245-0654
          </a>
        </nav>

        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="mobile-menu-btn"
          style={{
            color: "var(--navy)",
            width: 40, height: 40,
            display: "none",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ width: 24, height: 24 }}>{Icon.menu}</span>
        </button>
      </div>

      {mobileOpen && (
        <div style={{
          position: "fixed", inset: 0,
          background: "var(--navy-deep)",
          zIndex: 60,
          color: "var(--bone)",
          display: "flex",
          flexDirection: "column",
          padding: "20px var(--gutter)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <IGLLogo variant="horizontal" color="light" />
            <button onClick={() => setMobileOpen(false)} style={{ color: "var(--bone)", width: 40, height: 40 }}>
              <span style={{ width: 24, height: 24 }}>{Icon.close}</span>
            </button>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 64 }}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={goTo(l.href)}
                style={{
                  fontFamily: "var(--display)",
                  fontSize: 36,
                  letterSpacing: "0.02em",
                  color: "var(--bone)",
                  textTransform: "uppercase",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(244,241,236,0.1)",
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a href="tel:9712450654" className="btn btn-accent" style={{ marginTop: 32, justifyContent: "center" }}>
            <span style={{ width: 16, height: 16 }}>{Icon.phone}</span>
            (971) 245-0654
          </a>
        </div>
      )}

      <style>{`
        .nav-link::after {
          content: "";
          position: absolute;
          left: 0; right: 100%;
          bottom: -4px;
          height: 1.5px;
          background: var(--steel-blue);
          transition: right .25s ease;
        }
        .nav-link:hover::after { right: 0; }
        @media (max-width: 880px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

// =============================================================
// HERO
// =============================================================
function Hero({ variant = "editorial" }) {
  if (variant === "image") {
    return (
      <section id="top" style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-end",
        paddingBottom: 80,
        paddingTop: 'calc(var(--banner-h, 0px) + 80px)',
        overflow: "hidden",
        color: "var(--bone)",
      }}>
        {/* photographic placeholder background */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0f1d36 0%, #1a2c4e 60%, #2d6cb3 130%)" }} />
        <div style={{
          position: "absolute", inset: 0,
          background:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 14px)",
        }} />
        {/* placeholder photo overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
          <PhotoPlaceholder label="HERO PHOTO — TRUCK YARD AT DUSK" icon="truck" aspect="auto" style={{ width: "100%", height: "100%" }} />
        </div>

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <span className="eyebrow reveal" style={{ color: "var(--steel-blue-bright)" }}>Cottage Grove, OR — I-5 Corridor</span>
          <h1 className="h-display reveal" style={{ fontSize: "clamp(56px, 11vw, 168px)", marginTop: 24, color: "var(--bone)" }}>
            SECURE PARKING<br/>
            <span style={{ color: "var(--steel-blue-bright)" }}>FOR THE LONG HAUL.</span>
          </h1>
          <p className="reveal" style={{ marginTop: 28, fontSize: 18, lineHeight: 1.55, maxWidth: 580, color: "rgba(244,241,236,0.85)" }}>
            Fenced, lit, monitored 24/7. Built specifically for semi-trucks and trailers — not a re-purposed lot. Reserve your spot today.
          </p>
          <div className="reveal" style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
            <a href="#rates" className="btn btn-accent btn-arrow">Reserve a Spot</a>
            <a href="#contact" className="btn btn-ghost" style={{ color: "var(--bone)" }}>Talk to us</a>
          </div>
        </div>
      </section>
    );
  }

  // Editorial (default) — split type + visual blocks
  return (
    <section id="top" style={{
      position: "relative",
      paddingTop: 'calc(var(--banner-h, 0px) + 90px)',
      paddingBottom: 80,
      overflow: "hidden",
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "end" }} className="hero-grid">
          <div>
            <span className="eyebrow reveal">Est. Cottage Grove, Oregon</span>
            <h1 className="h-display reveal" style={{
              fontSize: "clamp(56px, 11vw, 156px)",
              marginTop: 24,
              color: "var(--navy-ink)",
            }}>
              SECURE<br/>
              PARKING<br/>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 16 }}>
                FOR
                <span style={{
                  display: "inline-block",
                  width: "clamp(80px, 14vw, 200px)",
                  height: "clamp(40px, 7vw, 90px)",
                  background: "var(--steel-blue)",
                  verticalAlign: "middle",
                  position: "relative",
                  marginLeft: 8,
                }} aria-hidden="true">
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    <span style={{ width: 40, height: 40 }}>{Icon.truck}</span>
                  </span>
                </span>
              </span><br/>
              <span style={{ fontStyle: "italic", fontFamily: "var(--serif)", fontSize: "clamp(48px, 9vw, 128px)", letterSpacing: "-0.02em", textTransform: "none", color: "var(--steel-blue)" }}>
                the long haul.
              </span>
            </h1>
          </div>

          <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <PhotoPlaceholder label="01 — LOT AT GOLDEN HOUR" icon="truck" aspect="4 / 3" />
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--navy-ink)", maxWidth: 460 }}>
              Fenced. Lit. Monitored 24/7. Built specifically for semi-trucks and trailers — wide lanes, easy access, no tight turns. We park rigs for owner-operators and fleets along the I-5 corridor.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#rates" className="btn btn-primary btn-arrow">Reserve a spot</a>
              <a href="#why" className="btn btn-ghost">Why Iron Gate</a>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="reveal" style={{
          marginTop: 80,
          paddingTop: 32,
          borderTop: "1px solid rgba(26,44,78,0.15)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 32,
        }}>
          {[
            { v: "24/7", l: "Monitored" },
            { v: "100%", l: "Fenced & Lit" },
            { v: "I-5", l: "Corridor Access" },
            { v: "FROM\n$120", l: "Per Week" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: "var(--display)",
                fontSize: "clamp(32px, 4vw, 56px)",
                color: "var(--navy)",
                lineHeight: 0.95,
                whiteSpace: "pre-line",
              }}>{s.v}</div>
              <div style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--navy)",
                opacity: 0.6,
                marginTop: 8,
              }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hero-grid + div { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}

// =============================================================
// MARQUEE / Trust strip
// =============================================================
function Marquee() {
  const items = [
    "OWNER-OPERATORS",
    "FLEET CUSTOMERS",
    "DRY VANS",
    "REEFERS",
    "FLATBEDS",
    "BOBTAILS",
    "TRACTOR & TRAILER",
    "LONG-TERM",
    "RESERVED SPACES",
  ];
  const list = [...items, ...items];
  return (
    <div style={{
      background: "var(--navy)",
      color: "var(--bone)",
      padding: "20px 0",
      overflow: "hidden",
      borderTop: "1px solid rgba(244,241,236,0.08)",
      borderBottom: "1px solid rgba(244,241,236,0.08)",
    }}>
      <div style={{
        display: "inline-flex",
        gap: 56,
        whiteSpace: "nowrap",
        animation: "marquee 40s linear infinite",
        paddingLeft: 56,
      }}>
        {list.map((t, i) => (
          <span key={i} style={{
            fontFamily: "var(--display)",
            fontSize: 22,
            letterSpacing: "0.12em",
            display: "inline-flex",
            alignItems: "center",
            gap: 56,
          }}>
            {t}
            <span style={{ width: 6, height: 6, background: "var(--steel-blue-bright)", borderRadius: "50%" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════ SERVICES-RATES-WHY-LOCATION ═══════════════════

// =============================================================
// SERVICES — what we do
// =============================================================
function Services() {
  const items = [
    {
      n: "01",
      title: "Truck & Trailer Parking",
      body: "Monthly secure parking for semi-trucks, tractor & trailer rigs, and bobtails. Wide lanes designed for easy maneuvering.",
      icon: "truck",
    },
    {
      n: "02",
      title: "Fleet Solutions",
      body: "Reserved long-term spaces for fleet operators. Flexible terms, predictable pricing, dedicated points of contact.",
      icon: "fleet",
    },
    {
      n: "03",
      title: "24/7 Security",
      body: "Fully fenced perimeter, lit at night, monitored around the clock. Park with confidence — your equipment is your livelihood.",
      icon: "shield",
    },
    {
      n: "04",
      title: "Owner-Operator Friendly",
      body: "Straightforward monthly rates, no hidden fees. Whether you're hauling one load a week or running hard, you're welcome here.",
      icon: "handshake",
    },
  ];

  return (
    <section id="services" className="section" style={{ background: "var(--bone)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, marginBottom: 64, alignItems: "end" }} className="services-head">
          <div>
            <span className="eyebrow reveal">What we do</span>
            <h2 className="h-display reveal" style={{
              fontSize: "clamp(44px, 6vw, 84px)",
              marginTop: 16,
              color: "var(--navy-ink)",
            }}>
              Built for<br/>big rigs.
            </h2>
          </div>
          <p className="reveal" style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 540, color: "var(--navy-ink)", opacity: 0.8 }}>
            We aren't a re-purposed parking lot. Iron Gate's yard is designed from the ground up for commercial trucks — from the gate width to the turn radius to the lighting plan.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          background: "rgba(26,44,78,0.12)",
          border: "1px solid rgba(26,44,78,0.12)",
        }} className="services-grid">
          {items.map((it, i) => (
            <article key={i} className="reveal service-card" style={{
              background: "var(--bone)",
              padding: "40px 36px",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 28,
              alignItems: "start",
              transition: "background .25s ease, color .25s ease",
              cursor: "default",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em",
                  color: "var(--steel-blue)",
                }}>{it.n}</span>
                <span style={{ width: 36, height: 36, color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {it.icon === "handshake" ? (
                    <img
                      src={(window.__resources && window.__resources.handshake) || "assets/handshake.png"}
                      alt=""
                      style={{ width: 44, height: 44, objectFit: "contain", display: "block" }}
                    />
                  ) : Icon[it.icon]}
                </span>
              </div>
              <div>
                <h3 className="h-serif" style={{ fontSize: 28, color: "var(--navy-ink)" }}>{it.title}</h3>
                <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, color: "var(--navy-ink)", opacity: 0.78 }}>{it.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .service-card:hover { background: white; }
        @media (max-width: 880px) {
          .services-head { grid-template-columns: 1fr !important; gap: 24px !important; }
          .services-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// =============================================================
// RATES — pricing tiers
// =============================================================
function Rates() {
  const tiers = [
    {
      tag: "Tier 01 — Weekly",
      name: "Weekly Rates",
      price: "120",
      period: "/week",
      blurb: "Need short-term parking? Weekly rate covers tractors, trailers, and full rigs — same security as monthly.",
      perks: ["Short-term flexibility", "24/7 yard access", "Fenced & lit", "Same security as monthly"],
      cta: "Reserve weekly",
      featured: false,
    },
    {
      tag: "Tier 02 — Most popular",
      name: "Tractor & Trailer",
      price: "250",
      period: "/mo",
      blurb: "Full rigs with trailer. Wide pull-through space sized for tractor & trailer combos.",
      perks: ["Pull-through space", "24/7 yard access", "Fenced & lit", "Month-to-month", "Priority support"],
      cta: "Reserve",
      featured: true,
    },
    {
      tag: "Tier 03",
      name: "Trailer Only",
      price: "175",
      period: "/mo",
      blurb: "Drop trailer storage without the tractor. Weekly rate also available at $85/week.",
      perks: ["Drop & go convenience", "24/7 yard access", "Fenced & lit", "Month-to-month", "$85 / week option"],
      cta: "Reserve",
      featured: false,
    },
    {
      tag: "Tier 04",
      name: "Fleet Parking",
      price: "Let's talk",
      period: "",
      blurb: "Multiple rigs, dedicated lanes. Custom pricing tailored to your fleet's footprint.",
      perks: ["Volume pricing", "Dedicated point of contact", "Custom terms", "Reserved blocks"],
      cta: "Get a quote",
      featured: false,
    },
  ];

  return (
    <section id="rates" className="section" style={{ background: "var(--navy-ink)", color: "var(--bone)" }}>
      <div className="container">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 56 }}>
          <div>
            <span className="eyebrow reveal" style={{ color: "var(--steel-blue-bright)" }}>Explore our rates</span>
            <h2 className="h-display reveal" style={{
              fontSize: "clamp(44px, 6vw, 96px)",
              marginTop: 16,
              color: "var(--bone)",
            }}>
              Simple,<br/>straightforward<br/>pricing.
            </h2>
          </div>
          <p className="reveal" style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 360, opacity: 0.75 }}>
            No hidden fees. No surprises. Reserve month-to-month or lock in long-term — your call.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
        }} className="rates-grid">
          {tiers.map((t, i) => (
            <div
              key={i}
              className="reveal rate-card"
              style={{
                background: t.featured ? "var(--bone)" : "rgba(244,241,236,0.04)",
                color: t.featured ? "var(--navy-ink)" : "var(--bone)",
                border: t.featured ? "1px solid var(--bone)" : "1px solid rgba(244,241,236,0.12)",
                padding: "32px 28px 28px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform .3s ease, background .3s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: t.featured ? "var(--steel-blue)" : "var(--steel-blue-bright)",
                }}>{t.tag}</span>
                <span style={{ width: 28, height: 28, color: t.featured ? "var(--navy)" : "var(--bone)", opacity: 0.85 }}>
                  {Icon[i === 0 ? "truck" : i === 1 ? "tag" : i === 2 ? "truck" : "fleet"]}
                </span>
              </div>

              <h3 className="h-serif" style={{ fontSize: 32, marginTop: 20, color: t.featured ? "var(--navy-ink)" : "var(--bone)" }}>
                {t.name}
              </h3>

              <div style={{ marginTop: 24, display: "flex", alignItems: "baseline", gap: 4 }}>
                {t.price !== "Let's talk" && t.price !== "Ask" && (
                  <span style={{ fontFamily: "var(--display)", fontSize: 24, lineHeight: 1, color: t.featured ? "var(--navy)" : "var(--bone)" }}>$</span>
                )}
                <span style={{
                  fontFamily: "var(--display)",
                  fontSize: (t.price === "Let's talk" || t.price === "Ask") ? "44px" : "72px",
                  lineHeight: 1,
                  color: t.featured ? "var(--navy-ink)" : "var(--bone)",
                  letterSpacing: "-0.01em",
                }}>{t.price}</span>
                {t.period && (
                  <span style={{ fontFamily: "var(--sans)", fontSize: 14, opacity: 0.65, marginLeft: 4 }}>{t.period}</span>
                )}
              </div>

              <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.55, opacity: 0.78 }}>{t.blurb}</p>

              <ul style={{
                listStyle: "none",
                margin: "24px 0 32px",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderTop: t.featured ? "1px solid rgba(26,44,78,0.12)" : "1px solid rgba(244,241,236,0.1)",
                paddingTop: 20,
              }}>
                {t.perks.map((p, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                    <span style={{
                      width: 16, height: 16,
                      color: t.featured ? "var(--steel-blue)" : "var(--steel-blue-bright)",
                      flexShrink: 0,
                    }}>{Icon.check}</span>
                    {p}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("contact");
                  if (el) window.scrollTo({ top: el.offsetTop - getScrollOffset(), behavior: "smooth" });
                }}
                className="btn btn-arrow"
                style={{
                  marginTop: "auto",
                  background: t.featured ? "var(--navy)" : "var(--bone)",
                  color: t.featured ? "var(--bone)" : "var(--navy-ink)",
                  justifyContent: "center",
                }}
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5, marginTop: 32, textAlign: "center" }}>
          All rates exclude applicable taxes · Spaces subject to availability · Month-to-month unless noted
        </p>

        {/* RV & BOAT PARKING — secondary offering */}
        <div className="reveal" style={{
          marginTop: 80,
          padding: "clamp(32px, 5vw, 56px)",
          background: "rgba(244,241,236,0.04)",
          border: "1px solid rgba(244,241,236,0.12)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 40,
          alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: 16, color: "var(--steel-blue-bright)" }}>
            <span style={{ width: 44, height: 44 }} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="9" width="15" height="8" rx="1"/>
                <path d="M17 11h3l1 3v3h-4z"/>
                <circle cx="6" cy="18" r="1.5"/>
                <circle cx="18" cy="18" r="1.5"/>
                <path d="M5 9V7h6v2"/>
              </svg>
            </span>
            <span style={{ width: 44, height: 44 }} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 16h18l-2 4H5z"/>
                <path d="M5 16V9l7-4 7 4v7"/>
                <path d="M12 5v11"/>
              </svg>
            </span>
          </div>
          <div className="rv-text">
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--steel-blue-bright)" }}>
              Also available
            </span>
            <h3 className="h-serif" style={{ fontSize: "clamp(28px, 3vw, 40px)", marginTop: 8, color: "var(--bone)" }}>
              RV &amp; Boat Parking
            </h3>
            <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.6, opacity: 0.78, maxWidth: 560 }}>
              Got a fifth-wheel, motorhome, travel trailer, or boat that needs a safe home? We have space for that too — same secure, fenced, and lit yard. Contact us for current rates and availability.
            </p>
          </div>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("contact");
              if (el) window.scrollTo({ top: el.offsetTop - getScrollOffset(), behavior: "smooth" });
            }}
            className="btn btn-accent btn-arrow rv-cta"
          >
            Contact for rates
          </a>
        </div>
        <style>{`
          @media (max-width: 880px) {
            #rates > .container > .reveal:last-of-type {
              grid-template-columns: 1fr !important;
              text-align: left;
            }
            #rates > .container > .reveal:last-of-type .rv-cta {
              justify-self: start;
            }
          }
        `}</style>
      </div>

      <style>{`
        .rate-card:hover { transform: translateY(-4px); }
        @media (max-width: 1100px) {
          .rates-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .rates-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// =============================================================
// WHY US
// =============================================================
function WhyUs() {
  const reasons = [
    { t: "Security you can trust", b: "Yards are fully fenced, well-lit, and monitored 24/7. Park with confidence." },
    { t: "Built for big rigs", b: "Wide lanes, easy access, ample maneuver space. No tight turns or crowded conditions." },
    { t: "Straightforward pricing", b: "No hidden fees. Simple, competitive monthly rates for owner-operators and fleets." },
    { t: "Fleet-friendly solutions", b: "Whether one truck or an entire fleet — flexible options including long-term and reserved spaces." },
    { t: "Reliable, professional service", b: "Responsive communication, well-maintained property, dependable partner every time." },
  ];
  return (
    <section id="why" className="section" style={{ background: "var(--bone-soft)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 80, alignItems: "start" }} className="why-grid">
          <div style={{ position: "sticky", top: 100 }}>
            <span className="eyebrow reveal">Why Iron Gate</span>
            <h2 className="h-display reveal" style={{
              fontSize: "clamp(48px, 7vw, 108px)",
              marginTop: 16,
              color: "var(--navy-ink)",
            }}>
              Reliable.<br/>
              <span style={{ color: "var(--steel-blue)" }}>Secure.</span><br/>
              Built<br/>
              for the<br/>
              <span style={{ fontStyle: "italic", fontFamily: "var(--serif)", textTransform: "none", letterSpacing: "-0.02em" }}>long haul.</span>
            </h2>

            <div className="reveal" style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <PhotoPlaceholder label="AERIAL — YARD" icon="fleet" aspect="1 / 1" />
              <PhotoPlaceholder label="ON THE ROAD" icon="truck" aspect="1 / 1" />
            </div>
          </div>

          <div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
              {reasons.map((r, i) => (
                <li key={i} className="reveal reason-row" style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr",
                  gap: 24,
                  padding: "32px 0",
                  borderBottom: "1px solid rgba(26,44,78,0.15)",
                  alignItems: "start",
                }}>
                  <span style={{
                    fontFamily: "var(--display)",
                    fontSize: 36,
                    color: "var(--steel-blue)",
                    lineHeight: 1,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="h-serif" style={{ fontSize: 26, color: "var(--navy-ink)" }}>{r.t}</h3>
                    <p style={{ marginTop: 8, fontSize: 16, lineHeight: 1.55, color: "var(--navy-ink)", opacity: 0.75 }}>{r.b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .why-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .why-grid > div:first-child { position: static !important; }
        }
      `}</style>
    </section>
  );
}

// =============================================================
// LOCATION
// =============================================================
function Location() {
  return (
    <section id="location" className="section" style={{ background: "var(--bone)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="location-grid">
          <div>
            <span className="eyebrow reveal">Strategic location</span>
            <h2 className="h-display reveal" style={{ fontSize: "clamp(40px, 5vw, 76px)", marginTop: 16, color: "var(--navy-ink)" }}>
              On the I-5<br/>corridor.
            </h2>
            <p className="reveal" style={{ marginTop: 24, fontSize: 17, lineHeight: 1.6, color: "var(--navy-ink)", opacity: 0.8, maxWidth: 460 }}>
              Iron Gate sits in Cottage Grove, Oregon — minutes off Interstate 5 between Eugene and the California border. A natural overnight stop on the West Coast freight corridor.
            </p>

            <dl className="reveal" style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              padding: "24px 0",
              borderTop: "1px solid rgba(26,44,78,0.15)",
              borderBottom: "1px solid rgba(26,44,78,0.15)",
            }}>
              <div>
                <dt style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>Address</dt>
                <dd style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.4 }}>
                  80614 Sears Rd<br/>
                  Cottage Grove, OR 97424
                </dd>
              </div>
              <div>
                <dt style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>Hours</dt>
                <dd style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.4 }}>
                  24 / 7<br/>
                  Yard access for tenants
                </dd>
              </div>
              <div>
                <dt style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>Nearest Exit</dt>
                <dd style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.4 }}>
                  I-5 Cottage Grove<br/>
                  Exit 174
                </dd>
              </div>
              <div>
                <dt style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>Phone</dt>
                <dd style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.4 }}>
                  <a href="tel:9712450654" style={{ borderBottom: "1px solid currentColor" }}>(971) 245-0654</a>
                </dd>
              </div>
            </dl>

            <div className="reveal" style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                className="btn btn-primary btn-arrow"
                href="https://maps.google.com/?q=80614+Sears+Rd+Cottage+Grove+OR+97424"
                target="_blank" rel="noopener noreferrer"
              >
                Get directions
              </a>
            </div>
          </div>

          {/* Stylized map */}
          <div className="reveal">
            <StylizedMap />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .location-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}

function StylizedMap() {
  return (
    <div style={{
      position: "relative",
      aspectRatio: "5 / 4",
      background: "var(--navy-ink)",
      overflow: "hidden",
      border: "1px solid rgba(26,44,78,0.2)",
    }}>
      <svg viewBox="0 0 500 400" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden="true">
        <defs>
          <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(184,194,204,0.06)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="500" height="400" fill="url(#mapgrid)"/>

        {/* terrain shapes */}
        <path d="M 0 200 C 80 180 160 230 240 210 S 400 200 500 220 L 500 400 L 0 400 Z" fill="#0a1426" opacity="0.6"/>
        <path d="M 0 280 C 100 260 200 290 280 280 S 420 270 500 290 L 500 400 L 0 400 Z" fill="#0a1426" opacity="0.4"/>

        {/* I-5 highway */}
        <path d="M 250 0 C 240 80 270 160 250 240 S 230 360 245 400" fill="none" stroke="#2d6cb3" strokeWidth="6" strokeLinecap="round" opacity="0.85"/>
        <path d="M 250 0 C 240 80 270 160 250 240 S 230 360 245 400" fill="none" stroke="#3a82d4" strokeWidth="2" strokeDasharray="6 12" strokeLinecap="round"/>

        {/* Side roads */}
        <path d="M 0 180 Q 120 195 245 200" fill="none" stroke="rgba(184,194,204,0.4)" strokeWidth="1.5"/>
        <path d="M 245 280 Q 360 290 500 285" fill="none" stroke="rgba(184,194,204,0.4)" strokeWidth="1.5"/>
        <path d="M 100 0 Q 130 100 245 130" fill="none" stroke="rgba(184,194,204,0.25)" strokeWidth="1.5"/>

        {/* I-5 shield label */}
        <g transform="translate(280 70)">
          <path d="M -16 -2 L 16 -2 L 16 12 C 16 22 0 28 0 28 C 0 28 -16 22 -16 12 Z" fill="#3a82d4" stroke="#f4f1ec" strokeWidth="1"/>
          <text x="0" y="14" textAnchor="middle" fill="#f4f1ec" fontFamily="var(--display)" fontSize="14">I-5</text>
        </g>

        {/* Towns */}
        <g fontFamily="var(--mono)" fontSize="9" letterSpacing="2" fill="#b8c2cc" opacity="0.6">
          <circle cx="245" cy="80" r="3" fill="#b8c2cc"/>
          <text x="255" y="84">EUGENE</text>
          <circle cx="245" cy="370" r="3" fill="#b8c2cc"/>
          <text x="255" y="374">ROSEBURG</text>
        </g>

        {/* Pin — Iron Gate */}
        <g transform="translate(245 220)">
          <circle r="40" fill="#2d6cb3" opacity="0.18">
            <animate attributeName="r" from="20" to="50" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle r="14" fill="#2d6cb3"/>
          <circle r="14" fill="none" stroke="#f4f1ec" strokeWidth="2"/>
          <circle r="4" fill="#f4f1ec"/>
          <text x="22" y="-6" fill="#f4f1ec" fontFamily="var(--display)" fontSize="16" letterSpacing="0.5">IRON GATE</text>
          <text x="22" y="10" fill="#3a82d4" fontFamily="var(--mono)" fontSize="10" letterSpacing="2">COTTAGE GROVE, OR</text>
          <text x="22" y="24" fill="#b8c2cc" fontFamily="var(--mono)" fontSize="9" letterSpacing="1.5" opacity="0.7">EXIT 174 — I-5</text>
        </g>
      </svg>

      <div style={{
        position: "absolute",
        top: 16, left: 16,
        fontFamily: "var(--mono)",
        fontSize: 10,
        color: "var(--bone)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        opacity: 0.7,
      }}>
        N ↑ — Pacific Northwest
      </div>
    </div>
  );
}




// ═══════════════════ CONTACT-FOOTER ═══════════════════

const EMAIL = "freightstorage@irongatelogi.com";

// ── Shared helpers ────────────────────────────────────────────
function Field({ label, req, error, children }) {
  return (
    <div className={`field${error ? " error" : ""}`}>
      <label>{label}{req && <span className="req"> *</span>}</label>
      {children}
      {error && <span className="err-msg">{error}</span>}
    </div>
  );
}

function RadioGroup({ label, name, options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: 6 }}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => (
          <label key={opt} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              style={{ accentColor: "var(--steel-blue)", width: 16, height: 16 }}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function SuccessScreen({ name, onReset, type }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ width: 56, height: 56, margin: "0 auto", color: "var(--steel-blue)" }}>{Icon.check}</div>
      <h3 className="h-serif" style={{ fontSize: 30, marginTop: 20, color: "var(--navy-ink)" }}>
        {type === "reserve" ? `Request received, ${name}!` : `Thanks, ${name}.`}
      </h3>
      <p style={{ marginTop: 10, fontSize: 16, opacity: 0.75, color: "var(--navy-ink)", lineHeight: 1.55 }}>
        {type === "reserve"
          ? "Your reservation request has been sent. We'll review it and follow up within one business day to confirm your spot and walk you through next steps."
          : "Your inquiry has been sent. We'll be in touch within one business day."}
      </p>
      {type === "reserve" && (
        <p style={{ marginTop: 12, fontSize: 13, opacity: 0.6, color: "var(--navy-ink)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>
          Your documents have been submitted. We'll be in touch to confirm your spot.
        </p>
      )}
      <button onClick={onReset} className="btn btn-ghost" style={{ marginTop: 28 }}>
        Submit another
      </button>
    </div>
  );
}

// ── INQUIRY FORM ─────────────────────────────────────────────
function InquiryForm() {
  const blank = { firstName: "", lastName: "", email: "", phone: "", serviceType: "Tractor & Trailer — $250/mo", message: "", wasReferred: "", referredBy: "" };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const upd = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.message.trim()) e.message = "Please tell us a bit more";
    return e;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const referralLine = form.wasReferred === "Yes" && form.referredBy.trim()
      ? form.referredBy.trim()
      : (form.wasReferred === "Yes" ? "Yes (name not provided)" : "None");

    const body = [
      `NAME: ${form.firstName} ${form.lastName}`,
      `EMAIL: ${form.email}`,
      `PHONE: ${form.phone || "—"}`,
      `SERVICE: ${form.serviceType}`,
      `REFERRED BY: ${referralLine}`,
      ``,
      `MESSAGE:`,
      form.message,
    ].join("\n");

    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Iron Gate Logistics — Inquiry from " + form.firstName + " " + form.lastName)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  if (submitted) return <SuccessScreen name={form.firstName} onReset={() => { setSubmitted(false); setForm(blank); }} type="inquiry" />;

  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="First name" req error={errors.firstName}>
          <input value={form.firstName} onChange={upd("firstName")} placeholder="Jane" />
        </Field>
        <Field label="Last name" req error={errors.lastName}>
          <input value={form.lastName} onChange={upd("lastName")} placeholder="Smith" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Email" req error={errors.email}>
          <input type="email" value={form.email} onChange={upd("email")} placeholder="you@company.com" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input type="tel" value={form.phone} onChange={upd("phone")} placeholder="(555) 000-0000" />
        </Field>
      </div>
      <Field label="Service type">
        <select value={form.serviceType} onChange={upd("serviceType")}>
          <option>Weekly rate — $120/week</option>
          <option>Tractor &amp; Trailer — $250/mo</option>
          <option>Fleet parking (multiple rigs)</option>
          <option>RV / Boat parking</option>
          <option>Just have a question</option>
        </select>
      </Field>
      <Field label="Message" req error={errors.message}>
        <textarea
          value={form.message}
          onChange={upd("message")}
          placeholder="How many rigs? When do you need parking? Any specific requirements?"
          style={{ minHeight: 110 }}
        />
      </Field>

      {/* Referral */}
      <div style={{ padding: "16px", border: "1px solid rgba(26,44,78,0.12)", background: "var(--bone-soft)" }}>
        <RadioGroup
          label="Were you referred by a current Iron Gate Logistics customer?"
          name="wasReferred-inquiry"
          options={["Yes", "No"]}
          value={form.wasReferred}
          onChange={(v) => { setForm(f => ({ ...f, wasReferred: v, referredBy: v === "No" ? "" : f.referredBy })); }}
        />
        {form.wasReferred === "Yes" && (
          <div style={{ marginTop: 14 }}>
            <input
              value={form.referredBy}
              onChange={upd("referredBy")}
              placeholder="Enter the name of the customer who referred you"
            />
          </div>
        )}
      </div>

      <div>
        <button type="submit" className="btn btn-primary btn-arrow" style={{ width: "100%", justifyContent: "center" }}>
          Send Inquiry
        </button>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5, marginTop: 12, textAlign: "center" }}>
          Opens your email client · We respond within one business day
        </p>
      </div>
    </form>
  );
}

// ── RESERVATION FORM ──────────────────────────────────────────
function ReservationForm() {
  const blank = {
    driverName: "", usdot: "", phone: "", email: "",
    vehicleType: "Full Combo", vehicleInfo: "", rigLength: "",
    startDate: "", schedule: "Daily In/Out", hazmat: "No",
    wasReferred: "", referredBy: "",
    acknowledged: false,
  };
  const blankUploads = {
    rig:      { status: "idle", progress: 0 },
    insurance:{ status: "idle", progress: 0 },
    cdl:      { status: "idle", progress: 0 },
  };

  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploads, setUploads] = useState(blankUploads);

  const DOC_CONFIG = [
    { key: "rig",       label: "Photo of Rig",           accept: "image/jpeg,image/png,application/pdf", maxMB: 10, docType: "rig_photo" },
    { key: "insurance", label: "Proof of Insurance",      accept: "image/jpeg,image/png,application/pdf", maxMB: 10, docType: "insurance" },
    { key: "cdl",       label: "CDL / Driver's License",  accept: "image/jpeg,image/png,application/pdf", maxMB: 5,  docType: "cdl" },
  ];

  const handleUpload = (docKey, docType, maxMB, file) => {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setUploads(u => ({ ...u, [docKey]: { status: "error", progress: 0, error: "Only JPG, PNG, or PDF files accepted." } }));
      return;
    }
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploads(u => ({ ...u, [docKey]: { status: "error", progress: 0, error: `File too large — max ${maxMB} MB.` } }));
      return;
    }

    setUploads(u => ({ ...u, [docKey]: { status: "uploading", progress: 0 } }));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    fd.append("driverName", form.driverName || "Applicant");

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploads(u => ({ ...u, [docKey]: { status: "uploading", progress: pct } }));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.ok) {
          setUploads(u => ({ ...u, [docKey]: { status: "done", progress: 100, fileName: data.fileName } }));
        } else {
          setUploads(u => ({ ...u, [docKey]: { status: "error", progress: 0, error: data.error } }));
        }
      } catch {
        setUploads(u => ({ ...u, [docKey]: { status: "error", progress: 0, error: "Unexpected server response." } }));
      }
    };

    xhr.onerror = () => {
      setUploads(u => ({ ...u, [docKey]: { status: "error", progress: 0, error: "Network error — please try again." } }));
    };

    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  };

  const upd = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const updRadio = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.driverName.trim()) e.driverName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.vehicleInfo.trim()) e.vehicleInfo = "Required";
    if (!form.startDate) e.startDate = "Required";
    if (!form.acknowledged) e.acknowledged = "Please acknowledge to continue";
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setSubmitError(null);

    const docLabel = (key) => uploads[key].status === "done" ? "✓ Uploaded" : "Not uploaded";

    try {
      const resp = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverName:    form.driverName,
          usdot:         form.usdot,
          phone:         form.phone,
          email:         form.email,
          vehicleType:   form.vehicleType,
          vehicleInfo:   form.vehicleInfo,
          rigLength:     form.rigLength,
          startDate:     form.startDate,
          schedule:      form.schedule,
          hazmat:        form.hazmat,
          docRig:        docLabel("rig"),
          docInsurance:  docLabel("insurance"),
          docCdl:        docLabel("cdl"),
          referredBy:    form.wasReferred === "Yes" && form.referredBy.trim()
                           ? form.referredBy.trim()
                           : (form.wasReferred === "Yes" ? "Yes (name not provided)" : "None"),
        }),
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Submission failed — please try again.");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const firstName = form.driverName.split(" ")[0];
    return <SuccessScreen name={firstName} onReset={() => { setSubmitted(false); setForm(blank); setUploads(blankUploads); setSubmitError(null); }} type="reserve" />;
  }

  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <Field label="Driver Name / Company Name" req error={errors.driverName}>
        <input value={form.driverName} onChange={upd("driverName")} placeholder="Jane Smith / Smith Trucking LLC" />
      </Field>

      <Field label="USDOT Number & MC Number" error={errors.usdot}>
        <input value={form.usdot} onChange={upd("usdot")} placeholder="USDOT 1234567 / MC-123456" />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Phone Number" req error={errors.phone}>
          <input type="tel" value={form.phone} onChange={upd("phone")} placeholder="(555) 000-0000" />
        </Field>
        <Field label="Email Address" req error={errors.email}>
          <input type="email" value={form.email} onChange={upd("email")} placeholder="you@company.com" />
        </Field>
      </div>

      <div style={{ padding: "16px", border: "1px solid rgba(26,44,78,0.12)", background: "var(--bone-soft)" }}>
        <RadioGroup
          label="What are you parking? *"
          name="vehicleType"
          options={["Full Combo", "Bobtail", "Box Truck", "Drop Trailer", "Other"]}
          value={form.vehicleType}
          onChange={(v) => updRadio("vehicleType", v)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Vehicle Year, Make, Model & Plate" req error={errors.vehicleInfo}>
          <input value={form.vehicleInfo} onChange={upd("vehicleInfo")} placeholder="2022 Kenworth T680 · ABC-1234" />
        </Field>
        <Field label="Length of Rig" error={errors.rigLength}>
          <input value={form.rigLength} onChange={upd("rigLength")} placeholder='e.g. 70 ft' />
        </Field>
      </div>

      <Field label="Requested Start Date" req error={errors.startDate}>
        <input type="date" value={form.startDate} onChange={upd("startDate")} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: "16px", border: "1px solid rgba(26,44,78,0.12)", background: "var(--bone-soft)" }}>
          <RadioGroup
            label="Typical Schedule"
            name="schedule"
            options={["Daily In/Out", "Storage", "Weekends only"]}
            value={form.schedule}
            onChange={(v) => updRadio("schedule", v)}
          />
        </div>
        <div style={{ padding: "16px", border: "1px solid rgba(26,44,78,0.12)", background: "var(--bone-soft)" }}>
          <RadioGroup
            label="Do you haul HazMat?"
            name="hazmat"
            options={["Yes", "No"]}
            value={form.hazmat}
            onChange={(v) => updRadio("hazmat", v)}
          />
        </div>
      </div>

      {/* Referral */}
      <div style={{ padding: "16px", border: "1px solid rgba(26,44,78,0.12)", background: "var(--bone-soft)" }}>
        <RadioGroup
          label="Were you referred by a current Iron Gate Logistics customer?"
          name="wasReferred-reserve"
          options={["Yes", "No"]}
          value={form.wasReferred}
          onChange={(v) => { updRadio("wasReferred", v); if (v === "No") setForm(f => ({ ...f, referredBy: "" })); }}
        />
        {form.wasReferred === "Yes" && (
          <div style={{ marginTop: 14 }}>
            <input
              value={form.referredBy}
              onChange={upd("referredBy")}
              placeholder="Enter the name of the customer who referred you"
            />
          </div>
        )}
      </div>

      {/* Document uploads — Cloudinary */}
      <div style={{
        border: "1px solid rgba(45,108,179,0.2)",
        borderLeft: "3px solid var(--steel-blue)",
        background: "rgba(45,108,179,0.04)",
      }}>
        {/* Header */}
        <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(45,108,179,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--steel-blue)", fontWeight: 600 }}>
            Documents required
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--navy-ink)", opacity: 0.45 }}>
            JPG · PNG · PDF &nbsp;|&nbsp; Stored securely
          </span>
        </div>

        {DOC_CONFIG.map(({ key, label, accept, maxMB, docType }, idx) => {
          const u = uploads[key];
          const isDone      = u.status === "done";
          const isUploading = u.status === "uploading";
          const isError     = u.status === "error";

          return (
            <div key={key} style={{
              padding: "14px 16px",
              borderBottom: idx < DOC_CONFIG.length - 1 ? "1px solid rgba(26,44,78,0.07)" : "none",
              background: isDone ? "rgba(34,197,94,0.04)" : "transparent",
              transition: "background .4s ease",
            }}>
              {/* Row: icon + label + button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {/* Left */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{
                    width: 18, height: 18, flexShrink: 0,
                    color: isDone ? "#16a34a" : isError ? "var(--rust)" : "rgba(26,44,78,0.2)",
                    transition: "color .3s",
                  }}>
                    {isError
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      : Icon.check
                    }
                  </span>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--navy-ink)", fontWeight: isDone ? 600 : 400 }}>{label}</div>
                    <div style={{ fontSize: 11, fontFamily: "var(--mono)", letterSpacing: "0.05em", marginTop: 1,
                      color: isDone ? "#16a34a" : isError ? "var(--rust)" : "rgba(26,44,78,0.4)" }}>
                      {isDone    ? "Uploaded successfully"
                       : isError ? (u.error || "Upload failed")
                       : `Max ${maxMB} MB`}
                    </div>
                  </div>
                </div>

                {/* Right: button (hidden while uploading) */}
                {!isUploading && (
                  <>
                    <input
                      type="file"
                      id={`upload-${key}`}
                      accept={accept}
                      style={{ display: "none" }}
                      onChange={e => { handleUpload(key, docType, maxMB, e.target.files[0]); e.target.value = ""; }}
                    />
                    <label htmlFor={`upload-${key}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
                      padding: "8px 14px",
                      fontFamily: "var(--sans)", fontWeight: 600, fontSize: 12,
                      letterSpacing: "0.05em", textTransform: "uppercase",
                      border: "1px solid",
                      borderColor: isDone ? "#16a34a" : isError ? "var(--rust)" : "rgba(26,44,78,0.25)",
                      color: isDone ? "#16a34a" : isError ? "var(--rust)" : "var(--navy)",
                      background: "transparent", borderRadius: 2, cursor: "pointer",
                      transition: "border-color .2s, color .2s",
                    }}>
                      {isDone ? (
                        "Replace"
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          {isError ? "Retry" : "Upload"}
                        </>
                      )}
                    </label>
                  </>
                )}
              </div>

              {/* Progress bar (shown while uploading) */}
              {isUploading && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--steel-blue)" }}>Uploading</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--steel-blue)" }}>{u.progress}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(45,108,179,0.15)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${u.progress}%`,
                      background: "var(--steel-blue)",
                      borderRadius: 2,
                      transition: "width .1s linear",
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acknowledgement */}
      <div className={errors.acknowledged ? "error" : ""}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", fontSize: 15, lineHeight: 1.45 }}>
          <input
            type="checkbox"
            checked={form.acknowledged}
            onChange={upd("acknowledged")}
            style={{ marginTop: 2, accentColor: "var(--steel-blue)", width: 16, height: 16, flexShrink: 0 }}
          />
          <span>I understand this is a reservation request and not a binding lease. <span className="req">*</span></span>
        </label>
        {errors.acknowledged && <span className="err-msg" style={{ display: "block", marginTop: 4 }}>{errors.acknowledged}</span>}
      </div>

      {submitError && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(185,28,28,0.06)",
          border: "1px solid rgba(185,28,28,0.25)",
          borderLeft: "3px solid #b91c1c",
          fontSize: 14,
          color: "#b91c1c",
          lineHeight: 1.5,
        }}>
          <strong>Submission failed:</strong> {submitError}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-accent btn-arrow"
          style={{ width: "100%", justifyContent: "center", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Sending…" : "Submit Reservation Request"}
        </button>
        <p style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5, marginTop: 12, textAlign: "center" }}>
          We confirm within one business day
        </p>
      </div>
    </form>
  );
}

// ── MAIN CONTACT SECTION ──────────────────────────────────────
function Contact() {
  const [tab, setTab] = useState("reserve"); // "inquiry" | "reserve"

  return (
    <section id="contact" className="section" style={{ background: "var(--bone-soft)" }}>
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span className="eyebrow reveal">Get in touch</span>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginTop: 12 }}>
            <h2 className="h-display reveal" style={{ fontSize: "clamp(44px, 6vw, 96px)", color: "var(--navy-ink)", margin: 0 }}>
              Let's get<br/>you parked.
            </h2>
            {/* Tab switcher */}
            <div className="reveal" style={{
              display: "inline-flex",
              border: "1px solid rgba(26,44,78,0.18)",
              background: "var(--paper)",
              overflow: "hidden",
            }}>
              {[
                { key: "inquiry", label: "Send an Inquiry" },
                { key: "reserve", label: "Reserve a Spot" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    padding: "12px 24px",
                    fontFamily: "var(--sans)",
                    fontWeight: 600,
                    fontSize: 13,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    background: tab === key ? "var(--navy)" : "transparent",
                    color: tab === key ? "var(--bone)" : "var(--navy)",
                    transition: "background .2s ease, color .2s ease",
                    borderRight: key === "reserve" ? "1px solid rgba(26,44,78,0.18)" : "none",
                    cursor: "pointer",
                    border: tab === key ? "none" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 64, alignItems: "start" }} className="contact-grid">

          {/* Left — info */}
          <div>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--navy-ink)", opacity: 0.78, maxWidth: 420 }}>
              {tab === "inquiry"
                ? "Have a question or want to learn more? Send us a message and we'll be in touch within one business day."
                : "Ready to secure your spot? Fill out the form with your rig info and requested start date — we'll confirm availability and next steps within one business day."}
            </p>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Email — preferred, shown first and highlighted */}
              <a href={`mailto:${EMAIL}`} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "20px",
                background: "var(--navy)",
                color: "var(--bone)",
                marginBottom: 2,
                transition: "background .2s ease",
              }} className="email-preferred-link">
                <span style={{ width: 22, height: 22, color: "var(--steel-blue-bright)", flexShrink: 0 }}>{Icon.mail}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>Email</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", background: "var(--steel-blue)", color: "white", padding: "2px 7px" }}>Preferred</span>
                  </div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--bone)" }}>{EMAIL}</div>
                </div>
              </a>
              <a href="tel:9712450654" style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 0", borderTop: "1px solid rgba(26,44,78,0.15)", borderBottom: "1px solid rgba(26,44,78,0.15)" }}>
                <span style={{ width: 22, height: 22, color: "var(--steel-blue)", flexShrink: 0 }}>{Icon.phone}</span>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6 }}>Call us</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 22, color: "var(--navy-ink)" }}>(971) 245-0654</div>
                </div>
              </a>
            </div>

            {tab === "reserve" && (
              <div style={{ marginTop: 28, padding: "16px", background: "rgba(26,44,78,0.04)", border: "1px solid rgba(26,44,78,0.12)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--steel-blue)", marginBottom: 8 }}>Rates</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 15 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Weekly</span><strong>$120 / week</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(26,44,78,0.1)", paddingTop: 6 }}>
                    <span>Tractor &amp; Trailer</span><strong>$250 / mo</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(26,44,78,0.1)", paddingTop: 6 }}>
                    <span>Fleet</span><strong>Contact us</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — form */}
          <div style={{
            background: "var(--paper)",
            padding: "36px clamp(20px, 4vw, 44px) 40px",
            border: "1px solid rgba(26,44,78,0.12)",
          }}>
            {/* Form tab indicator */}
            <div style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--steel-blue)",
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: "1px solid rgba(26,44,78,0.1)",
            }}>
              {tab === "inquiry" ? "— General inquiry" : "— Parking reservation request"}
            </div>
            {tab === "inquiry" ? <InquiryForm /> : <ReservationForm />}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}

// =============================================================
// FOOTER
// =============================================================
function Footer() {
  return (
    <footer style={{ background: "var(--steel-gray)", color: "var(--navy-ink)", paddingTop: 80, paddingBottom: 32, overflow: "hidden", position: "relative" }}>
      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 48, alignItems: "start" }} className="footer-top">
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--navy)" }}>
              Iron Gate Logistics
            </div>
            <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.55, maxWidth: 380, color: "var(--navy-ink)", opacity: 0.78 }}>
              Secure parking for trucks, trailers, and fleets. Built for the long haul on the I-5 corridor in Cottage Grove, Oregon.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--navy)", opacity: 0.6 }}>Visit</div>
            <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5 }}>
              80614 Sears Rd<br/>
              Cottage Grove, OR 97424
            </p>
          </div>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--navy)", opacity: 0.6 }}>Contact</div>
            <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.5 }}>
              <a href={`mailto:${EMAIL}`} style={{ borderBottom: "1px solid currentColor" }}>{EMAIL}</a><br/>
              <a href="tel:9712450654">(971) 245-0654</a>
            </p>
          </div>
        </div>

        {/* Big wordmark */}
        <div style={{
          marginTop: 64,
          marginBottom: 32,
          fontFamily: "var(--display)",
          fontSize: "clamp(64px, 14vw, 200px)",
          color: "var(--navy)",
          letterSpacing: "0.02em",
          lineHeight: 0.85,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.08em",
        }}>
          <span>IRON</span>
          <img src={(window.__resources && window.__resources.logoMark) || "assets/logo-mark.png"} alt="" style={{ height: "1.05em", width: "auto", display: "block", objectFit: "contain", flexShrink: 0 }} />
          <span>GATE</span>
        </div>

        <div style={{ height: 4, background: "var(--steel-blue)", marginBottom: 24 }} />
        <div style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(32px, 6vw, 92px)",
          color: "var(--navy)",
          letterSpacing: "0.18em",
          textAlign: "center",
          lineHeight: 1,
        }}>
          LOGISTICS
        </div>

        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid rgba(26,44,78,0.18)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--navy)",
          opacity: 0.7,
        }}>
          <span>© {new Date().getFullYear()} Iron Gate Logistics</span>
          <span>Cottage Grove · Oregon · USA</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .footer-top { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </footer>
  );
}

// ═══════════════════ APP-ENTRY ═══════════════════

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroVariant": "editorial",
  "density": "default",
  "showMarquee": true,
  "accentColor": "#2d6cb3"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);
  const ref = useReveal();

  // Apply density / accent
  useEffect(() => {
    document.body.dataset.density = tweaks.density;
    document.documentElement.style.setProperty("--steel-blue", tweaks.accentColor);
  }, [tweaks.density, tweaks.accentColor]);

  return (
    <div ref={ref}>
      <Nav />
      <main>
        <Hero variant={tweaks.heroVariant} />
        {tweaks.showMarquee && <Marquee />}
        <Services />
        <Rates />
        <WhyUs />
        <Location />
        <Contact />
      </main>
      <Footer />

      <TweaksPanel>
        <TweakSection label="Hero" />
        <TweakRadio
          label="Layout"
          value={tweaks.heroVariant}
          options={["editorial", "image"]}
          onChange={(v) => setTweak("heroVariant", v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={tweaks.density}
          options={["compact", "default", "spacious"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakToggle
          label="Marquee strip"
          value={tweaks.showMarquee}
          onChange={(v) => setTweak("showMarquee", v)}
        />
        <TweakSection label="Accent color" />
        <TweakRadio
          label="Accent"
          value={tweaks.accentColor}
          options={["#2d6cb3", "#0f4c81", "#b04a1f", "#3a6b3a"]}
          onChange={(v) => setTweak("accentColor", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

