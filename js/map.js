let mapInstance;
let markersClusterGroup;

function initMap() {
  mapInstance = L.map("map").setView([-14, -51], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance);

  markersClusterGroup = L.markerClusterGroup();
  mapInstance.addLayer(markersClusterGroup);
}

function clearMapMarkers() {
  if (markersClusterGroup) {
    markersClusterGroup.clearLayers();
  }
}

function addGeoJsonToMap(geojson) {
  if (!geojson || !geojson.features || geojson.features.length === 0) {
    console.warn("No features to add to map or GeoJSON is invalid.");
    // Optionally, notify the user that no results were found.
    alert("Nenhum resultado encontrado para os filtros aplicados.");
    return;
  }

  const geoJsonLayer = L.geoJSON(geojson, {
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      // Sanitize popup content
      const codigo = sanitizeText(p.Codigo || 'N/A');
      const mun = sanitizeText(p.Mun || 'N/A');
      const uf = sanitizeText(p.Uf || 'N/A');
      const bacia = sanitizeText(p.Bacia || 'N/A');
      layer.bindPopup(
        `<b>Código:</b> ${codigo}<br>
         <b>Local:</b> ${mun} / ${uf}<br>
         <b>Bacia:</b> ${bacia}`
      );
    }
  });

  markersClusterGroup.addLayer(geoJsonLayer);

  if (markersClusterGroup.getLayers().length > 0) {
    try {
        mapInstance.fitBounds(markersClusterGroup.getBounds().pad(0.1));
    } catch(e) {
        console.warn("Could not fit bounds, perhaps no valid markers.", e);
        // Fallback if bounds are problematic (e.g. single point, or invalid)
        if (geojson.features.length > 0 && geojson.features[0].geometry.coordinates) {
            const firstCoord = geojson.features[0].geometry.coordinates;
             // GeoJSON coordinates are [lng, lat], Leaflet needs [lat, lng]
            mapInstance.setView([firstCoord[1], firstCoord[0]], 10);
        }
    }
  }
}