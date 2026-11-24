// Small stroke icons, drawn to one 24-unit grid so they sit evenly beside Arabic text.
type P = { size?: number; className?: string };
const S = ({ size = 20, className, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const IconPath = (p: P) => <S {...p}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H13a3 3 0 0 0 3-3V8.5" /></S>;
export const IconReview = (p: P) => <S {...p}><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v4h-4" /></S>;
export const IconLibrary = (p: P) => <S {...p}><rect x="4" y="4" width="6" height="16" rx="1.5" /><rect x="14" y="4" width="6" height="16" rx="1.5" /><path d="M7 8v.01M17 8v.01" /></S>;
export const IconBolt = (p: P) => <S {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></S>;
export const IconFlame = (p: P) => <S {...p}><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.4 3.6-8.3.6 1.6 1.5 2.6 2.6 3 .3-2.3 1.3-4.3 3-6 .2 3.4 4.8 5.7 4.8 11.3 0 3.6-3.6 6.2-7.5 6.2Z" /></S>;
export const IconLock = (p: P) => <S {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>;
export const IconCheck = (p: P) => <S {...p}><path d="m5 12.5 4.2 4.2L19 7" /></S>;
export const IconX = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IconBulb = (p: P) => <S {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></S>;
export const IconQuestion = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17v.01" /></S>;
export const IconFlask = (p: P) => <S {...p}><path d="M9 3h6M10 3v6L4.8 18.2A1.9 1.9 0 0 0 6.4 21h11.2a1.9 1.9 0 0 0 1.6-2.8L14 9V3" /><path d="M7.5 15h9" /></S>;
export const IconShield = (p: P) => <S {...p}><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></S>;
export const IconArrowNext = (p: P) => <S {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></S>; // points left: "next" in RTL
export const IconArrowPrev = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>;
export const IconBook = (p: P) => <S {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></S>;
export const IconWarn = (p: P) => <S {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17v.01" /></S>;
export const IconChat = (p: P) => <S {...p}><path d="M4 5h16v11H9l-5 4V5Z" /></S>;
export const IconLink = (p: P) => <S {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></S>;
export const IconCloud = (p: P) => <S {...p}><path d="M7 18h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 7 18Z" /></S>;
export const IconTarget = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></S>;
