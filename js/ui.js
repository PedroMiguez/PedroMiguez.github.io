let lastSearchCriteria = null; // To store criteria for export


async function populateSistemaDropdown() {
  const sistemas = await fetchInitialSistemas();
  fillSelect($("sistema"), sistemas);
  if (sistemas.length > 0) {
    await loadDependentCombos(); // Load UFs, Bacias for the default/first sistema
  }
}

async function loadDependentCombos() {
  const sistema = $("sistema").value;
  if (!sistema) return;

  const ufs = await fetchDistinct(sistema, "Uf");
  fillSelect($("uf"), ufs, true, "Todos", "Todos os Estados");

  const bacias = await fetchDistinct(sistema, "Bacia");
  fillSelect($("bacia"), bacias, true, "Todos", "Todas as Bacias");

  fillSelect($("mun"), [], true, "Todos", "Todos os Municípios");
  fillSelect($("subbacia"), [], true, "Todos", "Todas as Sub-bacias");
}

async function loadMunicipios() {
  const sistema = $("sistema").value;
  const uf = $("uf").value;
  if (uf === "Todos" || !sistema) {
    fillSelect($("mun"), [], true, "Todos", "Todos os Municípios");
    return;
  }
  const municipios = await fetchDistinct(sistema, "Mun", "Uf", uf);
  fillSelect($("mun"), municipios, true, "Todos", "Todos os Municípios");
}

async function loadSubBacias() {
  const sistema = $("sistema").value;
  const bacia = $("bacia").value;
  if (bacia === "Todos" || !sistema) {
    fillSelect($("subbacia"), [], true, "Todos", "Todas as Sub-bacias");
    return;
  }
  const subBacias = await fetchDistinct(sistema, "SubBacia", "Bacia", bacia);
  fillSelect($("subbacia"), subBacias, true, "Todos", "Todas as Sub-bacias");
}
/* anterior
function createQuimicaFilterRow() {
  const container = $("quim-container");
  const row = createAndAppendElement(container, "div", { className: "filter-row quim-row" });

  const selectLabel = createAndAppendElement(row, "label", { textContent: "Nome Parâmetro" });
  const anaSelect = createAndAppendElement(selectLabel, "select", { className: "ana-select" });

  const opLabel = createAndAppendElement(row, "label", { textContent: "Operador" });
  const opSelect = createAndAppendElement(opLabel, "select", { className: "op" });
  fillSelect(opSelect, [
    { value: "contém", text: "Contém" }, { value: "=", text: "=" }, { value: "!=", text: "!=" },
    { value: ">", text: ">" }, { value: ">=", text: ">=" },
    { value: "<", text: "<" }, { value: "<=", text: "<=" }
  ]);

  const valLabel = createAndAppendElement(row, "label", { textContent: "Valor" });
  createAndAppendElement(valLabel, "input", { type: "number", className: "val", step: "any" });

  // 'E/OU' select is removed for simplicity based on original structure not using it for individual lines.
  // If you need it per line, it can be added back. Usually E/OU applies between criteria groups.

  const removeBtn = createAndAppendElement(row, "button", { textContent: "Remover", className: "remove-row-btn" });
  removeBtn.onclick = () => row.remove();

  // Populate analysis options
  fetchDistinct($("sistema").value, "Analises.Nome_Ana")
    .then(nomes => fillSelect(anaSelect, nomes.sort()));
}
*/

function createQuimicaFilterRow() {
  const container = $('quim-container');
  const row = createAndAppendElement(container, 'div', { className: 'filter-row quim-row' });

  // 2) Parâmetro químico
  const paramLabel = createAndAppendElement(row, 'label', { textContent: 'Parâmetro' });
  const anaSelect = createAndAppendElement(paramLabel, 'select', { className: 'ana-select' });

  // popula dinamicamente com todos os nomes de análise
  fetchDistinct($('sistema').value, 'Analises.Nome_Ana')
    .then(nomes => fillSelect(anaSelect, nomes.sort()));

  // 3) Operador de valor
  const opLabel = createAndAppendElement(row, 'label', { textContent: 'Operador' });
  const opSelect = createAndAppendElement(opLabel, 'select', { className: 'op' });
  fillSelect(opSelect, [
    { value: '=',    text: '=' },
    { value: '!=',   text: '!=' },
    { value: '>',    text: '>' },
    { value: '>=',   text: '>=' },
    { value: '<',    text: '<' },
    { value: '<=',   text: '<=' },
    { value: 'contém', text: 'Contém' }
  ]);

  // 4) Valor numérico
  const valLabel = createAndAppendElement(row, 'label', { textContent: 'Valor' });
  createAndAppendElement(valLabel, 'input', { type: 'number', className: 'val', step: 'any' });

  // 5) Filtro de data
  const dateLabel = createAndAppendElement(row, 'label', { 
   textContent: 'Data',
    className: 'label-data'    // <— adiciona esta classe
  });
  const dateOp = createAndAppendElement(dateLabel, 'select', { className: 'date-op' });
  fillSelect(dateOp, [
    { value: '<=', text: 'Antes de' },
    { value: '>=', text: 'Depois de' }
  ]);
  createAndAppendElement(dateLabel, 'input', { type: 'date', className: 'date-val' });
   // 6) Operador lógico E/OU (sempre *por último*)
  const eouLabel = createAndAppendElement(row, 'label', { textContent: 'E/OU', className: 'eou-group' });
  const eouSelect = createAndAppendElement(eouLabel, 'select', { className: 'eou' });
  fillSelect(eouSelect, [
    { value: 'E',  text: 'E' },
    { value: 'OU', text: 'OU' }
  ]);


  // 7) Botão remover
  const removeBtn = createAndAppendElement(row, 'button', { textContent: 'Remover', className: 'remove-row-btn' });
  removeBtn.onclick = () => row.remove();
}


function createHidroFilterRow() {
  const container = $("hidro-container");
  const row = createAndAppendElement(container, "div", { className: "filter-row hidro-row" });

  const campoLabel = createAndAppendElement(row, "label", { textContent: "Campo Hidro" });
  const campoSelect = createAndAppendElement(campoLabel, "select", { className: "campo" });
  fillSelect(campoSelect, [
    { value: "Nivel_Estatico", text: "Nível estático" },
    { value: "Nivel_Dinamico", text: "Nível dinâmico" },
    { value: "Vazao_Pos_Estabilizacao", text: "Vazão pós estabilização" },
    { value: "Vazao_Especifica", text: "Vazão específica" }
  ]);

  const opLabel = createAndAppendElement(row, "label", { textContent: "Operador" });
  const opSelect = createAndAppendElement(opLabel, "select", { className: "op" });
  fillSelect(opSelect, [
    { value: "contém", text: "Contém" }, { value: "=", text: "=" }, { value: "!=", text: "!=" },
    { value: ">", text: ">" }, { value: ">=", text: ">=" },
    { value: "<", text: "<" }, { value: "<=", text: "<=" }
  ]);

  const valLabel = createAndAppendElement(row, "label", { textContent: "Valor" });
  createAndAppendElement(valLabel, "input", { type: "number", className: "val", step: "any" });

  const removeBtn = createAndAppendElement(row, "button", { textContent: "Remover", className: "remove-row-btn" });
  removeBtn.onclick = () => row.remove();
}

function collectSearchCriteria() {
const quimicaFilters = [...document.querySelectorAll('#quim-container .quim-row')]
    .map(div => {
      const nome     = div.querySelector('.ana-select').value;
      const operador = div.querySelector('.op').value;
      const valorRaw = div.querySelector('.val').value;
      const valor    = valorRaw !== '' ? Number(valorRaw) : null;



      // montagem do filtro de data
      const dateVal  = div.querySelector('.date-val').value;
      const dateOp   = div.querySelector('.date-op').value;
      const dateFilt = dateVal ? { operator: dateOp, value: dateVal } : null;
      const eouEl  = div.querySelector('.eou');
      const eou    = eouEl && !eouEl.disabled ? eouEl.value : null;

      return { 
        nome, 
        operador, 
        valor, 
        eou, 
        data: dateFilt 
      };
    })
    // só envio linhas com parâmetro + (valor OU data)
    .filter(f => f.nome && (f.valor !== null || f.data !== null));

  const hidroFilters = [...document.querySelectorAll("#hidro-container .hidro-row")].map(div => ({
    campo: div.querySelector(".campo").value,
    operador: div.querySelector(".op").value,
    valor: div.querySelector(".val").value ? Number(div.querySelector(".val").value) : null,
    // eou: div.querySelector(".eou") ? div.querySelector(".eou").value : "E"
  })).filter(f => f.campo && f.valor !== null);

  lastSearchCriteria = {
    sistema: $("sistema").value,
    geral: {
      estado: $("uf").value === "Todos" ? null : $("uf").value,
      municipio: $("mun").value === "Todos" ? null : $("mun").value,
      bacia: $("bacia").value === "Todos" ? null : $("bacia").value,
      sub_bacia: $("subbacia").value === "Todos" ? null : $("subbacia").value
    },
    quimica: quimicaFilters,
    hidro: hidroFilters
  };
  // Clean up null general filters
  for (const key in lastSearchCriteria.geral) {
      if (lastSearchCriteria.geral[key] === null) {
          delete lastSearchCriteria.geral[key];
      }
  }
  if (Object.keys(lastSearchCriteria.geral).length === 0) {
      delete lastSearchCriteria.geral;
  }


  console.log("🔍 Corpo da requisição:", lastSearchCriteria);
  return lastSearchCriteria;
}


// js/ui.js

const TEXT_BTN_SIDEBAR_VISIBLE = "Ocultar Menu";
const ICON_BTN_SIDEBAR_HIDDEN = "☰"; // Pode ser um ícone SVG ou de fonte se preferir

function _updateSidebarToggleAppearance(isCollapsed) {
    const toggleBtn = $('sidebar-toggle');
    if (!toggleBtn) return;

    if (isCollapsed) {
        toggleBtn.innerHTML = ICON_BTN_SIDEBAR_HIDDEN;
        // As propriedades de width, padding, font-size são controladas pelo CSS
        // via body.sidebar-collapsed #sidebar-toggle
    } else {
        toggleBtn.innerHTML = TEXT_BTN_SIDEBAR_VISIBLE;
        // As propriedades de width, padding, font-size são controladas pelo CSS
        // via body:not(.sidebar-collapsed) #sidebar-toggle
    }
}

function toggleSidebar() {
  const sidebar = $('sidebar');
  const body = document.body;

  const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
  
  sidebar.classList.toggle('collapsed');
  body.classList.toggle('sidebar-collapsed');

  _updateSidebarToggleAppearance(!isCurrentlyCollapsed); // Atualiza para o novo estado

  if (typeof mapInstance !== 'undefined' && mapInstance) {
    setTimeout(() => {
      mapInstance.invalidateSize(true); // true para animar o redimensionamento se suportado
    }, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--transition-speed') || '0.3s') * 1000 + 50); // Sincroniza com a transição CSS
  }
}

// Função para configurar o estado inicial do botão no carregamento da página
function initSidebarState() {
    const sidebar = $('sidebar');
    // Adicionar .collapsed por padrão se quiser que comece fechada. Ex:
    // sidebar.classList.add('collapsed'); 
    // document.body.classList.add('sidebar-collapsed');

    _updateSidebarToggleAppearance(sidebar.classList.contains('collapsed'));
}

// ... (displaySearchSummary e outras funções do ui.js)
// A função displaySearchSummary para preencher o conteúdo simplificado permanece a mesma.
// As mudanças de CSS para #search-summary (largura limitada, posicionamento) devem cuidar da aparência.
function displaySearchSummary(criteria,qtd) {
  const summaryPanel = $("search-summary");
  if (!summaryPanel) { console.error("Elemento #search-summary não encontrado!"); return; }
  if (!criteria) { console.warn("Nenhum critério para displaySearchSummary."); return; }

  const summaryContentDiv = $("summary-content");
  if (!summaryContentDiv) { console.error("Elemento #summary-content não encontrado!"); return; }
  summaryContentDiv.innerHTML = '';

  createAndAppendElement(summaryContentDiv, "p", { innerHTML: `<strong>Fonte (Sistema):</strong> ${sanitizeText(criteria.sistema || 'N/A')}` });
  let localizacao = "N/A";
  if (criteria.geral) {
    const estado = criteria.geral.estado && criteria.geral.estado !== "Todos" ? sanitizeText(criteria.geral.estado) : null;
    const municipio = criteria.geral.municipio && criteria.geral.municipio !== "Todos" ? sanitizeText(criteria.geral.municipio) : null;
    if (municipio && estado) localizacao = `${municipio} / ${estado}`;
    else if (municipio) localizacao = municipio;
    else if (estado) localizacao = estado;
  }
  let totalFilters = 0;
  if (criteria.geral) {
    if (criteria.geral.estado && criteria.geral.estado !== "Todos") totalFilters++;
    if (criteria.geral.municipio && criteria.geral.municipio !== "Todos") totalFilters++;
    if (criteria.geral.bacia && criteria.geral.bacia !== "Todos") totalFilters++;
    if (criteria.geral.sub_bacia && criteria.geral.sub_bacia !== "Todos") totalFilters++;
  }
  if (criteria.quimica) totalFilters += criteria.quimica.length;
  if (criteria.hidro) totalFilters += criteria.hidro.length;
  createAndAppendElement(summaryContentDiv, "p", { innerHTML: `<strong>Qtd. Filtros Aplicados:</strong> ${totalFilters}` });
  createAndAppendElement(summaryContentDiv, "p", { innerHTML: `<strong>Qtd. de Poços encontrados:</strong> ${qtd}` });
  summaryPanel.classList.remove('hidden');
  // console.log("Painel de resumo: classList após remover 'hidden':", summaryPanel.classList);
}
function hideSearchSummary() {
  $("search-summary").classList.add('hidden');
}

function exportSearchCriteria() {
  if (!lastSearchCriteria) {
    alert("Nenhuma pesquisa foi realizada para exportar.");
    return;
  }
  
  // Serializa o filtro e codifica em URI Component
  const filterParam = encodeURIComponent(JSON.stringify(lastSearchCriteria));
  const sistemaParam = encodeURIComponent(lastSearchCriteria.sistema || 'geral');
  
  // Abre nova aba com a página de exportação, passando filter e sistema
  const url = `export_page.html?filter=${filterParam}&sistema=${sistemaParam}`;
  window.open(url, '_blank');
}

// === Funções para controlar o overlay
function showLoadingOverlay() {
  const o = $('loading-overlay');
  o.classList.add('visible');
}
function hideLoadingOverlay() {
  const o = $('loading-overlay');
  o.classList.remove('visible');
}
