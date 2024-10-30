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

function disableSearchControls() {
    document.querySelectorAll('.search-control').forEach(element => {
        element.disabled = true;
    });
    console.log('Sumindo')
    document.getElementById('BotaoPesquisa').disabled = true;
    document.getElementById('BotaoPesquisa').innerText = "Pesquisando";
}

// Função para habilitar os controles
function enableSearchControls() {
    document.querySelectorAll('.search-control').forEach(element => {
        element.disabled = false;
    });
    console.log('aparecendo')
    document.getElementById('BotaoPesquisa').disabled = false;
    document.getElementById('BotaoPesquisa').innerText = "Pesquisar";
}


// Função para atualizar os marcadores de acordo com o checkbox
function updateMarkers(wells, zoom) {
    var system = systemSelect.value;
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
            marker.bindPopup('<b>Código:</b> ' + well.Codigo + '<br><b>Localidade:</b> ' + well.Localidade + '<br><a href="https://pedromiguez.ddns.net/' + well.system + '/DetalhesPoco/' + well.Codigo + '" target="_blank">Ver detalhes do poço</a>');
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
fetch('https://pedromiguez.ddns.net/datasources')
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
        fetch('https://pedromiguez.ddns.net/' + system + '/states')
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
        fetch('https://pedromiguez.ddns.net/'+ system + '/cities?state=' + state)
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


function search() {
        var state = stateSelect.value;
        var city = citySelect.value;
        var system = systemSelect.value;
        disableSearchControls();
        document.getElementById('BotaoPesquisa').disabled = true;
        document.getElementById('BotaoPesquisa').innerText = "Pesquisando";
        if (state === 'Todos') {
            // Se "Todos" foi selecionado, obtenha a lista de todos os estados e faça uma requisição para cada estado
            fetch('https://pedromiguez.ddns.net/' + system + '/states')
                .then(response => response.json())
                .then(states => {
                    var promises = [];
                    states.forEach(s => {
                        var url = 'https://pedromiguez.ddns.net/' + system + '/searchv2?Uf=' + s;
                        promises.push(fetch(url).then(res => res.json()));
                    });
                    // Aguarde todas as requisições serem concluídas
                    Promise.all(promises).then(results => {
                        //var allWells = [].concat(...results);
                        let allWells = results.flatMap(result => result.data);
                        if (allWells.length > 5000) {
                            clusterCheckbox.checked = true;
                        }
                        allWells.forEach(well => {
                            well.system = systemSelect.value;
                        });
                        currentWells = allWells;
                        updateMarkers(allWells, true);
                        enableSearchControls();
                    });
                });
        } else {
            var searchURL = 'https://pedromiguez.ddns.net/' + system + '/searchv2';
            if (state !== '') {
                searchURL += '?Uf=' + state;
            }
            if (city !== 'Todos' && city !== '') {
                searchURL += '&Mun=' + city;
            }
            fetch(searchURL)
                .then(response => response.json())
                .then(result => {
                    let wells = result.data;
                    if (wells.length > 5000) {
                        clusterCheckbox.checked = true;
                    }
                    wells.forEach(well => {
                        well.system = systemSelect.value;
                    });
                    currentWells = wells;
                    updateMarkers(wells, true);
                    enableSearchControls();
                });
        }
         
       //document.getElementById('clearButton').disabled = false;
       
    
    }
// Limpar todos os marcadores do mapa
function clearMap() {
    map.removeLayer(markers);
    markers = L.markerClusterGroup();
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
