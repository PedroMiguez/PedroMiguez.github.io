document.addEventListener('DOMContentLoaded', async () => {
    // Splash screen: fecha ao clicar em "Acessar Sistema"
    const splashBtn = document.getElementById('splash-enter');
    if (splashBtn) {
      splashBtn.addEventListener('click', () => {
        document.getElementById('splash-overlay')
                .classList.add('hidden');
      });
    }

    initMap(); // Initialize the map first
  
    // Populate initial dropdowns
    await populateSistemaDropdown(); // This will also call loadDependentCombos
  
    // Event Listeners for sidebar and main controls
    $('sidebar-toggle').addEventListener('click', toggleSidebar);
    $('sistema').addEventListener('change', loadDependentCombos);
    $('uf').addEventListener('change', loadMunicipios);
    $('bacia').addEventListener('change', loadSubBacias);
  
    $('add-quim').addEventListener('click', createQuimicaFilterRow);
    $('add-hidro').addEventListener('click', createHidroFilterRow);
  
    $('buscar').addEventListener('click', performSearch);
  
    $('close-summary').addEventListener('click', hideSearchSummary);
    $('export-search').addEventListener('click', exportSearchCriteria);
  
    initSidebarState();
  });
  
  async function performSearch() {
    clearMapMarkers();
    hideSearchSummary(); // Hide previous summary

    if (window.innerWidth <= 768) {
    toggleSidebar()
    }

    showLoadingOverlay();
    const searchBody = collectSearchCriteria();
    if (!searchBody.sistema) {
      hideLoadingOverlay();
      alert("Por favor, selecione um sistema antes de buscar.");
      return;
    }
  
    const geojson = await fetchSearchResults(searchBody, true);
  
    if (geojson) {
      addGeoJsonToMap(geojson);
      displaySearchSummary(searchBody, geojson.features.length); // Pass the criteria used for the search
      hideLoadingOverlay();
    } else {
      // Error already logged by fetchSearchResults,
      // could display a generic "Search failed" message to user
      hideLoadingOverlay();
      alert("A busca não retornou resultados ou ocorreu um erro. Verifique o console para detalhes.");
    }

      // Força sidebar colapsada em telas <=768px
    // Após carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebar-toggle');

  // Em mobile, inicia escondido
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
      }
    
      // Ao clicar no toggle, alterna a exibição
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    });
  }
document.addEventListener('DOMContentLoaded', () => {
  const sidebar    = document.getElementById('sidebar');
  const searchBtn  = document.getElementById('search-btn');

  // ao clicar em “Pesquisar” em telas <=768px, força o hide
  searchBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768 && !sidebar.classList.contains('collapsed')) {
      sidebar.classList.add('collapsed');
    }
  });
});


