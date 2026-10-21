const marker = /[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
const linePattern = /^\[?(\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}),?\s+(\d{1,2}[.:]\d{2}(?:[.:]\d{2})?(?:\s*[AP]M)?)\]?\s*(?:-\s*)?(.*)$/i;

export function timestamp(date, time, order = 'DMY') {
  const parts = date.split(/[\/.-]/).map(Number);
  let y, m, d;
  if (String(parts[0]).length === 4) [y, m, d] = parts;
  else if (order === 'MDY') [m, d, y] = parts;
  else [d, m, y] = parts;
  if (y < 100) y += 2000;
  const t = time.match(/^(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?\s*([AP]M)?$/i);
  if (!t) return null;
  let h = Number(t[1]);
  const min = Number(t[2]), sec = Number(t[3] || 0), ampm = t[4]?.toUpperCase();
  if (ampm && (h < 1 || h > 12)) return null;
  if (ampm) h = h % 12 + (ampm === 'PM' ? 12 : 0);
  if (m < 1 || m > 12 || d < 1 || h > 23 || min > 59 || sec > 59 || y < 2000 || y > 2199) return null;
  const value = Date.UTC(y, m - 1, d, h, min, sec);
  const check = new Date(value);
  return check.getUTCDate() === d && check.getUTCMonth() === m - 1 ? value : null;
}

export function signature(m) { return JSON.stringify([m.time, m.sender, m.text]); }
export function hash(text) {
  let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

export function parseChat(input, order = 'DMY') {
  if (typeof input !== 'string' || input.includes('\0')) throw new Error('File ini bukan teks chat. Pilih file .txt hasil Ekspor chat WhatsApp.');
  const messages = [], occurrences = new Map();
  let current = null, ignored = 0, invalid = 0;
  const finish = () => {
    if (!current) return;
    current.text = current.text.replace(/\n+$/, '');
    const key = signature(current), occurrence = (occurrences.get(key) || 0) + 1;
    occurrences.set(key, occurrence);
    current.key = hash(key) + '-' + occurrence;
    messages.push(current); current = null;
  };
  for (const raw of input.replace(/\r\n?/g, '\n').split('\n')) {
    const match = raw.replace(marker, '').match(linePattern);
    if (match) {
      finish();
      const time = timestamp(match[1], match[2], order);
      const delimiter = match[3].indexOf(': ');
      if (time === null) { invalid++; continue; }
      if (delimiter < 1) { ignored++; continue; }
      const sender = match[3].slice(0, delimiter).trim();
      current = { sender, text: match[3].slice(delimiter + 2), time, dateOriginal: match[1], timeOriginal: match[2] };
    } else if (current) current.text += '\n' + raw;
    else if (raw.trim()) ignored++;
  }
  finish();
  if (!messages.length) throw new Error('Pesan belum terbaca. Gunakan file .txt dari Ekspor chat WhatsApp dan periksa pilihan format tanggal.');
  return { messages, ignored, invalid };
}

export function mergeMessages(previous, incoming, groupId) {
  const seen = new Set(previous.map(m => m.key));
  const added = incoming.filter(m => !seen.has(m.key)).map(m => ({...m, id: groupId + '/' + m.key, groupId}));
  return { messages: [...previous, ...added], added: added.length };
}

export function filterMessages(messages, {teachers = [], sender = '', group = '', query = '', view = 'messages', status = 'all', tasks = {}, ascending = false} = {}) {
  const names = new Set(teachers), q = query.trim().toLocaleLowerCase('id-ID');
  return messages.filter(m => (!names.size || names.has(m.sender)) && (!sender || m.sender === sender) && (!group || m.groupId === group) && (!q || (m.text + ' ' + m.sender).toLocaleLowerCase('id-ID').includes(q)) && (view !== 'tasks' || Object.hasOwn(tasks, m.id)) && (view !== 'tasks' || status === 'all' || (status === 'done' ? tasks[m.id]?.done : !tasks[m.id]?.done))).sort((a,b) => ascending ? a.time - b.time : b.time - a.time);
}
