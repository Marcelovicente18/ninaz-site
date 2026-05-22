/* Calculadora de Precificação Shopee · Operação Leve
   - Cálculo em tempo real
   - Persistência via localStorage
   - Tooltips clicáveis (mobile-friendly)
   - Zonas de margem coloridas */

(function () {
  'use strict';

  const STORAGE_KEY = 'ninaz-margem-produtos-v1';
  const REQUIRED_FIELDS = ['custo', 'venda', 'comissaoPct', 'taxa', 'impostoPct', 'custoVar'];

  const productsContainer = document.getElementById('products');
  const addBtn = document.getElementById('add-product');
  const resetBtn = document.getElementById('reset-all');
  const template = document.getElementById('product-template');
  const tooltip = document.getElementById('tooltip');
  const tooltipContent = tooltip.querySelector('.tooltip-content');
  const tooltipClose = tooltip.querySelector('.tooltip-close');

  // ---------- Utilities ----------

  function uid() {
    return 'p_' + Math.random().toString(36).slice(2, 9);
  }

  function brl(n) {
    if (!isFinite(n)) return '—';
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(n) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + '%';
  }

  function num(n, decimals) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 2 });
  }

  function parseNumber(v) {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    // pt-BR: remove pontos de milhar e troca vírgula por ponto
    const s = String(v).replace(/\./g, '').replace(',', '.').trim();
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }

  // Máscara monetária: digita "3145" → exibe "31,45"
  function maskCurrency(input) {
    const raw = (input.value || '').replace(/\D/g, '');
    if (!raw) { input.value = ''; return; }
    const n = parseInt(raw, 10) / 100;
    input.value = n.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Máscara de %: aceita dígitos e vírgula, max 100
  function maskPercent(input) {
    let v = (input.value || '').replace(/[^\d,]/g, '');
    // Garante só 1 vírgula
    const parts = v.split(',');
    if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('');
    // Limita a 2 decimais
    if (parts[1] && parts[1].length > 2) {
      v = parts[0] + ',' + parts[1].slice(0, 2);
    }
    // Limita parte inteira a 3 dígitos (até 100)
    const intPart = v.split(',')[0];
    if (intPart.length > 3) {
      v = intPart.slice(0, 3) + (v.includes(',') ? ',' + v.split(',')[1] : '');
    }
    // Cap em 100
    if (parseNumber(v) > 100) v = '100';
    input.value = v;
  }

  // ---------- Zone logic ----------

  function getZone(marginPct) {
    if (!isFinite(marginPct)) return { id: '', label: '—' };
    if (marginPct < 16)  return { id: 'red',    label: 'Sobrevivência' };
    if (marginPct <= 20) return { id: 'yellow', label: 'Instável' };
    if (marginPct <= 29) return { id: 'blue',   label: 'Estrutural' };
    return                      { id: 'green',  label: 'Escala segura' };
  }

  // ---------- Calculation ----------

  function calculate(data) {
    const venda      = parseNumber(data.venda);
    const custo      = parseNumber(data.custo);
    const comissaoR  = venda * (parseNumber(data.comissaoPct) / 100);
    const taxa       = parseNumber(data.taxa);
    const impostoR   = venda * (parseNumber(data.impostoPct) / 100);
    const marketing  = parseNumber(data.marketing);
    const custoVar   = parseNumber(data.custoVar);
    const custoFixo  = parseNumber(data.custoFixo);

    const lucro = venda - custo - comissaoR - taxa - impostoR - marketing - custoVar - custoFixo;
    const margem = venda > 0 ? (lucro / venda) * 100 : NaN;
    const roasBase = lucro > 0 ? venda / lucro : NaN;
    const roasIdeal = isFinite(roasBase) ? roasBase + 10 : NaN;

    return { venda, lucro, margem, roasBase, roasIdeal, comissaoR, impostoR };
  }

  // ---------- Render ----------

  function readCardData(card) {
    const inputs = card.querySelectorAll('[data-name]');
    const data = {};
    inputs.forEach(input => {
      data[input.dataset.name] = input.value;
    });
    return data;
  }

  function renderResults(card) {
    const data = readCardData(card);
    const r = calculate(data);

    const lucroBox = card.querySelector('.result-lucro');
    const margemBox = card.querySelector('.result-margem');
    const lucroEl  = card.querySelector('[data-result="lucro"]');
    const margemEl = card.querySelector('[data-result="margem"]');
    const zoneEl   = card.querySelector('[data-result="zone"]');
    const roasEl   = card.querySelector('[data-result="roasBase"]');
    const idealEl  = card.querySelector('[data-result="roasIdeal"]');

    const hasMinInputs = parseNumber(data.venda) > 0;

    lucroEl.textContent  = hasMinInputs ? brl(r.lucro) : '—';
    lucroBox.classList.toggle('is-negative', hasMinInputs && r.lucro < 0);

    if (hasMinInputs && isFinite(r.margem)) {
      margemEl.textContent = pct(r.margem);
      const zone = getZone(r.margem);
      zoneEl.textContent = zone.label;
      margemBox.setAttribute('data-zone', zone.id);
    } else {
      margemEl.textContent = '—';
      zoneEl.textContent = '—';
      margemBox.setAttribute('data-zone', '');
    }

    roasEl.textContent  = (hasMinInputs && isFinite(r.roasBase))  ? num(r.roasBase, 2) : '—';
    idealEl.textContent = (hasMinInputs && isFinite(r.roasIdeal)) ? num(r.roasIdeal, 2) : '—';

    renderSummary(card, data, r);
  }

  // Resumo / prévia dos valores do produto
  function renderSummary(card, data, r) {
    const summaryEl = card.querySelector('.summary');
    const titleEl = card.querySelector('[data-result="summaryTitle"]');
    const listEl = card.querySelector('[data-result="summaryList"]');
    if (!titleEl || !listEl || !summaryEl) return;

    const venda = parseNumber(data.venda);

    // Esconde prévia se venda ainda não foi preenchida
    if (venda <= 0) {
      summaryEl.style.display = 'none';
      listEl.innerHTML = '';
      return;
    }
    summaryEl.style.display = '';

    // Título dinâmico
    const cards = productsContainer.querySelectorAll('.product-card');
    const idx = Array.from(cards).indexOf(card) + 1;
    const itemName = (data.item || '').trim();
    const qtde = parseNumber(data.qtde);
    let title = 'Produto ' + idx;
    if (itemName) title += ' · ' + itemName;
    if (qtde > 1) title += ' (×' + qtde + ')';
    titleEl.textContent = title;

    const custo     = parseNumber(data.custo);
    const comissaoP = parseNumber(data.comissaoPct);
    const taxa      = parseNumber(data.taxa);
    const impostoP  = parseNumber(data.impostoPct);
    const marketing = parseNumber(data.marketing);
    const custoVar  = parseNumber(data.custoVar);
    const custoFixo = parseNumber(data.custoFixo);

    const rows = [];
    rows.push(row('Valor de venda', brl(venda)));
    if (custo > 0)     rows.push(deduct('Custo do produto', '− ' + brl(custo)));
    if (r.comissaoR > 0) rows.push(deduct('Comissão (' + pct(comissaoP) + ')', '− ' + brl(r.comissaoR)));
    if (taxa > 0)      rows.push(deduct('Taxa fixa', '− ' + brl(taxa)));
    if (r.impostoR > 0) rows.push(deduct('Imposto (' + pct(impostoP) + ')', '− ' + brl(r.impostoR)));
    if (marketing > 0) rows.push(deduct('Marketing / brinde', '− ' + brl(marketing)));
    if (custoVar > 0)  rows.push(deduct('Custo variável', '− ' + brl(custoVar)));
    if (custoFixo > 0) rows.push(deduct('Custo fixo diluído', '− ' + brl(custoFixo)));
    rows.push(final('Lucro líquido', brl(r.lucro)));

    listEl.innerHTML = rows.join('');
  }

  function row(label, value, cls) {
    return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span class="sum-label">' + escapeHtml(label) + '</span><span class="sum-value">' + escapeHtml(value) + '</span></li>';
  }
  function deduct(label, value) { return row(label, value, 'sum-deduct'); }
  function final(label, value)  { return row(label, value, 'sum-final'); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function renumberCards() {
    const cards = productsContainer.querySelectorAll('.product-card');
    cards.forEach((card, i) => {
      const num = card.querySelector('.product-num');
      num.textContent = 'Produto ' + (i + 1);
    });
  }

  function renumberSummaries() {
    productsContainer.querySelectorAll('.product-card').forEach(card => renderResults(card));
  }

  // ---------- Persistence ----------

  function saveAll() {
    const cards = productsContainer.querySelectorAll('.product-card');
    const products = Array.from(cards).map(card => {
      return {
        id: card.dataset.productId,
        data: readCardData(card)
      };
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      // localStorage cheio ou indisponível — silencioso
    }
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // ---------- Card creation ----------

  function createCard(initialData) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.product-card');
    card.dataset.productId = (initialData && initialData.id) || uid();

    // Preencher inputs com dados salvos
    if (initialData && initialData.data) {
      Object.keys(initialData.data).forEach(name => {
        const input = card.querySelector('[data-name="' + name + '"]');
        if (input) input.value = initialData.data[name];
      });
    }

    // Aplica máscara nos valores salvos antes de exibir
    card.querySelectorAll('[data-mask="currency"]').forEach(maskCurrency);
    card.querySelectorAll('[data-mask="percent"]').forEach(maskPercent);

    // Listeners de input
    const inputs = card.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        if (input.dataset.mask === 'currency') maskCurrency(input);
        else if (input.dataset.mask === 'percent') maskPercent(input);
        renderResults(card);
        saveAll();
      });
      input.addEventListener('blur', () => {
        validateInput(input);
      });
    });

    // Botão deletar
    const delBtn = card.querySelector('.delete-btn');
    delBtn.addEventListener('click', () => {
      if (productsContainer.querySelectorAll('.product-card').length === 1) {
        // É o último: limpa os campos em vez de remover
        card.querySelectorAll('input').forEach(i => {
          if (i.dataset.name === 'comissaoPct') i.value = '20';
          else if (i.dataset.name === 'taxa') i.value = '4,00';
          else i.value = '';
        });
        renderResults(card);
        saveAll();
        return;
      }
      card.remove();
      renumberCards();
      renumberSummaries();
      saveAll();
    });

    // Tooltips
    const tipBtns = card.querySelectorAll('.tip-btn');
    tipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTooltip(btn, btn.dataset.tip);
      });
    });

    productsContainer.appendChild(card);
    renderResults(card);
    renumberCards();
    return card;
  }

  function validateInput(input) {
    const row = input.closest('.input-row');
    if (!row || !row.classList.contains('required')) return;
    const v = parseNumber(input.value);
    if (v <= 0 && input.value.trim() === '') {
      row.classList.add('invalid');
    } else {
      row.classList.remove('invalid');
    }
  }

  // ---------- Tooltips ----------

  function openTooltip(anchor, text) {
    tooltipContent.textContent = text;
    tooltip.classList.add('is-open');
    tooltip.setAttribute('aria-hidden', 'false');

    // Posicionar próximo do botão
    const rect = anchor.getBoundingClientRect();
    const tt = tooltip.getBoundingClientRect();
    const margin = 8;

    let left = rect.left;
    let top = rect.bottom + margin;

    // Ajustar pra não sair da tela
    const vw = window.innerWidth;
    if (left + tt.width > vw - margin) left = vw - tt.width - margin;
    if (left < margin) left = margin;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function closeTooltip() {
    tooltip.classList.remove('is-open');
    tooltip.setAttribute('aria-hidden', 'true');
  }

  tooltipClose.addEventListener('click', closeTooltip);
  document.addEventListener('click', (e) => {
    if (!tooltip.contains(e.target) && !e.target.classList.contains('tip-btn')) {
      closeTooltip();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTooltip();
  });

  // ---------- Init ----------

  addBtn.addEventListener('click', () => {
    createCard();
    saveAll();
    // Scroll suave para o novo card
    const cards = productsContainer.querySelectorAll('.product-card');
    const last = cards[cards.length - 1];
    last.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Apagar todos os produtos salvos?')) return;
    productsContainer.innerHTML = '';
    localStorage.removeItem(STORAGE_KEY);
    createCard();
  });

  // Carrega estado salvo ou cria 1 card vazio
  const saved = loadAll();
  if (saved && saved.length > 0) {
    saved.forEach(p => createCard(p));
  } else {
    createCard();
  }

})();
