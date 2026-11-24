// Lido: a 5 mm LED with legs. Original character for Dāra.
// mood changes the eyes and glow; `lit` makes the dome glow amber.

type Mood = 'happy' | 'think' | 'cheer' | 'calm';

export function Lido({ size = 96, mood = 'happy', lit = true }: { size?: number; mood?: Mood; lit?: boolean }) {
  const dome = lit ? '#F7B731' : '#E8DCC4';
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" role="img" aria-label="ليدو" className={`lido lido-${mood}`}>
      {lit && <circle cx="50" cy="40" r="36" fill="#F7B731" opacity="0.18" className="lido-glow" />}
      {/* legs: the anode is longer, as on a real LED */}
      <path d="M41 78v24c0 4-3 6-7 6" stroke="#8C8378" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M59 78v28c0 3 3 5 7 5" stroke="#8C8378" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* dome */}
      <path d="M24 74V44a26 26 0 0 1 52 0v30Z" fill={dome} />
      <path d="M30 44a20 20 0 0 1 12-18" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.55" fill="none" />
      {/* rim */}
      <rect x="20" y="72" width="60" height="9" rx="4.5" fill="#E09A12" />
      {/* face */}
      {mood === 'cheer' ? (
        <>
          <path d="M38 47q4-5 8 0M54 47q4-5 8 0" stroke="#3A2E22" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M42 56q8 9 16 0" stroke="#3A2E22" strokeWidth="3" fill="#7A3B1A" strokeLinecap="round" />
        </>
      ) : mood === 'think' ? (
        <>
          <circle cx="42" cy="47" r="3.6" fill="#3A2E22" />
          <circle cx="58" cy="45" r="3.6" fill="#3A2E22" />
          <path d="M44 60h12" stroke="#3A2E22" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : mood === 'calm' ? (
        <>
          <path d="M38 48h8M54 48h8" stroke="#3A2E22" strokeWidth="3" strokeLinecap="round" />
          <path d="M44 58q6 4 12 0" stroke="#3A2E22" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="42" cy="47" r="3.8" fill="#3A2E22" />
          <circle cx="58" cy="47" r="3.8" fill="#3A2E22" />
          <circle cx="43.3" cy="45.6" r="1.2" fill="#fff" />
          <circle cx="59.3" cy="45.6" r="1.2" fill="#fff" />
          <path d="M43 57q7 6 14 0" stroke="#3A2E22" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="34" cy="55" r="3.5" fill="#F08A5D" opacity="0.5" />
      <circle cx="66" cy="55" r="3.5" fill="#F08A5D" opacity="0.5" />
    </svg>
  );
}

export function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="bubble">{children}</div>;
}

/** The Dāra mark: a solder pad with a copper trace bending into the letter dāl. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#0B7A75" />
      <path d="M12 12h10a6 6 0 0 1 6 6v10H12" stroke="#E9B56A" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.6" fill="#F7B731" />
      <circle cx="12" cy="28" r="3.6" fill="#F7B731" />
    </svg>
  );
}
