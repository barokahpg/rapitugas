# Product context and canonical UI map

Source: current user conversation. Scope: Android-friendly web application for filtering exported WhatsApp messages by sender. User explicitly requires CSS bundled for offline. No access to live WhatsApp, no APK, no backend chat processing.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select | DESIGN.md | Android-owned popup for group/date format | browser |
| Form | import-form + importChat | current brief | file or pasted exported text | parser tests and browser |
| Scrollbar | style.css global | DESIGN.md | global only | static/browser |
| Toast | notify in app.mjs | this contract | status with inline persistent errors | browser |
| CRUD | app.mjs state transitions | current brief | merge imports, manual tasks, delete-all confirmation | tests/browser |

## Data lifecycle
Only user-selected local .txt content or manually pasted text enters the app. It is memory-only by default. Explicit 'Simpan di perangkat ini' opts into browser localStorage for messages, teachers, tasks; turning it off removes the persistent copy but retains this session. Storage errors are visible. Removing all app data requires a descriptive confirmation, and never affects WhatsApp. No analytics, remote fonts, or chat network API. Hosting authentication is handled by Sites. All cache content is app shell; actual chat content is never cached by the service worker. Search/filter state is deliberately private session state, not URL parameters.

## Flow ledger
- Import: validate extension/size/date format, parse before mutation, show count/warnings, merge exact duplicate keys within a named group, keep existing task markers. Never replace actual data when trying demo. Demo is an in-memory isolated workspace.
- Select teacher: checkbox selection has explicit save/cancel. Empty selection intentionally shows all senders, clearly labelled. Native Android input/file/select behavior accepted.
- Task: saving/unsaving and completing/reopening are reversible local actions. Completion uses explicit button and text, not color alone.
- Delete: scoped to all RapiTugas data; cancel is initial focus. Persisted deletion error stops transition and shows recovery text.
- Modals: native dialog showModal, shared close, Escape, focus restore, scroll bounded by viewport. No browser alert/confirm/prompt.
- Offline: service worker precaches same-origin shell after first successful online load. Cached app functions without network. Chat survives reopening only with explicit persistence. Update waits for existing tabs to close to avoid mixed asset versions.
- Long data: 20MB input, 40 rendered messages per load-more action. Local text search is immediate and IME-safe. No server requests or races.
- Multi-tab: storage event refreshes the persisted dataset and warns the user, preserving session filter values where valid.

## Locale and state coverage
Indonesian UI and accessible labels, id-ID dates, source wall-clock timestamps. Errors preserve input and previous data. Empty workspace, no matching messages, no saved tasks, parsing failure, storage failure, import busy, and successful merge all have visible text and an action. Sample names/messages are explicitly fictional. Media remains in WhatsApp; .txt-only limitation is visible before import.
