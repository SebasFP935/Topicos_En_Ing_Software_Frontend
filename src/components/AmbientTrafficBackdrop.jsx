import { C } from '../tokens'

const SLOT_ITEMS = [
  { x: 160, y: 170, w: 92, h: 58, color: '#ff4d6d', delay: 0 },
  { x: 282, y: 154, w: 92, h: 58, color: '#7ba5ff', delay: 0.5 },
  { x: 404, y: 138, w: 92, h: 58, color: '#8d6bff', delay: 1.2 },
  { x: 526, y: 122, w: 92, h: 58, color: '#ff6b88', delay: 0.9 },
  { x: 682, y: 260, w: 92, h: 58, color: '#7ba5ff', delay: 1.5 },
  { x: 804, y: 244, w: 92, h: 58, color: '#ff4d6d', delay: 0.2 },
  { x: 926, y: 228, w: 92, h: 58, color: '#8d6bff', delay: 0.8 },
]

const TRAFFIC_PATHS = [
  { id: 'atb-p1', color: '#ff4d6d', duration: 14, delay: -1.8, d: 'M -120 330 C 240 252, 620 232, 1320 140' },
  { id: 'atb-p2', color: '#7ba5ff', duration: 17, delay: -6.4, d: 'M 1320 236 C 930 282, 560 346, -120 432' },
  { id: 'atb-p3', color: '#8d6bff', duration: 15, delay: -3.1, d: 'M -120 492 C 220 442, 780 404, 1320 304' },
  { id: 'atb-p4', color: '#ff6b88', duration: 20, delay: -9.5, d: 'M 1320 604 C 840 538, 402 538, -120 666' },
  { id: 'atb-p5', color: '#7ba5ff', duration: 22, delay: -5.8, d: 'M -120 770 C 286 694, 762 676, 1320 560' },
]

const AMBIENT_CSS = `
  .atb-root {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    isolation: isolate;
  }

  .atb-glow {
    position: absolute;
    inset: -10%;
    background:
      radial-gradient(circle at 12% 16%, rgba(255,77,109,.28), transparent 32%),
      radial-gradient(circle at 84% 8%, rgba(123,165,255,.2), transparent 28%),
      radial-gradient(circle at 88% 88%, rgba(141,107,255,.16), transparent 34%),
      radial-gradient(circle at 24% 82%, rgba(255,107,136,.16), transparent 32%);
    animation: atb-glow-breathe 12s ease-in-out infinite alternate;
  }

  .atb-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
    background-size: 52px 52px;
    opacity: .12;
    mask-image: radial-gradient(circle at 50% 44%, black 42%, transparent 100%);
  }

  .atb-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: .72;
  }

  .atb-slot {
    animation: atb-slot-float 4.8s ease-in-out infinite;
    transform-origin: center;
  }

  .atb-slot-line {
    stroke-linecap: round;
  }

  .atb-lane {
    stroke-linecap: round;
    stroke-dasharray: 18 10;
    stroke-width: 2.6;
    opacity: .34;
  }

  .atb-lane-glow {
    stroke-linecap: round;
    stroke-dasharray: 18 10;
    stroke-width: 5.8;
    opacity: .08;
    filter: blur(2px);
  }

  .atb-trace-base {
    fill: none;
    stroke: var(--color);
    stroke-width: 2.6;
    stroke-dasharray: 14 11;
    stroke-linecap: round;
    opacity: .18;
  }

  .atb-trace-flow {
    fill: none;
    stroke: var(--color);
    stroke-width: 3.2;
    stroke-dasharray: 160 2400;
    stroke-linecap: round;
    opacity: 0;
    animation: atb-trace-run calc(var(--duration) * 1s) linear infinite, atb-trace-fade calc(var(--duration) * 1s) ease-in-out infinite;
    animation-delay: calc(var(--delay) * 1s), calc(var(--delay) * 1s);
    filter: drop-shadow(0 0 6px var(--color));
  }

  .atb-car-svg {
    filter: drop-shadow(0 0 14px rgba(0,0,0,.32));
  }

  @keyframes atb-glow-breathe {
    from { transform: translateY(0px) scale(1); }
    to { transform: translateY(-14px) scale(1.04); }
  }

  @keyframes atb-slot-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-9px); }
  }

  @keyframes atb-trace-run {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -2560; }
  }

  @keyframes atb-trace-fade {
    0% { opacity: 0; }
    15% { opacity: .12; }
    35% { opacity: .44; }
    75% { opacity: .16; }
    100% { opacity: 0; }
  }

  @media (max-width: 900px) {
    .atb-grid {
      opacity: .08;
      background-size: 40px 40px;
    }
    .atb-svg {
      opacity: .58;
    }
    .atb-trace-flow {
      stroke-width: 2.6;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .atb-glow,
    .atb-slot,
    .atb-trace-flow {
      animation: none !important;
    }
  }
`

function CarGlyph({ color }) {
  return (
    <g>
      <rect x="-36" y="-16" width="72" height="32" rx="10" fill={color} stroke="rgba(255,255,255,.28)" strokeWidth="1.8" />
      <rect x="-21" y="-11" width="42" height="12" rx="6" fill="rgba(242,246,255,.46)" />
      <circle cx="-23" cy="17" r="6" fill="#151926" />
      <circle cx="23" cy="17" r="6" fill="#151926" />
      <rect x="-34" y="-5" width="4" height="7" rx="2" fill="rgba(255,255,255,.48)" />
      <rect x="30" y="-5" width="4" height="7" rx="2" fill="rgba(255,255,255,.48)" />
    </g>
  )
}

export function AmbientTrafficBackdrop() {
  return (
    <div className="atb-root" aria-hidden="true">
      <style>{AMBIENT_CSS}</style>
      <div className="atb-glow" />
      <div className="atb-grid" />

      <svg className="atb-svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="atb-lane" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={C.teal} stopOpacity="0" />
            <stop offset="50%" stopColor={C.teal} stopOpacity="0.54" />
            <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
          </linearGradient>
          {TRAFFIC_PATHS.map((path) => (
            <path key={path.id} id={path.id} d={path.d} />
          ))}
        </defs>

        {[0, 1, 2, 3].map((lane) => (
          <g key={lane}>
            <line
              className="atb-lane-glow"
              x1={60}
              y1={300 + lane * 92}
              x2={1140}
              y2={160 + lane * 92}
              stroke="url(#atb-lane)"
            />
            <line
              className="atb-lane"
              x1={60}
              y1={300 + lane * 92}
              x2={1140}
              y2={160 + lane * 92}
              stroke="url(#atb-lane)"
            />
          </g>
        ))}

        {SLOT_ITEMS.map((slot, index) => (
          <g
            key={`${slot.x}-${slot.y}`}
            className="atb-slot"
            style={{ animationDelay: `${slot.delay}s`, animationDuration: `${4.4 + (index % 3) * 0.7}s` }}
          >
            <rect
              x={slot.x}
              y={slot.y}
              width={slot.w}
              height={slot.h}
              rx="12"
              fill={`${slot.color}20`}
              stroke={slot.color}
              strokeWidth="1.3"
            />
            <line
              className="atb-slot-line"
              x1={slot.x + 16}
              y1={slot.y + 12}
              x2={slot.x + slot.w - 16}
              y2={slot.y + 12}
              stroke={slot.color}
              strokeWidth="2"
              opacity="0.5"
            />
            <rect
              x={slot.x + slot.w / 2 - 14}
              y={slot.y + 20}
              width="28"
              height="20"
              rx="5"
              fill={`${slot.color}35`}
              stroke={`${slot.color}99`}
              strokeWidth="1"
            />
          </g>
        ))}

        {TRAFFIC_PATHS.map((path) => (
          <path
            key={`${path.id}-base`}
            className="atb-trace-base"
            d={path.d}
            style={{ '--color': path.color }}
          />
        ))}

        {TRAFFIC_PATHS.map((path) => (
          <path
            key={`${path.id}-flow`}
            className="atb-trace-flow"
            d={path.d}
            style={{
              '--color': path.color,
              '--duration': path.duration,
              '--delay': path.delay,
            }}
          />
        ))}

        {TRAFFIC_PATHS.map((path) => (
          <g key={`${path.id}-car`} className="atb-car-svg">
            <CarGlyph color={path.color} />
            <animateMotion dur={`${path.duration}s`} begin={`${path.delay}s`} repeatCount="indefinite" rotate="auto">
              <mpath href={`#${path.id}`} />
            </animateMotion>
          </g>
        ))}
      </svg>
    </div>
  )
}

