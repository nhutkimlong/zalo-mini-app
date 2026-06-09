import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { MapPin, Compass, Navigation, Info, Volume2 } from "lucide-react";
import api, { MapPlace, hasAudioGuide, Itinerary } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

// Coordinate database markers interface
interface MapMarker {
  slug: string;
  name: string;
  name_en: string;
  lat: number;
  lng: number;
  category: "tam_linh" | "phong_canh" | "dich_vu";
}

const MAP_CENTER: [number, number] = [11.375641, 106.174648];
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const CLUSTER_CSS = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css";
const CLUSTER_DEFAULT_CSS = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css";
const CLUSTER_JS = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js";

let leafletResourcesPromise: Promise<void> | null = null;

const ensureStyleSheet = (href: string) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.crossOrigin = "";
  document.head.appendChild(link);
};

const ensureScript = (src: string) => new Promise<void>((resolve, reject) => {
  let existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing?.dataset.failed === "true") {
    existing.remove();
    existing = null;
  }

  if (existing) {
    if (existing.dataset.loaded === "true") {
      resolve();
      return;
    }
    existing.addEventListener("load", () => resolve(), { once: true });
    existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.crossOrigin = "";
  script.onload = () => {
    script.dataset.loaded = "true";
    resolve();
  };
  script.onerror = () => {
    script.dataset.failed = "true";
    reject(new Error(`Failed loading ${src}`));
  };
  document.body.appendChild(script);
});

const loadLeafletResources = () => {
  const L = (window as any).L;
  if (L?.markerClusterGroup) return Promise.resolve();
  if (leafletResourcesPromise) return leafletResourcesPromise;

  ensureStyleSheet(LEAFLET_CSS);
  leafletResourcesPromise = ensureScript(LEAFLET_JS).then(() => {
    ensureStyleSheet(CLUSTER_CSS);
    ensureStyleSheet(CLUSTER_DEFAULT_CSS);
    return ensureScript(CLUSTER_JS);
  }).catch((error) => {
    leafletResourcesPromise = null;
    throw error;
  });

  return leafletResourcesPromise;
};

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  // App state variables mapping Supabase database
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userStamps, setUserStamps] = useState<string[]>([]);

  // GPS Location state variables
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // DOM Container ref & Leaflet refs
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const gpsMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const markersRef = useRef<{ [slug: string]: any }>({});
  const clusterGroupRef = useRef<any>(null);
  const lastTapRef = useRef<{ slug: string; time: number } | null>(null);
  const clusterActionLockRef = useRef(false);

  // Memoized lookups
  const placeBySlug = useMemo(() => new Map(places.map(place => [place.slug, place])), [places]);
  const activeRoute = useMemo(
    () => itineraries.find(route => route.id === activeRouteId),
    [activeRouteId, itineraries]
  );

  // Stability refs for asynchronous Leaflet callbacks to avoid React stale closures
  const placeBySlugRef = useRef<Map<string, MapPlace>>(new Map());
  useEffect(() => {
    placeBySlugRef.current = placeBySlug;
  }, [placeBySlug]);

  const handleMarkerTapRef = useRef<(marker: MapMarker) => void>(() => { });

  // 1. Dynamic CDN Loading of Leaflet.js
  useEffect(() => {
    let mounted = true;
    void loadLeafletResources()
      .then(() => {
        if (mounted) setLeafletLoaded(true);
      })
      .catch((error) => {
        console.error("Load Leaflet resources failed", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch Places, Itineraries, and Stamps
  useEffect(() => {
    let mounted = true;

    void api.getMapPlaces().then((data) => {
      if (mounted) setPlaces(data);
    }).catch((err) => {
      console.error("Load map places failed", err);
    });

    void api.getItineraries().then((data) => {
      if (mounted) setItineraries(data);
    }).catch((err) => {
      console.error("Load map itineraries failed", err);
    });

    void api.getMyStamps().then((data) => {
      if (mounted && data) {
        setUserStamps(data.map((item) => item.place_slug));
      }
    }).catch((err) => {
      console.warn("Load user stamps for map failed", err);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // 3. Initialize Leaflet map instance
  useEffect(() => {
    if (!leafletLoaded || !mapDivRef.current || mapInstanceRef.current) return () => { };

    const L = (window as any).L;
    if (!L) return () => { };

    // Tay Ninh Mount Ba Den Center
    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: false,
      tap: false // Disable Leaflet custom tap handler to avoid conflicts with WebView click emulation
    }).setView(MAP_CENTER, 15);

    mapInstanceRef.current = map;

    // Load CartoDB Voyager tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      minZoom: 13,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.basemaps.cartocdn.com/">CARTO</a>'
    }).addTo(map);

    // Track clicks on map background to deselect markers
    map.on("click", () => {
      // Prevent ghost clicks from mobile touch interactions from deselecting the POI
      const lastTapTime = lastTapRef.current?.time ?? 0;
      const timeSinceLastTap = Date.now() - lastTapTime;
      if (timeSinceLastTap < 800) {
        return;
      }

      setSelectedPlace(null);
      setSelectedMarker(null);
      setActiveRouteId(null);
    });

    // Handle native click/touch/mouse/pointer events for markers, tooltips, and clusters
    map.on("layeradd", (e: any) => {
      const layer = e.layer;
      if (!layer) return;

      setTimeout(() => {
        const el = typeof layer.getElement === "function" ? layer.getElement() : null;
        if (!el) return;

        // Helper to bind events and stop propagation across all pointer/mouse/touch types
        const bindStopPropagationEvents = (element: HTMLElement, handler: (evt: Event) => void) => {
          // Detach existing handler if any
          if ((element as any)._nativeTapHandler) {
            const oldHandler = (element as any)._nativeTapHandler;
            const events = ["click", "touchstart", "touchend", "mousedown", "mouseup", "pointerdown", "pointerup"];
            events.forEach((evtName) => {
              element.removeEventListener(evtName, oldHandler);
            });
          }

          (element as any)._nativeTapHandler = handler;
          const events = ["click", "touchstart", "touchend", "mousedown", "mouseup", "pointerdown", "pointerup"];
          events.forEach((evtName) => {
            element.addEventListener(evtName, handler, { passive: true });
          });
        };

        // Case 1: Individual POI Marker
        if (layer.placeSlug) {
          const slug = layer.placeSlug;

          const handleNativeMarkerTap = (evt: Event) => {
            evt.stopPropagation();
            if (L?.DomEvent) {
              L.DomEvent.stopPropagation(evt);
            }

            if (evt.type === "click" || evt.type === "touchstart" || evt.type === "pointerdown") {
              const matchedPlace = placeBySlugRef.current.get(slug);
              if (matchedPlace && handleMarkerTapRef.current) {
                handleMarkerTapRef.current({
                  slug: matchedPlace.slug,
                  name: matchedPlace.name,
                  name_en: matchedPlace.name_en || matchedPlace.name,
                  lat: matchedPlace.latitude,
                  lng: matchedPlace.longitude,
                  category: (matchedPlace.category || "tam_linh") as any
                });
              }
            }
          };

          bindStopPropagationEvents(el, handleNativeMarkerTap);
        }

        // Case 2: Clickable Tooltip Labels
        if (layer.options?.className === "leaflet-premium-tooltip") {
          const marker = layer._source;
          if (marker && marker.placeSlug) {
            const slug = marker.placeSlug;

            const handleNativeTooltipTap = (evt: Event) => {
              evt.stopPropagation();
              if (L?.DomEvent) {
                L.DomEvent.stopPropagation(evt);
              }

              if (evt.type === "click" || evt.type === "touchstart" || evt.type === "pointerdown") {
                const matchedPlace = placeBySlugRef.current.get(slug);
                if (matchedPlace && handleMarkerTapRef.current) {
                  handleMarkerTapRef.current({
                    slug: matchedPlace.slug,
                    name: matchedPlace.name,
                    name_en: matchedPlace.name_en || matchedPlace.name,
                    lat: matchedPlace.latitude,
                    lng: matchedPlace.longitude,
                    category: (matchedPlace.category || "tam_linh") as any
                  });
                }
              }
            };

            bindStopPropagationEvents(el, handleNativeTooltipTap);
          }
        }

        // Case 3: Cluster Marker
        if (el.classList.contains("marker-cluster")) {
          const handleNativeClusterTap = (evt: Event) => {
            evt.stopPropagation();
            if (L?.DomEvent) {
              L.DomEvent.stopPropagation(evt);
            }

            if (evt.type === "click" || evt.type === "touchstart" || evt.type === "pointerdown") {
              const cluster = layer;
              if (!cluster || clusterActionLockRef.current) {
                return;
              }

              clusterActionLockRef.current = true;

              if (typeof map.stop === "function") {
                map.stop();
              }

              const currentGroup = clusterGroupRef.current;
              if (currentGroup && typeof currentGroup.unspiderfy === "function") {
                currentGroup.unspiderfy();
              }

              setSelectedPlace(null);
              setSelectedMarker(null);
              setActiveRouteId(null);

              const currentZoom = map.getZoom();
              const targetMaxZoom = Math.min(17, map.getMaxZoom());

              let unlocked = false;
              let fallbackTimer: number | undefined;

              const unlock = () => {
                if (unlocked) return;
                unlocked = true;
                clusterActionLockRef.current = false;
                map.off("moveend", unlock);
                map.off("zoomend", unlock);
                if (fallbackTimer !== undefined) {
                  window.clearTimeout(fallbackTimer);
                }
              };

              map.on("moveend", unlock);
              map.on("zoomend", unlock);
              fallbackTimer = window.setTimeout(unlock, 700);

              if (currentZoom < targetMaxZoom) {
                map.fitBounds(cluster.getBounds(), {
                  padding: [48, 48],
                  maxZoom: targetMaxZoom,
                  animate: true
                });
              } else {
                if (typeof cluster.spiderfy === "function") {
                  cluster.spiderfy();
                }
                window.setTimeout(unlock, 250);
              }
            }
          };

          bindStopPropagationEvents(el, handleNativeClusterTap);
        }
      }, 0);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // 4. Plot markers dynamically on map
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || places.length === 0) return;

    // Clean existing cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current = {};

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      zoomToBoundsOnClick: false,
      spiderfyOnMaxZoom: false,
      animate: true,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true
    });
    clusterGroupRef.current = clusterGroup;

    // Stable Custom DivIcon DOM (large 32x32 size for easy touch targets, centered inner dot)
    const createCustomIcon = () => {
      return L.divIcon({
        className: "custom-leaflet-poi-icon",
        html: `<div class="marker-inner-dot"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    places.forEach((place) => {
      const leafletMarker = L.marker([place.latitude, place.longitude], {
        icon: createCustomIcon(),
        interactive: true
      }) as any;

      leafletMarker.placeSlug = place.slug;

      leafletMarker.bindTooltip(place.name, {
        permanent: true,
        direction: "top",
        offset: [0, -14],
        className: "leaflet-premium-tooltip"
      });

      clusterGroup.addLayer(leafletMarker);
      markersRef.current[place.slug] = leafletMarker;
    });

    // Custom clusterclick handler
    clusterGroup.on("clusterclick", (e: any) => {
      const cluster = e.layer;
      if (!cluster || clusterActionLockRef.current) return;

      clusterActionLockRef.current = true;
      if (typeof map.stop === "function") {
        map.stop();
      }
      if (clusterGroupRef.current && typeof clusterGroupRef.current.unspiderfy === "function") {
        clusterGroupRef.current.unspiderfy();
      }

      setSelectedPlace(null);
      setSelectedMarker(null);

      const currentZoom = map.getZoom();
      const targetMaxZoom = Math.min(17, map.getMaxZoom());

      let unlocked = false;
      let fallbackTimer: number | undefined;

      const unlock = () => {
        if (unlocked) return;
        unlocked = true;
        clusterActionLockRef.current = false;
        map.off("moveend", unlock);
        map.off("zoomend", unlock);
        if (fallbackTimer !== undefined) {
          window.clearTimeout(fallbackTimer);
        }
      };

      map.on("moveend", unlock);
      map.on("zoomend", unlock);
      fallbackTimer = window.setTimeout(unlock, 700);

      if (currentZoom < targetMaxZoom) {
        map.fitBounds(cluster.getBounds(), {
          padding: [48, 48],
          maxZoom: targetMaxZoom,
          animate: true
        });
      } else {
        cluster.spiderfy();
        window.setTimeout(unlock, 250);
      }
    });

    map.addLayer(clusterGroup);

    return () => {
      if (clusterGroupRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      markersRef.current = {};
    };
  }, [leafletLoaded, places]);

  // 5. STABLE DOM Styling updates (Classes toggled instead of redrawing icons)
  useEffect(() => {
    if (!leafletLoaded || places.length === 0) return;

    const routeIndexBySlug = new Map(
      (activeRoute?.place_slugs || []).map((slug, index) => [slug, index])
    );

    places.forEach((place) => {
      const leafletMarker = markersRef.current[place.slug];
      const el = leafletMarker ? leafletMarker.getElement() : null;
      if (!el) return;

      const dot = el.querySelector(".marker-inner-dot") as HTMLElement;
      if (!dot) return;

      const isSelected = selectedPlace?.slug === place.slug;
      const routeIndex = routeIndexBySlug.get(place.slug) ?? -1;

      // 1. Toggle Selection highlighting
      dot.classList.toggle("is-selected", isSelected);

      // 2. Toggle Itinerary Route highlighting & numbering
      if (routeIndex !== -1) {
        dot.classList.add("is-in-route");
        dot.style.setProperty("--route-color", activeRoute?.color || "var(--accent-gold)");
        dot.innerHTML = `<span>${routeIndex + 1}</span>`;
      } else {
        dot.classList.remove("is-in-route");
        dot.style.removeProperty("--route-color");
        dot.innerHTML = "";
      }

      // 3. Toggle Stamp Rally checked-in status
      const isStamped = userStamps.includes(place.slug);
      dot.classList.toggle("is-stamped", isStamped);
    });
  }, [activeRoute, selectedPlace?.slug, places, leafletLoaded, userStamps]);

  // 6. Language support tooltip updates
  useEffect(() => {
    if (!leafletLoaded) return;
    places.forEach((place) => {
      const marker = markersRef.current[place.slug];
      if (!marker) return;
      const label = language === "km" && place.name_km 
        ? place.name_km 
        : language === "en" && place.name_en 
          ? place.name_en 
          : place.name;
      marker.setTooltipContent(label);
    });
  }, [language, places, leafletLoaded]);

  // 7. Drawing itinerary route polyline
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (activeRoute) {
      const resolvedPath: [number, number][] = [];
      const slugs = activeRoute.place_slugs || [];
      slugs.forEach((slug) => {
        const matched = placeBySlug.get(slug);
        if (matched) {
          resolvedPath.push([matched.latitude, matched.longitude]);
        }
      });

      if (resolvedPath.length > 0) {
        const polyline = L.polyline(resolvedPath, {
          color: activeRoute.color,
          weight: 4,
          dashArray: "10, 8",
          opacity: 0.95
        }).addTo(map);

        routePolylineRef.current = polyline;

        map.fitBounds(polyline.getBounds(), {
          padding: [40, 40],
          maxZoom: 16
        });
      }
    }
  }, [activeRoute, placeBySlug]);

  // 8. GPS Location Marker plot & updates
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (gpsMarkerRef.current) {
      map.removeLayer(gpsMarkerRef.current);
      gpsMarkerRef.current = null;
    }

    if (gpsLocation) {
      const gpsIcon = L.divIcon({
        className: "gps-div-icon",
        html: `<div style="position: relative; width: 20px; height: 20px;">
          <div style="
            position: absolute;
            width: 32px;
            height: 32px;
            background-color: rgba(0, 210, 255, 0.35);
            border-radius: 50%;
            top: -6px;
            left: -6px;
            animation: gps-pulse 1.8s infinite;
          "></div>
          <div style="
            position: absolute;
            width: 14px;
            height: 14px;
            background-color: #ffffff;
            border: 3px solid #0099ff;
            border-radius: 50%;
            top: 3px;
            left: 3px;
            box-shadow: 0 0 10px #00d2ff;
          "></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      gpsMarkerRef.current = L.marker([gpsLocation.lat, gpsLocation.lng], {
        icon: gpsIcon
      }).addTo(map);
    }
  }, [gpsLocation]);

  // Marker Tap handler
  const handleMarkerTap = (marker: MapMarker) => {
    const now = Date.now();

    // Debounce fast multi-taps
    if (
      lastTapRef.current?.slug === marker.slug &&
      now - lastTapRef.current.time < 400
    ) {
      return;
    }

    lastTapRef.current = { slug: marker.slug, time: now };

    const matchedPlace = placeBySlug.get(marker.slug);
    setSelectedPlace(matchedPlace ?? null);
    setSelectedMarker(marker);
    setActiveRouteId(null); // Reset active AI route on click

    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;

    if (!map || !L) return;

    if (typeof map.stop === "function") {
      map.stop();
    }
    if (clusterGroup && typeof clusterGroup.unspiderfy === "function") {
      clusterGroup.unspiderfy();
    }

    const currentZoom = map.getZoom();
    const targetZoom = currentZoom < 16 ? 16 : currentZoom;
    const targetLatLng = L.latLng(marker.lat, marker.lng);
    const currentCenter = map.getCenter();
    const distance = currentCenter.distanceTo(targetLatLng);

    // Skip flyTo if already focused
    const isAlreadyFocused = distance < 5 && currentZoom >= 16;
    if (selectedPlace?.slug === marker.slug && isAlreadyFocused) return;

    map.flyTo(targetLatLng, targetZoom, {
      animate: true,
      duration: 0.35
    });
  };

  useEffect(() => {
    handleMarkerTapRef.current = handleMarkerTap;
  }, [handleMarkerTap]);

  // Activate GPS location using browser HTML5 Geolocation
  const handleActivateGPS = async (isAutoLoad: boolean = false) => {
    setGpsLoading(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      // Try 1: HTML5 Browser Geolocation (Primary for PWA)
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          console.log("Acquired location via HTML5 browser geolocation:", latitude, longitude);
        } catch (geoError) {
          console.warn("Browser Geolocation failed/timed out:", geoError);
        }
      }

      // Try 3: Default mock (Mount Ba Den coordinates for development)
      if (latitude === undefined || longitude === undefined) {
        console.warn("Defaulting to Mount Ba Den coordinates for development.");
        latitude = 11.375641;
        longitude = 106.174648;
      }

      setGpsLocation({ lat: latitude, lng: longitude });

      const isRemote = latitude < 11.35 || latitude > 11.41 || longitude < 106.12 || longitude > 106.21;

      if (mapInstanceRef.current && (!isRemote || !isAutoLoad)) {
        mapInstanceRef.current.setView([latitude, longitude], 16, {
          animate: true,
          duration: 0.5
        });
      }

      if (isRemote && !isAutoLoad) {
        alert(
          language === "en"
            ? `You are exploring remotely (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Map centered on your position.`
            : `Bạn đang ở vị trí từ xa (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Bản đồ đã định vị tiêu điểm về bạn.`
        );
      }
    } catch (error: any) {
      console.warn("GPS retrieval failed:", error);
      if (!isAutoLoad) {
        const isPermissionError = error && (error.code === 1 || error.code === -301 || error.code === 301 || String(error.message).toLowerCase().includes("denied") || String(error.message).toLowerCase().includes("permission"));

        if (isPermissionError) {
          alert(
            language === "en"
              ? "GPS permission denied. Please allow location access in your browser settings to use this feature."
              : "Quyền định vị bị từ chối. Vui lòng cấp quyền truy cập vị trí trên trình duyệt của bạn để sử dụng tính năng này."
          );
        } else {
          alert(
            language === "en"
              ? "GPS access failed. Please ensure location services are enabled."
              : "Lỗi kích hoạt định vị GPS. Vui lòng kiểm tra dịch vụ vị trí của thiết bị."
          );
        }
      }
    } finally {
      setGpsLoading(false);
    }
  };

  // Auto-GPS triggers on load once Leaflet is ready
  useEffect(() => {
    if (leafletLoaded && mapInstanceRef.current) {
      handleActivateGPS(true);
    }
  }, [leafletLoaded]);

  // Map zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };
  const handleResetZoom = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(MAP_CENTER, 15, {
        animate: true,
        duration: 0.5
      });
      setActiveRouteId(null);
      setSelectedPlace(null);
      setSelectedMarker(null);
    }
  };

  return (
    <Page
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: "calc(48px + var(--zaui-safe-area-inset-top, env(safe-area-inset-top, 0px)))",
        color: "#f4f7f6",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 0%, #17375e 0%, #06152a 100%)",
        zIndex: 97
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .leaflet-container {
          background-color: #f4f8fa !important;
        }

        @keyframes gps-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .leaflet-premium-tooltip {
          background-color: var(--primary-navy) !important;
          border: 1px solid var(--accent-gold) !important;
          color: var(--accent-gold) !important;
          font-weight: 750 !important;
          font-size: 9px !important;
          border-radius: 4px !important;
          padding: 2px 6px !important;
          box-shadow: 0 2px 6px rgba(11, 37, 69, 0.4) !important;
          opacity: 0.95 !important;
          white-space: nowrap !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }

        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background-color: rgba(11, 37, 69, 0.6) !important;
          border: 1.5px solid var(--accent-gold) !important;
        }

        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background-color: rgba(212, 175, 55, 0.2) !important;
          color: var(--accent-gold) !important;
          font-weight: 800 !important;
        }

        .custom-leaflet-poi-icon {
          background: transparent !important;
          border: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto !important;
          cursor: pointer !important;
          touch-action: manipulation !important;
        }

        .marker-inner-dot {
          width: 14px;
          height: 14px;
          background-color: var(--accent-gold);
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px var(--accent-gold);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .marker-inner-dot.is-selected {
          width: 18px !important;
          height: 18px !important;
          background-color: #f97316 !important;
          box-shadow: 0 0 12px #f97316 !important;
          border-color: #ffffff !important;
          transform: scale(1.25);
        }

        .marker-inner-dot.is-in-route {
          width: 20px !important;
          height: 20px !important;
          border-color: #ffffff !important;
          background-color: var(--route-color, var(--accent-gold)) !important;
          box-shadow: 0 0 12px var(--route-color, var(--accent-gold)) !important;
          transform: scale(1.1);
        }

        .marker-inner-dot.is-stamped {
          background-color: var(--accent-gold) !important;
          border: 2px solid #22c55e !important;
          box-shadow: 0 0 14px var(--accent-gold), 0 0 4px #22c55e !important;
        }

        .marker-inner-dot.is-in-route span {
          color: var(--primary-navy);
          font-size: 10px;
          font-weight: 900;
          font-family: Arial, sans-serif;
          line-height: 1;
        }
      ` }} />

      {/* Premium Header */}
      <Header
        title={
          <span style={{ color: "var(--accent-gold)", fontWeight: 800 }}>
            {language === "km" ? "ផែនទីឌីជីថលពិតប្រាកដ" : language === "en" ? "Real Geolocation Map" : "Bản Đồ Số Thực Địa"}
          </span> as any
        }
        showBackIcon={true}
      />

      {/* Control bar */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "6px 12px 8px 12px",
        background: "rgba(11, 37, 69, 0.85)",
        borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
        zIndex: 10
      }}>
        {/* AI route scrollable list */}
        <div style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "2px",
          scrollbarWidth: "none"
        }}>
          {itineraries.map((itinerary) => (
            <button
              key={itinerary.id}
              onClick={() => {
                setActiveRouteId(activeRouteId === itinerary.id ? null : itinerary.id);
                setSelectedPlace(null);
                setSelectedMarker(null);
              }}
              style={{
                flexShrink: 0,
                padding: "4px 10px",
                fontSize: "10.5px",
                fontWeight: 700,
                borderRadius: "12px",
                border: activeRouteId === itinerary.id ? `1.5px solid ${itinerary.color}` : "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: activeRouteId === itinerary.id ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
                color: activeRouteId === itinerary.id ? itinerary.color : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Compass size={12} style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }} />
              {language === "km" ? (itinerary.name_km || itinerary.name) : language === "en" ? (itinerary.name_en || itinerary.name) : itinerary.name} ({language === "km" ? (itinerary.duration_km || itinerary.duration) : language === "en" ? (itinerary.duration_en || itinerary.duration) : itinerary.duration})
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Content DOM */}
      <div style={{ flex: 1, position: "relative", width: "100%", height: "100%" }}>
        {!leafletLoaded && (
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--primary-navy)",
            color: "var(--accent-gold)",
            zIndex: 5
          }}>
            <Compass size={40} style={{ animation: "spin 2s linear infinite", marginBottom: "12px" }} />
            <p style={{ fontSize: "13px", fontWeight: 700 }}>
              {language === "km" ? "កំពុងទាញយកផែនទីឌីជីថល..." : language === "en" ? "Loading Leaflet Map Tiles..." : "Đang tải bản đồ số..."}
            </p>
          </div>
        )}

        <div ref={mapDivRef} style={{ width: "100%", height: "100%", backgroundColor: "var(--primary-navy)" }} />

        {/* Zoom and resetting viewport overlay tools */}
        <div style={{
          position: "absolute",
          bottom: "24px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 1000
        }}>
          {/* GPS Locate Button */}
          <button
            onClick={() => handleActivateGPS(false)}
            disabled={gpsLoading}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(11, 37, 69, 0.9)",
              color: "var(--accent-gold)",
              border: gpsLocation ? "1.5px solid var(--accent-gold)" : "1px solid rgba(255, 255, 255, 0.25)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              position: "relative",
              transition: "all 0.2s ease",
              outline: "none"
            }}
            title={language === "km" ? "កំណត់ទីតាំង GPS" : language === "en" ? "GPS Locate" : "Định Vị GPS"}
          >
            {gpsLoading ? (
              <Compass size={18} style={{ animation: "spin 2s linear infinite", color: "var(--accent-gold)" }} />
            ) : (
              <Navigation size={18} style={{ 
                transform: "rotate(45deg)", 
                strokeWidth: 3, 
                color: gpsLocation ? "var(--accent-gold)" : "#ffffff" 
              }} />
            )}
            {gpsLocation && (
              <span style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 6px #22c55e"
              }} />
            )}
          </button>

          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(11, 37, 69, 0.9)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              fontSize: "20px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              transition: "all 0.2s ease"
            }}
            title={language === "en" ? "Zoom In" : "Phóng to"}
          >
            +
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(11, 37, 69, 0.9)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              fontSize: "20px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              transition: "all 0.2s ease"
            }}
            title={language === "en" ? "Zoom Out" : "Thu nhỏ"}
          >
            -
          </button>

          {/* Reset Zoom / Center Button */}
          <button
            onClick={handleResetZoom}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "rgba(11, 37, 69, 0.9)",
              color: "var(--accent-gold)",
              border: "1px solid var(--accent-gold)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              transition: "all 0.2s ease"
            }}
            title={language === "km" ? "ទម្រង់ដើម" : language === "en" ? "Center Map" : "Thu Nhỏ / Trung Tâm"}
          >
            <Compass size={18} style={{ color: "var(--accent-gold)" }} />
          </button>
        </div>
      </div>

      {/* Pop-up bottom details sheet panel */}
      <div style={{
        backgroundColor: "var(--primary-navy)",
        borderTop: "2.5px solid var(--accent-gold)",
        padding: (selectedPlace || activeRoute)
          ? "8px 16px calc(12px + var(--zaui-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))) 16px"
          : "4px 16px calc(4px + var(--zaui-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))) 16px",
        maxHeight: (selectedPlace || activeRoute) ? "210px" : "48px",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        overflowY: "auto",
        zIndex: 1001,
        boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
        gap: (selectedPlace || activeRoute) ? "8px" : "2px"
      }}>
        {/* Drag handle */}
        <div style={{
          width: "40px",
          height: "4px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderRadius: "2px",
          margin: "0 auto 6px auto",
          flexShrink: 0
        }} />

        {selectedPlace && selectedMarker ? (
          <div>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <img
                src={selectedPlace.image_url}
                alt={selectedPlace.name}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                style={{ borderRadius: "8px", objectFit: "cover", border: "1px solid var(--accent-gold)", flexShrink: 0 }}
              />

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-gold)", margin: "0 0 2px 0" }}>
                  {language === "km" && selectedPlace.name_km ? selectedPlace.name_km : language === "en" && selectedPlace.name_en ? selectedPlace.name_en : selectedPlace.name}
                </h3>
                <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={10} style={{ stroke: "var(--accent-gold)" }} />
                  GPS: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                </p>
                <p style={{
                  fontSize: "11.5px",
                  color: "var(--cream-white)",
                  opacity: 0.85,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.3"
                }}>
                  {language === "km" && selectedPlace.short_description_km ? selectedPlace.short_description_km : language === "en" && selectedPlace.short_description_en ? selectedPlace.short_description_en : selectedPlace.short_description}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => navigate(`/places/${selectedPlace.slug}`)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: "36px"
                }}
              >
                <Info size={14} />
                <span>{language === "km" ? "មើលព័ត៌មានលម្អិត" : language === "en" ? "View Details" : "Lịch Sử Di Tích"}</span>
              </button>

              {hasAudioGuide(selectedPlace, language) && (
                <button
                  onClick={() => navigate(`/places/${selectedPlace.slug}`)}
                  style={{
                    flex: 1.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    backgroundColor: "var(--accent-gold)",
                    color: "var(--primary-navy)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    minHeight: "36px"
                  }}
                >
                  <Volume2 size={14} />
                  <span>{language === "km" ? "ស្តាប់ការអធិប្បាយ" : language === "en" ? "Audio Guide" : "Phát Thuyết Minh"}</span>
                </button>
              )}
            </div>
          </div>
        ) : activeRoute ? (
          <div>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "4px", marginBottom: "6px" }}>
              <h3 style={{ fontSize: "13.5px", fontWeight: 700, color: activeRoute.color, margin: "0 0 2px 0" }}>
                {language === "km" ? (activeRoute.name_km || activeRoute.name) : language === "en" ? (activeRoute.name_en || activeRoute.name) : activeRoute.name}
              </h3>
              <p style={{ fontSize: "10.5px", color: "var(--cream-white)", opacity: 0.8, margin: 0 }}>
                {language === "km" ? "ជំហានធ្វើដំណើរដែលណែនាំដោយ AI:" : language === "en" ? "AI recommended travel steps:" : "Lộ trình đề xuất di chuyển chi tiết:"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", maxHeight: "110px" }}>
              {activeRoute.steps.map((step, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px" }}>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: activeRoute.color,
                    color: "var(--primary-navy)",
                    fontSize: "9.5px",
                    fontWeight: 800,
                    marginTop: "2px",
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </span>
                  <p style={{ margin: 0, color: "var(--cream-white)", opacity: 0.9, lineHeight: "1.35" }}>
                    {language === "km" && step.km ? step.km : language === "en" ? step.en : step.vi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "2px 0",
            fontSize: "11.5px",
            color: "var(--cream-white)",
            opacity: 0.85,
            textAlign: "center"
          }}>
            <Compass size={13} style={{ stroke: "var(--accent-gold)", animation: "spin 12s linear infinite" }} />
            <span>
              {language === "km"
                ? "សូមប៉ះទីកន្លែង ឬជ្រើសរើសផ្លូវ AI ដើម្បីមើលព័ត៌មានលម្អិត។"
                : language === "en"
                  ? "Select a marker or an AI Itinerary to view route."
                  : "Chạm địa danh hoặc chọn Lộ trình AI để xem chi tiết."}
            </span>
          </div>
        )}
      </div>
    </Page>
  );
};

export default MapPage;
