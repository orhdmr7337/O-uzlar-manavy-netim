/* Fiş / teklif HTML üretici. Hem önizlemede hem yazdırmada aynı çıktı kullanılır. */
(function (global) {
  const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  const COLUMN_DEFS = {
    no: { label: 'No', align: 'center' },
    code: { label: 'Kod', align: 'center' },
    name: { label: 'Ürün', align: 'left' },
    qty: { label: 'Kilosu / Birimi', align: 'center' },
    price: { label: 'Fiyat', align: 'right' },
    kdv: { label: 'KDV', align: 'center' },
    total: { label: 'Tutar', align: 'right' }
  };

  function cols(list) {
    return list.map(([key, label, visible, width]) => ({ key, label, visible, width }));
  }

  const PRESETS = {
    manav: {
      template: 'manav',
      paper: 'A4',
      margin: 10,
      title: '',
      docTypeLabel: 'Satış Fişi',
      font: 'Segoe UI',
      fontSize: 12,
      accent: '#2e7d32',
      headerBg: '#d5e8d4',
      headerText: '#1b1b1b',
      tableHeadBg: '#ffffff',
      tableHeadText: '#111111',
      totalsBg: '#ffffff',
      borderColor: '#111111',
      borderWidth: 1,
      radius: 10,
      logoHeight: 60,
      zebra: false,
      minRows: 14,
      fillPage: true,
      show: {
        frame: true, logo: true, companyName: true, companyAddress: false, companyPhone: false,
        docNo: true, docType: true, customer: true, customerDetail: true,
        date: true, time: true, day: true, validity: false,
        notes: true, signatures: false, footer: true, kdvLine: true, subtotal: true
      },
      columns: cols([
        ['no', 'No', false, 6], ['code', 'Kod', false, 10], ['name', 'Ürün', true, 34],
        ['qty', 'Kilosu yada Birimi', true, 20], ['price', 'Fiyat', true, 18],
        ['kdv', 'KDV', false, 8], ['total', 'Tutar', true, 20]
      ]),
      labels: {
        docNo: 'Belge No', customer: 'Alıcı', date: 'Tarih', time: 'Saat', day: 'Gün', validity: 'Geçerlilik',
        subtotal: 'Toplam Tutar', discount: 'İskonto', matrah: 'KDV Matrahı', kdv: 'KDV', grand: 'Genel Toplam',
        notesTitle: 'Açıklama', signLeft: 'Teslim Eden', signRight: 'Teslim Alan', customerTitle: 'Müşteri Bilgileri'
      },
      notes: '',
      footer: 'Bizi tercih ettiğiniz için teşekkür ederiz.',
      customCss: ''
    },
    teklif: {
      template: 'teklif',
      paper: 'A4',
      margin: 10,
      title: '',
      docTypeLabel: 'Teklif',
      font: 'Calibri',
      fontSize: 11,
      accent: '#2f5fbf',
      headerBg: '#4472c4',
      headerText: '#ffffff',
      tableHeadBg: '#4472c4',
      tableHeadText: '#ffffff',
      totalsBg: '#e7e6e6',
      borderColor: '#000000',
      borderWidth: 1,
      radius: 0,
      logoHeight: 50,
      zebra: false,
      minRows: 10,
      fillPage: true,
      show: {
        frame: true, logo: true, companyName: true, companyAddress: true, companyPhone: true,
        docNo: true, docType: false, customer: true, customerDetail: true,
        date: true, time: false, day: false, validity: true,
        notes: true, signatures: true, footer: false, kdvLine: true, subtotal: true
      },
      columns: cols([
        ['no', 'NO', true, 6], ['code', 'KOD', true, 10], ['name', 'ÜRÜN / HİZMET ADI', true, 34],
        ['qty', 'MİKTAR', true, 10], ['price', 'BİRİM FİYAT', true, 15],
        ['kdv', 'KDV', true, 8], ['total', 'TOPLAM', true, 17]
      ]),
      labels: {
        docNo: 'TEKLİF NO', customer: 'FİRMA ADI', date: 'TARİH', time: 'SAAT', day: 'GÜN', validity: 'GEÇERLİLİK',
        subtotal: 'ARA TOPLAM', discount: 'İSKONTO', matrah: 'KDV MATRAHI', kdv: 'TOPLAM KDV', grand: 'GENEL TOPLAM',
        notesTitle: 'AÇIKLAMALAR VE KOŞULLAR:', signLeft: 'FİRMA YETKİLİSİ', signRight: 'MÜŞTERİ ONAYI',
        customerTitle: 'MÜŞTERİ BİLGİLERİ'
      },
      notes: '1. Fiyatlarımıza KDV dahildir.\n2. Teslimat süresi 15 iş günüdür.\n3. Ödeme %50 peşin, kalan teslimatta.',
      footer: '',
      customCss: ''
    },
    termal: {
      template: 'termal',
      paper: '80mm',
      margin: 3,
      title: '',
      docTypeLabel: 'Satış Fişi',
      font: 'Consolas',
      fontSize: 11,
      accent: '#000000',
      headerBg: '#ffffff',
      headerText: '#000000',
      tableHeadBg: '#ffffff',
      tableHeadText: '#000000',
      totalsBg: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      radius: 0,
      logoHeight: 45,
      zebra: false,
      minRows: 0,
      fillPage: false,
      show: {
        frame: false, logo: true, companyName: true, companyAddress: true, companyPhone: true,
        docNo: true, docType: true, customer: true, customerDetail: false,
        date: true, time: true, day: false, validity: false,
        notes: true, signatures: false, footer: true, kdvLine: true, subtotal: true
      },
      columns: cols([
        ['no', 'No', false, 6], ['code', 'Kod', false, 10], ['name', 'Ürün', true, 40],
        ['qty', 'Miktar', true, 18], ['price', 'Fiyat', true, 18],
        ['kdv', 'KDV', false, 8], ['total', 'Tutar', true, 24]
      ]),
      labels: {
        docNo: 'Fiş No', customer: 'Müşteri', date: 'Tarih', time: 'Saat', day: 'Gün', validity: 'Geçerlilik',
        subtotal: 'Ara Toplam', discount: 'İskonto', matrah: 'Matrah', kdv: 'KDV', grand: 'TOPLAM',
        notesTitle: 'Not', signLeft: '', signRight: '', customerTitle: 'Müşteri'
      },
      notes: '',
      footer: 'Teşekkür ederiz, yine bekleriz!',
      customCss: ''
    }
  };

  function preset(name) {
    return JSON.parse(JSON.stringify(PRESETS[name] || PRESETS.manav));
  }

  // Eski kayıtlardaki eksik alanları varsayılanlarla tamamla
  function normalizeDesign(d) {
    const base = preset((d && d.template) || 'manav');
    if (!d) return base;
    const out = Object.assign({}, base, d);
    out.show = Object.assign({}, base.show, d.show || {});
    out.labels = Object.assign({}, base.labels, d.labels || {});
    const known = (d.columns || []).filter(c => COLUMN_DEFS[c.key]);
    base.columns.forEach(c => { if (!known.find(k => k.key === c.key)) known.push(c); });
    out.columns = known;
    return out;
  }

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nl2br = s => esc(s).replace(/\n/g, '<br>');
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;

  function money(n, cur) {
    const v = (Number(n) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return cur ? `${v} ${cur}` : v;
  }
  function qtyFmt(n) {
    return (Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 3 });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateParts(iso) {
    const d = iso ? new Date(iso) : new Date();
    return {
      date: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      day: DAYS[d.getDay()]
    };
  }

  /* Hesaplama: satır tutarı = miktar x fiyat.
     kdvIncluded ise fiyatlar KDV dahildir, değilse KDV üstüne eklenir.
     kdvMode 'genel' ise tek oran (fişte seçilen), 'satir' ise her satırın kendi oranı. */
  function calc(receipt, settings) {
    const s = settings || {};
    const mode = s.kdvMode || 'genel';
    const included = !!s.kdvIncluded;
    const disc = Math.min(100, Math.max(0, Number(receipt.discountRate) || 0));
    let subtotal = 0, net = 0, kdv = 0, grand = 0;
    const breakdown = {};
    const lines = (receipt.items || []).map(it => {
      const amount = r2((Number(it.qty) || 0) * (Number(it.price) || 0));
      const rate = mode === 'satir' ? Number(it.kdv) || 0 : Number(receipt.kdvRate) || 0;
      const base = amount * (1 - disc / 100);
      let lnet, lkdv;
      if (included) { lnet = base / (1 + rate / 100); lkdv = base - lnet; }
      else { lnet = base; lkdv = base * rate / 100; }
      subtotal += amount; net += lnet; kdv += lkdv; grand += lnet + lkdv;
      breakdown[rate] = (breakdown[rate] || 0) + lkdv;
      return Object.assign({}, it, { amount, rate });
    });
    Object.keys(breakdown).forEach(k => { breakdown[k] = r2(breakdown[k]); });
    return {
      lines,
      subtotal: r2(subtotal),
      discountRate: disc,
      discount: r2(subtotal * disc / 100),
      net: r2(net),
      kdv: r2(kdv),
      breakdown,
      grand: r2(grand),
      included,
      mode
    };
  }

  function cellValue(key, line, idx, cur, design) {
    switch (key) {
      case 'no': return String(idx + 1);
      case 'code': return esc(line.code);
      case 'name': return esc(line.name);
      case 'qty': return `${qtyFmt(line.qty)} ${esc(line.unit || '')}`;
      case 'price': return money(line.price, cur);
      case 'kdv': return `%${qtyFmt(line.rate)}`;
      case 'total': return money(line.amount, cur);
      default: return '';
    }
  }

  function itemsTable(t, design, cur) {
    const cs = design.columns.filter(c => c.visible);
    const totalW = cs.reduce((a, c) => a + (Number(c.width) || 10), 0) || 1;
    const head = cs.map(c =>
      `<th style="width:${((Number(c.width) || 10) / totalW * 100).toFixed(2)}%;text-align:${COLUMN_DEFS[c.key].align}">${esc(c.label)}</th>`
    ).join('');
    let body = t.lines.map((l, i) =>
      `<tr>${cs.map(c => `<td class="c-${c.key}" style="text-align:${COLUMN_DEFS[c.key].align}">${cellValue(c.key, l, i, cur, design)}</td>`).join('')}</tr>`
    ).join('');
    const empty = Math.max(0, (Number(design.minRows) || 0) - t.lines.length);
    for (let i = 0; i < empty; i++) {
      body += `<tr class="empty">${cs.map(c => `<td class="c-${c.key}" style="text-align:${COLUMN_DEFS[c.key].align}">${c.key === 'no' && design.template === 'teklif' ? t.lines.length + i + 1 : '&nbsp;'}</td>`).join('')}</tr>`;
    }
    if (design.fillPage && design.template !== 'termal') {
      body += `<tr class="filler">${cs.map(c => `<td class="c-${c.key}"></td>`).join('')}</tr>`;
    }
    return `<table class="items"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function totalsRows(t, design, cur) {
    const L = design.labels;
    const rows = [];
    if (design.show.subtotal) rows.push(['subtotal', L.subtotal, money(t.subtotal, cur)]);
    if (t.discount > 0) rows.push(['discount', `${L.discount} (%${qtyFmt(t.discountRate)})`, '- ' + money(t.discount, cur)]);
    if (design.show.kdvLine) {
      if (t.included || t.discount > 0) rows.push(['matrah', L.matrah, money(t.net, cur)]);
      const rates = Object.keys(t.breakdown);
      if (t.mode === 'genel' || rates.length <= 1) {
        const rate = rates[0] != null ? rates[0] : 0;
        rows.push(['kdv', `${L.kdv} (%${qtyFmt(rate)})${t.included ? ' dahil' : ''}`, money(t.kdv, cur)]);
      } else {
        rates.forEach(r => rows.push(['kdv', `${L.kdv} %${qtyFmt(r)}`, money(t.breakdown[r], cur)]));
      }
    }
    rows.push(['grand', L.grand, money(t.grand, cur)]);
    return rows;
  }

  function customerLines(c, design) {
    if (!c || !c.name) return '';
    let s = `<div class="cust-name">${esc(c.name)}</div>`;
    if (design.show.customerDetail) {
      if (c.contact) s += `<div>${esc(c.contact)}</div>`;
      if (c.phone) s += `<div>Tel: ${esc(c.phone)}</div>`;
      if (c.address) s += `<div>${esc(c.address)}</div>`;
      if (c.taxNo) s += `<div>VD/VN: ${esc(c.taxOffice || '')} ${esc(c.taxNo)}</div>`;
    }
    return s;
  }

  function brandBlock(co, design, align) {
    const sh = design.show;
    let s = `<div class="brand" style="text-align:${align}">`;
    if (sh.logo && co.logo) s += `<img class="logo" src="${co.logo}" alt="">`;
    if (sh.companyName && co.name) s += `<div class="co-name">${esc(co.name)}</div>`;
    if (sh.companyAddress && co.address) s += `<div class="co-sub">${esc(co.address)}</div>`;
    if (sh.companyPhone && (co.phone || co.web)) {
      s += `<div class="co-sub">${[co.phone && 'Tel: ' + esc(co.phone), co.web && 'Web: ' + esc(co.web)].filter(Boolean).join(' | ')}</div>`;
    }
    if (co.taxNo && sh.companyAddress) s += `<div class="co-sub">${esc(co.taxOffice || '')} ${esc(co.taxNo)}</div>`;
    s += '</div>';
    return s;
  }

  function baseCss(design, paper) {
    const d = design;
    const bw = `${d.borderWidth}px solid ${d.borderColor}`;
    const page = {
      A4: { w: 210, h: 297 }, A5: { w: 148, h: 210 }, '80mm': { w: 80, h: 0 }, '58mm': { w: 58, h: 0 }
    }[paper] || { w: 210, h: 297 };
    const innerH = page.h ? page.h - d.margin * 2 - 1 : 0;
    return `
@page { size: ${page.w}mm ${page.h ? page.h + 'mm' : 'auto'}; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: '${d.font}', 'Segoe UI', Arial, sans-serif; font-size: ${d.fontSize}px; color: #111; width: ${page.w}mm; }
.page { padding: ${d.margin}mm; }
.sheet { position: relative; display: flex; flex-direction: column; ${innerH && d.fillPage ? `min-height: ${innerH}mm;` : ''} }
.sheet.frame { border: ${bw}; }
.logo { max-height: ${d.logoHeight}px; max-width: 100%; object-fit: contain; display: inline-block; }
.co-name { font-weight: 700; font-size: 1.5em; color: ${d.accent}; }
.co-sub { font-size: .85em; color: #333; }
table { border-collapse: collapse; width: 100%; }
.items th { background: ${d.tableHeadBg}; color: ${d.tableHeadText}; font-weight: 700; padding: 5px 6px; border: ${bw}; }
.items td { padding: 4px 6px; border-left: ${bw}; border-right: ${bw}; vertical-align: top; }
.items tbody tr:last-child td { border-bottom: ${bw}; }
.items tr.filler td { height: auto; }
${d.zebra ? `.items tbody tr:nth-child(even) td { background: #f3f5f8; }` : ''}
.totals { background: ${d.totalsBg}; }
.totals .row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 10px; }
.totals .row.grand { font-weight: 800; font-size: 1.2em; }
.notes { white-space: normal; font-size: .95em; }
.footer { text-align: center; font-size: .9em; color: #444; padding: 6px; }
.signs { display: flex; justify-content: space-around; text-align: center; padding: 24px 10px 10px; margin-top: auto; }
.signs .s b { display: block; margin-bottom: 4px; }
.signs .s span { color: #777; font-size: .9em; }
.title { text-align: center; font-weight: 700; font-size: 1.3em; padding: 6px; color: ${d.accent}; }
`;
  }

  // ---- Şablon 1: Manav (verilen çizim) ----
  function tplManav(ctx) {
    const { r, t, co, design: d, cur } = ctx;
    const L = d.labels, sh = d.show;
    const dp = dateParts(r.date);
    const bw = `${d.borderWidth}px solid ${d.borderColor}`;
    let docBox = '';
    if (sh.docNo) docBox += `<div><span class="lbl">${esc(L.docNo)}:</span> <b>${esc(r.no)}</b></div>`;
    if (sh.docType && d.docTypeLabel) docBox += `<div class="doctype">${esc(r.docType || d.docTypeLabel)}</div>`;
    if (sh.customer && r.customer && r.customer.name) docBox += `<div class="cust"><span class="lbl">${esc(L.customer)}:</span> ${customerLines(r.customer, d)}</div>`;
    let dateBox = '';
    if (sh.date) dateBox += `<div><span class="lbl">${esc(L.date)}:</span> <b>${dp.date}</b></div>`;
    if (sh.time) dateBox += `<div><span class="lbl">${esc(L.time)}:</span> <b>${dp.time}</b></div>`;
    if (sh.day) dateBox += `<div><span class="lbl">${esc(L.day)}:</span> <b>${dp.day}</b></div>`;
    if (sh.validity && r.validity) dateBox += `<div><span class="lbl">${esc(L.validity)}:</span> <b>${esc(r.validity)} Gün</b></div>`;
    const totals = totalsRows(t, d, cur).map(([k, a, b]) => `<div class="row ${k}"><span>${esc(a)}</span><span>${b}</span></div>`).join('');
    const notes = (sh.notes && (r.notes || d.notes)) ? `<div class="notes"><b>${esc(L.notesTitle)}</b><br>${nl2br(r.notes || d.notes)}</div>` : '<div></div>';
    return `
<style>
.m-hdr { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 10px; align-items: center; padding: 10px; border-bottom: ${bw}; }
.m-box { border: ${bw}; border-radius: ${d.radius}px; padding: 6px 10px; font-size: .92em; line-height: 1.45; min-height: 48px; }
.m-brand { background: ${d.headerBg}; color: ${d.headerText}; border: ${bw}; padding: 8px; text-align: center; border-radius: ${Math.min(d.radius, 4)}px; }
.m-brand .co-name { color: ${d.headerText}; }
.m-box .lbl { color: #555; }
.m-box .doctype { font-weight: 700; color: ${d.accent}; }
.m-date { text-align: right; }
.m-items { flex: 1; display: flex; flex-direction: column; }
.m-items .items { flex: 1; height: 100%; }
.m-items .items tbody tr:not(.filler) { height: 1.9em; }
.m-items .items th { border-top: 0; }
.m-items .items th:first-child, .m-items .items td:first-child { border-left: 0; }
.m-items .items th:last-child, .m-items .items td:last-child { border-right: 0; }
.m-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 10px; align-items: end; }
.m-bottom .totals { border: ${bw}; border-radius: ${d.radius}px; padding: 4px 0; }
.m-bottom .totals .row.grand { border-top: ${bw}; color: ${d.accent}; margin-top: 2px; padding-top: 6px; }
.cust-name { display: inline; font-weight: 700; }
</style>
<div class="sheet ${sh.frame ? 'frame' : ''}">
  <div class="m-hdr">
    <div class="m-box">${docBox || '&nbsp;'}</div>
    <div class="m-brand">${brandBlock(co, d, 'center')}</div>
    <div class="m-box m-date">${dateBox || '&nbsp;'}</div>
  </div>
  ${d.title ? `<div class="title">${esc(d.title)}</div>` : ''}
  <div class="m-items">${itemsTable(t, d, cur)}</div>
  <div class="m-bottom">${notes}<div class="totals">${totals}</div></div>
  ${sh.signatures ? `<div class="signs"><div class="s"><b>${esc(L.signLeft)}</b><span>İmza</span></div><div class="s"><b>${esc(L.signRight)}</b><span>İmza</span></div></div>` : ''}
  ${sh.footer && d.footer ? `<div class="footer">${nl2br(d.footer)}</div>` : ''}
</div>`;
  }

  // ---- Şablon 2: Teklif / Fatura (Excel benzeri) ----
  function tplTeklif(ctx) {
    const { r, t, co, design: d, cur } = ctx;
    const L = d.labels, sh = d.show;
    const dp = dateParts(r.date);
    const bw = `${d.borderWidth}px solid ${d.borderColor}`;
    const metaRows = [];
    if (sh.date) metaRows.push([L.date, dp.date + (sh.time ? ' ' + dp.time : '')]);
    if (sh.day) metaRows.push([L.day, dp.day]);
    if (sh.docNo) metaRows.push([L.docNo, r.no]);
    if (sh.validity) metaRows.push([L.validity, r.validity ? `${r.validity} Gün` : '']);
    if (sh.docType) metaRows.push(['BELGE', r.docType || d.docTypeLabel]);
    const c = r.customer || {};
    const custRows = [
      [L.customer, c.name], ['YETKİLİ', c.contact], ['TELEFON', c.phone], ['ADRES', c.address]
    ];
    if (c.taxNo) custRows.push(['VERGİ D. / NO', `${c.taxOffice || ''} ${c.taxNo}`]);
    const totals = totalsRows(t, d, cur).map(([k, a, b]) =>
      `<tr class="${k}"><th>${esc(a)}</th><td>${b}</td></tr>`).join('');
    return `
<style>
.t-hdr { display: grid; grid-template-columns: 1.6fr 1fr; border-bottom: ${bw}; }
.t-hdr .brand { padding: 8px 10px; }
.t-hdr .brand .logo { display: block; margin-bottom: 4px; }
.t-hdr .co-name { font-size: 1.7em; }
.t-meta { border-left: ${bw}; background: ${d.totalsBg}; padding: 6px 10px; }
.t-meta div { display: flex; justify-content: space-between; padding: 2px 0; }
.t-meta b { font-weight: 700; }
.gap { height: 18px; border-bottom: ${bw}; }
.sec { background: ${d.totalsBg}; font-weight: 700; padding: 3px 6px; border-bottom: ${bw}; }
.kv th, .kv td { border-bottom: ${bw}; padding: 3px 6px; text-align: left; }
.kv th { width: 22%; border-right: ${bw}; font-weight: 700; }
.t-items .items th { border-left: 0; border-right: ${bw}; }
.t-items .items th:last-child, .t-items .items td:last-child { border-right: 0; }
.t-items .items td:first-child { border-left: 0; }
.t-items .items td { border-bottom: ${bw}; height: 1.9em; }
.t-items .items td.c-kdv { background: ${d.totalsBg}; }
.t-bottom { display: grid; grid-template-columns: 1.6fr 1fr; border-bottom: ${bw}; }
.t-bottom .notes { padding: 6px 8px; border-right: ${bw}; line-height: 1.6; }
.t-tot th { text-align: right; padding: 6px 8px; font-weight: 700; background: ${d.totalsBg}; }
.t-tot td { text-align: right; padding: 6px 8px; }
.t-tot tr { border-bottom: ${bw}; }
.t-tot tr:last-child { border-bottom: 0; }
.t-tot tr.grand th { background: ${d.headerBg}; color: ${d.headerText}; }
.t-tot tr.grand td { font-weight: 800; }
.t-spacer { flex: 1; }
.t-items .items tr.filler { display: none; }
</style>
<div class="sheet ${sh.frame ? 'frame' : ''}">
  <div class="t-hdr">
    ${brandBlock(co, d, 'left')}
    <div class="t-meta">${metaRows.map(([a, b]) => `<div><b>${esc(a)}:</b><span>${esc(b)}</span></div>`).join('')}</div>
  </div>
  ${d.title ? `<div class="title" style="border-bottom:${bw}">${esc(d.title)}</div>` : '<div class="gap"></div>'}
  ${sh.customer ? `<div class="sec">${esc(L.customerTitle)}</div>
  <table class="kv">${custRows.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b || '')}</td></tr>`).join('')}</table>
  <div class="gap"></div>` : ''}
  <div class="t-items">${itemsTable(t, d, cur)}</div>
  <div class="t-bottom">
    <div class="notes">${sh.notes ? `<b>${esc(L.notesTitle)}</b><br>${nl2br(r.notes || d.notes)}` : ''}</div>
    <table class="t-tot">${totals}</table>
  </div>
  <div class="t-spacer"></div>
  ${sh.signatures ? `<div class="signs"><div class="s"><b>${esc(L.signLeft)}</b><span>İmza / Kaşe</span></div><div class="s"><b>${esc(L.signRight)}</b><span>İmza / Kaşe</span></div></div>` : ''}
  ${sh.footer && d.footer ? `<div class="footer">${nl2br(d.footer)}</div>` : ''}
</div>`;
  }

  // ---- Şablon 3: Termal (80/58 mm rulo) ----
  function tplTermal(ctx) {
    const { r, t, co, design: d, cur } = ctx;
    const L = d.labels, sh = d.show;
    const dp = dateParts(r.date);
    const cs = d.columns.filter(c => c.visible).map(c => c.key);
    const lines = t.lines.map((l, i) => `
      <div class="ln">
        <div class="ln-name">${cs.includes('no') ? (i + 1) + '. ' : ''}${cs.includes('code') && l.code ? esc(l.code) + ' ' : ''}${esc(l.name)}</div>
        <div class="ln-row">
          <span>${cs.includes('qty') ? `${qtyFmt(l.qty)} ${esc(l.unit || '')}` : ''}${cs.includes('price') ? ` x ${money(l.price)}` : ''}${cs.includes('kdv') ? ` %${qtyFmt(l.rate)}` : ''}</span>
          <b>${cs.includes('total') ? money(l.amount, cur) : ''}</b>
        </div>
      </div>`).join('');
    const totals = totalsRows(t, d, cur).map(([k, a, b]) => `<div class="row ${k}"><span>${esc(a)}</span><span>${b}</span></div>`).join('');
    const meta = [];
    if (sh.docType) meta.push(`<div class="c"><b>${esc(r.docType || d.docTypeLabel)}</b></div>`);
    if (sh.docNo) meta.push(`<div class="kv"><span>${esc(L.docNo)}</span><span>${esc(r.no)}</span></div>`);
    if (sh.date || sh.time) meta.push(`<div class="kv"><span>${esc(L.date)}</span><span>${sh.date ? dp.date : ''} ${sh.time ? dp.time : ''}</span></div>`);
    if (sh.day) meta.push(`<div class="kv"><span>${esc(L.day)}</span><span>${dp.day}</span></div>`);
    if (sh.customer && r.customer && r.customer.name) meta.push(`<div class="kv"><span>${esc(L.customer)}</span><span>${esc(r.customer.name)}</span></div>`);
    return `
<style>
.sheet { text-align: left; }
.brand { text-align: center; }
.co-name { font-size: 1.3em; color: #000; }
.sep { border-top: 1px dashed #000; margin: 5px 0; }
.kv, .ln-row, .row { display: flex; justify-content: space-between; gap: 6px; }
.c { text-align: center; }
.ln { padding: 2px 0; }
.ln-name { font-weight: 600; }
.totals .row { padding: 1px 0; }
.totals .row.grand { font-size: 1.35em; font-weight: 800; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }
.footer { padding: 4px 0; color: #000; }
</style>
<div class="sheet ${sh.frame ? 'frame' : ''}">
  ${brandBlock(co, d, 'center')}
  ${d.title ? `<div class="title">${esc(d.title)}</div>` : ''}
  <div class="sep"></div>${meta.join('')}<div class="sep"></div>
  ${lines || '<div class="c">-</div>'}
  <div class="sep"></div>
  <div class="totals">${totals}</div>
  ${sh.notes && (r.notes || d.notes) ? `<div class="sep"></div><div class="notes">${nl2br(r.notes || d.notes)}</div>` : ''}
  ${sh.footer && d.footer ? `<div class="sep"></div><div class="footer">${nl2br(d.footer)}</div>` : ''}
</div>`;
  }

  function render(receipt, settings, designIn) {
    const design = normalizeDesign(designIn);
    const co = (settings && settings.company) || {};
    const cur = (settings && settings.currency) || '₺';
    const t = calc(receipt, settings);
    const ctx = { r: receipt, t, co, design, cur };
    const body = design.template === 'teklif' ? tplTeklif(ctx) : design.template === 'termal' ? tplTermal(ctx) : tplManav(ctx);
    return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(receipt.no || 'Fiş')}</title>
<style>${baseCss(design, design.paper)}</style>
${design.customCss ? `<style>${design.customCss}</style>` : ''}
</head><body><div class="page">${body}</div></body></html>`;
  }

  const api = { render, calc, preset, normalizeDesign, money, qtyFmt, dateParts, COLUMN_DEFS, PRESETS, DAYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Receipt = api;
})(typeof window !== 'undefined' ? window : globalThis);
