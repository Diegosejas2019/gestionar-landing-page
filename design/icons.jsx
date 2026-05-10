// Icons.jsx — Inline SVG icon set, stroke-based, 16/20px
// Use: <Icon name="home" size={16} />
const Icon = ({ name, size = 16, stroke = 1.6, color = 'currentColor', style }) => {
  const paths = ICONS[name] || ICONS.dot;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ic"
      style={style}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
};

const ICONS = {
  // Sidebar nav
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.2" fill="currentColor"/></>,
  receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  users: <><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.5-3.3 3-5.5 6-5.5s5.5 2.2 6 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M21 18c-.3-2.3-1.8-3.8-4-4.2"/></>,
  megaphone: <><path d="M3 10v4l11 5V5z"/><path d="M14 8a4 4 0 0 1 0 8"/><path d="M7 14v3a2 2 0 0 0 4 0"/></>,
  alert: <><path d="m12 3 10 18H2z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.8" fill="currentColor"/></>,
  vote: <><path d="M3 11.5 12 4l9 7.5"/><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="m9 15 2 2 4-4"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  car: <><path d="M5 17V13l2-5h10l2 5v4"/><path d="M3 17h18v3H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></>,
  truck: <><rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7v.5"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/></>,
  cog: <><circle cx="12" cy="12" r="3"/><path d="m12 1 1.6 2.6L17 3l-.4 3.4L19 9l-2.4 1.6.4 3.4-3.4-.6L12 16l-1.6-2.6L7 14l.4-3.4L5 9l2.4-1.6L7 4l3.4.6z"/></>,

  // Topbar
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  inbox: <><path d="M3 13V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 13h5l1.5 3h5L16 13h5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
  command: <><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/></>,

  // Generic
  plus: <><path d="M12 5v14M5 12h14"/></>,
  filter: <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
  download: <><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/></>,
  upload: <><path d="M12 20V8"/><path d="m7 13 5-5 5 5"/><path d="M4 4h16"/></>,
  chev: <><path d="m9 6 6 6-6 6"/></>,
  chevDown: <><path d="m6 9 6 6 6-6"/></>,
  chevUp: <><path d="m6 15 6-6 6 6"/></>,
  chevLeft: <><path d="m15 6-6 6 6 6"/></>,
  more: <><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>,
  moreV: <><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></>,
  arrowUp: <><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></>,
  arrowDown: <><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></>,
  arrowRight: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  check: <><path d="m5 12 5 5L20 7"/></>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  x: <><path d="M6 6l12 12M18 6 6 18"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></>,
  pin: <><path d="M12 22v-7"/><path d="M8 9c0-2 1.5-4 4-4s4 2 4 4v3l2 3H6l2-3z"/></>,
  bolt: <><path d="m13 3-9 11h7l-1 7 9-11h-7z"/></>,
  shield: <><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6z"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.5-3.6 3.2-6 7-6s6.5 2.4 7 6"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></>,
  phone: <><path d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></>,
  whatsapp: <><path d="M3 21l1.6-4.5A8.5 8.5 0 1 1 8 20z"/><path d="M9 9c0 4 3 7 6 7l1.5-1.5-2.5-1.2-1.2 1c-1-.5-2-1.5-2.5-2.5l1-1.2-1.2-2.5z" fill="currentColor"/></>,
  edit: <><path d="M14 4l6 6"/><path d="M4 20h4l11-11-4-4L4 16z"/></>,
  trash: <><path d="M5 7h14"/><path d="m6 7 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4h6v3"/></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  link: <><path d="M9 15a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 6"/><path d="M15 9a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6-6"/></>,
  document: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/></>,
  pieChart: <><path d="M12 3v9h9"/><path d="M21 12a9 9 0 1 1-9-9"/></>,
  refresh: <><path d="M3 12a9 9 0 0 1 16-5"/><path d="M19 4v4h-4"/><path d="M21 12a9 9 0 0 1-16 5"/><path d="M5 20v-4h4"/></>,
  external: <><path d="M14 3h7v7"/><path d="m21 3-9 9"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
  print: <><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M6 14h12v7H6z"/></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></>,
  star: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6L12 17l-5.4 2.8 1-6L3.2 9.4l6.1-.9z"/></>,
  flag: <><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></>,
  send: <><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></>,
  bookmark: <><path d="M5 3h14v18l-7-4-7 4z"/></>,
  dot: <circle cx="12" cy="12" r="3" fill="currentColor"/>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  key: <><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m14 9 2 2"/></>,
  drop: <><path d="M12 3s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12z"/></>,
  package: <><path d="m3 8 9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v9"/></>,
  fire: <><path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-2-2-3-2-5 0 0 4 1 4 6a6 6 0 0 1-12 0c0-6 6-7 6-10z"/></>,
};

window.Icon = Icon;
