'use strict';

/* ============================================================
   Duft-Butler – alles läuft lokal im Browser (localStorage)
   ============================================================ */

const KEY = 'duftbutler.v1';

// warmth: -2 = sehr frisch/leicht … +2 = sehr warm/schwer
const FAMILIES = {
  zitrisch:     { label: 'Zitrisch',     warmth: -2 },
  aquatisch:    { label: 'Aquatisch',    warmth: -2 },
  frisch:       { label: 'Frisch',       warmth: -1.5 },
  gruen:        { label: 'Grün',         warmth: -1 },
  aromatisch:   { label: 'Aromatisch',   warmth: -0.5 },
  fruchtig:     { label: 'Fruchtig',     warmth: -0.5 },
  blumig:       { label: 'Blumig',       warmth: 0 },
  pudrig:       { label: 'Pudrig',       warmth: 0.5 },
  holzig:       { label: 'Holzig',       warmth: 0.8 },
  wuerzig:      { label: 'Würzig',       warmth: 1.2 },
  ledrig:       { label: 'Ledrig',       warmth: 1.5 },
  suess:        { label: 'Süß',          warmth: 1.6 },
  gourmand:     { label: 'Gourmand',     warmth: 2 },
  orientalisch: { label: 'Orientalisch', warmth: 2 },
};

const OCCASIONS = {
  uni:      { label: 'Uni',      icon: '🎓', warmth: -0.2, strength: 2.5, word: 'hörsaaltauglich' },
  gym:     { label: 'Gym',      icon: '🏋️', warmth: -2.5, strength: 1.5, word: 'dezent' },
  buero:    { label: 'Büro',     icon: '💼', warmth: -0.3, strength: 2.5, word: 'unaufdringlich' },
  date:     { label: 'Date',     icon: '🌹', warmth: 0.6,  strength: 3.5, word: 'verführerisch' },
  ausgehen: { label: 'Ausgehen', icon: '🥂', warmth: 0.8,  strength: 4.3, word: 'mit Projektion' },
  alltag:   { label: 'Alltag',   icon: '☀️', warmth: 0,    strength: 3,   word: 'unkompliziert' },
};

const SEASONS = { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' };
const STRENGTH = ['', 'sehr dezent', 'dezent', 'mittel', 'stark', 'Beast Mode'];
const PRIORITY = { 1: 'Muss ich haben', 2: 'Gerne', 3: 'Irgendwann' };
const FORGOTTEN_DAYS = 30;

// Damit „Vanilla“ und „Vanille“ als dieselbe Note zählen
const ALIASES = {
  bergamot: 'bergamotte', vanilla: 'vanille', lavender: 'lavendel', sandalwood: 'sandelholz',
  cedar: 'zeder', zedernholz: 'zeder', cedarwood: 'zeder', patchouly: 'patchouli', tonka: 'tonkabohne',
  'tonka bean': 'tonkabohne', musk: 'moschus', leather: 'leder', rose: 'rose', jasmine: 'jasmin',
  pepper: 'pfeffer', 'schwarzer pfeffer': 'pfeffer', 'black pepper': 'pfeffer', cardamom: 'kardamom',
  apple: 'apfel', lemon: 'zitrone', mint: 'minze', incense: 'weihrauch', olibanum: 'weihrauch',
  tobacco: 'tabak', cinnamon: 'zimt', 'orange blossom': 'orangenblüte', ginger: 'ingwer',
  coffee: 'kaffee', honey: 'honig', caramel: 'karamell', amber: 'amber', ambra: 'amber',
  'sea notes': 'meeresnoten', 'marine notes': 'meeresnoten', marine: 'meeresnoten', oakmoss: 'eichenmoos',
  rosemary: 'rosmarin', sage: 'salbei', nutmeg: 'muskat', muskatnuss: 'muskat', iris: 'iris',
  orris: 'iris', mandarin: 'mandarine', juniper: 'wacholder', caraway: 'kümmel', 'pink pepper': 'rosa pfeffer',
  saffron: 'safran', pineapple: 'ananas', birch: 'birke', rum: 'rum', cacao: 'kakao', cocoa: 'kakao',
};

/* ---------- Layering: Noten → Akkord-Kategorien ---------- */
// Reihenfolge zählt: das erste passende Stichwort gewinnt (z. B. „Veilchenblatt“ vor „Veilchen“)
const NOTE_KEYWORDS = [
  ['veilchenblatt', 'kraut'], ['feigenblatt', 'kraut'], ['muskateller', 'kraut'], ['grüne minze', 'kraut'],
  ['grüner weihrauch', 'amber'], ['grüner apfel', 'frucht'], ['orangenblüte', 'blume'], ['hibiskus', 'blume'],
  ['melone', 'frucht'], ['ambrette', 'moschus'], ['kokos', 'gourmand'], ['bittermandel', 'gourmand'], ['zyanid', 'gourmand'],
  ['harz', 'amber'], ['balsam', 'amber'],
  // Zitrus
  ['zitrus', 'zitrus'], ['zitron', 'zitrus'], ['bergamott', 'zitrus'], ['grapefruit', 'zitrus'], ['mandarin', 'zitrus'],
  ['orange', 'zitrus'], ['yuzu', 'zitrus'], ['limette', 'zitrus'], ['petitgrain', 'zitrus'],
  // Frucht
  ['apfel', 'frucht'], ['birne', 'frucht'], ['pfirsich', 'frucht'], ['himbeer', 'frucht'], ['johannisbeer', 'frucht'],
  ['pflaume', 'frucht'], ['kirsch', 'frucht'], ['mango', 'frucht'], ['ananas', 'frucht'], ['frucht', 'frucht'],
  ['früchte', 'frucht'], ['aprikose', 'frucht'], ['feige', 'frucht'], ['dattel', 'frucht'], ['sapo', 'frucht'], ['rhabarber', 'frucht'],
  // Blüten
  ['rose', 'blume'], ['jasmin', 'blume'], ['iris', 'blume'], ['veilchen', 'blume'], ['tuberose', 'blume'], ['ylang', 'blume'],
  ['magnolie', 'blume'], ['lilie', 'blume'], ['maiglöckchen', 'blume'], ['gardenie', 'blume'], ['osmanthus', 'blume'],
  ['geranie', 'blume'], ['heliotrop', 'blume'], ['tiaré', 'blume'], ['blüte', 'blume'], ['hyazinthe', 'blume'],
  ['ringelblume', 'blume'], ['neroli', 'blume'], ['hedion', 'blume'],
  // Kräuter & Grün
  ['lavendel', 'kraut'], ['lavandin', 'kraut'], ['minze', 'kraut'], ['rosmarin', 'kraut'], ['salbei', 'kraut'],
  ['basilikum', 'kraut'], ['matcha', 'kraut'], ['tee', 'kraut'], ['fenchel', 'kraut'], ['verbene', 'kraut'],
  ['thymian', 'kraut'], ['oregano', 'kraut'], ['grün', 'kraut'], ['wacholder', 'kraut'], ['karotte', 'kraut'], ['angelika', 'kraut'],
  // Gewürze
  ['pfeffer', 'gewuerz'], ['zimt', 'gewuerz'], ['kardamom', 'gewuerz'], ['safran', 'gewuerz'], ['muskat', 'gewuerz'],
  ['ingwer', 'gewuerz'], ['piment', 'gewuerz'], ['kümmel', 'gewuerz'], ['koriander', 'gewuerz'], ['nelke', 'gewuerz'],
  // Amber & Harze
  ['amber', 'amber'], ['ambra', 'amber'], ['ambrox', 'amber'], ['ambertonic', 'amber'], ['ambrofix', 'amber'], ['labdanum', 'amber'],
  ['benzoe', 'amber'], ['weihrauch', 'amber'], ['myrrhe', 'amber'], ['opoponax', 'amber'], ['elemi', 'amber'], ['zistrose', 'amber'],
  // Süße / Gourmand
  ['vanille', 'gourmand'], ['tonka', 'gourmand'], ['karamell', 'gourmand'], ['pralin', 'gourmand'], ['schokolade', 'gourmand'],
  ['kakao', 'gourmand'], ['kaffee', 'gourmand'], ['mandel', 'gourmand'], ['honig', 'gourmand'], ['zucker', 'gourmand'], ['amaretto', 'gourmand'],
  // Boozy
  ['rum', 'alkohol'], ['cognac', 'alkohol'], ['wein', 'alkohol'],
  // Dunkel
  ['tabak', 'dunkel'], ['leder', 'dunkel'], ['rauch', 'dunkel'], ['oud', 'dunkel'], ['castoreum', 'dunkel'], ['erde', 'dunkel'],
  // Hölzer
  ['holz', 'holz'], ['hölzer', 'holz'], ['zeder', 'holz'], ['vetiver', 'holz'], ['guajak', 'holz'], ['zypresse', 'holz'],
  ['cypriol', 'holz'], ['patchouli', 'holz'], ['akigala', 'holz'], ['palo santo', 'holz'], ['amyris', 'holz'], ['birke', 'holz'],
  ['eiche', 'holz'], ['moos', 'holz'], ['tanne', 'holz'], ['palisander', 'holz'], ['kaschmir', 'holz'],
  // Moschus & Pudrig
  ['moschus', 'moschus'], ['talkum', 'moschus'], ['aldehyd', 'moschus'], ['pudrig', 'moschus'],
  // Aquatisch
  ['meer', 'aquatisch'], ['aquat', 'aquatisch'], ['mineral', 'aquatisch'], ['eis-', 'aquatisch'],
];
const CAT_LABEL = {
  zitrus: 'Zitrus', frucht: 'Frucht', blume: 'Blüten', kraut: 'Kräuter', gewuerz: 'Gewürze', amber: 'Amber & Harze',
  gourmand: 'Süße', alkohol: 'Boozy-Noten', dunkel: 'Tabak, Leder & Oud', holz: 'Hölzer', moschus: 'Moschus', aquatisch: 'Aquatisches',
};
const CAT_WARMTH = {
  zitrus: -2, aquatisch: -2, kraut: -1, frucht: -0.5, blume: 0, moschus: 0.3, holz: 0.8,
  gewuerz: 1.2, amber: 1.5, alkohol: 1.5, dunkel: 1.6, gourmand: 2,
};
const FAMILY_CAT = {
  zitrisch: 'zitrus', aquatisch: 'aquatisch', frisch: 'zitrus', gruen: 'kraut', aromatisch: 'kraut', fruchtig: 'frucht',
  blumig: 'blume', pudrig: 'moschus', holzig: 'holz', wuerzig: 'gewuerz', ledrig: 'dunkel', suess: 'gourmand',
  gourmand: 'gourmand', orientalisch: 'amber',
};
// Wie gut sich zwei Akkorde beim Layern ergänzen (-1 = beißt sich, 1 = Traumpaar) + Begründung
const PAIRS = {
  'gourmand|zitrus': [1, 'Zitrus hellt die Süße auf und macht sie leichter'],
  'dunkel|gourmand': [1, 'Süße rundet Tabak, Leder & Oud weich ab'],
  'blume|dunkel': [1, 'Blüten auf Oud & Leder – ein Layering-Klassiker'],
  'gourmand|kraut': [0.8, 'Kräuter-Frische trifft Süße – wie Lavendel auf Vanille'],
  'gewuerz|gourmand': [0.8, 'Gewürze geben der Süße Tiefe'],
  'alkohol|gourmand': [0.9, 'Boozy-Noten und Süße – wie ein Dessert-Cocktail'],
  'blume|gourmand': [0.8, 'Blüten werden durch Süße cremig und weich'],
  'frucht|gourmand': [0.6, 'Frucht und Süße – saftig und verspielt'],
  'gourmand|holz': [0.6, 'Hölzer geben der Süße Struktur'],
  'gourmand|moschus': [0.6, 'Moschus macht die Süße hautnah und weich'],
  'amber|gourmand': [0.7, 'Amber und Süße – warm und einhüllend'],
  'aquatisch|gourmand': [-1, ''],
  'dunkel|gewuerz': [0.8, 'Gewürze verstärken die dunkle, rauchige Seite'],
  'amber|dunkel': [0.8, 'Harze und Oud/Leder – tief und orientalisch'],
  'dunkel|frucht': [0.7, 'Frucht bringt Licht in das Dunkle'],
  'dunkel|zitrus': [0.6, 'Zitrus lockert die schwere Basis auf'],
  'alkohol|dunkel': [0.8, 'Boozy-Noten und Tabak – wie Zigarre und Cognac'],
  'aquatisch|dunkel': [-1, ''],
  'holz|zitrus': [0.9, 'Zitrus über Hölzern – frisch und elegant'],
  'kraut|zitrus': [0.7, 'Zitrus und Kräuter – klassisch frisch'],
  'moschus|zitrus': [0.6, 'Moschus verlängert die Zitrus-Frische'],
  'amber|zitrus': [0.7, 'Zitrus-Spritzer über warmem Amber'],
  'blume|zitrus': [0.5, 'Zitrus macht die Blüten luftiger'],
  'blume|holz': [0.7, 'Hölzer erden die Blüten'],
  'blume|moschus': [0.8, 'Moschus macht die Blüten weich und hautnah'],
  'amber|blume': [0.7, 'Amber gibt den Blüten Wärme'],
  'blume|gewuerz': [0.6, 'Gewürze machen die Blüten spannender'],
  'blume|frucht': [0.6, 'Frucht und Blüten – saftig-floral'],
  'gewuerz|holz': [0.7, 'Gewürze und Hölzer – trocken und maskulin'],
  'amber|holz': [0.7, 'Amber macht die Hölzer warm und rund'],
  'holz|kraut': [0.6, 'Kräuter und Hölzer – aromatisch und sauber'],
  'amber|gewuerz': [0.8, 'Gewürze und Harze – orientalische Wärme'],
  'amber|frucht': [0.5, 'Frucht über warmem Amber'],
  'frucht|moschus': [0.5, 'Moschus macht die Frucht weicher'],
  'aquatisch|kraut': [0.5, 'Aquatisch und Kräuter – sportlich frisch'],
  'aquatisch|zitrus': [0.5, 'Zitrus und Meer – sommerlich'],
  'alkohol|frucht': [0.6, 'Frucht und Boozy-Noten – wie ein Cocktail'],
  'amber|aquatisch': [-0.5, ''],
};
const pairInfo = (a, b) => (a === b ? [0.35, ''] : PAIRS[[a, b].sort().join('|')] || [0.2, '']);

/* ---------- Helfer ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => dateStr(new Date());
const daysAgoStr = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateStr(d); };
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const daysSince = (s) => Math.round((parseDate(todayStr()) - parseDate(s)) / 864e5);
const arr = (v) => (Array.isArray(v) ? v : []);
const splitNotes = (s) => String(s || '').split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
const arrStr = (v) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : splitNotes(v));
const noteKey = (n) => { const k = String(n).toLowerCase().trim().replace(/\s+/g, ' '); return ALIASES[k] || k; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const allNotes = (p) => [...p.top, ...p.heart, ...p.base];
const noteSet = (p) => new Set(allNotes(p).map(noteKey));
const euro = (v) => Number(v || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function fmtDate(s) {
  const n = daysSince(s);
  if (n === 0) return 'Heute';
  if (n === 1) return 'Gestern';
  return parseDate(s).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}
function agoText(s) {
  if (!s) return 'noch nie getragen';
  const n = daysSince(s);
  if (n <= 0) return 'heute getragen';
  if (n === 1) return 'gestern getragen';
  return `vor ${n} Tagen getragen`;
}
function currentSeason(d = new Date()) {
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'fruehling';
  if (m <= 7) return 'sommer';
  return 'herbst';
}

/* ---------- Daten ---------- */
function emptyDb() {
  return { perfumes: [], wears: [], wishlist: [], suggestLog: [], settings: { location: null, weather: null } };
}

function fixPerfume(p) {
  return {
    id: p.id || uid(),
    name: String(p.name || 'Unbenannt').trim(),
    brand: String(p.brand || '').trim(),
    top: arrStr(p.top), heart: arrStr(p.heart), base: arrStr(p.base),
    family: FAMILIES[p.family] ? p.family : 'holzig',
    strength: clamp(Math.round(Number(p.strength)) || 3, 1, 5),
    seasons: arr(p.seasons).filter((s) => SEASONS[s]),
    occasions: arr(p.occasions).filter((o) => OCCASIONS[o]),
    fill: clamp(Number(p.fill ?? 100) || 0, 0, 100),
    rating: clamp(Math.round(Number(p.rating)) || 3, 1, 5),
    notes: String(p.notes || ''),
    created: p.created || todayStr(),
  };
}

function normalize(d) {
  const e = emptyDb();
  const perfumes = arr(d.perfumes).filter((p) => p && typeof p === 'object').map(fixPerfume);
  const ids = new Set(perfumes.map((p) => p.id));
  return {
    perfumes,
    wears: arr(d.wears)
      .filter((w) => w && ids.has(String(w.perfumeId)) && /^\d{4}-\d{2}-\d{2}$/.test(w.date))
      .map((w) => ({
        id: w.id || uid(), perfumeId: String(w.perfumeId), date: w.date,
        layerId: w.layerId && ids.has(String(w.layerId)) && String(w.layerId) !== String(w.perfumeId) ? String(w.layerId) : '',
        occasion: OCCASIONS[w.occasion] ? w.occasion : 'alltag',
        compliments: Math.max(0, parseInt(w.compliments, 10) || 0), note: String(w.note || ''),
      })),
    wishlist: arr(d.wishlist).filter((w) => w && typeof w === 'object').map((w) => ({
      id: w.id || uid(), name: String(w.name || 'Unbenannt'), brand: String(w.brand || ''),
      price: Math.max(0, Number(w.price) || 0), shop: String(w.shop || ''), notes: arrStr(w.notes),
      priority: clamp(parseInt(w.priority, 10) || 2, 1, 3),
    })),
    suggestLog: arr(d.suggestLog).filter((x) => x && x.id && x.date).slice(-40),
    settings: { ...e.settings, ...(d.settings && typeof d.settings === 'object' ? d.settings : {}) },
  };
}

// Startdaten: deine Sammlung aus sammlung.js – falls die fehlt, die 5 Demo-Düfte
function sampleData() {
  if (window.START_DATA && Array.isArray(window.START_DATA.perfumes)) return normalize(window.START_DATA);
  return demoData();
}

function demoData() {
  const P = [
    { id: 'demo-sauvage', name: 'Sauvage EDT', brand: 'Dior', family: 'aromatisch', strength: 4,
      top: 'Bergamotte, Pfeffer', heart: 'Sichuan-Pfeffer, Lavendel, Geranie, Vetiver', base: 'Ambroxan, Zeder, Labdanum',
      seasons: ['fruehling', 'sommer', 'herbst', 'winter'], occasions: ['alltag', 'buero', 'ausgehen'], fill: 70, rating: 4,
      notes: 'Der sichere Allrounder.' },
    { id: 'demo-bleu', name: 'Bleu de Chanel EDP', brand: 'Chanel', family: 'holzig', strength: 3,
      top: 'Grapefruit, Zitrone, Minze', heart: 'Ingwer, Muskat, Jasmin', base: 'Weihrauch, Zeder, Sandelholz',
      seasons: ['fruehling', 'herbst', 'winter'], occasions: ['buero', 'date', 'alltag'], fill: 45, rating: 5,
      notes: 'Elegant, passt fast immer.' },
    { id: 'demo-lanuit', name: "La Nuit de L'Homme", brand: 'Yves Saint Laurent', family: 'wuerzig', strength: 2,
      top: 'Kardamom', heart: 'Lavendel, Zeder, Bergamotte', base: 'Vetiver, Kümmel',
      seasons: ['herbst', 'winter'], occasions: ['date'], fill: 85, rating: 4,
      notes: 'Hautnah – ideal für Abende zu zweit.' },
    { id: 'demo-lightblue', name: 'Light Blue Pour Homme', brand: 'Dolce & Gabbana', family: 'zitrisch', strength: 2,
      top: 'Grapefruit, Bergamotte, Mandarine, Wacholder', heart: 'Pfeffer, Rosmarin, Palisander', base: 'Moschus, Eichenmoos, Weihrauch',
      seasons: ['fruehling', 'sommer'], occasions: ['gym', 'alltag'], fill: 30, rating: 3,
      notes: 'Sommer- und Sportduft.' },
    { id: 'demo-lemale', name: 'Le Male EDT', brand: 'Jean Paul Gaultier', family: 'suess', strength: 4,
      top: 'Lavendel, Minze, Kardamom, Bergamotte', heart: 'Zimt, Orangenblüte, Kümmel', base: 'Vanille, Tonkabohne, Sandelholz, Amber, Zeder',
      seasons: ['herbst', 'winter'], occasions: ['date', 'ausgehen'], fill: 60, rating: 5,
      notes: 'Bringt die meisten Komplimente.' },
  ];
  const W = (pid, ago, occ, comp, note = '') => ({ id: uid(), perfumeId: pid, date: daysAgoStr(ago), occasion: occ, compliments: comp, note });
  return normalize({
    perfumes: P,
    wears: [
      W('demo-sauvage', 1, 'alltag', 0),
      W('demo-lemale', 2, 'date', 3, '„Du riechst unglaublich gut“'),
      W('demo-bleu', 3, 'buero', 1, 'Kollegin hat nachgefragt'),
      W('demo-sauvage', 4, 'buero', 1),
      W('demo-lightblue', 5, 'gym', 0),
      W('demo-bleu', 7, 'buero', 0),
      W('demo-sauvage', 9, 'alltag', 0),
      W('demo-lemale', 12, 'ausgehen', 2),
      W('demo-sauvage', 15, 'ausgehen', 2),
      W('demo-bleu', 20, 'date', 1),
      W('demo-lanuit', 45, 'date', 2),
    ],
    wishlist: [
      { name: 'Oud Wood', brand: 'Tom Ford', price: 245, shop: 'Douglas', notes: 'Oud, Sandelholz, Vetiver, Kardamom, Tonkabohne', priority: 2 },
      { name: 'Luna Rossa Carbon', brand: 'Prada', price: 72, shop: '', notes: 'Bergamotte, Pfeffer, Lavendel, Ambroxan', priority: 1 },
    ],
    settings: {},
  });
}

let fresh = false;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { /* privat-Modus */ }
  if (raw) {
    try { return normalize(JSON.parse(raw)); }
    catch (e) { try { localStorage.setItem(`${KEY}.defekt-${Date.now()}`, raw); } catch (_) { /* egal */ } }
  }
  fresh = true;
  return sampleData();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('Speichern fehlgeschlagen – ist der Speicher voll?'); }
}

let db = load();
if (fresh) save();
migrate();

// Einmalige Daten-Updates für bereits installierte Apps
function migrate() {
  let changed = false;
  // v2: neuer Anlass „Uni“ – Düfte, die fürs Büro oder den Alltag gedacht und nicht zu laut sind, eignen sich auch für die Uni
  if (!db.settings.migratedUni) {
    for (const p of db.perfumes) {
      if (!p.occasions.includes('uni') && p.strength <= 4 && (p.occasions.includes('buero') || p.occasions.includes('alltag'))) {
        p.occasions.push('uni');
      }
    }
    db.settings.migratedUni = true;
    changed = true;
  }
  if (changed) save();
}

const state = {
  view: 'today', occasion: null, excluded: [], topId: null,
  layerKey: '', layerExcluded: [], layerId: null,
  search: '', sort: 'name', diaryLimit: 30,
  blind: { name: '', brand: '', family: '', top: '', heart: '', base: '' }, blindResult: null,
};

const perfumeById = (id) => db.perfumes.find((p) => p.id === id);
// Gelayerte Düfte zählen als getragen (für Abwechslung, Statistik und vergessene Flaschen)
const wearsOf = (id) => db.wears.filter((w) => w.perfumeId === id || w.layerId === id);
const complimentsOf = (id) => wearsOf(id).reduce((a, w) => a + w.compliments, 0);
function lastWornDate(id) {
  let m = null;
  for (const w of db.wears) if ((w.perfumeId === id || w.layerId === id) && (!m || w.date > m)) m = w.date;
  return m;
}
const wearName = (w) => {
  const p = perfumeById(w.perfumeId);
  const l = w.layerId ? perfumeById(w.layerId) : null;
  return (p ? p.name : '?') + (l ? ` + ${l.name}` : '');
};

/* ---------- Layering-Logik ---------- */
function noteCat(note) {
  const k = String(note).toLowerCase();
  for (const [kw, cat] of NOTE_KEYWORDS) if (k.includes(kw)) return cat;
  return null;
}
// Akkord-Profil eines Dufts: Anteil je Kategorie (Summe 1)
function catVector(p) {
  const v = {};
  let total = 0;
  const add = (notes, w) => notes.forEach((n) => { const c = noteCat(n); if (c) { v[c] = (v[c] || 0) + w; total += w; } });
  add(p.top || [], 0.7); add(p.heart || [], 1); add(p.base || [], 1.2);
  const fc = FAMILY_CAT[p.family];
  if (fc) { const w = total ? total * 0.3 : 1; v[fc] = (v[fc] || 0) + w; total += w; }
  if (total) for (const c in v) v[c] /= total;
  return v;
}
function warmthOf(p) {
  if (FAMILIES[p.family]) return FAMILIES[p.family].warmth;
  const v = catVector(p);
  return Object.entries(v).reduce((s, [c, w]) => s + CAT_WARMTH[c] * w, 0);
}
const sprays = (s) => (s >= 4 ? '1 Sprüher' : s === 3 ? '1–2 Sprüher' : '2–3 Sprüher');

// Wie gut passen zwei Düfte geschichtet zusammen? (ohne Wetter/Anlass)
function layerScore(a, b) {
  const va = catVector(a), vb = catVector(b);
  let comp = 0, best = null, bestVal = 0;
  for (const ca in va) for (const cb in vb) {
    const [s, why] = pairInfo(ca, cb);
    const val = va[ca] * vb[cb] * s;
    comp += val;
    if (why && val > bestVal) { bestVal = val; best = why; }
  }
  let score = comp * 4;
  const why = [];
  if (best) why.push(best);

  const sa = noteSet(a), sb = noteSet(b);
  const shared = [...sa].filter((k) => sb.has(k));
  const label = (k) => cap(allNotes(a).find((n) => noteKey(n) === k) || k);
  if (shared.length >= 1 && shared.length <= 3) {
    score += 0.3 + Math.min(shared.length, 2) * 0.2;
    why.push(`${shared.length === 1 ? 'Gemeinsame Note' : 'Gemeinsame Noten'} ${shared.map(label).join(', ')} ${shared.length === 1 ? 'verbindet' : 'verbinden'} beide`);
  }
  const sim = similarity(sa, a.family, sb, b.family);
  if (shared.length >= 5 || sim > 0.55) score -= 1.5; // zu ähnlich – bringt nichts Neues

  const wa = warmthOf(a), wb = warmthOf(b), wd = Math.abs(wa - wb);
  if (wd >= 0.8 && wd <= 3) { score += 0.5; if (why.length < 2) why.push('Spannender Kontrast aus leicht und schwer'); }
  if ((a.strength || 3) + (b.strength || 3) >= 9) score -= 0.8;
  if (allNotes(b).length < 3) score -= 1.2; // zu wenig Noten bekannt – Empfehlung wäre geraten
  score += ((b.rating || 3) - 3) * 0.25;

  // Eigene Erfahrung: schon zusammen getragen?
  const together = db.wears.filter((w) => (w.perfumeId === a.id && w.layerId === b.id) || (w.perfumeId === b.id && w.layerId === a.id));
  if (together.length) {
    const c = together.reduce((s, w) => s + w.compliments, 0);
    score += 0.4 + Math.min(1, c * 0.2);
    why.unshift(c ? `Schon ${together.length}× zusammen getragen – ${plural(c, 'Kompliment', 'Komplimente')}` : `Schon ${together.length}× zusammen getragen`);
  }

  // Reihenfolge: das Wärmere/Schwerere zuerst als Basis
  const baseFirst = wa > wb || (wa === wb && (a.strength || 3) >= (b.strength || 3));
  const [under, over] = baseFirst ? [a, b] : [b, a];
  const tip = `Zuerst ${under.name} (${sprays(under.strength || 3)}), dann ${over.name} darüber (${sprays(over.strength || 3)})`;
  return { p: b, score, why: why.slice(0, 2), tip };
}

function layerPartners(p, n = 3) {
  return db.perfumes.filter((x) => x.id !== p.id && x.fill > 0)
    .map((x) => layerScore(p, x)).sort((a, b) => b.score - a.score).slice(0, n);
}

// Layering passend zu Wetter und Anlass
function layerForToday(base, occ, prof) {
  if (occ === 'gym') return [];
  const quiet = occ === 'buero' || occ === 'uni';
  return db.perfumes.filter((x) => x.id !== base.id && x.fill > 0).map((x) => {
    const r = layerScore(base, x);
    const combined = 0.6 * warmthOf(base) + 0.4 * warmthOf(x);
    r.score -= Math.abs(combined - prof.warmth) * 1.2;
    if (quiet && x.strength >= 4) r.score -= 1;
    if (x.seasons.includes(prof.season)) r.score += 0.3;
    const last = lastWornDate(x.id);
    if (last) { const d = daysSince(last); if (d <= 0) r.score -= 2; else if (d === 1) r.score -= 0.8; }
    return r;
  }).sort((a, b) => b.score - a.score);
}

/* ---------- Wetter (Open-Meteo, ohne API-Key) ---------- */
let weather = null;
let weatherStatus = 'idle';

function wmo(code) {
  if (code === 0) return ['klar', '☀️'];
  if (code <= 2) return ['leicht bewölkt', '🌤️'];
  if (code === 3) return ['bewölkt', '☁️'];
  if (code === 45 || code === 48) return ['Nebel', '🌫️'];
  if (code >= 51 && code <= 57) return ['Niesel', '🌦️'];
  if (code >= 61 && code <= 67) return ['Regen', '🌧️'];
  if (code >= 71 && code <= 77) return ['Schnee', '❄️'];
  if (code >= 80 && code <= 82) return ['Regenschauer', '🌧️'];
  if (code >= 85 && code <= 86) return ['Schneeschauer', '🌨️'];
  if (code >= 95) return ['Gewitter', '⛈️'];
  return ['wechselhaft', '🌥️'];
}
const isWet = (w) => !!w && (w.precip > 0.1 || (w.code >= 51 && w.code <= 67) || (w.code >= 80 && w.code <= 82) || w.code >= 95);

async function loadWeather(force = false) {
  const loc = db.settings.location;
  if (!loc) { weather = null; weatherStatus = 'noloc'; renderToday(); return; }
  const cached = db.settings.weather;
  const sameLoc = cached && cached.lat === loc.lat && cached.lon === loc.lon;
  if (!force && sameLoc && Date.now() - cached.time < 30 * 60e3) {
    weather = cached; weatherStatus = 'ok'; renderToday(); return;
  }
  weatherStatus = 'loading'; renderToday();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}`
      + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto';
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const c = (await r.json()).current;
    weather = {
      temp: c.temperature_2m, feels: c.apparent_temperature ?? c.temperature_2m, humidity: c.relative_humidity_2m,
      precip: c.precipitation || 0, code: c.weather_code, wind: c.wind_speed_10m,
      time: Date.now(), lat: loc.lat, lon: loc.lon,
    };
    db.settings.weather = weather; save(); weatherStatus = 'ok';
  } catch (e) {
    if (sameLoc && Date.now() - cached.time < 6 * 3600e3) { weather = cached; weatherStatus = 'stale'; }
    else { weather = null; weatherStatus = 'error'; }
  }
  renderToday();
}

function useGeolocation() {
  if (!navigator.geolocation) { toast('Dein Browser unterstützt keine Standortabfrage'); return; }
  toast('Standort wird ermittelt …');
  navigator.geolocation.getCurrentPosition(
    (pos) => setLocation({ name: 'Mein Standort', lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3) }),
    () => toast('Kein Standortzugriff – suche deine Stadt in den Einstellungen'),
    { timeout: 12000, maximumAge: 10 * 60e3 },
  );
}
function setLocation(loc) {
  db.settings.location = loc; save();
  closeSheet(); toast(`Ort: ${loc.name}`);
  loadWeather(true);
}
async function searchCity(q) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=de&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('geo');
  const j = await r.json();
  return (j.results || []).map((x) => ({
    name: x.name, region: [x.admin1, x.country].filter(Boolean).join(', '),
    lat: +x.latitude.toFixed(3), lon: +x.longitude.toFixed(3),
  }));
}

/* ---------- Empfehlungs-Logik ---------- */
function desiredProfile(occ, w) {
  const season = currentSeason();
  const o = OCCASIONS[occ];
  const SEASON_W = { winter: 1.4, herbst: 0.7, fruehling: -0.3, sommer: -1.3 };
  const base = w ? clamp((16 - w.feels) / 6, -2, 2) : SEASON_W[season];
  const wet = isWet(w);
  const muggy = w && w.temp > 22 && w.humidity > 70;
  const warmth = clamp(base + o.warmth * 0.6 + (wet ? 0.4 : 0) + (muggy ? -0.3 : 0), -2, 2);
  const strength = clamp(o.strength + (w ? (w.temp >= 25 ? -0.7 : w.temp <= 8 ? 0.4 : 0) : 0), 1, 5);
  let words = warmth <= -1.2 ? 'frisch und leicht'
    : warmth <= -0.4 ? 'frisch-aromatisch'
    : warmth < 0.4 ? 'ausgewogen'
    : warmth < 1.5 ? 'warm und holzig'
    : 'warm und süß';
  const style = words;
  if (occ === 'gym' || occ === 'buero' || occ === 'uni') words += `, ${o.word}`;
  const parts = w ? [`${Math.round(w.temp)} °C`, wmo(w.code)[0]] : [SEASONS[season]];
  parts.push(o.label);
  return { warmth, strength, season, style, words, headline: `${parts.join(', ')} → ${words}` };
}

function recommend(occ, w) {
  const prof = desiredProfile(occ, w);
  const today = todayStr();
  const o = OCCASIONS[occ];
  const list = db.perfumes.filter((p) => p.fill > 0).map((p) => {
    let s = 0;
    const why = [];
    const fam = FAMILIES[p.family];

    const wd = Math.abs(fam.warmth - prof.warmth);
    s += 5 - wd * 2.4;
    if (wd <= 0.8) why.push(`${fam.label} – genau das gesuchte Profil „${prof.style}“`);

    const sd = Math.abs(p.strength - prof.strength);
    s += 2 - sd * 1.2;
    if (sd <= 0.8) why.push(`Projektion „${STRENGTH[p.strength]}“ passt zu ${o.label}`);

    if (p.occasions.includes(occ)) { s += 3; why.push(`Von dir für ${o.label} vorgesehen`); }
    else s -= occ === 'gym' ? 3 : 1; // beim Sport zählt die Eignung besonders
    if (occ === 'gym' && p.strength >= 4) s -= 3;

    if (p.seasons.includes(prof.season)) { s += 1.2; why.push(`${SEASONS[prof.season]}-tauglich`); }

    s += (p.rating - 3) * 0.7;
    if (p.rating >= 5) why.push('Einer deiner Lieblinge');
    if (p.fill < 10) s -= 0.7;

    // Abwechslung: kürzlich Getragenes rutscht nach hinten
    const ws = wearsOf(p.id);
    const last = ws.reduce((m, x) => (x.date > m ? x.date : m), '');
    const d = last ? daysSince(last) : null;
    if (d !== null) {
      s -= d <= 0 ? 8 : d === 1 ? 5 : d === 2 ? 3 : d <= 4 ? 1.5 : d <= 6 ? 0.5 : 0;
      if (d >= 10) { s += 0.6; why.push(`Lange nicht getragen (${d} Tage)`); }
    } else {
      s += 0.8; why.push('Noch nie getragen – Zeit für eine Premiere');
    }
    const n14 = ws.filter((x) => daysSince(x.date) < 14).length;
    s -= Math.max(0, n14 - 2) * 0.6;

    // Gestern/vorgestern schon vorgeschlagen? Dann heute lieber etwas anderes
    const recentSuggest = db.suggestLog.filter((x) => x.id === p.id && x.date < today && daysSince(x.date) <= 3).length;
    s -= recentSuggest * 1.2;

    if (occ === 'date' || occ === 'ausgehen') {
      const c = ws.reduce((a, x) => a + x.compliments, 0);
      if (ws.length) {
        const rate = c / ws.length;
        s += Math.min(1.5, rate * 0.8);
        if (rate >= 1) why.push(`Kompliment-Magnet (${c}× gelobt)`);
      }
    }
    return { p, score: s, why, days: d };
  }).sort((a, b) => b.score - a.score);
  return { ...prof, list };
}

function logSuggestion(id) {
  const t = todayStr();
  if (db.suggestLog.some((x) => x.id === id && x.date === t)) return;
  db.suggestLog.push({ id, date: t });
  db.suggestLog = db.suggestLog.slice(-40);
  save();
}

/* ---------- Blind-Buy-Logik ---------- */
function weightOf(p) {
  const ws = wearsOf(p.id);
  return Math.max(0, p.rating - 2) + Math.min(ws.length, 20) * 0.15 + ws.reduce((a, w) => a + w.compliments, 0) * 0.3;
}
function similarity(aSet, aFam, bSet, bFam) {
  if (!aSet.size || !bSet.size) return 0;
  let inter = 0;
  for (const n of aSet) if (bSet.has(n)) inter++;
  const jac = inter / (aSet.size + bSet.size - inter);
  const ov = inter / Math.min(aSet.size, bSet.size);
  return Math.min(1, 0.5 * jac + 0.35 * ov + (aFam && aFam === bFam ? 0.15 : 0));
}
function blindCheck(c) {
  const raw = [...splitNotes(c.top), ...splitNotes(c.heart), ...splitNotes(c.base)];
  const keys = [...new Set(raw.map(noteKey))];
  if (!keys.length) return { error: 'Bitte gib mindestens eine Duftnote ein.' };
  const disp = {};
  raw.forEach((n) => { const k = noteKey(n); if (!disp[k]) disp[k] = cap(n.trim()); });

  const prof = {}, fam = {};
  let total = 0, warmSum = 0;
  const favs = new Set();
  for (const p of db.perfumes) {
    const w = weightOf(p);
    if (w <= 0) continue;
    favs.add(p.id); total += w;
    fam[p.family] = (fam[p.family] || 0) + w;
    warmSum += FAMILIES[p.family].warmth * w;
    for (const k of noteSet(p)) prof[k] = (prof[k] || 0) + w;
  }
  if (!favs.size) return { error: 'Ich kenne deinen Geschmack noch nicht. Lege Düfte an und bewerte sie mit mindestens 3 Sternen.' };

  const maxW = Math.max(1e-9, ...Object.values(prof));
  const aff = keys.map((k) => ({ k, label: disp[k], a: prof[k] ? prof[k] / maxW : 0 }));
  const hits = aff.filter((x) => x.a > 0).sort((a, b) => b.a - a.a);
  const hitShare = hits.length / keys.length;
  const avgAff = aff.reduce((s, x) => s + x.a, 0) / keys.length;

  const cSet = new Set(keys);
  const fam0 = FAMILIES[c.family] ? c.family : '';
  const sims = db.perfumes.map((p) => {
    const s = noteSet(p);
    return { p, sim: similarity(cSet, fam0, s, p.family), shared: [...s].filter((k) => cSet.has(k)).map((k) => disp[k]) };
  }).sort((a, b) => b.sim - a.sim);
  const favSim = Math.max(0, ...sims.filter((x) => favs.has(x.p.id)).map((x) => x.sim));

  let famScore = hitShare;
  if (fam0) {
    const share = (fam[fam0] || 0) / total;
    const close = 1 - Math.abs(FAMILIES[fam0].warmth - warmSum / total) / 4;
    famScore = 0.6 * Math.min(1, share * 2.5) + 0.4 * close;
  }
  const fit = Math.round(100 * clamp(0.35 * hitShare + 0.25 * Math.min(1, avgAff * 1.8) + 0.2 * famScore + 0.2 * Math.min(1, favSim * 1.4), 0, 1));

  let verdict, sub;
  if (fit >= 70) { verdict = 'Passt sehr gut zu deinem Geschmack'; sub = 'Das Notenprofil liegt mitten in deiner Komfortzone.'; }
  else if (fit >= 50) { verdict = 'Gute Chancen – lieber vorher testen'; sub = 'Einiges kennst und magst du, ein paar Noten sind Neuland.'; }
  else if (fit >= 35) { verdict = 'Wackelig'; sub = 'Nur teilweise dein Profil. Eine Probe wäre klüger als die ganze Flasche.'; }
  else { verdict = 'Eher nicht dein Ding'; sub = 'Kaum Überschneidungen mit deinen Favoriten.'; }

  return {
    fit, verdict, sub,
    loved: hits.slice(0, 8).map((x) => x.label),
    fresh: aff.filter((x) => x.a === 0).map((x) => x.label),
    layer: layerPartners({
      id: '__kandidat', name: c.name || 'der neue Duft', family: fam0 || null, strength: 3, rating: 3,
      top: splitNotes(c.top), heart: splitNotes(c.heart), base: splitNotes(c.base),
    }, 1)[0] || null,
    best: sims[0] && sims[0].sim >= 0.3 ? sims[0] : null,
    related: sims.slice(1, 3).filter((x) => x.sim >= 0.3),
    cand: { ...c },
  };
}

/* ---------- UI-Grundlagen ---------- */
const sheet = $('#sheet');
function openSheet(html) {
  $('#sheetBody').innerHTML = html;
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
}
function closeSheet() { if (sheet.open) sheet.close(); }
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => { const t = $('#toast'); if (t.parentElement !== document.body) document.body.appendChild(t); });

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  const host = sheet.open ? sheet : document.body;
  if (t.parentElement !== host) host.appendChild(t);
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function switchView(v) {
  state.view = v;
  document.querySelectorAll('.view').forEach((el) => el.classList.toggle('active', el.id === `view-${v}`));
  document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.view === v));
  window.scrollTo(0, 0);
}

function renderAll() {
  renderToday(); renderCollection(); renderDiary(); renderBlind(); renderWish();
}

const sheetHead = (title, eyebrow = '', sub = '') => `
  <div class="sheet-head">
    <div>${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h2 class="sheet-title">${esc(title)}</h2>${sub ? `<div class="muted">${esc(sub)}</div>` : ''}</div>
    <button type="button" class="icon-btn" data-act="close" aria-label="Schließen">✕</button>
  </div>`;

/* ---------- Ansicht: Heute ---------- */
function renderToday() {
  const el = $('#view-today');
  const loc = db.settings.location;
  let h = '<div class="card weather-card">';
  if (!loc) {
    h += `<div class="w-empty"><p>Wo bist du? Dann schaue ich fürs Wetter aus dem Fenster.</p>
      <div class="btn-row"><button class="btn small" data-act="geo">📍 Standort nutzen</button>
      <button class="btn ghost small" data-act="settings">Stadt suchen</button></div></div>`;
  } else if (weatherStatus === 'loading' && !weather) {
    h += '<div class="w-loading">Wetter wird geladen …</div>';
  } else if (weather) {
    const [cond, ic] = wmo(weather.code);
    const stand = weatherStatus === 'stale' ? ` · Stand ${new Date(weather.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : '';
    h += `<div class="w-main">
      <div class="w-icon">${ic}</div>
      <div class="w-temp">${Math.round(weather.temp)}°</div>
      <div class="w-info"><div class="w-cond">${cond}</div>
        <div class="muted small">${esc(loc.name)} · gefühlt ${Math.round(weather.feels)}° · ${Math.round(weather.humidity)} % Feuchte${stand}</div></div>
      <button class="icon-btn" data-act="weather-refresh" aria-label="Wetter aktualisieren">↻</button>
    </div>`;
  } else {
    h += `<div class="w-empty"><p>Wetter gerade nicht erreichbar – ich schätze nach der Jahreszeit (${SEASONS[currentSeason()]}).</p>
      <button class="btn ghost small" data-act="weather-refresh">Erneut versuchen</button></div>`;
  }
  h += '</div>';

  for (const w of db.wears.filter((x) => x.date === todayStr())) {
    const p = perfumeById(w.perfumeId);
    if (!p) continue;
    h += `<div class="card worn-today"><div class="eyebrow">Heute getragen</div>
      <div class="wt-row"><div><div class="p-name">${esc(wearName(w))}</div>
      <div class="muted small">${OCCASIONS[w.occasion].label} · ${plural(w.compliments, 'Kompliment', 'Komplimente')}</div></div>
      <button class="btn small" data-act="compliment" data-id="${w.id}" data-d="1">+1 Kompliment</button></div></div>`;
  }

  h += `<h2 class="section-title">Wohin geht's heute?</h2>
    <div class="occ-grid">${Object.entries(OCCASIONS).map(([k, o]) => `
      <button class="occ ${state.occasion === k ? 'active' : ''}" data-act="occasion" data-occ="${k}" aria-pressed="${state.occasion === k}">
        <span class="occ-icon">${o.icon}</span>${o.label}</button>`).join('')}</div>`;

  h += state.occasion ? renderSuggestion()
    : '<p class="muted center hint">Wähle einen Anlass – ich suche dir den passenden Duft aus.</p>';
  el.innerHTML = h;
}

function renderSuggestion() {
  if (weatherStatus === 'loading' && !weather && db.settings.location) return '<p class="muted center hint">Einen Moment, ich prüfe das Wetter …</p>';
  const r = recommend(state.occasion, weather);
  if (!r.list.length) {
    return `<div class="card empty-state">Keine Flasche verfügbar – lege Düfte an oder setze den Füllstand über 0 %.
      <div class="btn-row"><button class="btn" data-act="new-perfume">+ Duft anlegen</button></div></div>`;
  }
  let list = r.list.filter((x) => !state.excluded.includes(x.p.id));
  if (!list.length) { state.excluded = []; list = r.list; }
  const top = list[0];
  state.topId = top.p.id;
  logSuggestion(top.p.id);
  const why = top.why.slice(0, 4);
  return `
    <div class="card suggestion">
      <div class="headline">${esc(r.headline)}</div>
      <div class="eyebrow">Mein Vorschlag</div>
      <div class="s-name">${esc(top.p.name)}</div>
      <div class="s-brand">${esc(top.p.brand)}</div>
      <div class="pills">
        <span class="pill gold">${FAMILIES[top.p.family].label}</span>
        <span class="pill">${STRENGTH[top.p.strength]}</span>
        <span class="pill">${stars(top.p.rating)}</span>
        <span class="pill">${top.p.fill} % voll</span>
      </div>
      ${why.length ? `<ul class="why">${why.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <div class="btn-row">
        <button class="btn" data-act="wear" data-id="${top.p.id}">✓ Heute getragen</button>
        <button class="btn ghost" data-act="next">↻ Anderer Vorschlag</button>
      </div>
      ${renderLayerTip(top.p, r)}
    </div>
    ${list.length > 1 ? `<h3 class="sub-title">Auch eine gute Wahl</h3><div class="alt-list">
      ${list.slice(1, 3).map((x) => `<div class="alt"><div><div class="alt-name">${esc(x.p.name)}</div>
        <div class="muted small">${esc(x.p.brand)} · ${FAMILIES[x.p.family].label} · ${agoText(lastWornDate(x.p.id))}</div></div>
        <button class="btn ghost small" data-act="wear" data-id="${x.p.id}">Getragen</button></div>`).join('')}</div>` : ''}`;
}

function renderLayerTip(base, prof) {
  if (state.occasion === 'gym') return '<div class="layer-box muted small">Fürs Gym lieber solo – Layering wird beim Sport schnell zu viel.</div>';
  const key = `${base.id}|${state.occasion}`;
  if (state.layerKey !== key) { state.layerKey = key; state.layerExcluded = []; }
  let list = layerForToday(base, state.occasion, prof).filter((x) => !state.layerExcluded.includes(x.p.id));
  if (!list.length) { state.layerExcluded = []; list = layerForToday(base, state.occasion, prof); }
  const l = list[0];
  if (!l) return '';
  state.layerId = l.p.id;
  return `
    <div class="layer-box">
      <div class="eyebrow">Layering-Tipp</div>
      <div class="layer-combo">${esc(base.name)}<span class="plus">+</span>${esc(l.p.name)}</div>
      ${l.why.length ? `<ul class="why">${l.why.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <div class="layer-tip">💡 ${esc(l.tip)}</div>
      <div class="btn-row">
        <button class="btn small" data-act="wear-layer" data-id="${base.id}" data-layer="${l.p.id}">✓ So getragen</button>
        <button class="btn ghost small" data-act="next-layer">↻ Anderer Partner</button>
      </div>
    </div>`;
}

function addWear(perfumeId, occasion, date = todayStr(), layerId = '') {
  db.wears.push({ id: uid(), perfumeId, layerId: layerId && layerId !== perfumeId ? layerId : '', date, occasion: occasion || 'alltag', compliments: 0, note: '' });
  save();
  toast(`${wearName(db.wears[db.wears.length - 1])} im Tagebuch eingetragen`);
}

/* ---------- Ansicht: Sammlung ---------- */
function renderCollection() {
  const el = $('#view-collection');
  el.innerHTML = `
    <div class="view-head"><h2 class="section-title">Sammlung<span class="count">${db.perfumes.length}</span></h2>
      <button class="btn small" data-act="new-perfume">+ Duft</button></div>
    <div class="toolbar">
      <input type="search" id="search" placeholder="Name, Marke, Note …" value="${esc(state.search)}" aria-label="Suchen">
      <select id="sort" aria-label="Sortieren">
        ${[['name', 'A–Z'], ['rating', 'Bewertung'], ['worn', 'Zuletzt getragen'], ['fill', 'Füllstand']]
          .map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    <div id="collList" class="p-grid"></div>`;
  renderCollectionList();
}
function renderCollectionList() {
  const q = state.search.trim().toLowerCase();
  const ps = db.perfumes.filter((p) => !q || [p.name, p.brand, FAMILIES[p.family].label, ...allNotes(p)].join(' ').toLowerCase().includes(q));
  const lw = (id) => lastWornDate(id) || '';
  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, 'de'),
    rating: (a, b) => b.rating - a.rating || a.name.localeCompare(b.name, 'de'),
    worn: (a, b) => lw(b.id).localeCompare(lw(a.id)),
    fill: (a, b) => a.fill - b.fill,
  };
  ps.sort(sorters[state.sort] || sorters.name);
  const list = $('#collList');
  if (!list) return;
  if (!db.perfumes.length) {
    list.innerHTML = '<div class="card empty-state">Noch keine Düfte. Leg deinen ersten an!</div>';
    return;
  }
  list.innerHTML = ps.length ? ps.map((p) => `
    <button class="p-card" data-act="perfume" data-id="${p.id}">
      <div class="p-top"><div><div class="p-name">${esc(p.name)}</div><div class="p-brand">${esc(p.brand)}</div></div>
        <span class="pill gold">${FAMILIES[p.family].label}</span></div>
      <div class="p-meta"><span class="stars" aria-label="${p.rating} von 5 Sternen">${stars(p.rating)}</span>
        <span class="muted small">${agoText(lastWornDate(p.id))}</span></div>
      <div class="fill" aria-label="Füllstand ${p.fill} %"><div class="fill-bar ${p.fill < 15 ? 'low' : ''}" style="width:${p.fill}%"></div></div>
    </button>`).join('') : '<p class="muted center">Nichts gefunden.</p>';
}

function openPerfume(id) {
  const p = perfumeById(id);
  if (!p) return;
  const ws = wearsOf(id);
  const pyr = [['Kopf', p.top], ['Herz', p.heart], ['Basis', p.base]].filter(([, n]) => n.length);
  openSheet(`
    ${sheetHead(p.name, FAMILIES[p.family].label, p.brand)}
    <div class="stat-row">
      <div><b>${ws.length}</b><span>× getragen</span></div>
      <div><b>${complimentsOf(id)}</b><span>Komplimente</span></div>
      <div><b>${p.fill} %</b><span>Füllstand</span></div>
    </div>
    ${pyr.length ? `<div class="pyramid">${pyr.map(([l, n]) => `<div><span class="pyr-label">${l}</span>${n.map(esc).join(' · ')}</div>`).join('')}</div>` : ''}
    <dl class="facts">
      <dt>Projektion</dt><dd>${STRENGTH[p.strength]}</dd>
      <dt>Jahreszeit</dt><dd>${p.seasons.map((s) => SEASONS[s]).join(', ') || '–'}</dd>
      <dt>Anlass</dt><dd>${p.occasions.map((o) => OCCASIONS[o].label).join(', ') || '–'}</dd>
      <dt>Bewertung</dt><dd class="stars">${stars(p.rating)}</dd>
      <dt>Zuletzt</dt><dd>${cap(agoText(lastWornDate(id)))}</dd>
    </dl>
    ${p.notes ? `<p class="note-text">${esc(p.notes)}</p>` : ''}
    <div class="btn-row">
      <button class="btn" data-act="wear" data-id="${p.id}">✓ Heute getragen</button>
      <button class="btn ghost" data-act="edit-perfume" data-id="${p.id}">Bearbeiten</button>
    </div>
    ${renderLayerPartners(p)}`);
}

function renderLayerPartners(p) {
  const list = layerPartners(p, 3);
  if (!list.length) return '';
  return `<div class="layer-list"><div class="group-label">Layering-Partner</div>
    ${list.map((l) => `<div class="layer-row"><div>
        <div class="alt-name">+ ${esc(l.p.name)}</div>
        ${l.why[0] ? `<div class="muted small">${esc(l.why[0])}</div>` : ''}
        <div class="layer-tip small">💡 ${esc(l.tip)}</div></div>
      <button class="btn ghost small" data-act="wear-layer" data-id="${p.id}" data-layer="${l.p.id}">Getragen</button></div>`).join('')}
  </div>`;
}

const chipGroup = (name, options, selected) => Object.entries(options).map(([k, l]) =>
  `<label class="chip"><input type="checkbox" name="${name}" value="${k}" ${selected.includes(k) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('');

function openPerfumeForm(id, prefill = {}, fromWish = '') {
  const existing = id ? perfumeById(id) : null;
  const p = existing || { ...fixPerfume({ strength: 3, rating: 3, fill: 100, ...prefill }), id: '', name: prefill.name || '' };
  const occLabels = Object.fromEntries(Object.entries(OCCASIONS).map(([k, o]) => [k, o.label]));
  openSheet(`
    ${sheetHead(existing ? 'Duft bearbeiten' : 'Neuer Duft', existing ? p.brand : 'Sammlung')}
    <form id="perfumeForm" class="form" data-id="${esc(p.id)}" data-wish="${esc(fromWish)}" autocomplete="off">
      <label class="field"><span>Name *</span><input name="name" required maxlength="80" value="${esc(p.name)}" placeholder="z. B. Aventus"></label>
      <div class="two-col">
        <label class="field"><span>Marke</span><input name="brand" maxlength="60" value="${esc(p.brand)}"></label>
        <label class="field"><span>Duftfamilie</span><select name="family">
          ${Object.entries(FAMILIES).map(([k, f]) => `<option value="${k}" ${p.family === k ? 'selected' : ''}>${f.label}</option>`).join('')}
        </select></label>
      </div>
      <div class="field-group"><span class="group-label">Duftpyramide · mit Komma trennen</span>
        <label class="field"><span>Kopfnoten</span><input name="top" value="${esc(p.top.join(', '))}" placeholder="Bergamotte, Pfeffer"></label>
        <label class="field"><span>Herznoten</span><input name="heart" value="${esc(p.heart.join(', '))}" placeholder="Lavendel, Iris"></label>
        <label class="field"><span>Basisnoten</span><input name="base" value="${esc(p.base.join(', '))}" placeholder="Vanille, Zeder"></label>
      </div>
      <label class="field"><span>Stärke / Projektion: <b>${STRENGTH[p.strength]}</b></span>
        <input type="range" name="strength" min="1" max="5" step="1" value="${p.strength}" data-kind="strength"></label>
      <div class="field"><span>Jahreszeit</span><div class="chips">${chipGroup('seasons', SEASONS, p.seasons)}</div></div>
      <div class="field"><span>Anlass</span><div class="chips">${chipGroup('occasions', occLabels, p.occasions)}</div></div>
      <label class="field"><span>Füllstand: <b>${p.fill} %</b></span>
        <input type="range" name="fill" min="0" max="100" step="5" value="${p.fill}" data-kind="fill"></label>
      <label class="field"><span>Deine Bewertung: <b class="stars">${stars(p.rating)}</b></span>
        <input type="range" name="rating" min="1" max="5" step="1" value="${p.rating}" data-kind="rating"></label>
      <label class="field"><span>Notizen</span><textarea name="notes" rows="2" maxlength="500">${esc(p.notes)}</textarea></label>
      <div class="btn-row">
        <button class="btn" type="submit">Speichern</button>
        ${existing ? `<button type="button" class="btn danger" data-act="delete-perfume" data-id="${p.id}">Löschen</button>` : ''}
      </div>
    </form>`);
}

function savePerfumeForm(form) {
  const f = new FormData(form);
  const data = {
    name: String(f.get('name') || '').trim(), brand: String(f.get('brand') || '').trim(), family: f.get('family'),
    top: splitNotes(f.get('top')), heart: splitNotes(f.get('heart')), base: splitNotes(f.get('base')),
    strength: +f.get('strength'), seasons: f.getAll('seasons'), occasions: f.getAll('occasions'),
    fill: +f.get('fill'), rating: +f.get('rating'), notes: String(f.get('notes') || '').trim(),
  };
  if (!data.name) { toast('Bitte gib einen Namen ein'); return; }
  const id = form.dataset.id;
  if (id) {
    const i = db.perfumes.findIndex((p) => p.id === id);
    if (i >= 0) db.perfumes[i] = fixPerfume({ ...db.perfumes[i], ...data });
  } else {
    db.perfumes.push(fixPerfume(data));
  }
  if (form.dataset.wish) db.wishlist = db.wishlist.filter((w) => w.id !== form.dataset.wish);
  save(); closeSheet(); renderAll();
  toast(id ? 'Gespeichert' : `${data.name} ist jetzt in deiner Sammlung`);
}

/* ---------- Ansicht: Tagebuch ---------- */
function computeStats() {
  const rows = db.perfumes.map((p) => {
    const ws = wearsOf(p.id);
    const c = ws.reduce((a, w) => a + w.compliments, 0);
    return { p, n: ws.length, c, last: lastWornDate(p.id) };
  });
  const most = [...rows].filter((r) => r.n > 0).sort((a, b) => b.n - a.n || b.c - a.c)[0] || null;
  const king = [...rows].filter((r) => r.c > 0).sort((a, b) => b.c - a.c || (b.c / b.n) - (a.c / a.n))[0] || null;
  const forgotten = rows.filter((r) => r.p.fill > 0 && (!r.last || daysSince(r.last) >= FORGOTTEN_DAYS))
    .sort((a, b) => (b.last ? daysSince(b.last) : 1e9) - (a.last ? daysSince(a.last) : 1e9));
  // Lieblings-Layering: meiste Komplimente, dann am häufigsten
  const combos = {};
  for (const w of db.wears) {
    if (!w.layerId) continue;
    const k = [w.perfumeId, w.layerId].sort().join('|');
    combos[k] = combos[k] || { w, n: 0, c: 0 };
    combos[k].n++; combos[k].c += w.compliments;
  }
  const combo = Object.values(combos).sort((a, b) => b.c - a.c || b.n - a.n)[0] || null;
  return { most, king, forgotten, combo, totalC: db.wears.reduce((a, w) => a + w.compliments, 0) };
}

function renderDiary() {
  const el = $('#view-diary');
  const s = computeStats();
  const entries = [...db.wears].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const shown = entries.slice(0, state.diaryLimit);
  el.innerHTML = `
    <h2 class="section-title">Trage-Tagebuch</h2>
    <div class="stats-grid">
      <div class="stat-card"><div class="eyebrow">Meistgetragen</div>
        ${s.most ? `<div class="stat-name">${esc(s.most.p.name)}</div><div class="muted small">${s.most.n}× getragen</div>` : '<div class="muted small">Noch keine Einträge</div>'}</div>
      <div class="stat-card"><div class="eyebrow">👑 Kompliment-König</div>
        ${s.king ? `<div class="stat-name">${esc(s.king.p.name)}</div><div class="muted small">${plural(s.king.c, 'Kompliment', 'Komplimente')} · Ø ${(s.king.c / s.king.n).toLocaleString('de-DE', { maximumFractionDigits: 1 })} pro Tragen</div>` : '<div class="muted small">Noch keine Komplimente</div>'}</div>
    </div>
    <div class="stat-card combo-card"><div class="eyebrow">🧪 Lieblings-Layering</div>
      ${s.combo ? `<div class="stat-name">${esc(wearName(s.combo.w))}</div><div class="muted small">${s.combo.n}× getragen · ${plural(s.combo.c, 'Kompliment', 'Komplimente')}</div>`
        : '<div class="muted small">Noch kein Layering eingetragen – nutze „So getragen“ beim Layering-Tipp.</div>'}</div>
    <div class="card">
      <div class="eyebrow">Vergessene Flaschen · über ${FORGOTTEN_DAYS} Tage im Regal</div>
      ${s.forgotten.length ? s.forgotten.map((r) => `
        <div class="forgotten-row"><div><div>${esc(r.p.name)}</div><div class="muted small">${r.last ? `seit ${daysSince(r.last)} Tagen nicht getragen` : 'noch nie getragen'}</div></div>
        <button class="btn ghost small" data-act="wear" data-id="${r.p.id}">Heute tragen</button></div>`).join('')
        : '<div class="muted small">Alles im Einsatz – keine Flasche verstaubt.</div>'}
    </div>
    <div class="view-head"><h3 class="sub-title">Einträge <span class="count">${db.wears.length} · ${plural(s.totalC, 'Kompliment', 'Komplimente')}</span></h3>
      <button class="btn small" data-act="new-wear">+ Eintrag</button></div>
    <div class="entries">
      ${shown.length ? shown.map((w) => {
        const p = perfumeById(w.perfumeId);
        return `<div class="entry">
          <div class="e-date">${fmtDate(w.date)}</div>
          <button class="e-main" data-act="edit-wear" data-id="${w.id}">
            <div class="e-name">${esc(wearName(w))}</div>
            <div class="muted small e-sub">${OCCASIONS[w.occasion].label}${w.note ? ` · ${esc(w.note)}` : ''}</div>
          </button>
          <div class="e-comp">
            <button class="mini" data-act="compliment" data-id="${w.id}" data-d="-1" aria-label="Kompliment entfernen">−</button>
            <span title="Komplimente">💬 ${w.compliments}</span>
            <button class="mini" data-act="compliment" data-id="${w.id}" data-d="1" aria-label="Kompliment hinzufügen">+</button>
          </div>
        </div>`;
      }).join('') : '<div class="card empty-state">Noch nichts eingetragen. Tipp: Auf „Heute“ einen Vorschlag mit „Heute getragen“ bestätigen.</div>'}
    </div>
    ${entries.length > shown.length ? '<div class="btn-row"><button class="btn ghost" data-act="more-diary">Ältere Einträge anzeigen</button></div>' : ''}`;
}

function openWearForm(id, preset = {}) {
  if (!db.perfumes.length) { toast('Lege zuerst einen Duft an'); return; }
  const w = id ? db.wears.find((x) => x.id === id) : { perfumeId: db.perfumes[0].id, layerId: '', date: todayStr(), occasion: 'alltag', compliments: 0, note: '', ...preset };
  if (!w) return;
  const sorted = [...db.perfumes].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  openSheet(`
    ${sheetHead(id ? 'Eintrag bearbeiten' : 'Neuer Eintrag', 'Tagebuch')}
    <form id="wearForm" class="form" data-id="${esc(id || '')}">
      <label class="field"><span>Duft</span><select name="perfumeId">
        ${sorted.map((p) => `<option value="${p.id}" ${p.id === w.perfumeId ? 'selected' : ''}>${esc(p.name)}${p.brand ? ` – ${esc(p.brand)}` : ''}</option>`).join('')}
      </select></label>
      <label class="field"><span>Gelayert mit</span><select name="layerId">
        <option value="">– kein Layering –</option>
        ${sorted.map((p) => `<option value="${p.id}" ${p.id === w.layerId ? 'selected' : ''}>${esc(p.name)}${p.brand ? ` – ${esc(p.brand)}` : ''}</option>`).join('')}
      </select></label>
      <div class="two-col">
        <label class="field"><span>Datum</span><input type="date" name="date" value="${w.date}" max="${todayStr()}" required></label>
        <label class="field"><span>Anlass</span><select name="occasion">
          ${Object.entries(OCCASIONS).map(([k, o]) => `<option value="${k}" ${k === w.occasion ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select></label>
      </div>
      <label class="field"><span>Komplimente</span><input type="number" name="compliments" min="0" max="99" inputmode="numeric" value="${w.compliments}"></label>
      <label class="field"><span>Notiz</span><input name="note" maxlength="140" value="${esc(w.note)}" placeholder="Wer hat was gesagt? 😉"></label>
      <div class="btn-row">
        <button class="btn" type="submit">Speichern</button>
        ${id ? `<button type="button" class="btn danger" data-act="delete-wear" data-id="${id}">Löschen</button>` : ''}
      </div>
    </form>`);
}
function saveWearForm(form) {
  const f = new FormData(form);
  const data = {
    perfumeId: f.get('perfumeId'), date: f.get('date'), occasion: f.get('occasion'),
    layerId: f.get('layerId') && f.get('layerId') !== f.get('perfumeId') ? f.get('layerId') : '',
    compliments: Math.max(0, parseInt(f.get('compliments'), 10) || 0), note: String(f.get('note') || '').trim(),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) { toast('Bitte ein Datum wählen'); return; }
  const id = form.dataset.id;
  if (id) Object.assign(db.wears.find((w) => w.id === id) || {}, data);
  else db.wears.push({ id: uid(), ...data });
  save(); closeSheet(); renderAll(); toast('Tagebuch aktualisiert');
}

/* ---------- Ansicht: Blind-Buy ---------- */
function renderBlind() {
  const el = $('#view-blind');
  const b = state.blind;
  el.innerHTML = `
    <h2 class="section-title">Blind-Buy-Check</h2>
    <p class="muted">Gib die Noten eines Dufts ein, den du nicht testen kannst. Ich vergleiche ihn mit deinen Favoriten und deiner Sammlung.</p>
    <form id="blindForm" class="card form" autocomplete="off">
      <div class="two-col">
        <label class="field"><span>Name</span><input name="name" value="${esc(b.name)}" placeholder="optional"></label>
        <label class="field"><span>Marke</span><input name="brand" value="${esc(b.brand)}" placeholder="optional"></label>
      </div>
      <label class="field"><span>Duftfamilie</span><select name="family">
        <option value="">Weiß nicht</option>
        ${Object.entries(FAMILIES).map(([k, f]) => `<option value="${k}" ${b.family === k ? 'selected' : ''}>${f.label}</option>`).join('')}
      </select></label>
      <label class="field"><span>Kopfnoten</span><input name="top" value="${esc(b.top)}" placeholder="z. B. Ananas, Bergamotte"></label>
      <label class="field"><span>Herznoten</span><input name="heart" value="${esc(b.heart)}" placeholder="z. B. Birke, Jasmin"></label>
      <label class="field"><span>Basisnoten</span><input name="base" value="${esc(b.base)}" placeholder="z. B. Moschus, Eichenmoos, Vanille"></label>
      <div class="btn-row"><button class="btn" type="submit">Passt der zu mir?</button>
        ${state.blindResult ? '<button type="button" class="btn ghost" data-act="blind-reset">Leeren</button>' : ''}</div>
    </form>
    <div id="blindResult">${state.blindResult ? renderBlindResult(state.blindResult) : ''}</div>`;
}

function renderBlindResult(r) {
  if (r.error) return `<div class="card result muted">${esc(r.error)}</div>`;
  const C = 2 * Math.PI * 50;
  const title = [r.cand.name, r.cand.brand].filter(Boolean).join(' · ');
  let simBox;
  if (r.best && r.best.sim >= 0.45) {
    simBox = `<div class="similar-box warn"><b>Achtung, Doppelgänger-Gefahr:</b> ähnelt stark deinem <b>${esc(r.best.p.name)}</b> (${Math.round(r.best.sim * 100)} %).
      ${r.best.shared.length ? `<div class="muted small">Gemeinsam: ${r.best.shared.map(esc).join(', ')}</div>` : ''}</div>`;
  } else if (r.best) {
    simBox = `<div class="similar-box">Verwandt mit deinem <b>${esc(r.best.p.name)}</b> (${Math.round(r.best.sim * 100)} %), aber kein Klon.
      ${r.best.shared.length ? `<div class="muted small">Gemeinsam: ${r.best.shared.map(esc).join(', ')}</div>` : ''}</div>`;
  } else {
    simBox = '<div class="similar-box good">Nichts wirklich Ähnliches in deiner Sammlung – das wäre eine echte Ergänzung.</div>';
  }
  return `
    <div class="card result">
      ${title ? `<div class="eyebrow">${esc(title)}</div>` : ''}
      <div class="gauge-wrap">
        <svg class="gauge" viewBox="0 0 120 120" role="img" aria-label="Passung ${r.fit} Prozent">
          <circle class="track" cx="60" cy="60" r="50" fill="none" stroke-width="10"/>
          <circle class="val" cx="60" cy="60" r="50" fill="none" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - r.fit / 100)).toFixed(1)}" transform="rotate(-90 60 60)"/>
          <text x="60" y="66" text-anchor="middle" font-size="28">${r.fit}%</text>
        </svg>
        <div><div class="verdict">${esc(r.verdict)}</div><div class="muted small">${esc(r.sub)}</div></div>
      </div>
      ${r.loved.length ? `<h4>Noten, die du magst</h4><div class="pills">${r.loved.map((n) => `<span class="pill gold">${esc(n)}</span>`).join('')}</div>` : ''}
      ${r.fresh.length ? `<h4>Neu für dich</h4><div class="pills">${r.fresh.map((n) => `<span class="pill">${esc(n)}</span>`).join('')}</div>` : ''}
      <h4>Hast du schon etwas Ähnliches?</h4>
      ${simBox}
      ${r.related.length ? `<div class="muted small" style="margin-top:8px">Außerdem verwandt: ${r.related.map((x) => `${esc(x.p.name)} (${Math.round(x.sim * 100)} %)`).join(', ')}</div>` : ''}
      ${r.layer && r.layer.score > 1 ? `<h4>Layering-Potenzial</h4>
        <div class="similar-box good">Würde gut mit deinem <b>${esc(r.layer.p.name)}</b> harmonieren.
          ${r.layer.why[0] ? `<div class="muted small">${esc(r.layer.why[0])}</div>` : ''}</div>` : ''}
      <div class="btn-row"><button class="btn ghost" data-act="blind-to-wish">♡ Auf die Wunschliste</button></div>
    </div>`;
}

/* ---------- Ansicht: Wunschliste ---------- */
function renderWish() {
  const el = $('#view-wish');
  const items = [...db.wishlist].sort((a, b) => a.priority - b.priority || a.price - b.price);
  const total = items.reduce((a, w) => a + w.price, 0);
  el.innerHTML = `
    <div class="view-head"><h2 class="section-title">Wunschliste<span class="count">${items.length}</span></h2>
      <button class="btn small" data-act="new-wish">+ Wunsch</button></div>
    ${items.length ? `<div class="card total-card"><span class="muted">Alles zusammen</span><b>${euro(total)}</b></div>` : ''}
    ${items.length ? items.map((w) => {
      const link = /^https?:\/\//i.test(w.shop);
      return `<div class="card">
        <div class="p-top"><div><div class="p-name">${esc(w.name)}</div><div class="p-brand">${esc(w.brand)}</div></div>
          <div class="price">${w.price ? euro(w.price) : '–'}</div></div>
        <div class="pills"><span class="pill ${w.priority === 1 ? 'gold' : ''}">${PRIORITY[w.priority]}</span>
          ${w.shop && !link ? `<span class="pill">bei ${esc(w.shop)}</span>` : ''}
          ${link ? `<a class="pill gold" href="${esc(w.shop)}" target="_blank" rel="noopener noreferrer">Zum Shop ↗</a>` : ''}</div>
        ${w.notes.length ? `<div class="muted small">${w.notes.map(esc).join(' · ')}</div>` : ''}
        <div class="btn-row">
          ${w.notes.length ? `<button class="btn ghost small" data-act="wish-check" data-id="${w.id}">Blind-Check</button>` : ''}
          <button class="btn ghost small" data-act="edit-wish" data-id="${w.id}">Bearbeiten</button>
          <button class="btn small" data-act="wish-bought" data-id="${w.id}">Gekauft ✓</button>
        </div>
      </div>`;
    }).join('') : '<div class="card empty-state">Noch keine Wünsche. Tipp: Nach einem Blind-Buy-Check kannst du Düfte direkt hierher setzen.</div>'}`;
}

function openWishForm(id, prefill = {}) {
  const w = id ? db.wishlist.find((x) => x.id === id) : { name: '', brand: '', price: '', shop: '', notes: [], priority: 2, ...prefill };
  if (!w) return;
  openSheet(`
    ${sheetHead(id ? 'Wunsch bearbeiten' : 'Neuer Wunsch', 'Wunschliste')}
    <form id="wishForm" class="form" data-id="${esc(id || '')}" autocomplete="off">
      <label class="field"><span>Name *</span><input name="name" required maxlength="80" value="${esc(w.name)}"></label>
      <div class="two-col">
        <label class="field"><span>Marke</span><input name="brand" maxlength="60" value="${esc(w.brand)}"></label>
        <label class="field"><span>Preis (€)</span><input type="number" name="price" min="0" step="0.01" inputmode="decimal" value="${w.price || ''}"></label>
      </div>
      <label class="field"><span>Shop oder Link</span><input name="shop" maxlength="300" value="${esc(w.shop)}" placeholder="z. B. Douglas oder https://…"></label>
      <label class="field"><span>Noten (für den Blind-Buy-Check)</span><input name="notes" value="${esc(w.notes.join(', '))}" placeholder="Oud, Vanille, …"></label>
      <label class="field"><span>Priorität</span><select name="priority">
        ${Object.entries(PRIORITY).map(([k, l]) => `<option value="${k}" ${+k === +w.priority ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
      <div class="btn-row">
        <button class="btn" type="submit">Speichern</button>
        ${id ? `<button type="button" class="btn danger" data-act="delete-wish" data-id="${id}">Löschen</button>` : ''}
      </div>
    </form>`);
}
function saveWishForm(form) {
  const f = new FormData(form);
  const data = {
    name: String(f.get('name') || '').trim(), brand: String(f.get('brand') || '').trim(),
    price: Math.max(0, parseFloat(String(f.get('price')).replace(',', '.')) || 0), shop: String(f.get('shop') || '').trim(),
    notes: splitNotes(f.get('notes')), priority: clamp(parseInt(f.get('priority'), 10) || 2, 1, 3),
  };
  if (!data.name) { toast('Bitte gib einen Namen ein'); return; }
  const id = form.dataset.id;
  if (id) Object.assign(db.wishlist.find((w) => w.id === id) || {}, data);
  else db.wishlist.push({ id: uid(), ...data });
  save(); closeSheet(); renderWish(); toast('Wunschliste gespeichert');
}

/* ---------- Einstellungen, Export, Import ---------- */
function openSettings() {
  const loc = db.settings.location;
  openSheet(`
    ${sheetHead('Einstellungen')}
    <div class="form">
      <div class="field-group"><span class="group-label">Ort fürs Wetter</span>
        <div class="muted small">Aktuell: ${loc ? esc(loc.name) : 'nicht festgelegt'}</div>
        <form id="cityForm" class="inline-form"><input name="q" required placeholder="Stadt, z. B. Hamburg" aria-label="Stadt"><button class="btn small" type="submit">Suchen</button></form>
        <div id="cityResults" class="city-results"></div>
        <button class="btn ghost small" data-act="geo">📍 Aktuellen Standort verwenden</button>
      </div>
      <div class="field-group"><span class="group-label">Datensicherung</span>
        <div class="muted small">Deine Daten liegen nur auf diesem Gerät in diesem Browser. Mach ab und zu ein Backup – z. B. bevor du den Browser-Verlauf löschst oder das Handy wechselst.</div>
        <div class="btn-row">
          <button class="btn" data-act="export">⬇ Exportieren</button>
          <label class="btn ghost">⬆ Importieren<input type="file" id="importFile" accept="application/json,.json" hidden></label>
        </div>
      </div>
      <div class="field-group"><span class="group-label">Zurücksetzen</span>
        <div class="btn-row">
          <button class="btn ghost small" data-act="load-samples">Startsammlung neu laden</button>
          <button class="btn danger small" data-act="wipe">Alles löschen</button>
        </div>
      </div>
      <p class="muted small center">${db.perfumes.length} Düfte · ${db.wears.length} Tagebuch-Einträge · ${db.wishlist.length} Wünsche<br>Wetterdaten von Open-Meteo.com</p>
    </div>`);
}

async function exportData() {
  const { weather: _w, ...settings } = db.settings;
  const json = JSON.stringify({ app: 'duft-butler', version: 1, exportedAt: new Date().toISOString(), ...db, settings }, null, 2);
  const name = `duft-butler-backup-${todayStr()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (mobile && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Duft-Butler Backup' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Backup gespeichert');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let d;
    try { d = JSON.parse(reader.result); } catch (e) { toast('Die Datei ist kein gültiges JSON'); return; }
    if (!d || !Array.isArray(d.perfumes)) { toast('Das ist kein Duft-Butler-Backup'); return; }
    if (!confirm(`Backup mit ${d.perfumes.length} Düften laden?\nDeine aktuellen Daten auf diesem Gerät werden dabei ersetzt.`)) return;
    const keepLoc = db.settings.location;
    db = normalize(d);
    if (!db.settings.location) db.settings.location = keepLoc;
    migrate(); save(); closeSheet(); resetUiState(); renderAll(); loadWeather();
    toast('Backup importiert');
  };
  reader.readAsText(file);
}

function resetUiState() {
  state.occasion = null; state.excluded = []; state.blindResult = null; state.search = '';
}

/* ---------- Ereignisse ---------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const { act, id } = t.dataset;
  switch (act) {
    case 'tab': switchView(t.dataset.view); break;
    case 'close': closeSheet(); break;
    case 'settings': openSettings(); break;
    case 'geo': useGeolocation(); break;
    case 'weather-refresh': loadWeather(true); break;
    case 'pick-city': setLocation({ name: t.dataset.name, lat: +t.dataset.lat, lon: +t.dataset.lon }); break;

    case 'occasion':
      state.occasion = t.dataset.occ; state.excluded = []; renderToday(); break;
    case 'next':
      if (state.topId) state.excluded.push(state.topId);
      renderToday(); break;
    case 'wear':
      addWear(id, state.view === 'today' ? state.occasion : (perfumeById(id)?.occasions[0] || 'alltag'));
      state.excluded = []; closeSheet(); renderAll(); break;
    case 'wear-layer':
      addWear(id, (state.view === 'today' && !sheet.open && state.occasion) || perfumeById(id)?.occasions[0] || 'alltag', todayStr(), t.dataset.layer);
      state.excluded = []; closeSheet(); renderAll(); break;
    case 'next-layer':
      if (state.layerId) state.layerExcluded.push(state.layerId);
      renderToday(); break;
    case 'compliment': {
      const w = db.wears.find((x) => x.id === id);
      if (!w) break;
      w.compliments = Math.max(0, w.compliments + Number(t.dataset.d));
      save(); renderToday(); renderDiary();
      if (Number(t.dataset.d) > 0) toast('Kompliment notiert ✨');
      break;
    }

    case 'perfume': openPerfume(id); break;
    case 'new-perfume': openPerfumeForm(null); break;
    case 'edit-perfume': openPerfumeForm(id); break;
    case 'delete-perfume': {
      const p = perfumeById(id);
      const n = db.wears.filter((w) => w.perfumeId === id).length;
      if (!p || !confirm(`„${p.name}“ löschen?${n ? `\nAuch ${n} Tagebuch-Einträge werden entfernt.` : ''}`)) break;
      db.perfumes = db.perfumes.filter((x) => x.id !== id);
      db.wears = db.wears.filter((w) => w.perfumeId !== id).map((w) => (w.layerId === id ? { ...w, layerId: '' } : w));
      save(); closeSheet(); renderAll(); toast('Gelöscht');
      break;
    }

    case 'new-wear': openWearForm(null); break;
    case 'edit-wear': openWearForm(id); break;
    case 'delete-wear':
      if (!confirm('Diesen Eintrag löschen?')) break;
      db.wears = db.wears.filter((w) => w.id !== id);
      save(); closeSheet(); renderAll(); break;
    case 'more-diary': state.diaryLimit += 50; renderDiary(); break;

    case 'blind-reset':
      state.blind = { name: '', brand: '', family: '', top: '', heart: '', base: '' };
      state.blindResult = null; renderBlind(); break;
    case 'blind-to-wish': {
      const c = state.blindResult?.cand;
      if (!c) break;
      openWishForm(null, { name: c.name, brand: c.brand, notes: [...splitNotes(c.top), ...splitNotes(c.heart), ...splitNotes(c.base)] });
      break;
    }

    case 'new-wish': openWishForm(null); break;
    case 'edit-wish': openWishForm(id); break;
    case 'delete-wish':
      if (!confirm('Diesen Wunsch löschen?')) break;
      db.wishlist = db.wishlist.filter((w) => w.id !== id);
      save(); closeSheet(); renderWish(); break;
    case 'wish-check': {
      const w = db.wishlist.find((x) => x.id === id);
      if (!w) break;
      state.blind = { name: w.name, brand: w.brand, family: '', top: w.notes.join(', '), heart: '', base: '' };
      state.blindResult = blindCheck(state.blind);
      renderBlind(); switchView('blind');
      break;
    }
    case 'wish-bought': {
      const w = db.wishlist.find((x) => x.id === id);
      if (!w) break;
      openPerfumeForm(null, { name: w.name, brand: w.brand, top: w.notes, rating: 4 }, w.id);
      toast('Ergänze die Details – beim Speichern wandert er in die Sammlung');
      break;
    }

    case 'export': exportData(); break;
    case 'load-samples':
      if (!confirm('Alle aktuellen Daten (inkl. Tagebuch und Wunschliste) durch die Startsammlung ersetzen?')) break;
      { const loc = db.settings.location; db = sampleData(); db.settings.location = loc; }
      migrate(); save(); closeSheet(); resetUiState(); renderAll(); loadWeather(); toast('Startsammlung geladen');
      break;
    case 'wipe':
      if (!confirm('Wirklich ALLES löschen? Das lässt sich nicht rückgängig machen.\nTipp: Vorher exportieren.')) break;
      { const loc = db.settings.location; db = emptyDb(); db.settings.location = loc; }
      save(); closeSheet(); resetUiState(); renderAll(); loadWeather(); toast('Alle Daten gelöscht');
      break;
    default: break;
  }
});

document.addEventListener('submit', async (e) => {
  const form = e.target;
  e.preventDefault();
  if (form.id === 'perfumeForm') savePerfumeForm(form);
  else if (form.id === 'wearForm') saveWearForm(form);
  else if (form.id === 'wishForm') saveWishForm(form);
  else if (form.id === 'blindForm') {
    const f = new FormData(form);
    state.blind = Object.fromEntries(['name', 'brand', 'family', 'top', 'heart', 'base'].map((k) => [k, String(f.get(k) || '').trim()]));
    state.blindResult = blindCheck(state.blind);
    renderBlind();
    $('#blindResult')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (form.id === 'cityForm') {
    const q = String(new FormData(form).get('q') || '').trim();
    const box = $('#cityResults');
    if (!q) return;
    box.innerHTML = '<div class="muted small">Suche …</div>';
    try {
      const res = await searchCity(q);
      box.innerHTML = res.length ? res.map((r) => `
        <button type="button" data-act="pick-city" data-name="${esc(r.name)}" data-lat="${r.lat}" data-lon="${r.lon}">
          ${esc(r.name)} <span class="muted small">${esc(r.region)}</span></button>`).join('')
        : '<div class="muted small">Keinen Ort gefunden.</div>';
    } catch (err) {
      box.innerHTML = '<div class="muted small">Suche nicht möglich – bist du online?</div>';
    }
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'search') { state.search = t.value; renderCollectionList(); return; }
  const kind = t.dataset.kind;
  if (kind) {
    const out = t.closest('.field')?.querySelector('b');
    if (!out) return;
    const v = +t.value;
    out.textContent = kind === 'strength' ? STRENGTH[v] : kind === 'fill' ? `${v} %` : stars(v);
  }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'sort') { state.sort = t.value; renderCollectionList(); }
  if (t.id === 'importFile' && t.files && t.files[0]) { importData(t.files[0]); t.value = ''; }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const c = db.settings.weather;
  if (db.settings.location && (!c || Date.now() - c.time > 30 * 60e3)) loadWeather();
  else renderToday(); // Datum könnte über Mitternacht gewechselt sein
});

/* ---------- Start ---------- */
renderAll();
loadWeather();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
