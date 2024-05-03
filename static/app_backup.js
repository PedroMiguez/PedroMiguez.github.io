// Camada de mapa
var mapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
});

// Camada de satélite
var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
});

// Iniciar o mapa com a camada de mapa
var map = L.map('map', {
    layers: [mapLayer],
    center: [-14.2350, -51.9253],
    zoom: 4,
    preferCanvas: true  
});

var markers = L.markerClusterGroup();

// Adicionar controle de camadas
var baseMaps = {
    "Mapa": mapLayer,
    "Satélite": satelliteLayer
};
L.control.layers(baseMaps,null, { collapsed:false }).addTo(map);

var markers = L.layerGroup().addTo(map);
var systemSelect = document.getElementById('system');
var stateSelect = document.getElementById('state');
var citySelect = document.getElementById('city');
var currentWells = [];
var clusterCheckbox = document.getElementById('clusterCheckbox');


// Função para atualizar os marcadores de acordo com o checkbox
function updateMarkers(wells, zoom) {
    markers.clearLayers();
    if (clusterCheckbox.checked) {
        markers = L.markerClusterGroup();
    } else {
        markers = L.layerGroup();
    }
    var bounds = L.latLngBounds();
    wells.forEach(well => {
        if (well.Cordenadas) {
            var coordinates = well.Cordenadas.coordinates;
            var latLng = [coordinates[1], coordinates[0]];
            var marker = L.marker(latLng);
            marker.bindPopup('<b>Código:</b> ' + well.Codigo + '<br><b>Localidade:</b> ' + well.Localidade + '<br><a href="#" onclick="openWellDetails(' + well.Codigo + ')">Ver detalhes do poço</a>');
            markers.addLayer(marker);
            bounds.extend(latLng);
        }
    });
    map.addLayer(markers);
    if (zoom) {
        map.fitBounds(bounds);
    }
}

clusterCheckbox.addEventListener('change', function() {
    // Chama a função search sem zoom (passando false)
    updateMarkers(currentWells, false);
});


// Carregar os sistemas
fetch('/datasources')
    .then(response => response.json())
    .then(sources => {
        sources.forEach(source => {
            var option = document.createElement('option');
            option.value = source;
            option.text = source;
            systemSelect.add(option);
        });
        systemSelect.value = 'SIAGAS'; // Definindo Siagas como valor padrão
        loadStates(systemSelect.value);
    });

    function loadStates(system) {
        fetch('/' + system + '/states')
            .then(response => response.json())
            .then(states => {
                stateSelect.innerHTML = '';
    
                // Adicionar opção "Todos" ao início da lista de estados
                var option = document.createElement('option');
                option.text = 'Todos';
                stateSelect.add(option);
    
                states.forEach(state => {
                    var option = document.createElement('option');
                    option.value = state;
                    option.text = state;
                    stateSelect.add(option);
                });
            });
    }
systemSelect.addEventListener('change', function() {
    loadStates(this.value);
});

stateSelect.addEventListener('change', function() {
    var state = this.value;
    var system = systemSelect.value;
    citySelect.innerHTML = '';
    if (state) {
        fetch('/'+ system + '/cities?state=' + state)
            .then(response => response.json())
            .then(cities => {
                cities.forEach(city => {
                    var option = document.createElement('option');
                    option.value = city;
                    option.text = city;
                    citySelect.add(option);
                });
            });
            var option = document.createElement('option');
            option.text = 'Todos';
            citySelect.add(option);
    } else {
        var option = document.createElement('option');
        option.text = 'Todos';
        citySelect.add(option);
    }
});

// Quando o botão "Pesquisar" é clicado, executar a pesquisa e adicionar marcadores ao mapa
function searchv2() {
    var state = stateSelect.value;
    var city = citySelect.value;
    var system = systemSelect.value;
    var searchURL = '/' + system + '/search'



    if (state !== 'Todos') {
        searchURL += '?Uf=' + state;
    }
    if (city !== 'Todos') {    if (city !== '') {
        searchURL += '&Mun=' + city;
    }}
    fetch(searchURL)
    .then(response => response.json())
    .then(wells => {
        // Chama a função updateMarkers
        if (wells.length > 5000) {
            clusterCheckbox.checked = true;
        }
        currentWells = wells;
        updateMarkers(wells, true);
    });

    document.getElementById('searchButton').disabled = false;
    document.getElementById('clearButton').disabled = false;
    document.getElementById('searchButton').innerText = "Pesquisar";
    }


function search() {
        var state = stateSelect.value;
        var city = citySelect.value;
        var system = systemSelect.value;
    
        if (state === 'Todos') {
            // Se "Todos" foi selecionado, obtenha a lista de todos os estados e faça uma requisição para cada estado
            fetch('/' + system + '/states')
                .then(response => response.json())
                .then(states => {
                    var promises = [];
                    states.forEach(s => {
                        var url = '/' + system + '/search?Uf=' + s;
                        promises.push(fetch(url).then(res => res.json()));
                    });
                    // Aguarde todas as requisições serem concluídas
                    Promise.all(promises).then(results => {
                        var allWells = [].concat(...results);
                        if (allWells.length > 5000) {
                            clusterCheckbox.checked = true;
                        }
                        currentWells = allWells;
                        updateMarkers(allWells, true);
                    });
                });
        } else {
            var searchURL = '/' + system + '/search';
            if (state !== '') {
                searchURL += '?Uf=' + state;
            }
            if (city !== 'Todos' && city !== '') {
                searchURL += '&Mun=' + city;
            }
            fetch(searchURL)
                .then(response => response.json())
                .then(wells => {
                    if (wells.length > 5000) {
                        clusterCheckbox.checked = true;
                    }
                    currentWells = wells;
                    updateMarkers(wells, true);
                });
        }
    
        document.getElementById('searchButton').disabled = false;
        document.getElementById('clearButton').disabled = false;
        document.getElementById('searchButton').innerText = "Pesquisar";
    }
// Limpar todos os marcadores do mapa
function clearMap() {
    map.removeLayer(markers);
    markers = L.markerClusterGroup();
}

function openWellDetails(wellCode) {
    var system = systemSelect.value;

    fetch('/' + system + '/Poco/' + wellCode)
    .then(response => response.json())
    .then(well => {
      // Carregue o arquivo HTML
      fetch('/static/wellDetails.html')
        .then(response => response.text())
        .then(html => {
          // Crie uma nova janela (ou aba)
          var newWindow = window.open("", "_blank");

          // Escreva o conteúdo HTML na nova janela
          newWindow.document.write(html);
          newWindow.document.close();

          // Insira os detalhes do poço no HTML
          newWindow.document.getElementById('well-code').textContent = 'Código: ' + well.Codigo;
          newWindow.document.getElementById('well-uf').textContent = 'Uf: ' + well.Uf;
          newWindow.document.getElementById('well-mun').textContent = 'Município: ' + well.Mun;
          newWindow.document.getElementById('well-nome').textContent = 'Nome: ' + well.Nome;
          newWindow.document.getElementById('well-localidade').textContent = 'Localidade: ' + well.Localidade;
          newWindow.document.getElementById('well-dono').textContent = 'Dono: ' + well.Dono;
          newWindow.document.getElementById('well-cota').textContent = 'Cota: ' + well.Cota;
          newWindow.document.getElementById('well-utms').textContent = 'UTMS: ' + well.UTMS;
          newWindow.document.getElementById('well-utmo').textContent = 'UTMO: ' + well.UTMO;
          newWindow.document.getElementById('well-data_insta').textContent = 'Data da Instalação: ' + well.Data_Insta;
          newWindow.document.getElementById('well-natureza').textContent = 'Natureza: ' + well.Natureza;

          // Preencha a tabela de análises químicas
          var table = newWindow.document.getElementById('analises-table');
          well.Analises.forEach(analysis => {
            var row = table.insertRow();
            row.insertCell().textContent = analysis.Nome_Ana;
            row.insertCell().textContent = analysis.Data_Ana;
            row.insertCell().textContent = analysis.Valor_Ana;
            row.insertCell().textContent = analysis.Uni_Ana;
          });
        });
    });
}

// Detect if the device is mobile
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// Adjust the site based on the device
if (isMobileDevice()) {
    // Custom logic for mobile devices can go here
    // For example, changing the initial zoom level of the map
    map.setZoom(6);
}

// Function to apply mobile-specific styles
function applyMobileStyles() {
    const sidebar = document.getElementById('sidebar');
    const mapElement = document.getElementById('map');
    const heading = document.querySelector('#sidebar h1');
    const labels = document.querySelectorAll('#sidebar label');
    const buttons = document.querySelectorAll('#sidebar button');
    const inputs = document.querySelectorAll('#sidebar input');
    
    if (sidebar && mapElement) {
        // Apply styles for the sidebar to make it a bottom bar
        sidebar.setAttribute('style', 'width: 100% !important; height: auto !important; position: fixed !important; bottom: 0 !important; left: 0 !important; z-index: 1000 !important;');

        // Set a reasonable font size for "Pesquisa Poços"
        if (heading) {
            heading.setAttribute('style', 'font-size: 34px !important;');
        }

        // Set reasonable font sizes for labels
        if (labels) {
            labels.forEach(element => {
                element.setAttribute('style', 'font-size: 32px !important;');
            });
        }

        // Set reasonable font sizes for buttons
        if (buttons) {
            buttons.forEach(element => {
                element.setAttribute('style', 'font-size: 32px !important;');
            });
        }

        // Set reasonable font sizes for inputs
        if (inputs) {
            inputs.forEach(element => {
                element.setAttribute('style', 'font-size: 32px !important;');
            });
        }

        // Apply styles for the map
        mapElement.setAttribute('style', 'width: 100% !important; height: calc(100vh - 80px) !important; position: absolute !important; top: 0 !important; left: 0 !important;');
    }
}

// Apply mobile styles if the device is mobile
if (isMobileDevice()) {
    applyMobileStyles();
}
