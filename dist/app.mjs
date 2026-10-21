import {parseChat, mergeMessages, filterMessages, hash} from './parser.mjs';

const $ = id => document.getElementById(id);
const STORAGE = 'rapitugas.data.v1';
const LIMIT = 20 * 1024 * 1024;
const blank = () => ({version:1, groups:[], messages:[], teachers:[], tasks:{}});
let state = blank(), demo = false, remember = false;
let view = 'messages', sender = '', group = '', status = 'all', ascending = false, shown = 40;
let draftTeachers = new Set(), busy = false, importGeneration = 0, toastTimer, savedBeforeDemo = null;
const dialogTriggers = new WeakMap();

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}
function action(label, className, handler) {
  const b = el('button', className, label); b.type = 'button';
  if (handler) b.addEventListener('click', handler);
  return b;
}
function notify(message) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
  toastTimer = setTimeout(() => {$('toast').hidden = true;}, 5500);
}
function openDialog(id) {
  const dialog = $(id); dialogTriggers.set(dialog, document.activeElement);
  dialog.showModal();
}
function closeDialog(dialog) {
  dialog.close();
  const previous = dialogTriggers.get(dialog);
  if (previous?.isConnected) previous.focus();
}
document.querySelectorAll('.close-dialog').forEach(b => b.addEventListener('click', () => closeDialog(b.closest('dialog'))));
document.querySelectorAll('dialog').forEach(d => d.addEventListener('close', () => {
  if (d.id === 'import-dialog') {importGeneration++; busy = false; $('read-file-btn').disabled = false; $('read-file-btn').textContent = 'Baca chat →'; $('import-form').removeAttribute('aria-busy');}
}));

function validState(value) {
  return value?.version === 1 && Array.isArray(value.groups) && Array.isArray(value.messages) && Array.isArray(value.teachers) && value.tasks && typeof value.tasks === 'object' && value.groups.every(g => typeof g.id === 'string' && typeof g.name === 'string') && value.messages.every(m => typeof m.id === 'string' && typeof m.sender === 'string' && typeof m.text === 'string' && Number.isFinite(m.time));
}
function storageWarning(text) { $('storage-warning').textContent = text; $('storage-warning').hidden = !text; }
function saveState() {
  if (!remember || demo) return;
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); storageWarning(''); }
  catch { remember = false; storageWarning('Perubahan terbaru belum tersimpan di browser, mungkin karena penyimpanan penuh atau dibatasi. Data masih ada di tab ini. Buka Penyimpanan & data untuk mencoba menyimpan lagi.'); }
}
try {
  const stored = localStorage.getItem(STORAGE);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (validState(parsed)) {state = parsed; remember = true;}
    else storageWarning('Data tersimpan tidak terbaca. Masukkan kembali file chat atau hapus data lewat Penyimpanan & data.');
  }
} catch { storageWarning('Penyimpanan browser tidak dapat dibaca. Kamu tetap bisa menggunakan aplikasi di tab ini.'); }

function number(n) {return n.toLocaleString('id-ID');}
function initials(name) {return name.replace(/^\+/,'').split(/\s+/).slice(0,2).map(x => [...x][0] || '').join('').toUpperCase();}
function avatar(name) {return el('span', 'avatar' + (parseInt(hash(name).slice(-1),36) % 2 ? ' gold' : ''), initials(name));}
function counts() {
  const result = new Map();
  for (const m of state.messages) result.set(m.sender, (result.get(m.sender) || 0) + 1);
  return result;
}
function groupName(id) {return state.groups.find(g => g.id === id)?.name || 'Grup chat';}
function setView(next) {view = next; shown = 40; status = 'all'; render();}

function renderTeachers() {
  const list = $('teacher-list'); list.replaceChildren();
  const totals = counts();
  const names = state.teachers.length ? state.teachers.filter(n => totals.has(n)) : [...totals.keys()].sort((a,b)=>a.localeCompare(b,'id'));
  if (sender && !names.includes(sender)) sender = '';
  const all = action('', 'teacher-button' + (!sender ? ' active' : ''), () => {sender='';shown=40;render();});
  all.setAttribute('aria-pressed', String(!sender));
  all.append(el('span','avatar','≡'),el('span','', state.teachers.length ? 'Semua guru' : 'Semua pengirim'),el('span','teacher-total',number(names.length)));
  list.append(all);
  for (const name of names) {
    const b = action('', 'teacher-button' + (sender === name ? ' active' : ''), () => {sender=name;shown=40;render();});
    b.setAttribute('aria-pressed', String(sender===name)); b.title = name;
    b.append(avatar(name),el('span','',name),el('span','teacher-total',number(totals.get(name))));list.append(b);
  }
}

function renderGroups() {
  const select = $('group-filter');
  select.replaceChildren(new Option('Semua grup', ''));
  state.groups.forEach(g => select.append(new Option(g.name,g.id)));
  if (!state.groups.some(g => g.id === group)) group = '';
  select.value = group;
}

function render() {
  const hasData = !!state.messages.length;
  $('welcome').hidden=hasData; $('welcome-steps').hidden=hasData; $('workspace').hidden=!hasData;
  $('demo-banner').hidden=!demo;
  $('workspace-title').textContent=view==='tasks'?'Tugas anak': 'Pesan guru';
  document.title=(hasData ? (view==='tasks'?'Tugas anak':'Pesan guru') : 'Pesan guru, lebih teratur') + ' — RapiTugas';
  const count = Object.keys(state.tasks).length;
  $('task-count').textContent=number(count);
  $('summary').textContent = `${number(state.messages.length)} pesan dari ${number(state.groups.length)} grup · ${state.teachers.length ? number(state.teachers.length)+' guru dipilih' : 'Semua pengirim ditampilkan'}`;
  $('messages-tab').classList.toggle('active',view==='messages'); $('tasks-tab').classList.toggle('active',view==='tasks');
  $('messages-tab').setAttribute('aria-pressed',String(view==='messages')); $('tasks-tab').setAttribute('aria-pressed',String(view==='tasks'));
  $('task-status').hidden=view!=='tasks';
  $('sort-btn').textContent=ascending?'↑ Terlama dulu':'↓ Terbaru dulu';
  document.querySelectorAll('[data-status]').forEach(b=>{b.classList.toggle('active',b.dataset.status===status);b.setAttribute('aria-pressed',String(b.dataset.status===status));});
  renderTeachers();renderGroups();renderMessages();
}

function renderMessages() {
  const query=$('search').value;
  $('clear-search').hidden=!query;
  const results=filterMessages(state.messages,{teachers:state.teachers,sender,group,query,view,status,tasks:state.tasks,ascending});
  const list=$('message-list');list.replaceChildren();
  $('result-count').textContent=`${number(results.length)} ${view==='tasks'?'tugas':'pesan'}${results.length>shown?' · '+number(Math.min(shown,results.length))+' ditampilkan':''}`;
  $('teacher-caption').textContent=sender || (state.teachers.length ? 'Hanya guru pilihan' : 'Semua pengirim');
  if (!results.length) {
    const empty=el('div','empty-state');
    empty.append(el('span','empty-symbol', view==='tasks'?'☑':'⌕'));
    const noTasks=view==='tasks'&&!Object.keys(state.tasks).length;
    empty.append(el('h2','',noTasks?'Tugas yang disimpan akan muncul di sini':'Belum ada yang cocok'));
    empty.append(el('p','',noTasks?'Buka Pesan guru, lalu ketuk “Simpan tugas” pada instruksi yang perlu dikerjakan.':'Coba kata pencarian lain, pilih semua guru, atau ubah filter grup dan status.'));
    empty.append(action(noTasks?'Lihat pesan guru':'Bersihkan filter','btn',()=>{
      if(noTasks)setView('messages');else{sender='';group='';status='all';$('search').value='';shown=40;render();}
    }));list.append(empty);
  }
  for (const m of results.slice(0,shown)) {
    const card=el('article','message-card');
    const head=el('div','message-head');head.append(avatar(m.sender));
    const who=el('div','message-person');who.append(el('strong','',m.sender),el('small','',groupName(m.groupId)));head.append(who);
    const date=new Date(m.time);
    const when=el('time','message-time',date.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}));
    when.dateTime=date.toISOString().replace('Z','');
    when.append(el('span','', date.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'})));head.append(when);
    card.append(head,el('p','message-text',m.text));
    const footer=el('div','message-footer');const task=state.tasks[m.id];
    if (task) {
      const label=el('span','task-state'+(task.done?' complete':''));label.append(el('span','dot'),document.createTextNode(task.done?'Sudah selesai':'Belum selesai'));footer.append(label);
      const controls=el('div','');
      const remove=action('Lepas tugas','btn ghost',()=>{delete state.tasks[m.id];saveState();render();notify('Pesan dilepas dari daftar tugas.');});
      remove.setAttribute('aria-label','Lepas tugas dari '+m.sender);
      const done=action(task.done?'↶ Buka kembali':'✓ Tandai selesai','btn'+(task.done?'':' primary'),()=>{
        state.tasks[m.id]={done:!task.done};saveState();render();
        const newButton=[...document.querySelectorAll('[data-complete]')].find(b=>b.dataset.complete===m.id);newButton?.focus();
        notify(task.done?'Tugas dibuka kembali.':'Tugas ditandai selesai.');
      });done.dataset.complete=m.id;controls.append(remove,done);footer.append(controls);
    } else {
      footer.append(el('span','task-state','Teks asli dari chat'));
      const save=action('＋ Simpan tugas','btn ghost',()=>{state.tasks[m.id]={done:false};saveState();render();notify('Tugas disimpan. Buka tab Tugas untuk melihatnya.');});
      save.setAttribute('aria-label','Simpan tugas dari '+m.sender);footer.append(save);
    }
    card.append(footer);list.append(card);
  }
  $('load-more').hidden=results.length<=shown;
}

function importDialog() {
  $('import-error').textContent='';$('chat-file').value='';$('paste-chat').value='';$('group-name').value='';$('file-status').textContent='';
  $('chat-file').removeAttribute('aria-invalid');$('group-name').removeAttribute('aria-invalid');
  openDialog('import-dialog');
}
$('import-btn').addEventListener('click',importDialog);$('start-btn').addEventListener('click',importDialog);$('use-real-btn').addEventListener('click',importDialog);
$('chat-file').addEventListener('change',()=>{
  const file=$('chat-file').files[0];
  if(!file){$('file-status').textContent='';return;}
  $('file-status').textContent=file.name+' · '+number(Math.ceil(file.size/1024))+' KB';
  if(!$('group-name').value)$('group-name').value=file.name.replace(/\.txt$/i,'').replace(/^(WhatsApp Chat with |Chat WhatsApp dengan |WhatsApp Chat - )/i,'').slice(0,100);
});
$('import-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  $('import-error').textContent='';$('chat-file').removeAttribute('aria-invalid');$('group-name').removeAttribute('aria-invalid');
  const file=$('chat-file').files[0], pasted=$('paste-chat').value;
  let field=$('chat-file');
  try {
    if(!file&&!pasted.trim())throw new Error('Pilih file .txt atau tempel teks hasil ekspor terlebih dahulu.');
    if(file && !/\.txt$/i.test(file.name))throw new Error('Pilih file .txt. Jika hasil ekspor berupa ZIP, ekstrak terlebih dahulu lalu pilih file teksnya.');
    if(file && !file.size)throw new Error('File kosong. Ekspor kembali chat dari WhatsApp.');
    if((file?.size||new Blob([pasted]).size)>LIMIT)throw new Error('File terlalu besar. Batas versi ini 20 MB per file.');
    if(!$('group-name').value.trim()){field=$('group-name');throw new Error('Isi nama grup agar pembaruan chat bisa digabung dengan benar.');}
    busy=true;const generation=++importGeneration;
    $('read-file-btn').disabled=true;$('read-file-btn').textContent='Membaca chat…';$('import-form').setAttribute('aria-busy','true');
    const text=file?await file.text():pasted;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(generation!==importGeneration)return;
    const parsed=parseChat(text,$('date-order').value);
    const name=$('group-name').value.trim();
    const next=demo?(savedBeforeDemo||blank()):state;
    let target=next.groups.find(g=>g.name.normalize('NFC').toLocaleLowerCase('id-ID')===name.normalize('NFC').toLocaleLowerCase('id-ID'));
    if(!target)target={id:crypto.randomUUID(),name};
    const merged=mergeMessages(next.messages.filter(m=>m.groupId===target.id),parsed.messages,target.id);
    const updated={...next,groups:next.groups.some(g=>g.id===target.id)?next.groups:[...next.groups,target],messages:[...next.messages.filter(m=>m.groupId!==target.id),...merged.messages]};
    state=updated;demo=false;savedBeforeDemo=null;sender='';group=target.id;view='messages';status='all';shown=40;$('search').value='';
    saveState();closeDialog($('import-dialog'));render();
    const warnings=parsed.invalid?` ${number(parsed.invalid)} baris dengan tanggal tidak valid dilewati; periksa format tanggal.`:'';
    $('import-report').textContent=`${number(merged.added)} pesan baru ditambahkan. ${number(parsed.messages.length-merged.added)} pesan yang sudah ada dilewati.${warnings}`;
    $('import-report').hidden=false;
    notify(`${number(merged.added)} pesan baru ditambahkan.`);
    openTeachers();
  } catch(error) {
    $('import-error').textContent=error.message || 'File tidak dapat dibaca. Pilih ulang file dan coba lagi.';
    field.setAttribute('aria-invalid','true');field.focus();
  } finally {busy=false;$('read-file-btn').disabled=false;$('read-file-btn').textContent='Baca chat →';$('import-form').removeAttribute('aria-busy');}
});

function openTeachers() {draftTeachers=new Set(state.teachers);$('teacher-search').value='';renderTeacherOptions();openDialog('teachers-dialog');}
function renderTeacherOptions() {
  const totals=counts(),q=$('teacher-search').value.toLocaleLowerCase('id-ID');
  $('clear-teacher-search').hidden=!q;
  const list=$('teacher-options');list.replaceChildren();
  const names=[...totals.keys()].sort((a,b)=>a.localeCompare(b,'id')).filter(name=>name.toLocaleLowerCase('id-ID').includes(q));
  if(!names.length)list.append(el('p','muted','Nama tidak ditemukan. Coba nama atau nomor lain.'));
  for(const name of names){
    const row=el('label','check-row');const input=document.createElement('input');input.type='checkbox';input.checked=draftTeachers.has(name);
    input.addEventListener('change',()=>{input.checked?draftTeachers.add(name):draftTeachers.delete(name);selectionCount();});
    row.append(input,avatar(name),el('span','',name),el('span','count',number(totals.get(name))+' pesan'));list.append(row);
  }selectionCount();
}
function selectionCount() {$('selection-count').textContent=draftTeachers.size?`${number(draftTeachers.size)} pengirim dipilih.`:'Belum ada pilihan. Semua pengirim akan ditampilkan.';}
$('choose-teachers').addEventListener('click',openTeachers);
$('teacher-search').addEventListener('input',event=>{if(!event.isComposing)renderTeacherOptions();});$('teacher-search').addEventListener('compositionend',renderTeacherOptions);
$('clear-teacher-search').addEventListener('click',()=>{$('teacher-search').value='';renderTeacherOptions();$('teacher-search').focus();});
$('save-teachers').addEventListener('click',()=>{state.teachers=[...draftTeachers];sender='';shown=40;saveState();closeDialog($('teachers-dialog'));render();notify(state.teachers.length?'Pilihan guru disimpan.':'Semua pengirim ditampilkan.');});

function openSettings(){
  $('remember-data').checked=remember&&!demo;$('remember-data').disabled=demo;
  $('storage-status').textContent=demo?'Data contoh hanya dipakai untuk mencoba dan tidak disimpan.':remember?'Pesan dan penanda tugas disimpan di browser perangkat ini.':'Data hanya ada di tab ini. Aktifkan penyimpanan jika ingin membukanya lagi setelah tab ditutup.';
  $('data-actions').hidden=!state.messages.length;
  openDialog('settings-dialog');
}
$('settings-btn').addEventListener('click',openSettings);$('privacy-btn').addEventListener('click',openSettings);
$('remember-data').addEventListener('change',()=>{
  if(demo)return;
  try {
    if($('remember-data').checked){localStorage.setItem(STORAGE,JSON.stringify(state));remember=true;}
    else {localStorage.removeItem(STORAGE);remember=false;}
    storageWarning('');$('storage-status').textContent=remember?'Tersimpan di browser ini. Kamu bisa menutup tab dan membukanya lagi.':'Salinan tersimpan dihapus. Data sesi ini tetap tersedia sampai tab ditutup atau dimuat ulang.';
  } catch {$('remember-data').checked=remember;$('storage-status').textContent='Penyimpanan tidak berhasil diubah. Periksa ruang kosong atau izin penyimpanan browser, lalu coba lagi.';}
});
$('clear-data-btn').addEventListener('click',()=>{$('delete-error').textContent='';closeDialog($('settings-dialog'));openDialog('delete-dialog');});
$('confirm-delete').addEventListener('click',()=>{
  try {
    if(!demo)localStorage.removeItem(STORAGE);
    const wasDemo=demo;
    state=demo&&savedBeforeDemo?savedBeforeDemo:blank();savedBeforeDemo=null;demo=false;if(!wasDemo)remember=false;
    sender='';group='';view='messages';status='all';$('search').value='';$('import-report').hidden=true;storageWarning('');
    closeDialog($('delete-dialog'));render();(state.messages.length?$('messages-tab'):$('start-btn')).focus();notify(wasDemo?'Data contoh ditutup.':'Data RapiTugas dihapus. Pesan WhatsApp tetap ada.');
  } catch {$('delete-error').textContent='Salinan di browser belum bisa dihapus. Periksa izin penyimpanan browser, lalu coba lagi.';}
});

const sample=`20/10/26, 07.00 - Pesan dan panggilan dienkripsi secara end-to-end.
20/10/26, 07.30 - Bu Rina: Selamat pagi, Bapak dan Ibu. Untuk latihan Matematika hari ini, anak-anak mengerjakan halaman 42 nomor 1–5 tentang pecahan.
Ditulis di buku latihan dan dikumpulkan besok. Terima kasih.
20/10/26, 07.32 - Mama Dika: Baik Bu, terima kasih 🙏
20/10/26, 07.33 - Ayah Naya: Siap Bu Rina.
20/10/26, 08.15 - Pak Budi: Tugas Bahasa Indonesia:
Baca cerita “Kebun Kakek”, lalu tuliskan tokoh dan pesan ceritanya. Cukup satu paragraf di buku tulis.
20/10/26, 08.17 - Mama Dika: Untuk judulnya ditulis juga Pak?
20/10/26, 08.20 - Pak Budi: Iya, judul cerita ditulis di atas paragraf. Dikumpulkan hari Kamis.
20/10/26, 10.00 - Bu Sari: Untuk kegiatan IPA Jumat nanti, mohon anak-anak membawa satu gelas plastik bekas dan kapas. Tidak perlu membeli yang baru.
21/10/26, 07.10 - Bu Rina: Tambahan untuk latihan pecahan: nomor 5 cukup digambar, tidak perlu menggunakan kertas lipat.
21/10/26, 07.11 - Ayah Naya: Terima kasih infonya Bu.
21/10/26, 08.00 - Bu Sari: Contoh bahan untuk kegiatan Jumat ada di foto ini.
<Media tidak disertakan>
21/10/26, 09.00 - Pak Budi: Selamat pagi. Jangan lupa membaca kembali tulisan anak sebelum dikumpulkan. Perhatikan huruf kapital dan tanda titik.`;
$('demo-btn').addEventListener('click',()=>{
  savedBeforeDemo=state;demo=true;const parsed=parseChat(sample),id='contoh-kelas-4a';
  state={version:1,groups:[{id,name:'Kelas 4A · Contoh'}],messages:mergeMessages([],parsed.messages,id).messages,teachers:['Bu Rina','Pak Budi','Bu Sari'],tasks:{}};
  state.tasks[state.messages.find(m=>m.sender==='Bu Rina').id]={done:false};
  state.tasks[state.messages.find(m=>m.sender==='Pak Budi').id]={done:true};
  render();$('workspace-title').scrollIntoView({block:'start'});
});
$('messages-tab').addEventListener('click',()=>setView('messages'));$('tasks-tab').addEventListener('click',()=>setView('tasks'));
$('search').addEventListener('input',event=>{if(!event.isComposing){shown=40;renderMessages();}});$('search').addEventListener('compositionend',()=>{shown=40;renderMessages();});
$('clear-search').addEventListener('click',()=>{$('search').value='';shown=40;renderMessages();$('search').focus();});
$('sort-btn').addEventListener('click',()=>{ascending=!ascending;shown=40;render();});
$('group-filter').addEventListener('change',()=>{group=$('group-filter').value;shown=40;renderMessages();});
document.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',()=>{status=b.dataset.status;shown=40;render();}));
$('load-more').addEventListener('click',()=>{shown+=40;renderMessages();});
['help-btn','import-help-btn'].forEach(id=>$(id).addEventListener('click',()=>openDialog('help-dialog')));
window.addEventListener('storage',event=>{
  if(event.key!==STORAGE||demo)return;
  try {const next=event.newValue?JSON.parse(event.newValue):blank();if(validState(next)){state=next;remember=!!event.newValue;render();notify('Data diperbarui dari tab RapiTugas lainnya.');}}catch{storageWarning('Perubahan dari tab lain tidak terbaca. Muat ulang setelah menyimpan file ekspor aslinya.');}
});
render();

if('serviceWorker' in navigator){
  const readyTimeout=setTimeout(()=>{$('offline-status').textContent='Persiapan offline belum selesai. Pastikan koneksi aktif lalu buka kembali.';},20000);
  navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{
    clearTimeout(readyTimeout);
    $('offline-status').textContent='✓ Aplikasi siap dibuka offline';
  }).catch(()=>{clearTimeout(readyTimeout);$('offline-status').textContent='Mode offline belum tersedia. Buka lagi saat online untuk mencoba.';});
}else{$('offline-status').textContent='Browser ini belum mendukung mode offline.';}
