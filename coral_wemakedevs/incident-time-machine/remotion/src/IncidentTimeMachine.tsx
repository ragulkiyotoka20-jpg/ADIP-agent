import React, {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const colors = {
  bg: '#06101b',
  panel: '#0b1724',
  panelSoft: '#102131',
  line: 'rgba(158, 184, 204, 0.16)',
  text: '#f7fbff',
  muted: '#8fa7b9',
  cyan: '#52d7f4',
  cyanDim: 'rgba(82, 215, 244, 0.16)',
  coral: '#ff7f6d',
  coralDim: 'rgba(255, 127, 109, 0.17)',
  lime: '#b9ef80',
  limeDim: 'rgba(185, 239, 128, 0.15)',
  violet: '#a995ff',
  violetDim: 'rgba(169, 149, 255, 0.18)',
  yellow: '#f8c76c',
  red: '#ff6b6b',
};

const font = {
  sans: 'Arial, Helvetica, sans-serif',
  mono: '"Courier New", Consolas, monospace',
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const fadeScene = (frame: number, start: number, end: number, fade = 22) => {
  return Math.min(
    interpolate(frame, [start, start + fade], [0, 1], clamp),
    interpolate(frame, [end - fade, end], [1, 0], clamp),
  );
};

const enter = (frame: number, start = 0, duration = 24) => {
  return interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });
};

const liftStyle = (progress: number, distance = 28): CSSProperties => ({
  opacity: progress,
  transform: `translateY(${(1 - progress) * distance}px)`,
});

const panelStyle: CSSProperties = {
  border: `1px solid ${colors.line}`,
  background: 'rgba(11, 23, 36, 0.88)',
  boxShadow: '0 18px 64px rgba(0, 0, 0, 0.24)',
  borderRadius: 24,
};

const sourceData = [
  {name: 'PagerDuty', code: 'PD', color: colors.coral, detail: 'incident opened'},
  {name: 'Datadog', code: 'DD', color: colors.cyan, detail: 'latency spike'},
  {name: 'Sentry', code: 'SE', color: colors.violet, detail: 'checkout errors'},
  {name: 'GitHub', code: 'GH', color: colors.lime, detail: 'deploy sha 7f3c1a'},
  {name: 'Slack', code: 'SL', color: colors.yellow, detail: 'war-room context'},
  {name: 'Crawler', code: 'UI', color: '#72e6c2', detail: 'screen evidence'},
];

const Badge: React.FC<{
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}> = ({children, color = colors.cyan, style}) => (
  <div
    style={{
      border: `1px solid ${color}55`,
      background: `${color}18`,
      color,
      borderRadius: 999,
      padding: '8px 14px',
      fontSize: 18,
      fontFamily: font.mono,
      fontWeight: 700,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      ...style,
    }}
  >
    {children}
  </div>
);

const Dot: React.FC<{color?: string; size?: number}> = ({
  color = colors.cyan,
  size = 10,
}) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: color,
      boxShadow: `0 0 18px ${color}`,
      display: 'inline-block',
    }}
  />
);

const GridBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 1980], [0, 150]);

  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        overflow: 'hidden',
        fontFamily: font.sans,
        color: colors.text,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `
            radial-gradient(circle at 14% 18%, rgba(82,215,244,.16), transparent 30%),
            radial-gradient(circle at 84% 72%, rgba(255,127,109,.13), transparent 31%),
            linear-gradient(rgba(158,184,204,.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(158,184,204,.06) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, auto, 72px 72px, 72px 72px',
          backgroundPosition: `center, center, ${drift}px ${drift * 0.32}px, ${drift}px ${drift * 0.32}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 34,
          border: `1px solid ${colors.line}`,
          borderRadius: 30,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -260,
          top: -310,
          width: 740,
          height: 740,
          borderRadius: 999,
          border: `1px solid ${colors.cyan}22`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -260,
          bottom: -310,
          width: 740,
          height: 740,
          borderRadius: 999,
          border: `1px solid ${colors.coral}22`,
        }}
      />
    </AbsoluteFill>
  );
};

const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = frame / 1979;
  const chapter =
    frame < 180
      ? 'wake-up call'
      : frame < 390
        ? 'ask for the replay'
        : frame < 690
          ? 'join every signal'
          : frame < 1170
            ? 'scrub the incident'
            : frame < 1440
              ? 'see the break'
              : frame < 1740
                ? 'explain the cause'
                : 'learn faster';

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          top: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: font.mono,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          fontWeight: 700,
          zIndex: 20,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 14, color: colors.text}}>
          <Dot size={12} />
          <span style={{fontSize: 19}}>Coral // Incident Replay</span>
        </div>
        <span style={{fontSize: 17, color: colors.muted}}>
          {chapter} // {String(Math.floor(frame / 30)).padStart(2, '0')}s
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          bottom: 58,
          height: 3,
          borderRadius: 999,
          background: 'rgba(143,167,185,.17)',
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${colors.cyan}, ${colors.coral})`,
            boxShadow: `0 0 18px ${colors.cyan}`,
            borderRadius: 999,
          }}
        />
      </div>
    </>
  );
};

const TimeTicker: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = Math.floor(frame / 30);

  return (
    <div
      style={{
        position: 'absolute',
        left: 84,
        bottom: 80,
        color: colors.muted,
        fontFamily: font.mono,
        fontWeight: 700,
        letterSpacing: 1.6,
        fontSize: 16,
      }}
    >
      GENERATED REPLAY / 00:{String(seconds).padStart(2, '0')}
    </div>
  );
};

const Scene: React.FC<{
  start: number;
  end: number;
  children: ReactNode;
}> = ({start, end, children}) => {
  const frame = useCurrentFrame();
  const opacity = fadeScene(frame, start, end);

  if (frame < start || frame > end) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        padding: '148px 112px 120px',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame;
  const title = enter(local, 18, 34);
  const alert = enter(local, 74, 20);
  const pulse = 1 + 0.035 * Math.sin(local / 4);

  return (
    <Scene start={0} end={180}>
      <div style={{display: 'flex', height: '100%', alignItems: 'center'}}>
        <div style={{width: '66%'}}>
          <Badge color={colors.coral} style={liftStyle(enter(local, 2, 22), 18)}>
            <Dot color={colors.coral} size={9} />
            02:10 UTC / SEV-1 detected
          </Badge>
          <h1
            style={{
              ...liftStyle(title, 42),
              margin: '28px 0 16px',
              fontSize: 116,
              lineHeight: 0.94,
              letterSpacing: -7,
              fontWeight: 900,
              maxWidth: 1040,
            }}
          >
            Every outage
            <br />
            leaves a trail.
          </h1>
          <p
            style={{
              ...liftStyle(enter(local, 48, 30), 25),
              color: colors.muted,
              fontSize: 32,
              lineHeight: 1.38,
              width: 930,
              margin: 0,
            }}
          >
            Alerts. metrics. errors. deploys. chat.
            <br />
            And the exact moment customers felt the break.
          </p>
        </div>
        <div
          style={{
            width: 430,
            height: 430,
            marginLeft: 30,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                inset: 28 + index * 52,
                borderRadius: 999,
                border: `1px solid ${colors.coral}${index === 0 ? '55' : '28'}`,
                transform: `scale(${pulse + index * 0.02})`,
              }}
            />
          ))}
          <div
            style={{
              ...liftStyle(alert, 16),
              width: 216,
              height: 216,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 999,
              background: `radial-gradient(circle, ${colors.coralDim}, rgba(255,127,109,.04))`,
              border: `2px solid ${colors.coral}`,
              boxShadow: `0 0 60px ${colors.coralDim}`,
            }}
          >
            <span style={{fontFamily: font.mono, fontSize: 26, color: colors.coral}}>SEV-1</span>
            <strong style={{fontSize: 46, marginTop: 8}}>02:10</strong>
            <span style={{color: colors.muted, fontSize: 19, marginTop: 5}}>UTC</span>
          </div>
        </div>
      </div>
    </Scene>
  );
};

const QueryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 180;
  const text = 'Show me the 18-minute outage at 02:10 UTC.';
  const typed = Math.floor(interpolate(local, [30, 142], [0, text.length], clamp));
  const cursor = Math.floor(local / 12) % 2 === 0;

  return (
    <Scene start={180} end={390}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%'}}>
        <Badge style={liftStyle(enter(local, 0, 22), 18)}>one question / complete replay</Badge>
        <h2
          style={{
            ...liftStyle(enter(local, 16, 28), 32),
            fontSize: 84,
            margin: '26px 0 42px',
            letterSpacing: -4.6,
            lineHeight: 0.98,
            maxWidth: 1160,
          }}
        >
          Ask for the incident.
          <br />
          Get the whole movie.
        </h2>
        <div
          style={{
            ...panelStyle,
            ...liftStyle(enter(local, 36, 28), 22),
            padding: '34px 40px',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            width: 1440,
            borderColor: `${colors.cyan}66`,
            boxShadow: `0 18px 64px rgba(0,0,0,.24), 0 0 70px ${colors.cyanDim}`,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              display: 'grid',
              placeItems: 'center',
              color: colors.bg,
              background: colors.cyan,
              fontFamily: font.mono,
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            &gt;_
          </div>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 36,
              color: colors.text,
              letterSpacing: -1.2,
            }}
          >
            {text.slice(0, typed)}
            <span style={{opacity: cursor ? 1 : 0, color: colors.cyan}}>|</span>
          </span>
        </div>
        <div
          style={{
            ...liftStyle(enter(local, 156, 22), 14),
            color: colors.lime,
            fontFamily: font.mono,
            fontSize: 21,
            marginTop: 26,
            letterSpacing: 1,
          }}
        >
          REQUEST ACCEPTED / BUILDING FUSED INCIDENT TIMELINE
        </div>
      </div>
    </Scene>
  );
};

const StreamLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  progress: number;
}> = ({x1, y1, x2, y2, color, progress}) => {
  const length = Math.hypot(x2 - x1, y2 - y1);

  return (
    <svg
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      viewBox="0 0 1696 760"
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${color}2c`} strokeWidth="2" />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${length} ${length}`}
        strokeDashoffset={length * (1 - progress)}
        strokeLinecap="round"
      />
      <circle
        cx={x1 + (x2 - x1) * progress}
        cy={y1 + (y2 - y1) * progress}
        r="6"
        fill={color}
      />
    </svg>
  );
};

const SourcesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 390;
  const centers = [
    {x: 220, y: 116},
    {x: 220, y: 300},
    {x: 220, y: 484},
    {x: 1476, y: 116},
    {x: 1476, y: 300},
    {x: 1476, y: 484},
  ];
  const center = {x: 848, y: 300};

  return (
    <Scene start={390} end={690}>
      <div style={{height: '100%', position: 'relative'}}>
        <div style={{...liftStyle(enter(local, 0, 24), 16), position: 'absolute', left: 0, top: 0}}>
          <Badge>Coral SQL layer / live join</Badge>
          <h2 style={{fontSize: 64, lineHeight: 1, letterSpacing: -3, margin: '20px 0 0'}}>
            Every signal. One incident truth.
          </h2>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 142,
            bottom: 10,
          }}
        >
          {sourceData.map((source, index) => {
            const node = centers[index];
            const nodeEnter = enter(local, 36 + index * 10, 20);
            const stream = enter(local, 78 + index * 13, 56);

            return (
              <React.Fragment key={source.name}>
                <StreamLine
                  x1={node.x}
                  y1={node.y}
                  x2={center.x}
                  y2={center.y}
                  color={source.color}
                  progress={stream}
                />
                <div
                  style={{
                    ...panelStyle,
                    ...liftStyle(nodeEnter, index % 2 === 0 ? 18 : -18),
                    position: 'absolute',
                    left: node.x - 145,
                    top: node.y - 58,
                    width: 290,
                    padding: '16px 19px',
                    borderColor: `${source.color}55`,
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: 13}}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 15,
                        display: 'grid',
                        placeItems: 'center',
                        background: `${source.color}18`,
                        color: source.color,
                        fontFamily: font.mono,
                        fontWeight: 900,
                        fontSize: 18,
                      }}
                    >
                      {source.code}
                    </div>
                    <div>
                      <div style={{fontSize: 22, fontWeight: 800}}>{source.name}</div>
                      <div style={{fontSize: 15, color: colors.muted, marginTop: 4}}>{source.detail}</div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div
            style={{
              ...panelStyle,
              ...liftStyle(enter(local, 128, 28), 16),
              position: 'absolute',
              left: center.x - 185,
              top: center.y - 130,
              width: 370,
              height: 260,
              borderRadius: 42,
              borderColor: `${colors.cyan}88`,
              boxShadow: `0 0 90px ${colors.cyanDim}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: 27,
                background: `linear-gradient(135deg, ${colors.cyan}, #72e6c2)`,
                color: colors.bg,
                fontFamily: font.mono,
                fontWeight: 900,
                display: 'grid',
                placeItems: 'center',
                fontSize: 34,
              }}
            >
              SQL
            </div>
            <strong style={{fontSize: 31, marginTop: 17}}>Coral Engine</strong>
            <span style={{fontFamily: font.mono, color: colors.cyan, fontSize: 15, marginTop: 8}}>
              JOIN COMPLETE / 142 ROWS
            </span>
          </div>
        </div>
      </div>
    </Scene>
  );
};

const Chart: React.FC<{progress: number}> = ({progress}) => {
  const points = [
    [0, 54],
    [7, 49],
    [14, 52],
    [22, 46],
    [30, 50],
    [38, 45],
    [43, 41],
    [48, 44],
    [52, 112],
    [56, 148],
    [62, 160],
    [68, 154],
    [74, 141],
    [80, 101],
    [86, 74],
    [92, 58],
    [100, 49],
  ];
  const linePoints = points.map(([x, y]) => `${x * 7.65 + 10},${y}`).join(' ');

  return (
    <svg viewBox="0 0 800 190" style={{width: '100%', height: 190}}>
      {[38, 78, 118, 158].map((y) => (
        <line key={y} x1="0" x2="800" y1={y} y2={y} stroke={colors.line} strokeWidth="1" />
      ))}
      <polyline
        fill="none"
        stroke={colors.coral}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - progress}
      />
      <line
        x1={10 + progress * 765}
        x2={10 + progress * 765}
        y1="16"
        y2="180"
        stroke={colors.cyan}
        strokeWidth="2"
        strokeDasharray="7 7"
      />
      <circle cx={10 + progress * 765} cy="16" r="7" fill={colors.cyan} />
    </svg>
  );
};

const CheckoutThumbnail: React.FC<{broken?: boolean}> = ({broken = false}) => (
  <div
    style={{
      width: 242,
      height: 142,
      borderRadius: 13,
      overflow: 'hidden',
      background: '#eef4f4',
      color: '#18323c',
      border: broken ? `2px solid ${colors.red}` : '2px solid rgba(185,239,128,.65)',
      position: 'relative',
    }}
  >
    <div style={{height: 25, background: '#16313d', display: 'flex', alignItems: 'center', paddingLeft: 10, gap: 4}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 5, height: 5, borderRadius: 999, background: i === 0 ? colors.coral : '#7f9da8'}} />
      ))}
    </div>
    <div style={{padding: 15}}>
      <div style={{fontSize: 11, color: '#4a6772', fontWeight: 700}}>CHECKOUT / CONFIRM ORDER</div>
      <div style={{fontSize: 17, fontWeight: 900, marginTop: 7}}>$84.50</div>
      <div
        style={{
          marginTop: 16,
          height: 25,
          borderRadius: 7,
          background: broken ? '#f8d4d0' : '#2aa982',
          color: broken ? '#b83b36' : 'white',
          display: 'grid',
          placeItems: 'center',
          fontSize: 10,
          fontWeight: 900,
        }}
      >
        {broken ? 'PAYMENT FAILED' : 'PLACE ORDER'}
      </div>
    </div>
    {broken && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(135deg, rgba(255,107,107,.03), rgba(255,107,107,.03) 10px, rgba(255,107,107,.12) 10px, rgba(255,107,107,.12) 20px)',
        }}
      />
    )}
  </div>
);

const TimelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 690;
  const progress = interpolate(local, [72, 390], [0, 1], clamp);
  const minute = Math.round(progress * 18);
  const events = [
    {time: '02:09', label: 'Deploy completed', detail: 'checkout-service / 7f3c1a', color: colors.lime, x: 50},
    {time: '02:10', label: 'Sentry errors spike', detail: 'POST /payments / 503', color: colors.coral, x: 240},
    {time: '02:12', label: 'UI evidence captured', detail: 'checkout regression', color: colors.cyan, x: 460},
    {time: '02:28', label: 'Rollback restored', detail: 'latency back to baseline', color: colors.lime, x: 704},
  ];

  return (
    <Scene start={690} end={1170}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end'}}>
          <div style={liftStyle(enter(local, 0, 24), 18)}>
            <Badge color={colors.violet}>interactive outage replay</Badge>
            <h2 style={{fontSize: 62, letterSpacing: -3.2, margin: '17px 0 0'}}>Scrub the moment the UI broke.</h2>
          </div>
          <div
            style={{
              ...panelStyle,
              ...liftStyle(enter(local, 20, 18), 14),
              padding: '16px 22px',
              fontFamily: font.mono,
              color: colors.cyan,
              fontSize: 20,
            }}
          >
            PLAYBACK / 02:{String(10 + minute).padStart(2, '0')} UTC
          </div>
        </div>
        <div
          style={{
            ...panelStyle,
            ...liftStyle(enter(local, 30, 24), 18),
            marginTop: 28,
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 355px',
            gap: 22,
            padding: 25,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 17}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontFamily: font.mono, fontSize: 15, color: colors.muted, letterSpacing: 1.1}}>
                  DATADOG / CHECKOUT P95 LATENCY
                </div>
                <div style={{fontSize: 25, marginTop: 6, fontWeight: 800}}>18-minute customer-impact window</div>
              </div>
              <Badge color={colors.coral} style={{fontSize: 14, padding: '7px 10px'}}>
                <Dot color={colors.coral} size={8} /> SEV-1 open
              </Badge>
            </div>
            <Chart progress={progress} />
            <div
              style={{
                position: 'relative',
                height: 94,
                borderTop: `1px solid ${colors.line}`,
                paddingTop: 19,
              }}
            >
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  background: 'rgba(143,167,185,.18)',
                  position: 'absolute',
                  top: 19,
                  left: 0,
                  right: 0,
                }}
              >
                <div
                  style={{
                    width: `${progress * 100}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${colors.cyan}, ${colors.coral})`,
                  }}
                />
              </div>
              {events.map((event, index) => {
                const reveal = enter(local, 120 + index * 52, 16);
                return (
                  <div
                    key={event.time}
                    style={{
                      ...liftStyle(reveal, 12),
                      position: 'absolute',
                      top: 12,
                      left: event.x,
                      width: 186,
                    }}
                  >
                    <Dot color={event.color} size={18} />
                    <div style={{fontFamily: font.mono, color: event.color, fontSize: 15, marginTop: 12}}>
                      {event.time}
                    </div>
                    <div style={{fontSize: 17, fontWeight: 800, marginTop: 3}}>{event.label}</div>
                    <div style={{fontSize: 14, color: colors.muted, marginTop: 3}}>{event.detail}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{borderLeft: `1px solid ${colors.line}`, paddingLeft: 22}}>
            <div style={{fontFamily: font.mono, color: colors.muted, fontSize: 15, letterSpacing: 1}}>LIVE UI EVIDENCE</div>
            <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16}}>
              <div style={{...liftStyle(enter(local, 118, 20), 12)}}>
                <div style={{fontFamily: font.mono, color: colors.lime, fontSize: 14, marginBottom: 7}}>T-1 MIN / HEALTHY</div>
                <CheckoutThumbnail />
              </div>
              <div style={{...liftStyle(enter(local, 210, 20), 12)}}>
                <div style={{fontFamily: font.mono, color: colors.coral, fontSize: 14, marginBottom: 7}}>T+1 MIN / REGRESSION</div>
                <CheckoutThumbnail broken />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Scene>
  );
};

const CheckoutPanel: React.FC<{broken?: boolean; title: string}> = ({broken = false, title}) => (
  <div style={{flex: 1}}>
    <div style={{fontFamily: font.mono, color: broken ? colors.coral : colors.lime, fontSize: 17, letterSpacing: 1.2, marginBottom: 11}}>
      {title}
    </div>
    <div
      style={{
        ...panelStyle,
        height: 384,
        overflow: 'hidden',
        background: '#eef4f4',
        borderColor: broken ? `${colors.red}99` : `${colors.lime}66`,
        position: 'relative',
        color: '#18323c',
      }}
    >
      <div style={{height: 52, background: '#16313d', display: 'flex', alignItems: 'center', paddingLeft: 22, gap: 7}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 9, height: 9, borderRadius: 999, background: i === 0 ? colors.coral : '#7895a2'}} />
        ))}
        <div style={{fontFamily: font.mono, fontSize: 13, color: '#b8cbd1', marginLeft: 20}}>shop.example.com/checkout</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 180px', gap: 18, padding: 28}}>
        <div>
          <div style={{fontSize: 14, color: '#58737d', fontWeight: 800}}>CHECKOUT</div>
          <div style={{fontSize: 28, fontWeight: 900, marginTop: 10}}>Confirm your order</div>
          {['Delivery address', 'Payment method', 'Order total'].map((row, index) => (
            <div key={row} style={{borderTop: '1px solid #ccd9dd', padding: '13px 0', marginTop: index === 0 ? 18 : 0, display: 'flex', justifyContent: 'space-between'}}>
              <span style={{fontSize: 15, color: '#58737d'}}>{row}</span>
              <span style={{fontSize: 15, fontWeight: 800}}>{index === 2 ? '$84.50' : 'Verified'}</span>
            </div>
          ))}
        </div>
        <div style={{background: '#fff', borderRadius: 13, padding: 16, height: 188, boxShadow: '0 9px 20px rgba(14,49,59,.12)'}}>
          <div style={{fontSize: 13, color: '#58737d'}}>ORDER TOTAL</div>
          <div style={{fontSize: 27, fontWeight: 900, marginTop: 5}}>$84.50</div>
          <div
            style={{
              marginTop: 28,
              height: 45,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 9,
              background: broken ? '#f6d6d2' : '#2aa982',
              color: broken ? '#b83b36' : 'white',
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {broken ? 'PAYMENT FAILED' : 'PLACE ORDER'}
          </div>
        </div>
      </div>
      {broken && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 26,
              right: 26,
              bottom: 20,
              padding: '13px 15px',
              background: '#fff0ef',
              color: '#bc3d3d',
              border: '1px solid #ef9c96',
              borderRadius: 9,
              fontFamily: font.mono,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Error 503: payment-service replica unavailable
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(135deg, rgba(255,107,107,.02), rgba(255,107,107,.02) 12px, rgba(255,107,107,.11) 12px, rgba(255,107,107,.11) 24px)',
            }}
          />
        </>
      )}
    </div>
  </div>
);

const DiffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 1170;

  return (
    <Scene start={1170} end={1440}>
      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={liftStyle(enter(local, 0, 24), 18)}>
          <Badge color={colors.coral}>before vs after / visual diff</Badge>
          <h2 style={{fontSize: 61, letterSpacing: -3.2, margin: '17px 0 0'}}>The regression becomes impossible to miss.</h2>
        </div>
        <div style={{display: 'flex', gap: 24, marginTop: 28, ...liftStyle(enter(local, 30, 26), 18)}}>
          <CheckoutPanel title="T-1 MIN / BEFORE DEPLOY" />
          <CheckoutPanel broken title="T+1 MIN / AFTER DEPLOY" />
        </div>
        <div
          style={{
            ...panelStyle,
            ...liftStyle(enter(local, 126, 24), 16),
            marginTop: 18,
            padding: '17px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderColor: `${colors.coral}55`,
          }}
        >
          <span style={{fontFamily: font.mono, color: colors.coral, fontSize: 18}}>PIXEL DIFF / CUSTOMER FLOW BLOCKED</span>
          <span style={{color: colors.muted, fontSize: 18}}>checkout payment CTA changed from success to 503 failure</span>
        </div>
      </div>
    </Scene>
  );
};

const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 1440;
  const links = [
    {label: 'code diff', value: 'github.com/org/app/commit/7f3c1a', color: colors.lime},
    {label: 'alert', value: 'pagerduty.com/incidents/PD-1842', color: colors.coral},
    {label: 'screen diff', value: 'evidence/ui-checkout-t+1.png', color: colors.cyan},
  ];

  return (
    <Scene start={1440} end={1740}>
      <div style={{display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 30, height: '100%', alignItems: 'center'}}>
        <div>
          <Badge color={colors.violet} style={liftStyle(enter(local, 0, 22), 16)}>
            LLM narrator / linked evidence
          </Badge>
          <h2
            style={{
              ...liftStyle(enter(local, 20, 25), 22),
              fontSize: 73,
              letterSpacing: -4,
              lineHeight: 0.98,
              margin: '22px 0 22px',
            }}
          >
            Root cause,
            <br />
            with receipts.
          </h2>
          <p style={{...liftStyle(enter(local, 48, 22), 14), color: colors.muted, fontSize: 28, lineHeight: 1.42, margin: 0, maxWidth: 760}}>
            Coral links the deploy, alert, and UI evidence into one explanation your team can replay and trust.
          </p>
        </div>
        <div
          style={{
            ...panelStyle,
            ...liftStyle(enter(local, 45, 28), 18),
            padding: 29,
            borderColor: `${colors.violet}66`,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontFamily: font.mono, color: colors.violet, fontSize: 16, letterSpacing: 1.2}}>AUTO-GENERATED RCA</div>
            <Badge color={colors.lime} style={{fontSize: 13, padding: '6px 9px'}}>high confidence</Badge>
          </div>
          <div style={{height: 1, background: colors.line, margin: '19px 0'}} />
          <p style={{fontSize: 24, lineHeight: 1.46, margin: 0}}>
            Deploy <span style={{color: colors.lime, fontFamily: font.mono}}>7f3c1a</span> rerouted checkout traffic to an unhealthy payment replica. Error rates spiked at <span style={{color: colors.coral}}>02:10 UTC</span>, and the crawler captured the failed CTA one minute later.
          </p>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24}}>
            {links.map((link, index) => (
              <div
                key={link.label}
                style={{
                  ...liftStyle(enter(local, 110 + index * 26, 18), 11),
                  padding: '12px 14px',
                  borderRadius: 11,
                  border: `1px solid ${link.color}44`,
                  background: `${link.color}0d`,
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  fontFamily: font.mono,
                  fontSize: 15,
                }}
              >
                <span style={{color: link.color, width: 105, textTransform: 'uppercase', fontWeight: 900}}>{link.label}</span>
                <span style={{color: colors.text}}>{link.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Scene>
  );
};

const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 1740;
  const {fps} = useVideoConfig();
  const titleSpring = spring({frame: local, fps, config: {damping: 16, stiffness: 95}});
  const benefits = [
    'replay customer impact',
    'auto-fill the timeline',
    'teach every failure mode',
  ];

  return (
    <Scene start={1740} end={1979}>
      <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <Badge color={colors.cyan} style={liftStyle(enter(local, 0, 22), 14)}>Coral incident time-machine</Badge>
        <h2
          style={{
            opacity: titleSpring,
            transform: `scale(${0.93 + titleSpring * 0.07})`,
            fontSize: 102,
            letterSpacing: -6,
            lineHeight: 0.95,
            margin: '24px 0 20px',
          }}
        >
          Turn every outage
          <br />
          into a clickable documentary.
        </h2>
        <div style={{display: 'flex', gap: 14, marginTop: 12}}>
          {benefits.map((benefit, index) => (
            <div
              key={benefit}
              style={{
                ...panelStyle,
                ...liftStyle(enter(local, 62 + index * 18, 20), 14),
                padding: '14px 20px',
                color: index === 1 ? colors.coral : colors.cyan,
                fontFamily: font.mono,
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.7,
              }}
            >
              {benefit}
            </div>
          ))}
        </div>
        <div
          style={{
            ...liftStyle(enter(local, 146, 22), 10),
            marginTop: 38,
            color: colors.muted,
            fontSize: 24,
          }}
        >
          Cross-source SQL joins + live UI evidence + AI narration
        </div>
      </div>
    </Scene>
  );
};

export const IncidentTimeMachine: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: colors.bg,
        color: colors.text,
        fontFamily: font.sans,
      }}
    >
      <GridBackground />
      <TopBar />
      <TimeTicker />
      <IntroScene />
      <QueryScene />
      <SourcesScene />
      <TimelineScene />
      <DiffScene />
      <SummaryScene />
      <ClosingScene />
    </AbsoluteFill>
  );
};
