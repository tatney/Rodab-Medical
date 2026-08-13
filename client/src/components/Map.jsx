import React, { useEffect, useRef, useState } from 'react';

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const Map = ({
  center = [53.3498, -6.2603],
  zoom = 13,
  markers = [],
  hospitals = [],
  drivers = [],
  driverPaths = [],
  height = '400px',
  showRoute = false,
  driverLocation = null,
  routeDestination = null,
  onMapClick = null,
  fitKey = null,
  onRoute = null,
  followDriver = false,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const pathsLayerRef = useRef(null);
  const userMovedRef = useRef(false);
  const lastFitKeyRef = useRef(null);
  const lastRouteRef = useRef(null);
  const [mapMode, setMapMode] = useState('map');
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState(null);

  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    import('leaflet').then((leaflet) => {
      setL(leaflet.default || leaflet);
    }).catch(() => {
      if (window.L) {
        setL(window.L);
      }
    });
  }, []);

  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    const tileLayer = L.tileLayer(
      mapMode === 'map'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    );
    tileLayer.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    pathsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember when the user manually pans/zooms so we never fight them.
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const onDrag = () => { userMovedRef.current = true; };
    const onZoom = () => { userMovedRef.current = true; };
    map.on('dragend', onDrag);
    map.on('zoomend', onZoom);
    return () => {
      map.off('dragend', onDrag);
      map.off('zoomend', onZoom);
    };
  }, [L, mapReady]);

  // Switch tile layer on mode change
  useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const newTileUrl =
      mapMode === 'map'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    L.tileLayer(newTileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
  }, [mapMode, L]);

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      urgent: '#d97706',
      moderate: '#2563eb',
      low: '#16a34a',
    };
    return colors[priority] || '#6b7280';
  };

  const createDivIcon = (color, size = 28, label = '') => {
    if (!L) return null;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.4}" viewBox="0 0 24 34">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="6" fill="white"/>
        ${label ? `<text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">${label}</text>` : ''}
      </svg>
    `;
    return L.divIcon({
      html: svg,
      className: 'custom-marker',
      iconSize: [size, size * 1.4],
      iconAnchor: [size / 2, size * 1.4],
      popupAnchor: [0, -size * 1.4],
    });
  };

  // A new fitKey (e.g. a navigation start) overrides user interaction once.
  useEffect(() => {
    if (fitKey !== lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
      userMovedRef.current = false;
    }
  }, [fitKey]);

  // Uber-style follow mode: keep the driver centred on screen as they move,
  // preserving whatever zoom the driver has chosen.
  useEffect(() => {
    if (!L || !mapReady || !mapInstanceRef.current || !followDriver || !driverLocation) return;
    userMovedRef.current = false;
    mapInstanceRef.current.panTo([driverLocation.lat, driverLocation.lng], {
      animate: true,
      duration: 0.4,
    });
  }, [driverLocation, followDriver, L, mapReady]);

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    userMovedRef.current = true;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    userMovedRef.current = true;
    mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    const target = driverLocation
      ? [driverLocation.lat, driverLocation.lng]
      : center;
    if (target && mapInstanceRef.current) {
      userMovedRef.current = false;
      mapInstanceRef.current.setView(target, Math.max(zoom, 14));
    }
  };

  // Update markers
  useEffect(() => {
    if (!L || !mapReady || !mapInstanceRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();
    const bounds = [];

    // Emergency markers
    markers.forEach((marker) => {
      const color = getPriorityColor(marker.priority);
      const icon = createDivIcon(color, 30, '!');
      if (!icon) return;

      const m = L.marker([marker.lat, marker.lng], { icon })
        .addTo(layer)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:180px;">
            <strong style="font-size:14px;">${escapeHtml(marker.title || 'Emergency')}</strong><br/>
            <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${color}20;color:${color};margin:4px 0;">${escapeHtml((marker.priority || 'unknown').toUpperCase())}</span>
            ${marker.address ? `<br/><span style="color:#666;font-size:12px;">${escapeHtml(marker.address)}</span>` : ''}
            ${marker.patientName ? `<br/><span style="font-size:12px;">Patient: ${escapeHtml(marker.patientName)}</span>` : ''}
          </div>`
        );
      bounds.push([marker.lat, marker.lng]);
    });

    // Hospital markers
    hospitals.forEach((hospital) => {
      const icon = createDivIcon('#16a34a', 26, '+');
      if (!icon) return;

      const m = L.marker([hospital.lat, hospital.lng], { icon })
        .addTo(layer)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:180px;">
            <strong style="font-size:14px;">${escapeHtml(hospital.name || 'Hospital')}</strong><br/>
            <span style="color:#666;font-size:12px;">${escapeHtml(hospital.address || '')}</span>
            ${hospital.specialties ? `<br/><span style="font-size:11px;color:#888;">${escapeHtml(hospital.specialties)}</span>` : ''}
          </div>`
        );
      bounds.push([hospital.lat, hospital.lng]);
    });

    // Fleet ambulance markers
    drivers.forEach((driver) => {
      if (driver.lat == null || driver.lng == null) return;
      const color = driver.color || '#6b7280';
      const icon = createDivIcon(color, 32, driver.iconLabel || 'A');
      if (!icon) return;

      const html = driver.pulse
        ? `<div class="pulse-marker-wrap"><span class="pulse-marker-dot" style="background:${color};"></span><div class="pulse-marker-html">${icon.options.html}</div></div>`
        : icon.options.html;

      const pulsingIcon = driver.pulse
        ? L.divIcon({
            html,
            className: 'custom-marker',
            iconSize: icon.options.iconSize,
            iconAnchor: icon.options.iconAnchor,
            popupAnchor: icon.options.popupAnchor,
          })
        : icon;

      L.marker([driver.lat, driver.lng], { icon: pulsingIcon })
        .addTo(layer)
        .bindPopup(
          `<div style="font-family:system-ui;min-width:190px;">
            <strong style="font-size:14px;">${escapeHtml(driver.name || 'Ambulance')}</strong><br/>
            <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${color}20;color:${color};margin:4px 0;">${escapeHtml(driver.statusLabel || (driver.pulse ? 'ON RIDE' : driver.color === '#16a34a' ? 'AVAILABLE' : 'OFF DUTY'))}</span>
            ${driver.plate ? `<br/><span style="color:#666;font-size:12px;">${escapeHtml(driver.plate)}</span>` : ''}
            ${driver.lastUpdate ? `<br/><span style="color:#9ca3af;font-size:11px;">Updated ${escapeHtml(driver.lastUpdate)}</span>` : ''}
          </div>`
        );
      bounds.push([driver.lat, driver.lng]);
    });

    // Driver location
    if (driverLocation) {
      const driverIcon = createDivIcon('#1e3a5f', 28, 'D');
      if (driverIcon) {
        L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
          .addTo(layer)
          .bindPopup(
            `<div style="font-family:system-ui;">
              <strong>Driver Location</strong><br/>
              <span style="font-size:12px;color:#666;">${escapeHtml(driverLocation.name || 'Active Driver')}</span>
            </div>`
          );
        bounds.push([driverLocation.lat, driverLocation.lng]);
      }
    }

    // Auto-fit bounds — but only while the user hasn't taken control of the
    // map, and never while follow mode is active (it would fight panTo).
    if (!userMovedRef.current && !followDriver) {
      if (bounds.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], zoom);
      }
    }
  }, [markers, hospitals, drivers, driverLocation, mapReady, L]); // eslint-disable-line react-hooks/exhaustive-deps

  // Movement path polylines
  useEffect(() => {
    if (!L || !mapReady || !mapInstanceRef.current) return;

    const layer = pathsLayerRef.current;
    layer.clearLayers();

    driverPaths.forEach((path) => {
      if (!Array.isArray(path) || path.length < 2) return;
      L.polyline(path, {
        color: path.color || '#0b2a57',
        weight: 4,
        opacity: 0.55,
        dashArray: '8 8',
      }).addTo(layer);
    });
  }, [driverPaths, mapReady, L]); // eslint-disable-line react-hooks/exhaustive-deps

  // OSRM Route display
  useEffect(() => {
    if (!L || !mapReady || !mapInstanceRef.current) return;

    const emitRoute = (info) => {
      const sig = info ? `${Math.round(info.distance)}|${Math.round(info.duration)}` : null;
      if (sig !== lastRouteRef.current) {
        lastRouteRef.current = sig;
        if (onRoute) onRoute(info);
      }
    };

    routeLayerRef.current.clearLayers();

    if (showRoute && driverLocation && (routeDestination || markers.length >= 1)) {
      const origin = { lat: driverLocation.lat, lng: driverLocation.lng };

      let destination;
      let waypoints = '';

      if (routeDestination && routeDestination.lat != null && routeDestination.lng != null) {
        destination = routeDestination;
      } else {
        destination = markers[markers.length - 1];
        waypoints = markers.length > 1
          ? markers.slice(0, -1).map((m) => `${m.lng},${m.lat}`).join(';')
          : '';
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat}${
        waypoints ? ';' + waypoints : ''
      };${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

      fetch(url, { signal: AbortSignal.timeout(10000) })
        .then((res) => res.json())
        .then((data) => {
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
            L.polyline(coords, {
              color: '#0b2a57',
              weight: 5,
              opacity: 0.8,
              dashArray: null,
            }).addTo(routeLayerRef.current);

            const distance = (data.routes[0].distance / 1000).toFixed(1);
            const duration = Math.round(data.routes[0].duration / 60);
            const midpoint = coords[Math.floor(coords.length / 2)];

            L.popup()
              .setLatLng(midpoint)
              .setContent(
                `<div style="font-family:system-ui;text-align:center;">
                  <strong>${distance} km</strong><br/>
                  <span style="color:#666;font-size:12px;">${duration} min</span>
                </div>`
              )
              .openOn(mapInstanceRef.current);

            const steps = (data.routes[0].legs?.[0]?.steps || []).map((s) => ({
              instruction: s.maneuver?.type || 'straight',
              modifier: s.maneuver?.modifier || '',
              name: s.name || '',
              distance: s.distance,
              duration: s.duration,
            }));

            emitRoute({ distance, duration, coordinates: coords, steps });
          } else {
            emitRoute(null);
          }
        })
        .catch((err) => {
          console.error('Route fetch error:', err);
          emitRoute(null);
        });
    } else {
      emitRoute(null);
    }
  }, [showRoute, markers, driverLocation, routeDestination, mapReady, L]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Map/Satellite Toggle */}
      <div style={styles.toggleContainer}>
        <button
          onClick={() => setMapMode('map')}
          aria-pressed={mapMode === 'map'}
          style={{
            ...styles.toggleBtn,
            ...(mapMode === 'map' ? styles.toggleBtnActive : {}),
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Map
        </button>
        <button
          onClick={() => setMapMode('satellite')}
          aria-pressed={mapMode === 'satellite'}
          style={{
            ...styles.toggleBtn,
            ...(mapMode === 'satellite' ? styles.toggleBtnActive : {}),
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          Satellite
        </button>
      </div>

      {/* Recenter control */}
      <button
        onClick={handleRecenter}
        title="Recenter map"
        aria-label="Recenter map"
        style={styles.recenterBtn}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      {/* Uber-style zoom controls */}
      <div style={styles.zoomControls}>
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
          style={styles.zoomBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <div style={styles.zoomDivider} />
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
          style={styles.zoomBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      {markers.length > 0 && (
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: '#dc2626' }} />
            Critical
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: '#d97706' }} />
            Urgent
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }} />
            Moderate
          </div>
          {driverLocation && (
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#1e3a5f' }} />
              Driver
            </div>
          )}
          {drivers.length > 0 && (
            <>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#dc2626' }} />
                On ride
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#16a34a' }} />
                Available
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#6b7280' }} />
                Off duty
              </div>
            </>
          )}
          {driverPaths.length > 0 && (
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#0b2a57' }} />
              Movement path
            </div>
          )}
          {hospitals.length > 0 && (
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#16a34a' }} />
              Hospital
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {/* Loading state */}
      {!mapReady && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Loading map...</span>
        </div>
      )}

      {/* Custom marker styles injected */}
      <style>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .pulse-marker-wrap {
          position: relative;
          width: 32px;
          height: 45px;
        }
        .pulse-marker-dot {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5);
          animation: livePulse 1.6s infinite;
          z-index: 1;
        }
        .pulse-marker-html {
          position: absolute;
          top: 0;
          left: 0;
        }
        .pulse-marker-html svg {
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35));
        }
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
          70%  { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  toggleContainer: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 1000,
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    border: 'none',
    backgroundColor: 'white',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: 44,
    minWidth: 44,
  },
  toggleBtnActive: {
    backgroundColor: '#0b2a57',
    color: 'white',
  },
  recenterBtn: {
    position: 'absolute',
    top: '68px',
    right: '12px',
    zIndex: 1000,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  zoomControls: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  zoomBtn: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    border: 'none',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    margin: '0 6px',
  },
  legend: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '10px 14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#374151',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#0b2a57',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default Map;
