// js/export.js
function showExportOverlay() {
  const o = document.getElementById('export-loading-overlay');
  o.classList.add('visible');
  o.classList.remove('hidden');
}
function hideExportOverlay() {
  const o = document.getElementById('export-loading-overlay');
  o.classList.remove('visible');
  o.classList.add('hidden');
}


// --- Helper de debounce ---
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// --- Pega parâmetro da query string ---
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// --- Inicia tudo após carregar a página ---
async function initExportPage() {
  showExportOverlay();
  // 1) Monta filtro e busca dados
  const filter  = JSON.parse(decodeURIComponent(getQueryParam('filter')));
  window.sistema = getQueryParam('sistema');

  const resp = await fetch(`${API_BASE_URL }/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filter)
  });
  const geojson = await resp.json();
  const features = geojson.features || [];

  if (!features.length) {
    document.body.innerHTML = '<h2 style="padding:20px;">Nenhum dado para exportar.</h2>';
    return;
  }
  window.features = features;

  // 2) Constrói formulários e faz primeiro render
  buildForms(features);
  renderPreview(features);

  // 3) Atualização automática com debounce de 1.5s
  const debouncedRender = debounce(() => renderPreview(window.features), 1);
  document.getElementById('bombeamento-form')
        .addEventListener('change', debouncedRender);
  document.getElementById('fields-form')
          .addEventListener('change', debouncedRender);
  document.getElementById('analyses-form')
          .addEventListener('change', debouncedRender);
  document.getElementById('bombeamento-select')
        .addEventListener('change', debouncedRender);
  document.getElementById('analysis-select')
        .addEventListener('change', debouncedRender);
  document.getElementById('preview-limit')
        .addEventListener('change', debouncedRender);

  // 4) Associa botão de exportação
  document.getElementById('export-btn')
          .addEventListener('click', () => {
            const rows = collectRows(window.features);
            exportXLSX(rows, window.sistema);
          });
  hideExportOverlay();
}

// --- Preenche os checkboxes nos formulários ---
function buildForms(features) {
  initBombeamentoForm(window.features);
  const fieldsSet   = new Set();
  const analysesSet = new Set();

  features.forEach(f => {
    const p = f.properties || {};
    Object.entries(p).forEach(([k, v]) => {
      if (['string','number','boolean'].includes(typeof v)) {
        fieldsSet.add(k);
      }
    });
    if (Array.isArray(p.Analises)) {
      p.Analises.forEach(a => a.Nome_Ana && analysesSet.add(a.Nome_Ana));
    }
  });

  const fieldsForm   = document.getElementById('fields-form');
  const analysesForm = document.getElementById('analyses-form');
  
  // limpa formulários (caso já existam)
  fieldsForm.innerHTML   = '';
  analysesForm.innerHTML = '';

  [...fieldsSet].sort().forEach(k => {
    const lbl = document.createElement('label');
    lbl.innerHTML = `<input type="checkbox" name="field" value="${k}" checked> ${k}`;
    fieldsForm.append(lbl);
  });

  // define o conjunto exato de análises que devem vir marcadas:
const selectedAnalyses = new Set([
  'Sodio (Na)', 'Sódio',
  'Potassio (K)', 'Potássio',
  'Calcio (Ca)', 'Cálcio',
  'Magnesio (Mg)', 'Magnésio',
  'Cloreto (Cl)', 'Cloretos',
  'Carbonato (CO3)', 'Carbonatos',
  'Alcalinidade de Bicarbonato',
  'Bicarbonato (HCO3)', 'Bicarbonatos',
  'Sulfato (SO4)', 'Sulfatos',
  'Condutividade Elétrica',
  'Condutividade Elétrica Específica (25º C)'
]);

[...analysesSet].sort().forEach(a => {
  const label = document.createElement('label');
  const chk   = document.createElement('input');
  chk.type    = 'checkbox';
  chk.name    = 'analise';
  chk.value   = a;
  // só marca se estiver na lista
  if (selectedAnalyses.has(a)) {
    chk.checked = true;
  }
  // monta o rótulo
  label.appendChild(chk);
  label.appendChild(document.createTextNode(' ' + a));
  analysesForm.appendChild(label);
});

}

function collectRows(features) {
  const selFields = [...document.querySelectorAll('input[name="field"]:checked')]
                     .map(i => i.value);
  const selAnas   = [...document.querySelectorAll('input[name="analise"]:checked')]
                     .map(i => i.value);

  const analysisMode = document.getElementById('analysis-select').value;
  const bombeMode   = document.getElementById('bombeamento-select').value;

  return features.map(f => {
    const row = {}, p = f.properties || {};

    // Fields gerais (sem modificação)
    selFields.forEach(k => { row[k] = p[k] ?? ''; });

    // Análises Químicas, agregando por data conforme analysisMode
    selAnas.forEach(a => {
  const arr = Array.isArray(p.Analises)
    ? p.Analises.filter(x => x.Nome_Ana === a && x.Data_Ana)
    : [];

  let val = '';

  if (arr.length) {
    if (analysisMode === 'recent') {
      const rec = arr.reduce((prev, curr) =>
        new Date(curr.Data_Ana) > new Date(prev.Data_Ana) ? curr : prev
      );
      val = rec.Valor_Ana;
    } else if (analysisMode === 'oldest') {
      const rec = arr.reduce((prev, curr) =>
        new Date(curr.Data_Ana) < new Date(prev.Data_Ana) ? curr : prev
      );
      val = rec.Valor_Ana;
    } else if (analysisMode === 'average') {
      const sum = arr.reduce((s, x) => s + parseFloat(x.Valor_Ana), 0);
      val = (sum / arr.length).toFixed(2);
    } else if (analysisMode === 'max') {
      val = Math.max(...arr.map(x => parseFloat(x.Valor_Ana)));
    } else if (analysisMode === 'min') {
      val = Math.min(...arr.map(x => parseFloat(x.Valor_Ana)));
    }
  }

  row[a] = val;
});


    // Teste de Bombeamento — pega o registro mais recente ou mais antigo
    const tbArr = Array.isArray(p.Teste_Bobeamento) ? p.Teste_Bobeamento : [];
    if (tbArr.length) {
      const rec = tbArr.reduce((prev, curr) => {
        return bombeMode === 'recent'
          ? (new Date(prev.Data) > new Date(curr.Data) ? prev : curr)
          : (new Date(prev.Data) < new Date(curr.Data) ? prev : curr);
      });
      // injeta apenas os campos de bombeamento que estão marcados
const selBombe = [...document.querySelectorAll('input[name="bombe"]:checked')]
  .map(i => i.value);
selBombe.forEach(k => {
  row[k] = rec[k] ?? '';
});

    }

    return row;
  });
}


// --- Desenha a tabela de preview (até 20 linhas) ---
function renderPreview(features) {
  const rows = collectRows(features);
  const previewLimit = document.getElementById('preview-limit')?.value || '20';
  const preview = document.getElementById('preview-table');
  preview.innerHTML = '';
  if (!rows.length) return;

  const cols = Object.keys(rows[0]);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');

  cols.forEach(c => {
    const th = document.createElement('th');
    th.textContent = c;
    trh.append(th);
  });
  thead.append(trh);
  table.append(thead);

  const tbody = document.createElement('tbody');

  const limit = previewLimit === 'all' ? rows.length : parseInt(previewLimit);
  rows.slice(0, limit).forEach(r => {
    const tr = document.createElement('tr');
    cols.forEach(c => {
      const td = document.createElement('td');
      td.textContent = r[c];
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(tbody);
  preview.append(table);
}


// --- Gera e baixa o XLSX ---
function exportXLSX(rows, sistema) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Poços');
  XLSX.writeFile(wb, `export_pocos_${sistema||'resultado'}.xlsx`);
}

// — Toggle da sidebar no mobile com labels “Escolher Campos” / “Pré-visualização” —
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.export-sidebar');
  const btn     = document.getElementById('sidebar-toggle');

  // Estado inicial: sidebar fechada → mostrar campos
  btn.textContent = 'Escolher Campos';
  btn.setAttribute('aria-label', 'Abrir painel de filtros');

  btn.addEventListener('click', () => {
    const opened = sidebar.classList.toggle('open');

    if (opened) {
      // sidebar aberta → trocar para ver tabela  
      btn.textContent = 'Pré-visualização';
      btn.setAttribute('aria-label', 'Ver tabela de dados');
    } else {
      // sidebar fechada → voltar para filtros  
      btn.textContent = 'Escolher Campos';
      btn.setAttribute('aria-label', 'Abrir painel de filtros');
    }
  });
});


// --- Dispara tudo ao carregar ---
document.addEventListener('DOMContentLoaded', initExportPage);

function initBombeamentoForm(features = []) {
  // Garante que features é um array
  if (!Array.isArray(features)) return;

  const container = document.getElementById('bombeamento-form');
  if (!container) return;

  const fields = new Set();

  features.forEach(f => {
    const tests = f.properties?.Teste_Bobeamento;
    console.log(tests);
    if (Array.isArray(tests)) {
      tests.forEach(test => {
        Object.keys(test).forEach(k => fields.add(k));
      });
    }
  });

  container.innerHTML = ''; // limpa antes

  fields.forEach(fld => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" name="bombe" value="${fld}">
      ${fld}
    `;
    container.appendChild(label);
  });
}

