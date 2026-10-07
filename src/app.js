/* Oğuzlar Fiş - arayüz mantığı */
(function () {
  const R = window.Receipt;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clone = o => JSON.parse(JSON.stringify(o));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
  const lower = s => String(s || '').toLocaleLowerCase('tr');
  const money = n => R.money(n, DB.settings.currency);

  // ---------- Tarayıcıda test için yedek API ----------
  const api = window.api || {
    load: async () => JSON.parse(localStorage.getItem('oguzlar-fis') || 'null'),
    save: async d => localStorage.setItem('oguzlar-fis', JSON.stringify(d)),
    openDataFolder: async () => {},
    exportJson: async (name, data) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = name; a.click(); return true;
    },
    importJson: () => new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
      i.onchange = () => { const f = i.files[0]; if (!f) return res(null); f.text().then(t => res(JSON.parse(t))); };
      i.click();
    }),
    printers: async () => [],
    print: async ({ html }) => {
      const f = document.createElement('iframe'); f.style.display = 'none'; document.body.appendChild(f);
      f.srcdoc = html; f.onload = () => { f.contentWindow.print(); setTimeout(() => f.remove(), 1000); };
      return { success: true };
    },
    pdf: async opts => api.print(opts)
  };

  // ---------- Veri ----------
  function defaults() {
    const p = (name, unit, price, code) => ({ id: uid(), code, name, unit, price, kdv: 1, fav: true });
    return {
      version: 1,
      settings: {
        company: { name: 'OĞUZLAR MANAV', address: '', phone: '', web: '', taxOffice: '', taxNo: '', logo: '' },
        currency: '₺',
        kdvRates: [0, 1, 10, 20],
        defaultKdv: 1,
        kdvMode: 'genel',
        kdvIncluded: false,
        prefix: 'FS-',
        nextNo: 1,
        numPad: 6,
        validityDays: 7,
        units: ['kg', 'adet', 'kasa', 'bağ', 'demet', 'paket', 'çuval', 'ton'],
        printer: { deviceName: '', silent: false, copies: 1 }
      },
      design: R.preset('manav'),
      designs: [],
      products: [
        p('Domates', 'kg', 25, 'D01'), p('Salatalık', 'kg', 20, 'S01'), p('Sivri Biber', 'kg', 40, 'B01'),
        p('Patlıcan', 'kg', 30, 'P01'), p('Patates', 'kg', 15, 'P02'), p('Kuru Soğan', 'kg', 12, 'S02'),
        p('Elma', 'kg', 35, 'E01'), p('Portakal', 'kg', 30, 'P03'), p('Muz', 'kg', 60, 'M01'),
        p('Limon', 'kg', 40, 'L01'), p('Maydanoz', 'bağ', 10, 'M02'), p('Marul', 'adet', 15, 'M03')
      ],
      customers: [],
      receipts: [],
      draft: null
    };
  }

  let DB;
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => api.save(DB).catch(e => toast('Kaydedilemedi: ' + e.message, true)), 250);
  }
  function saveNow() { clearTimeout(saveTimer); return api.save(DB); }

  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, val) {
    const ks = path.split('.'); const last = ks.pop();
    const t = ks.reduce((o, k) => (o[k] = o[k] || {}), obj); t[last] = val;
  }

  const S = () => DB.settings;
  const fmtNo = n => S().prefix + String(n).padStart(Number(S().numPad) || 1, '0');

  function newDraft() {
    return {
      id: null,
      no: fmtNo(S().nextNo),
      docType: DB.design.docTypeLabel || 'Satış Fişi',
      autoDate: true,
      date: null,
      customerId: '',
      customer: null,
      items: [],
      kdvRate: S().defaultKdv,
      discountRate: 0,
      notes: '',
      validity: S().validityDays
    };
  }
  function draft() {
    if (!DB.draft) DB.draft = newDraft();
    return DB.draft;
  }
  // Fişin kendi hesap ayarları (geçmiş fişler kaydedildiği andaki kurallarla hesaplanır)
  function calcSettings(rec) {
    const s = Object.assign({}, S());
    if (rec && rec.kdvMode) s.kdvMode = rec.kdvMode;
    if (rec && rec.kdvIncluded != null) s.kdvIncluded = rec.kdvIncluded;
    return s;
  }
  function renderHtml(rec, design) {
    const r = Object.assign({}, rec, { date: rec.date || new Date().toISOString() });
    return R.render(r, calcSettings(rec), design || DB.design);
  }

  // ---------- Ortak arayüz ----------
  let toastTimer;
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.className = 'toast'), 2600);
  }
  function openModal(title, bodyHtml, footHtml, wide) {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    $('#modalFoot').innerHTML = footHtml || '';
    $('.modal-box').classList.toggle('wide', !!wide);
    $('#modal').classList.remove('hidden');
    return $('#modal');
  }
  function closeModal() { $('#modal').classList.add('hidden'); $('#modalBody').innerHTML = ''; }
  $('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });

  const PAPER_MM = { A4: 210, A5: 148, '80mm': 80, '58mm': 58 };
  // Kağıt önizlemesi (iframe içinde gerçek yazdırma HTML'i)
  function mountPreview(container, html, paper) {
    const wpx = Math.round((PAPER_MM[paper] || 210) * 96 / 25.4);
    container.innerHTML = '<div class="holder"><div class="paper"><iframe></iframe></div></div>';
    const holder = $('.holder', container), paperEl = $('.paper', container), fr = $('iframe', container);
    fr.style.width = wpx + 'px';
    fr.onload = () => {
      const doc = fr.contentDocument; if (!doc) return;
      const h = Math.max(doc.documentElement.scrollHeight, 200);
      fr.style.height = h + 'px';
      const sc = Math.min(1, (container.clientWidth - 40) / wpx);
      paperEl.style.width = wpx + 'px';
      paperEl.style.transform = `scale(${sc})`;
      holder.style.width = Math.floor(wpx * sc) + 'px';
      holder.style.height = Math.ceil(h * sc) + 'px';
    };
    fr.srcdoc = html;
  }

  async function doPrint(rec) {
    const p = S().printer || {};
    const res = await api.print({
      html: renderHtml(rec), paper: DB.design.paper, deviceName: p.deviceName, silent: p.silent, copies: p.copies
    });
    if (res && res.success) toast('Yazdırma gönderildi');
    else if (res && res.reason && !/cancel/i.test(res.reason)) toast('Yazdırılamadı: ' + res.reason, true);
    return res;
  }
  async function doPdf(rec) {
    const res = await api.pdf({ html: renderHtml(rec), paper: DB.design.paper, name: rec.no || 'fis' });
    if (res && res.success && res.path) toast('PDF kaydedildi');
  }
  function showPreview(rec, title) {
    openModal(title || `Önizleme - ${rec.no}`, '<div class="preview-wrap" id="pv" style="height:70vh"></div>',
      `<button class="btn" data-close>Kapat</button><button class="btn" id="pvPdf">📄 PDF Kaydet</button><button class="btn pri" id="pvPrint">🖨 Yazdır</button>`, true);
    mountPreview($('#pv'), renderHtml(rec), DB.design.paper);
    $('#pvPdf').onclick = () => doPdf(rec);
    $('#pvPrint').onclick = () => doPrint(rec);
  }

  // ---------- Navigasyon ----------
  let view = 'sale';
  const views = {};
  function go(v) {
    view = v;
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    $('#main').innerHTML = '';
    $('#main').oninput = $('#main').onchange = null;
    views[v]();
  }
  $$('.nav-btn').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));

  function refreshNav() {
    const co = S().company;
    const img = $('#navLogo');
    if (co.logo) img.src = co.logo; else img.removeAttribute('src');
    $('#navCompany').textContent = co.name || '';
  }
  function tick() {
    const d = R.dateParts();
    $('#navClock').innerHTML = `${d.day}<br><b>${d.date}</b> ${d.time}`;
    const c = $('#saleClock');
    if (c && draft().autoDate) c.innerHTML = clockHtml(d);
  }
  const clockHtml = d => `<div>${d.day}</div><b>${d.date}</b><div>${d.time}</div><div class="muted" style="font-size:12px">${esc(draft().docType)}</div>`;

  // =====================================================
  //  SATIŞ / YENİ FİŞ
  // =====================================================
  views.sale = function () {
    const d = draft();
    const co = S().company;
    const editing = d.id ? DB.receipts.find(r => r.id === d.id) : null;
    $('#main').innerHTML = `
    <div class="sale">
      <div class="sale-paper">
        <div class="sale-hdr">
          <button class="docbtn" id="docBtn" title="Belge ve alıcı bilgilerini düzenle"></button>
          <div class="sale-brand">${co.logo ? `<img src="${co.logo}">` : ''}${esc(co.name || 'Şirket ismi ve logosu')}</div>
          <div class="sale-clock" id="saleClock"></div>
        </div>
        <div class="add-bar">
          <input class="search" id="pSearch" placeholder="Ürün adı veya kodu yazın…  (F2)" autocomplete="off">
          <input class="qty" id="pQty" placeholder="Kilo / adet" inputmode="decimal">
          <button class="btn pri" id="pAdd">＋ Ekle</button>
          <div class="suggest" id="suggest" hidden></div>
        </div>
        <div class="lines-wrap">
          <table class="lines">
            <thead><tr>
              <th style="width:36%">Ürün</th><th style="width:24%">Kilosu yada Birimi</th><th style="width:17%">Fiyat</th>
              ${S().kdvMode === 'satir' ? '<th style="width:8%">KDV %</th>' : ''}
              <th style="width:17%;text-align:right">Tutar</th><th style="width:34px"></th>
            </tr></thead>
            <tbody id="lines"></tbody>
          </table>
        </div>
        <div class="sale-bottom">
          <label>Fiş açıklaması<textarea id="dNotes" rows="3" placeholder="Fişe yazılacak not (isteğe bağlı)">${esc(d.notes)}</textarea></label>
          <div class="totals-box" id="totals"></div>
        </div>
      </div>
      <div class="side">
        ${editing ? `<div class="editing-badge">✏️ <b>${esc(editing.no)}</b> numaralı fiş düzenleniyor. <a href="#" id="cancelEdit">Vazgeç</a></div>` : ''}
        <div class="card tiles-card">
          <input id="tileSearch" placeholder="🔍 Ürünlerde ara">
          <div class="tiles" id="tiles"></div>
        </div>
        <div class="actions">
          <button class="btn pri big full" id="aPrint">🖨 Kaydet ve Yazdır <kbd>F9</kbd></button>
          <button class="btn" id="aSave">💾 Sadece Kaydet <kbd style="background:#eee">F8</kbd></button>
          <button class="btn" id="aPreview">👁 Önizleme</button>
          <button class="btn" id="aPdf">📄 PDF</button>
          <button class="btn red" id="aNew">🗑 Yeni / Temizle</button>
        </div>
      </div>
    </div>`;
    renderDocBtn();
    $('#saleClock').innerHTML = clockHtml(d.autoDate || !d.date ? R.dateParts() : R.dateParts(d.date));
    renderLines();
    renderTiles();

    $('#docBtn').onclick = openDocModal;
    $('#dNotes').oninput = e => { d.notes = e.target.value; save(); };
    $('#tileSearch').oninput = renderTiles;
    $('#aPrint').onclick = () => saveAndPrint();
    $('#aSave').onclick = () => commit() && afterCommit();
    $('#aPreview').onclick = () => showPreview(d);
    $('#aPdf').onclick = () => doPdf(d);
    $('#aNew').onclick = () => {
      if (d.items.length && !confirm('Fişteki tüm satırlar silinsin mi?')) return;
      DB.draft = newDraft(); save(); go('sale');
    };
    const ce = $('#cancelEdit');
    if (ce) ce.onclick = e => { e.preventDefault(); DB.draft = newDraft(); save(); go('sale'); };

    // ürün arama / ekleme
    const inp = $('#pSearch'), qty = $('#pQty'), sug = $('#suggest');
    let matches = [], sel = 0;
    const showSug = () => {
      const q = lower(inp.value.trim());
      if (!q) { sug.hidden = true; matches = []; return; }
      matches = DB.products.filter(p => lower(p.name).includes(q) || lower(p.code) === q || lower(p.code).startsWith(q)).slice(0, 12);
      sel = 0;
      sug.innerHTML = matches.map((p, i) => `<div data-i="${i}" class="${i === sel ? 'on' : ''}"><span><b>${esc(p.name)}</b> <span class="muted">${esc(p.code || '')}</span></span><span>${money(p.price)} / ${esc(p.unit)}</span></div>`).join('')
        || `<div class="muted">"${esc(inp.value)}" listede yok — Enter ile serbest satır eklenir</div>`;
      sug.hidden = false;
    };
    const addFromSearch = () => {
      const q = inp.value.trim();
      const p = matches[sel];
      const qn = qty.value.trim() ? num(qty.value) : 1;
      if (p) addLine(p, qn);
      else if (q) addLine({ name: q, unit: S().units[0] || 'kg', price: 0, kdv: S().defaultKdv }, qn, true);
      else return;
      inp.value = ''; qty.value = ''; sug.hidden = true; matches = [];
      if (p) inp.focus();
    };
    inp.oninput = showSug;
    inp.onkeydown = e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!matches.length) return;
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        $$('div', sug).forEach((el, i) => el.classList.toggle('on', i === sel));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (matches[sel] && !qty.value) { qty.focus(); return; }
        addFromSearch();
      } else if (e.key === 'Escape') { sug.hidden = true; }
      else if (e.key === 'Tab' && matches.length) { /* miktar alanına geç */ }
    };
    qty.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addFromSearch(); inp.focus(); } };
    $('#pAdd').onclick = () => { addFromSearch(); inp.focus(); };
    sug.onmousedown = e => {
      const el = e.target.closest('[data-i]'); if (!el) return;
      e.preventDefault(); sel = +el.dataset.i; addFromSearch();
    };
    inp.onblur = () => setTimeout(() => (sug.hidden = true), 150);
    inp.focus();
  };

  function renderDocBtn() {
    const d = draft();
    const c = d.customer;
    $('#docBtn').innerHTML = `
      <div><span class="lbl">Belge No:</span> <b>${esc(d.no)}</b> · ${esc(d.docType)}</div>
      <div><span class="lbl">Alıcı:</span> <b>${c && c.name ? esc(c.name) : 'Seçilmedi (perakende)'}</b></div>
      ${c && c.phone ? `<div class="lbl">${esc(c.phone)}</div>` : ''}
      <div class="hint">▸ Bilgileri düzenlemek için tıklayın</div>`;
  }

  function addLine(p, qty, focusPrice) {
    const d = draft();
    d.items.push({ pid: p.id || '', code: p.code || '', name: p.name, qty: qty == null ? 1 : qty, unit: p.unit || 'kg', price: Number(p.price) || 0, kdv: p.kdv != null ? Number(p.kdv) : S().defaultKdv });
    save();
    renderLines();
    const idx = d.items.length - 1;
    const row = $(`#lines tr[data-i="${idx}"]`);
    if (row) {
      row.scrollIntoView({ block: 'nearest' });
      if (focusPrice) { const pr = $('[data-f=price]', row); pr.focus(); pr.select(); }
    }
    return idx;
  }

  function unitOptions(sel) {
    const us = S().units.slice();
    if (sel && !us.includes(sel)) us.unshift(sel);
    return us.map(u => `<option ${u === sel ? 'selected' : ''}>${esc(u)}</option>`).join('');
  }

  function renderLines() {
    const d = draft();
    const satir = S().kdvMode === 'satir';
    const t = R.calc(d, calcSettings(d));
    $('#lines').innerHTML = d.items.length ? d.items.map((it, i) => `
      <tr data-i="${i}">
        <td><input data-f="name" value="${esc(it.name)}"></td>
        <td><div class="qty-cell"><input data-f="qty" value="${R.qtyFmt(it.qty)}" inputmode="decimal"><select data-f="unit">${unitOptions(it.unit)}</select></div></td>
        <td><input data-f="price" value="${R.qtyFmt(it.price)}" inputmode="decimal" style="text-align:right"></td>
        ${satir ? `<td><input data-f="kdv" value="${R.qtyFmt(it.kdv)}" inputmode="decimal" style="text-align:center"></td>` : ''}
        <td class="amount">${money(t.lines[i].amount)}</td>
        <td><button class="del" title="Satırı sil">✕</button></td>
      </tr>`).join('')
      : `<tr><td colspan="6" class="empty-msg">Henüz ürün eklenmedi.<br>Yukarıdan arayın ya da sağdaki ürün kartlarına tıklayın.</td></tr>`;

    $$('#lines tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i;
      $$('[data-f]', tr).forEach(el => {
        const f = el.dataset.f;
        const handler = () => {
          const it = d.items[i];
          it[f] = (f === 'name' || f === 'unit') ? el.value : num(el.value);
          save(); updateAmounts();
        };
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', handler);
        if (el.tagName === 'INPUT') {
          el.addEventListener('focus', () => el.select());
          el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#pSearch').focus(); } });
        }
      });
      $('.del', tr).onclick = () => { d.items.splice(i, 1); save(); renderLines(); };
    });
    renderTotals();
  }

  function updateAmounts() {
    const d = draft();
    const t = R.calc(d, calcSettings(d));
    $$('#lines tr[data-i]').forEach(tr => { $('.amount', tr).textContent = money(t.lines[+tr.dataset.i].amount); });
    renderTotals();
  }

  function renderTotals() {
    const d = draft();
    const cs = calcSettings(d);
    const t = R.calc(d, cs);
    const rates = S().kdvRates.slice();
    if (!rates.map(Number).includes(Number(d.kdvRate))) rates.push(d.kdvRate);
    const box = $('#totals');
    const kdvLine = cs.kdvMode === 'genel'
      ? `<div class="r"><span>KDV oranı ${cs.kdvIncluded ? '(dahil)' : ''}</span><span class="row"><select id="tKdv">${rates.map(r => `<option value="${r}" ${Number(r) === Number(d.kdvRate) ? 'selected' : ''}>%${r}</option>`).join('')}</select><b>${money(t.kdv)}</b></span></div>`
      : `<div class="r"><span>KDV toplamı ${cs.kdvIncluded ? '(dahil)' : ''}</span><b>${money(t.kdv)}</b></div>`;
    box.innerHTML = `
      <div class="r"><span>Toplam Tutar</span><b>${money(t.subtotal)}</b></div>
      <div class="r"><span>İskonto %</span><span class="row"><input id="tDisc" value="${d.discountRate ? R.qtyFmt(d.discountRate) : ''}" placeholder="0" inputmode="decimal">${t.discount ? `<b>-${money(t.discount)}</b>` : ''}</span></div>
      ${kdvLine}
      <div class="r grand"><span>Genel Toplam</span><span>${money(t.grand)}</span></div>`;
    const k = $('#tKdv');
    if (k) k.onchange = () => { d.kdvRate = num(k.value); save(); renderTotals(); };
    const di = $('#tDisc');
    di.onchange = () => { d.discountRate = Math.min(100, Math.max(0, num(di.value))); save(); renderTotals(); };
  }

  function renderTiles() {
    const q = lower(($('#tileSearch') || {}).value || '');
    const list = DB.products.filter(p => p.fav !== false && (!q || lower(p.name).includes(q) || lower(p.code).includes(q)));
    $('#tiles').innerHTML = list.map(p => `<button class="tile" data-id="${p.id}"><b>${esc(p.name)}</b><span>${money(p.price)} / ${esc(p.unit)}</span></button>`).join('')
      || '<div class="muted" style="grid-column:1/-1;text-align:center;padding:20px">Ürün bulunamadı. "Ürünler" ekranından ekleyin.</div>';
    $$('#tiles .tile').forEach(b => b.onclick = () => {
      const p = DB.products.find(x => x.id === b.dataset.id);
      const i = addLine(p, 1);
      const q = $(`#lines tr[data-i="${i}"] [data-f=qty]`);
      if (q) { q.focus(); q.select(); }
    });
  }

  // Belge / alıcı bilgileri popup ekranı
  function openDocModal() {
    const d = draft();
    const c = d.customer || {};
    const toLocal = iso => { const x = iso ? new Date(iso) : new Date(); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
    openModal('Belge ve Alıcı Bilgileri', `
      <div class="grid3 mb">
        <label>Belge numarası<input id="mNo" value="${esc(d.no)}"></label>
        <label>Belge türü<input id="mType" value="${esc(d.docType)}" list="docTypes"></label>
        <label>Geçerlilik (gün)<input id="mValid" type="number" min="0" value="${esc(d.validity)}"></label>
        <datalist id="docTypes"><option>Satış Fişi</option><option>Teklif</option><option>Sevk İrsaliyesi</option><option>Fatura</option><option>Tahsilat Makbuzu</option><option>Sipariş Fişi</option></datalist>
      </div>
      <div class="grid2 mb">
        <label class="chk"><input type="checkbox" id="mAuto" ${d.autoDate ? 'checked' : ''}> Tarih/saat otomatik (kayıt anı)</label>
        <label>Tarih / saat<input type="datetime-local" id="mDate" value="${toLocal(d.date)}" ${d.autoDate ? 'disabled' : ''}></label>
      </div>
      <h3 style="margin:6px 0 10px">Alıcı şirket / müşteri</h3>
      <div class="row mb">
        <select id="mCust" class="grow"><option value="">— Kayıtlı müşteri seç (veya aşağıya elle yaz) —</option>
          ${DB.customers.map(x => `<option value="${x.id}" ${x.id === d.customerId ? 'selected' : ''}>${esc(x.name)}${x.phone ? ' - ' + esc(x.phone) : ''}</option>`).join('')}
        </select>
        <button class="btn sm" id="mClear">Temizle</button>
      </div>
      <div class="grid2 mb">
        <label>Firma / müşteri adı<input id="cName" value="${esc(c.name)}"></label>
        <label>Yetkili<input id="cContact" value="${esc(c.contact)}"></label>
        <label>Telefon<input id="cPhone" value="${esc(c.phone)}"></label>
        <label>Vergi dairesi<input id="cTaxOffice" value="${esc(c.taxOffice)}"></label>
        <label>Vergi / TC no<input id="cTaxNo" value="${esc(c.taxNo)}"></label>
        <label>Adres<input id="cAddress" value="${esc(c.address)}"></label>
      </div>
      <label class="chk"><input type="checkbox" id="cSave"> Bu müşteriyi kayıtlı müşterilere ekle / güncelle</label>
    `, `<button class="btn" data-close>Vazgeç</button><button class="btn pri" id="mOk">Tamam</button>`);

    const fields = ['name', 'contact', 'phone', 'taxOffice', 'taxNo', 'address'];
    const cap = f => 'c' + f[0].toUpperCase() + f.slice(1);
    $('#mAuto').onchange = e => { $('#mDate').disabled = e.target.checked; };
    $('#mCust').onchange = e => {
      const x = DB.customers.find(k => k.id === e.target.value) || {};
      fields.forEach(f => { $('#' + cap(f)).value = x[f] || ''; });
    };
    $('#mClear').onclick = () => { $('#mCust').value = ''; fields.forEach(f => { $('#' + cap(f)).value = ''; }); };
    $('#mOk').onclick = () => {
      d.no = $('#mNo').value.trim() || d.no;
      d.docType = $('#mType').value.trim();
      d.validity = num($('#mValid').value);
      d.autoDate = $('#mAuto').checked;
      d.date = d.autoDate ? null : new Date($('#mDate').value).toISOString();
      const cust = {};
      fields.forEach(f => { cust[f] = $('#' + cap(f)).value.trim(); });
      d.customerId = $('#mCust').value;
      d.customer = cust.name ? cust : null;
      if ($('#cSave').checked && cust.name) {
        let ex = DB.customers.find(k => k.id === d.customerId);
        if (ex) Object.assign(ex, cust);
        else { ex = Object.assign({ id: uid() }, cust); DB.customers.push(ex); d.customerId = ex.id; }
      }
      save(); closeModal(); go('sale');
    };
  }

  function commit() {
    const d = draft();
    if (!d.items.length) { toast('Fişte ürün yok', true); return null; }
    const rec = clone(d);
    if (rec.autoDate || !rec.date) rec.date = new Date().toISOString();
    rec.kdvMode = S().kdvMode;
    rec.kdvIncluded = S().kdvIncluded;
    rec.total = R.calc(rec, calcSettings(rec)).grand;
    if (rec.id) {
      const i = DB.receipts.findIndex(r => r.id === rec.id);
      rec.updatedAt = new Date().toISOString();
      if (i >= 0) DB.receipts[i] = rec; else DB.receipts.unshift(rec);
    } else {
      rec.id = uid();
      rec.createdAt = new Date().toISOString();
      DB.receipts.unshift(rec);
      if (rec.no === fmtNo(S().nextNo)) S().nextNo++;
    }
    lastCommitted = rec;
    return rec;
  }
  let lastCommitted = null;
  function afterCommit() {
    toast(`${lastCommitted.no} kaydedildi`);
    DB.draft = newDraft();
    saveNow();
    go('sale');
  }
  async function saveAndPrint() {
    const rec = commit();
    if (!rec) return;
    afterCommit();
    await doPrint(rec);
  }

  // =====================================================
  //  FİŞ GEÇMİŞİ
  // =====================================================
  const hist = { q: '', from: '', to: '' };
  views.history = function () {
    const today = new Date().toDateString();
    const now = new Date();
    const sum = arr => arr.reduce((a, r) => a + (Number(r.total) || 0), 0);
    const todays = DB.receipts.filter(r => new Date(r.date).toDateString() === today);
    const month = DB.receipts.filter(r => { const x = new Date(r.date); return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear(); });
    $('#main').innerHTML = `
      <h2>Fiş Geçmişi</h2>
      <div class="stats">
        <div class="stat"><span>Bugün fiş</span><b>${todays.length}</b></div>
        <div class="stat"><span>Bugün toplam</span><b>${money(sum(todays))}</b></div>
        <div class="stat"><span>Bu ay toplam</span><b>${money(sum(month))}</b></div>
        <div class="stat"><span>Tüm fişler</span><b>${DB.receipts.length}</b></div>
      </div>
      <div class="card">
        <div class="row mb">
          <input id="hQ" class="grow" placeholder="🔍 Fiş no, müşteri veya ürün ara" value="${esc(hist.q)}">
          <label style="flex-direction:row;align-items:center">Başlangıç <input type="date" id="hFrom" value="${hist.from}"></label>
          <label style="flex-direction:row;align-items:center">Bitiş <input type="date" id="hTo" value="${hist.to}"></label>
        </div>
        <div id="hTotal" class="muted mb"></div>
        <table class="list"><thead><tr><th>No</th><th>Tür</th><th>Tarih</th><th>Müşteri</th><th class="num">Kalem</th><th class="num">Genel Toplam</th><th style="width:400px"></th></tr></thead>
        <tbody id="hBody"></tbody></table>
      </div>`;
    const draw = () => {
      const q = lower(hist.q);
      const from = hist.from ? new Date(hist.from + 'T00:00') : null;
      const to = hist.to ? new Date(hist.to + 'T23:59:59') : null;
      const list = DB.receipts.filter(r => {
        const dt = new Date(r.date);
        if (from && dt < from) return false;
        if (to && dt > to) return false;
        if (!q) return true;
        return lower(r.no).includes(q) || lower(r.customer && r.customer.name).includes(q) || r.items.some(i => lower(i.name).includes(q));
      });
      $('#hTotal').textContent = `${list.length} fiş · Toplam ${money(sum(list))}`;
      $('#hBody').innerHTML = list.slice(0, 500).map(r => {
        const p = R.dateParts(r.date);
        return `<tr data-id="${r.id}">
          <td><b>${esc(r.no)}</b></td><td><span class="tag">${esc(r.docType)}</span></td>
          <td>${p.date} ${p.time}</td><td>${esc(r.customer ? r.customer.name : '-')}</td>
          <td class="num">${r.items.length}</td><td class="num"><b>${money(r.total)}</b></td>
          <td class="right" style="white-space:nowrap">
            <button class="btn sm" data-a="view">👁 Gör</button>
            <button class="btn sm" data-a="print">🖨 Yazdır</button>
            <button class="btn sm" data-a="pdf">PDF</button>
            <button class="btn sm" data-a="edit">✏️ Düzenle</button>
            <button class="btn sm" data-a="copy" title="Aynı ürünlerle yeni fiş">⧉</button>
            <button class="btn sm red" data-a="del">🗑</button>
          </td></tr>`;
      }).join('') || '<tr><td colspan="7" class="empty-msg">Kayıtlı fiş yok</td></tr>';
    };
    draw();
    $('#hQ').oninput = e => { hist.q = e.target.value; draw(); };
    $('#hFrom').onchange = e => { hist.from = e.target.value; draw(); };
    $('#hTo').onchange = e => { hist.to = e.target.value; draw(); };
    $('#hBody').onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const r = DB.receipts.find(x => x.id === b.closest('tr').dataset.id); if (!r) return;
      const a = b.dataset.a;
      if (a === 'view') showPreview(r);
      if (a === 'print') doPrint(r);
      if (a === 'pdf') doPdf(r);
      if (a === 'edit') {
        if (draft().items.length && !draft().id && !confirm('Açık olan yeni fişteki satırlar silinecek. Devam edilsin mi?')) return;
        DB.draft = clone(r); DB.draft.autoDate = false; save(); go('sale');
      }
      if (a === 'copy') {
        if (draft().items.length && !confirm('Açık olan fişin yerine bu fişin kopyası açılsın mı?')) return;
        const n = newDraft(); n.items = clone(r.items); n.customer = clone(r.customer); n.customerId = r.customerId;
        n.kdvRate = r.kdvRate; n.discountRate = r.discountRate; n.notes = r.notes; n.docType = r.docType;
        DB.draft = n; save(); go('sale');
      }
      if (a === 'del' && confirm(`${r.no} numaralı fiş silinsin mi?`)) {
        DB.receipts = DB.receipts.filter(x => x.id !== r.id); save(); views.history();
      }
    };
  };

  // =====================================================
  //  ÜRÜNLER
  // =====================================================
  views.products = function () {
    $('#main').innerHTML = `
      <h2>Ürünler</h2>
      <div class="card mb">
        <div class="row" style="align-items:flex-end;flex-wrap:wrap">
          <label style="width:110px">Kod<input id="nCode"></label>
          <label class="grow">Ürün adı<input id="nName"></label>
          <label style="width:120px">Birim<select id="nUnit">${unitOptions('kg')}</select></label>
          <label style="width:130px">Fiyat (${esc(S().currency)})<input id="nPrice" inputmode="decimal"></label>
          <label style="width:90px">KDV %<input id="nKdv" value="${S().defaultKdv}" inputmode="decimal"></label>
          <button class="btn pri" id="nAdd">＋ Ürün Ekle</button>
        </div>
      </div>
      <div class="card">
        <div class="row mb"><input id="prQ" class="grow" placeholder="🔍 Ürün ara">
          <button class="btn" id="prExp">⬇ Dışa aktar</button><button class="btn" id="prImp">⬆ İçe aktar</button></div>
        <table class="list"><thead><tr><th style="width:110px">Kod</th><th>Ürün adı</th><th style="width:120px">Birim</th><th style="width:130px">Fiyat</th><th style="width:90px">KDV %</th><th style="width:90px" title="Satış ekranında kart olarak göster">Kartta</th><th style="width:120px"></th></tr></thead>
        <tbody id="prBody"></tbody></table>
      </div>`;
    const draw = () => {
      const q = lower($('#prQ').value);
      $('#prBody').innerHTML = DB.products.map((p, i) => ({ p, i })).filter(({ p }) => !q || lower(p.name).includes(q) || lower(p.code).includes(q)).map(({ p, i }) => `
        <tr data-i="${i}">
          <td><input data-f="code" value="${esc(p.code)}"></td>
          <td><input data-f="name" value="${esc(p.name)}"></td>
          <td><select data-f="unit">${unitOptions(p.unit)}</select></td>
          <td><input data-f="price" value="${R.qtyFmt(p.price)}" inputmode="decimal"></td>
          <td><input data-f="kdv" value="${R.qtyFmt(p.kdv)}" inputmode="decimal"></td>
          <td style="text-align:center"><input type="checkbox" data-f="fav" ${p.fav !== false ? 'checked' : ''}></td>
          <td class="right"><button class="btn sm" data-a="up" title="Yukarı">▲</button> <button class="btn sm" data-a="down" title="Aşağı">▼</button> <button class="btn sm red" data-a="del">🗑</button></td>
        </tr>`).join('') || '<tr><td colspan="7" class="empty-msg">Ürün yok</td></tr>';
    };
    draw();
    $('#prQ').oninput = draw;
    $('#prBody').onchange = e => {
      const el = e.target; const f = el.dataset.f; if (!f) return;
      const p = DB.products[+el.closest('tr').dataset.i];
      p[f] = f === 'fav' ? el.checked : (f === 'price' || f === 'kdv') ? num(el.value) : el.value.trim();
      save();
    };
    $('#prBody').onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const i = +b.closest('tr').dataset.i;
      if (b.dataset.a === 'del' && confirm(`"${DB.products[i].name}" silinsin mi?`)) DB.products.splice(i, 1);
      if (b.dataset.a === 'up' && i > 0) DB.products.splice(i - 1, 0, DB.products.splice(i, 1)[0]);
      if (b.dataset.a === 'down' && i < DB.products.length - 1) DB.products.splice(i + 1, 0, DB.products.splice(i, 1)[0]);
      save(); draw();
    };
    $('#nAdd').onclick = () => {
      const name = $('#nName').value.trim();
      if (!name) { toast('Ürün adı girin', true); $('#nName').focus(); return; }
      DB.products.push({ id: uid(), code: $('#nCode').value.trim(), name, unit: $('#nUnit').value, price: num($('#nPrice').value), kdv: num($('#nKdv').value), fav: true });
      save(); ['nCode', 'nName', 'nPrice'].forEach(id => { $('#' + id).value = ''; }); $('#nName').focus(); draw();
      toast('Ürün eklendi');
    };
    $('#nPrice').onkeydown = $('#nName').onkeydown = e => { if (e.key === 'Enter') $('#nAdd').click(); };
    $('#prExp').onclick = () => api.exportJson('urunler.json', DB.products);
    $('#prImp').onclick = async () => {
      const list = await api.importJson(); if (!Array.isArray(list)) return;
      const mode = confirm(`${list.length} ürün bulundu.\nTamam = mevcut listeye ekle, İptal = vazgeç`);
      if (!mode) return;
      list.forEach(p => DB.products.push({ id: uid(), code: p.code || '', name: p.name || '?', unit: p.unit || 'kg', price: num(p.price), kdv: num(p.kdv), fav: p.fav !== false }));
      save(); draw();
    };
  };

  // =====================================================
  //  MÜŞTERİLER
  // =====================================================
  views.customers = function () {
    $('#main').innerHTML = `
      <h2>Müşteriler / Alıcı Şirketler</h2>
      <div class="card">
        <div class="row mb"><input id="cuQ" class="grow" placeholder="🔍 Müşteri ara"><button class="btn pri" id="cuAdd">＋ Yeni Müşteri</button></div>
        <table class="list"><thead><tr><th>Firma / Ad</th><th>Yetkili</th><th>Telefon</th><th>Adres</th><th class="num">Fiş</th><th class="num">Toplam</th><th style="width:220px"></th></tr></thead>
        <tbody id="cuBody"></tbody></table>
      </div>`;
    const draw = () => {
      const q = lower($('#cuQ').value);
      $('#cuBody').innerHTML = DB.customers.filter(c => !q || lower(c.name).includes(q) || lower(c.phone).includes(q) || lower(c.contact).includes(q)).map(c => {
        const rs = DB.receipts.filter(r => r.customerId === c.id);
        return `<tr data-id="${c.id}"><td><b>${esc(c.name)}</b></td><td>${esc(c.contact)}</td><td>${esc(c.phone)}</td><td>${esc(c.address)}</td>
          <td class="num">${rs.length}</td><td class="num">${money(rs.reduce((a, r) => a + (r.total || 0), 0))}</td>
          <td class="right"><button class="btn sm" data-a="sale">🧾 Fiş kes</button> <button class="btn sm" data-a="edit">✏️</button> <button class="btn sm red" data-a="del">🗑</button></td></tr>`;
      }).join('') || '<tr><td colspan="7" class="empty-msg">Kayıtlı müşteri yok</td></tr>';
    };
    draw();
    $('#cuQ').oninput = draw;
    $('#cuAdd').onclick = () => editCustomer(null, draw);
    $('#cuBody').onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const c = DB.customers.find(x => x.id === b.closest('tr').dataset.id);
      if (b.dataset.a === 'edit') editCustomer(c, draw);
      if (b.dataset.a === 'del' && confirm(`"${c.name}" silinsin mi? (Geçmiş fişler etkilenmez)`)) { DB.customers = DB.customers.filter(x => x !== c); save(); draw(); }
      if (b.dataset.a === 'sale') {
        const d = draft(); d.customerId = c.id; d.customer = clone(c); delete d.customer.id; save(); go('sale');
      }
    };
  };
  function editCustomer(c, after) {
    const x = c || {};
    const F = [['name', 'Firma / müşteri adı'], ['contact', 'Yetkili'], ['phone', 'Telefon'], ['address', 'Adres'], ['taxOffice', 'Vergi dairesi'], ['taxNo', 'Vergi / TC no']];
    openModal(c ? 'Müşteri Düzenle' : 'Yeni Müşteri',
      `<div class="grid2">${F.map(([k, l]) => `<label>${l}<input data-k="${k}" value="${esc(x[k])}"></label>`).join('')}</div>`,
      `<button class="btn" data-close>Vazgeç</button><button class="btn pri" id="cuOk">Kaydet</button>`);
    $('[data-k=name]').focus();
    $('#cuOk').onclick = () => {
      const v = {}; $$('[data-k]').forEach(i => { v[i.dataset.k] = i.value.trim(); });
      if (!v.name) { toast('Ad girin', true); return; }
      if (c) Object.assign(c, v); else DB.customers.push(Object.assign({ id: uid() }, v));
      save(); closeModal(); after && after();
    };
  }

  // =====================================================
  //  FİŞ TASARIMI
  // =====================================================
  const SHOW_LABELS = {
    frame: 'Sayfa çerçevesi', logo: 'Logo', companyName: 'Şirket adı', companyAddress: 'Şirket adresi / vergi no',
    companyPhone: 'Telefon / web', docNo: 'Belge numarası', docType: 'Belge türü', customer: 'Alıcı / müşteri',
    customerDetail: 'Müşteri detayları (tel, adres)', date: 'Tarih', time: 'Saat', day: 'Gün adı', validity: 'Geçerlilik süresi',
    subtotal: 'Toplam tutar satırı', kdvLine: 'KDV satırı', notes: 'Açıklamalar', signatures: 'İmza alanları', footer: 'Alt yazı'
  };
  const LABEL_NAMES = {
    docNo: 'Belge no', customer: 'Alıcı', date: 'Tarih', time: 'Saat', day: 'Gün', validity: 'Geçerlilik',
    subtotal: 'Toplam tutar', discount: 'İskonto', matrah: 'KDV matrahı', kdv: 'KDV', grand: 'Genel toplam',
    notesTitle: 'Açıklama başlığı', customerTitle: 'Müşteri bölüm başlığı', signLeft: 'Sol imza', signRight: 'Sağ imza'
  };
  const FONTS = ['Segoe UI', 'Arial', 'Calibri', 'Tahoma', 'Verdana', 'Trebuchet MS', 'Georgia', 'Times New Roman', 'Consolas', 'Courier New'];
  function sampleReceipt() {
    const d = draft();
    if (d.items.length) return d;
    return {
      no: fmtNo(S().nextNo), docType: DB.design.docTypeLabel, date: new Date().toISOString(), kdvRate: S().defaultKdv, discountRate: 0, validity: S().validityDays,
      customer: { name: 'Müşteri Firma A.Ş.', contact: 'Ahmet Yılmaz', phone: '0532 111 22 33', address: 'Sanayi Bölgesi, 1234. Sokak No:5, Ankara' },
      items: DB.products.slice(0, 4).map((p, i) => ({ code: p.code, name: p.name, qty: [12.5, 3, 20, 1][i] || 1, unit: p.unit, price: p.price, kdv: p.kdv }))
    };
  }

  views.design = function () {
    const D = DB.design = R.normalizeDesign(DB.design);
    const inp = (path, label, type = 'text', extra = '') => {
      const v = getPath(D, path);
      if (type === 'checkbox') return `<label class="chk"><input type="checkbox" data-d="${path}" ${v ? 'checked' : ''}> ${label}</label>`;
      return `<label>${label}<input type="${type}" data-d="${path}" value="${esc(v)}" ${extra}></label>`;
    };
    $('#main').innerHTML = `
    <div class="design">
      <div class="design-panel">
        <details open><summary>📄 Şablon ve Kağıt</summary><div>
          <div class="tpl-pick">
            <button data-tpl="manav" class="${D.template === 'manav' ? 'on' : ''}">🧾 Manav Fişi<br><span class="muted">çizimdeki düzen</span></button>
            <button data-tpl="teklif" class="${D.template === 'teklif' ? 'on' : ''}">📋 Teklif / Fatura<br><span class="muted">Excel düzeni</span></button>
            <button data-tpl="termal" class="${D.template === 'termal' ? 'on' : ''}">🧻 Termal Rulo<br><span class="muted">80 / 58 mm</span></button>
          </div>
          <div class="grid2">
            <label>Kağıt boyutu<select data-d="paper">${['A4', 'A5', '80mm', '58mm'].map(p => `<option ${D.paper === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
            ${inp('margin', 'Kenar boşluğu (mm)', 'number', 'min="0" max="40"')}
            ${inp('minRows', 'En az satır sayısı (boş satırlar)', 'number', 'min="0" max="60"')}
            ${inp('logoHeight', 'Logo yüksekliği (px)', 'number', 'min="10" max="300"')}
          </div>
          ${inp('fillPage', 'Tabloyu sayfa sonuna kadar uzat', 'checkbox')}
          ${inp('zebra', 'Satırları renkli çizgili göster', 'checkbox')}
        </div></details>

        <details><summary>✏️ Başlıklar ve Yazılar</summary><div>
          <div class="grid2">
            ${inp('title', 'Sayfa başlığı (boş bırakılabilir)')}
            ${inp('docTypeLabel', 'Varsayılan belge türü')}
            ${Object.keys(LABEL_NAMES).map(k => inp('labels.' + k, LABEL_NAMES[k])).join('')}
          </div>
        </div></details>

        <details><summary>👁 Görünen Alanlar</summary><div>
          <div class="chk-grid">${Object.keys(SHOW_LABELS).map(k => inp('show.' + k, SHOW_LABELS[k], 'checkbox')).join('')}</div>
        </div></details>

        <details><summary>▦ Tablo Sütunları</summary><div>
          <div class="muted" style="font-size:12px">Göster · Başlık · Genişlik · Sıra</div>
          <div id="colList"></div>
        </div></details>

        <details><summary>🎨 Renkler ve Yazı Tipi</summary><div>
          <div class="grid2">
            <label>Yazı tipi<select data-d="font">${FONTS.concat(FONTS.includes(D.font) ? [] : [D.font]).map(f => `<option ${f === D.font ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
            ${inp('fontSize', 'Yazı boyutu (px)', 'number', 'min="7" max="24"')}
            ${inp('borderWidth', 'Çizgi kalınlığı (px)', 'number', 'min="0" max="5"')}
            ${inp('radius', 'Kutu köşe yuvarlaklığı (px)', 'number', 'min="0" max="30"')}
          </div>
          <div class="grid3">
            ${inp('accent', 'Vurgu rengi', 'color')}
            ${inp('borderColor', 'Çizgi rengi', 'color')}
            ${inp('totalsBg', 'Toplam/gri alan', 'color')}
            ${inp('headerBg', 'Başlık kutusu', 'color')}
            ${inp('headerText', 'Başlık yazısı', 'color')}
            ${inp('tableHeadBg', 'Tablo başlığı', 'color')}
            ${inp('tableHeadText', 'Tablo başlık yazısı', 'color')}
          </div>
        </div></details>

        <details><summary>📝 Açıklama ve Alt Yazı</summary><div>
          <label>Varsayılan açıklamalar / koşullar<textarea data-d="notes" rows="4">${esc(D.notes)}</textarea></label>
          <label>Alt yazı (fişin en altı)<textarea data-d="footer" rows="2">${esc(D.footer)}</textarea></label>
        </div></details>

        <details><summary>💾 Kayıtlı Tasarımlar</summary><div>
          <div class="row"><input id="dsName" class="grow" placeholder="Tasarım adı (ör. A4 Teklif Mavi)"><button class="btn pri" id="dsSave">Kaydet</button></div>
          <div id="dsList"></div>
          <div class="row"><button class="btn" id="dExp">⬇ Dosyaya aktar</button><button class="btn" id="dImp">⬆ Dosyadan yükle</button></div>
        </div></details>

        <details><summary>⚙️ Gelişmiş (özel CSS)</summary><div>
          <label>Özel CSS (ileri düzey biçimlendirme)<textarea data-d="customCss" rows="6" style="font-family:Consolas,monospace" placeholder=".co-name { font-size: 28px; }">${esc(D.customCss)}</textarea></label>
          <button class="btn red" id="dReset">Şablonu varsayılana sıfırla</button>
        </div></details>
      </div>
      <div class="design-preview">
        <div class="row"><b class="grow">Canlı önizleme</b><span class="muted">${esc(D.paper)}</span>
          <button class="btn" id="dPdf">📄 PDF</button><button class="btn pri" id="dTest">🖨 Deneme Yazdır</button></div>
        <div class="preview-wrap" id="dPv"></div>
      </div>
    </div>`;

    let pvTimer;
    const refresh = () => { clearTimeout(pvTimer); pvTimer = setTimeout(() => mountPreview($('#dPv'), renderHtml(sampleReceipt()), DB.design.paper), 120); };
    const drawCols = () => {
      $('#colList').innerHTML = D.columns.map((c, i) => `
        <div class="col-row" data-i="${i}">
          <input type="checkbox" data-c="visible" ${c.visible ? 'checked' : ''} title="Göster">
          <input data-c="label" value="${esc(c.label)}" title="${c.key}">
          <input data-c="width" type="number" min="1" max="100" value="${c.width}" title="Genişlik oranı">
          <button class="btn sm" data-m="-1">▲</button><button class="btn sm" data-m="1">▼</button>
        </div>`).join('');
    };
    const drawSaved = () => {
      $('#dsList').innerHTML = (DB.designs || []).map((x, i) => `<div class="row" style="padding:4px 0;border-bottom:1px solid #eee"><span class="grow">${esc(x.name)} <span class="muted">(${esc(x.design.template)}, ${esc(x.design.paper)})</span></span><button class="btn sm" data-ld="${i}">Yükle</button><button class="btn sm red" data-rm="${i}">🗑</button></div>`).join('') || '<div class="muted">Kayıtlı tasarım yok</div>';
    };
    drawCols(); drawSaved(); refresh();

    const panel = $('.design-panel');
    const onField = e => {
      const el = e.target; const p = el.dataset.d; if (!p) return;
      let v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? num(el.value) : el.value;
      setPath(D, p, v); save(); refresh();
      if (p === 'paper') $('.design-preview .muted').textContent = v;
    };
    panel.addEventListener('input', onField);
    panel.addEventListener('change', onField);
    $('#colList').addEventListener('input', e => {
      const el = e.target; const k = el.dataset.c; if (!k) return;
      const c = D.columns[+el.closest('.col-row').dataset.i];
      c[k] = k === 'visible' ? el.checked : k === 'width' ? num(el.value) : el.value;
      save(); refresh();
    });
    $('#colList').addEventListener('click', e => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      const i = +b.closest('.col-row').dataset.i, j = i + Number(b.dataset.m);
      if (j < 0 || j >= D.columns.length) return;
      D.columns.splice(j, 0, D.columns.splice(i, 1)[0]); save(); drawCols(); refresh();
    });
    $$('[data-tpl]').forEach(b => b.onclick = () => {
      if (b.dataset.tpl === D.template) return;
      if (!confirm('Seçilen şablonun varsayılan ayarları yüklenecek. Mevcut tasarım değişiklikleriniz kaybolacak (önce "Kayıtlı Tasarımlar"dan kaydedebilirsiniz). Devam?')) return;
      DB.design = R.preset(b.dataset.tpl); save(); views.design();
    });
    $('#dReset').onclick = () => { if (confirm('Tasarım varsayılana sıfırlansın mı?')) { DB.design = R.preset(D.template); save(); views.design(); } };
    $('#dsSave').onclick = () => {
      const name = $('#dsName').value.trim() || `Tasarım ${(DB.designs || []).length + 1}`;
      DB.designs = DB.designs || [];
      const ex = DB.designs.find(x => x.name === name);
      if (ex) ex.design = clone(D); else DB.designs.push({ name, design: clone(D) });
      save(); drawSaved(); $('#dsName').value = ''; toast('Tasarım kaydedildi');
    };
    $('#dsList').onclick = e => {
      const l = e.target.closest('[data-ld]'), r = e.target.closest('[data-rm]');
      if (l) { DB.design = R.normalizeDesign(clone(DB.designs[+l.dataset.ld].design)); save(); views.design(); toast('Tasarım yüklendi'); }
      if (r && confirm('Kayıtlı tasarım silinsin mi?')) { DB.designs.splice(+r.dataset.rm, 1); save(); drawSaved(); }
    };
    $('#dExp').onclick = () => api.exportJson('fis-tasarimi.json', D);
    $('#dImp').onclick = async () => {
      const d = await api.importJson(); if (!d || typeof d !== 'object') return;
      DB.design = R.normalizeDesign(d); save(); views.design(); toast('Tasarım yüklendi');
    };
    $('#dTest').onclick = () => doPrint(sampleReceipt());
    $('#dPdf').onclick = () => doPdf(sampleReceipt());
  };

  // =====================================================
  //  AYARLAR
  // =====================================================
  views.settings = function () {
    const s = S();
    const inp = (path, label, type = 'text', extra = '') => {
      const v = getPath(s, path);
      if (type === 'checkbox') return `<label class="chk"><input type="checkbox" data-s="${path}" ${v ? 'checked' : ''}> ${label}</label>`;
      return `<label>${label}<input type="${type}" data-s="${path}" value="${esc(v)}" ${extra}></label>`;
    };
    $('#main').innerHTML = `
      <h2>Ayarlar</h2>
      <div class="grid2" style="align-items:start">
        <div class="card">
          <h3 class="mb">🏪 Şirket Bilgileri</h3>
          <div class="row mb" style="align-items:flex-start">
            <div class="logo-box" id="logoBox">${s.company.logo ? `<img src="${s.company.logo}">` : '<span class="muted">Logo yok</span>'}</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="btn" id="logoPick">🖼 Logo seç</button>
              <button class="btn red" id="logoDel">Logoyu kaldır</button>
              <input type="file" id="logoFile" accept="image/*" hidden>
            </div>
          </div>
          <div class="grid2">
            ${inp('company.name', 'Şirket adı')}
            ${inp('company.phone', 'Telefon')}
            ${inp('company.web', 'Web / e-posta')}
            ${inp('company.taxOffice', 'Vergi dairesi')}
            ${inp('company.taxNo', 'Vergi no')}
          </div>
          <label style="margin-top:10px">Adres<input data-s="company.address" value="${esc(s.company.address)}"></label>
        </div>

        <div class="card">
          <h3 class="mb">🖨 Yazıcı</h3>
          <div class="row mb">
            <select id="prSel" class="grow"><option value="">Varsayılan yazıcı</option>${s.printer.deviceName ? `<option selected>${esc(s.printer.deviceName)}</option>` : ''}</select>
            <button class="btn" id="prLoad">↻ Yazıcıları getir</button>
          </div>
          <div class="grid2">
            ${inp('printer.copies', 'Kopya sayısı', 'number', 'min="1" max="10"')}
          </div>
          <div style="margin-top:10px">${inp('printer.silent', 'Yazdırma penceresi açmadan direkt yazdır (hızlı mod)', 'checkbox')}</div>
          <p class="muted" style="font-size:12.5px">Kağıt boyutu "Fiş Tasarımı" ekranından seçilir (A4, A5, 80 mm, 58 mm termal).</p>
        </div>

        <div class="card">
          <h3 class="mb">％ KDV ve Hesaplama</h3>
          <div class="grid2">
            <label>KDV oranları (virgülle)<input id="kdvRates" value="${esc(s.kdvRates.join(', '))}"></label>
            <label>Varsayılan KDV oranı<select data-s="defaultKdv" data-num="1">${s.kdvRates.map(r => `<option value="${r}" ${Number(r) === Number(s.defaultKdv) ? 'selected' : ''}>%${r}</option>`).join('')}</select></label>
            <label>KDV uygulama şekli<select data-s="kdvMode">
              <option value="genel" ${s.kdvMode === 'genel' ? 'selected' : ''}>Fişin tamamına tek oran (toplamda seçilir)</option>
              <option value="satir" ${s.kdvMode === 'satir' ? 'selected' : ''}>Her ürüne kendi oranı</option></select></label>
            ${inp('currency', 'Para birimi simgesi')}
          </div>
          <div style="margin-top:10px">${inp('kdvIncluded', 'Fiyatlara KDV dahil (KDV toplamın içinden hesaplanır)', 'checkbox')}</div>
        </div>

        <div class="card">
          <h3 class="mb">#️⃣ Belge Numarası ve Birimler</h3>
          <div class="grid3">
            ${inp('prefix', 'Ön ek')}
            ${inp('nextNo', 'Sıradaki numara', 'number', 'min="1"')}
            ${inp('numPad', 'Basamak sayısı', 'number', 'min="1" max="12"')}
          </div>
          <p class="muted" id="noSample"></p>
          <div class="grid2">
            ${inp('validityDays', 'Varsayılan geçerlilik (gün)', 'number', 'min="0"')}
            <label>Birimler (virgülle)<input id="units" value="${esc(s.units.join(', '))}"></label>
          </div>
        </div>

        <div class="card">
          <h3 class="mb">🗄 Veri ve Yedek</h3>
          <div class="row" style="flex-wrap:wrap">
            <button class="btn" id="bkExp">⬇ Yedek al</button>
            <button class="btn" id="bkImp">⬆ Yedekten geri yükle</button>
            <button class="btn" id="bkDir">📁 Veri klasörünü aç</button>
          </div>
          <p class="muted" style="font-size:12.5px">Tüm veriler bu bilgisayarda saklanır. Düzenli yedek almanız önerilir.</p>
        </div>
      </div>`;

    const sample = () => { $('#noSample').textContent = 'Örnek: ' + fmtNo(s.nextNo); };
    sample();
    const onField = e => {
      const el = e.target; const p = el.dataset.s; if (!p) return;
      let v = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.dataset.num) ? num(el.value) : el.value;
      setPath(s, p, v); save(); sample();
      if (p.startsWith('company.')) refreshNav();
      if (p === 'nextNo' || p === 'prefix' || p === 'numPad') { const d = draft(); if (!d.id && !d.items.length) d.no = fmtNo(s.nextNo); }
    };
    $('#main').oninput = onField;
    $('#main').onchange = onField;
    $('#kdvRates').onchange = e => {
      const rs = e.target.value.split(/[,; ]+/).map(num).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => a - b);
      if (rs.length) { s.kdvRates = rs; if (!rs.includes(Number(s.defaultKdv))) s.defaultKdv = rs[0]; save(); views.settings(); }
    };
    $('#units').onchange = e => {
      const us = e.target.value.split(',').map(x => x.trim()).filter(Boolean);
      if (us.length) { s.units = us; save(); }
    };
    $('#logoPick').onclick = () => $('#logoFile').click();
    $('#logoFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 600, sc = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          s.company.logo = cv.toDataURL('image/png'); save(); refreshNav(); views.settings();
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    $('#logoDel').onclick = () => { s.company.logo = ''; save(); refreshNav(); views.settings(); };
    $('#prLoad').onclick = async () => {
      const list = await api.printers();
      $('#prSel').innerHTML = '<option value="">Varsayılan yazıcı</option>' + list.map(p => `<option value="${esc(p.name)}" ${p.name === s.printer.deviceName ? 'selected' : ''}>${esc(p.displayName)}${p.isDefault ? ' (varsayılan)' : ''}</option>`).join('');
      toast(`${list.length} yazıcı bulundu`);
    };
    $('#prSel').onchange = e => { s.printer.deviceName = e.target.value; save(); };
    $('#bkExp').onclick = () => {
      const d = new Date(); const pad = n => String(n).padStart(2, '0');
      api.exportJson(`oguzlar-fis-yedek-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`, DB);
    };
    $('#bkImp').onclick = async () => {
      const d = await api.importJson();
      if (!d || !d.settings || !Array.isArray(d.receipts)) { if (d) toast('Geçersiz yedek dosyası', true); return; }
      if (!confirm(`Yedekte ${d.receipts.length} fiş, ${(d.products || []).length} ürün var.\nMevcut tüm verilerin yerine yüklensin mi?`)) return;
      DB = migrate(d); await saveNow(); refreshNav(); toast('Yedek yüklendi'); go('settings');
    };
    $('#bkDir').onclick = () => api.openDataFolder();
  };

  // ---------- Klavye kısayolları ----------
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) { closeModal(); return; }
    if (!$('#modal').classList.contains('hidden')) return;
    if (e.key === 'F1') { e.preventDefault(); go('sale'); }
    if (e.key === 'F3') { e.preventDefault(); go('history'); }
    if (view === 'sale') {
      if (e.key === 'F2') { e.preventDefault(); $('#pSearch').focus(); }
      if (e.key === 'F9') { e.preventDefault(); saveAndPrint(); }
      if (e.key === 'F8') { e.preventDefault(); if (commit()) afterCommit(); }
    }
  });

  function migrate(d) {
    const def = defaults();
    const out = Object.assign({}, def, d);
    out.settings = Object.assign({}, def.settings, d.settings || {});
    out.settings.company = Object.assign({}, def.settings.company, (d.settings || {}).company || {});
    out.settings.printer = Object.assign({}, def.settings.printer, (d.settings || {}).printer || {});
    out.design = R.normalizeDesign(d.design);
    ['products', 'customers', 'receipts', 'designs'].forEach(k => { if (!Array.isArray(out[k])) out[k] = def[k]; });
    return out;
  }

  // ---------- Başlat ----------
  (async function init() {
    const d = await api.load();
    DB = d ? migrate(d) : defaults();
    if (!d) await saveNow();
    refreshNav();
    tick(); setInterval(tick, 1000);
    go('sale');
  })();
})();
