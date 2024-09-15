/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiamFyZWQtbGVkYmV0dGVyIiwiYSI6ImNrMnIweDJ2YjBreHkzb213bWM1ZTZ2cmwifQ.-xC_-3p3JaiG4vA_p9x0YQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jared-ledbetter/ck2r173rz0h5h1clmjtjornzx',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 5,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker to page
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add modal
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include all locations
    bounds.extend(loc.coordinates);
  });
  // Fit all markers within the map viewport
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
