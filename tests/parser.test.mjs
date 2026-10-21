import test from 'node:test';
import assert from 'node:assert/strict';
import {parseChat,timestamp,mergeMessages,filterMessages} from '../dist/parser.mjs';
test('Android Indonesian export preserves multiline and skips system messages',()=>{
  const p=parseChat('\u200e21/10/26, 07.30 - Pesan dienkripsi.\r\n21/10/26, 07.31 - Bu Rina: Kerjakan nomor 1.\r\nLalu nomor 2.\r\n21/10/26, 07.32 - Mama: Siap.');
  assert.equal(p.messages.length,2);assert.equal(p.messages[0].text,'Kerjakan nomor 1.\nLalu nomor 2.');assert.equal(p.ignored,1);
});
test('bracketed export, seconds, AM/PM, international phone names, and MDY',()=>{
  const p=parseChat('[10/21/2026, 12:05:04 PM] +62 812-3456: Tugas IPA\n[10/21/2026, 12:05:04 AM] Guru: Malam','MDY');
  assert.equal(p.messages[0].sender,'+62 812-3456');assert.equal(new Date(p.messages[0].time).getUTCHours(),12);assert.equal(new Date(p.messages[1].time).getUTCHours(),0);
});
test('invalid and non-text files fail without yielding fabricated messages',()=>{
  assert.throws(()=>parseChat('isi acak'));assert.throws(()=>parseChat('abc\0def'));assert.equal(timestamp('31/2/26','07.30'),null);assert.equal(timestamp('21/10/26','27:99'),null);
});
test('merge is idempotent, retains same-second duplicate messages, and adds updates',()=>{
  const source='21/10/26, 07.30 - Bu Rina: Tugas\n21/10/26, 07.30 - Bu Rina: Tugas';
  const parsed=parseChat(source);const first=mergeMessages([],parsed.messages,'g1');assert.equal(first.added,2);
  const again=mergeMessages(first.messages,parseChat(source+'\n21/10/26, 08.30 - Bu Rina: Koreksi tugas').messages,'g1');
  assert.equal(again.added,1);assert.equal(again.messages.length,3);assert.equal(again.messages[0].id,first.messages[0].id);
});
test('teacher, group, query, task status and sorting filters compose',()=>{
  const {messages}=mergeMessages([],parseChat('21/10/26, 07.30 - Guru: Pecahan\n21/10/26, 08.30 - Orang tua: Baik\n21/10/26, 09.30 - Guru: Revisi pecahan').messages,'g1');
  const tasks={[messages[0].id]:{done:true},[messages[2].id]:{done:false}};
  const result=filterMessages(messages,{teachers:['Guru'],view:'tasks',tasks,status:'pending',query:'PECAHAN',group:'g1'});
  assert.equal(result.length,1);assert.equal(result[0].text,'Revisi pecahan');assert.equal(filterMessages(messages,{group:'other'}).length,0);
});
test('message HTML is retained as text, not interpreted by parser',()=>{
  const p=parseChat('21/10/26, 07.30 - Guru: <img src=x onerror=evil()>');assert.equal(p.messages[0].text,'<img src=x onerror=evil()>');
});
test('an export trailing newline does not create a duplicate when a later export adds messages',()=>{
  const before=mergeMessages([],parseChat('21/10/26, 07.30 - Guru: Tugas\n').messages,'g');
  const after=mergeMessages(before.messages,parseChat('21/10/26, 07.30 - Guru: Tugas\n21/10/26, 08.30 - Guru: Lanjutan\n').messages,'g');
  assert.equal(after.added,1);assert.equal(after.messages.length,2);
});
