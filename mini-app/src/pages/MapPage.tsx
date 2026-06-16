import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page } from "../components/WebPrimitives";
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
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocalhost) {
      if (!isAutoLoad) {
        alert(
          language === "en"
            ? "GPS geolocation requires a secure connection (HTTPS). Please access via HTTPS."
            : "Định vị GPS yêu cầu kết nối bảo mật (HTTPS). Vui lòng truy cập qua địa chỉ HTTPS."
        );
      }
      return;
    }

    setGpsLoading(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;

      // Try Permissions API query to handle prompt / denied state gracefully
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: "geolocation" });
          if (status.state === "denied") {
            if (!isAutoLoad) {
              alert(
                language === "en"
                  ? "Location access is blocked. Please enable location permissions in your browser settings to use this feature."
                  : "Quyền truy cập vị trí đã bị chặn. Vui lòng cấp quyền truy cập vị trí trong cài đặt trang web của trình duyệt để sử dụng tính năng này."
              );
            }
            setGpsLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Permissions API query failed:", e);
        }
      }

      // Try HTML5 Browser Geolocation (Primary for PWA)
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          console.log("Acquired location via HTML5 browser geolocation:", latitude, longitude);
        } catch (geoError) {
          console.warn("Browser Geolocation failed/timed out:", geoError);
          if (!isLocalhost) {
            throw geoError;
          }
        }
      } else {
        if (!isLocalhost) {
          throw new Error("Geolocation not supported by this browser");
        }
      }

      // Default mock (Mount Ba Den coordinates for development) only on localhost
      if (latitude === undefined || longitude === undefined) {
        if (isLocalhost) {
          console.warn("Defaulting to Mount Ba Den coordinates for local development.");
          latitude = 11.375641;
          longitude = 106.174648;
        } else {
          throw new Error("GPS position could not be retrieved");
        }
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
    <Page className="map-page-premium">
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
          <span className="map-header-title">
            {language === "km" ? "ផែនទីឌីជីថលពិតប្រាកដ" : language === "en" ? "Real Geolocation Map" : "Bản Đồ Số Thực Địa"}
          </span> as any
        }
        showBackIcon={true}
      />

      {/* Control bar */}
      <div className="map-control-bar">
        {/* AI route scrollable list */}
        <div className="map-itinerary-list">
          {itineraries.map((itinerary) => (
            <button
              key={itinerary.id}
              onClick={() => {
                setActiveRouteId(activeRouteId === itinerary.id ? null : itinerary.id);
                setSelectedPlace(null);
                setSelectedMarker(null);
              }}
              className={`map-itinerary-btn ${activeRouteId === itinerary.id ? "is-active" : ""}`}
              style={{ "--route-color": itinerary.color } as React.CSSProperties}
            >
              <Compass size={12} className="map-itinerary-btn-icon" />
              {language === "km" ? (itinerary.name_km || itinerary.name) : language === "en" ? (itinerary.name_en || itinerary.name) : itinerary.name} ({language === "km" ? (itinerary.duration_km || itinerary.duration) : language === "en" ? (itinerary.duration_en || itinerary.duration) : itinerary.duration})
            </button>
          ))}
        </div>
      </div>

      {/* Map Layout Wrapper for Responsive Desktop */}
      <div className="map-responsive-wrapper">
        {/* Main Map Content DOM */}
        <div className="map-leaflet-wrapper">
          {!leafletLoaded && (
            <div className="map-loader-container">
              <Compass size={40} className="map-loader-icon" />
              <p className="map-loader-text">
                {language === "km" ? "កំពុងទាញយកផែនទីឌីជីថល..." : language === "en" ? "Loading Leaflet Map Tiles..." : "Đang tải bản đồ số..."}
              </p>
            </div>
          )}

          <div ref={mapDivRef} className="map-div-container" />

          {/* FAB Controls (GPS + Zoom) */}
          <div
            className={`map-fab-group ${(selectedPlace || activeRoute) ? "is-sheet-open" : "is-sheet-closed"}`}
          >
            {/* GPS Locate Button */}
            <button
              onClick={() => handleActivateGPS(false)}
              disabled={gpsLoading}
              id="map-gps-btn"
              className={`map-fab-btn ${gpsLocation ? "is-active" : ""}`}
              title={language === "km" ? "កំណត់ទីតាំង GPS" : language === "en" ? "GPS Locate" : "Định Vị GPS"}
            >
              {gpsLoading ? (
                <Compass size={18} className="map-gps-icon-loading" />
              ) : (
                <Navigation size={18} className="map-gps-icon" style={{ color: gpsLocation ? "var(--accent-gold)" : "#ffffff" }} />
              )}
              {gpsLocation && (
                <span className="map-gps-status-dot" />
              )}
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              id="map-zoom-in-btn"
              className="map-fab-btn map-zoom-btn"
              title={language === "en" ? "Zoom In" : "Phóng to"}
            >
              +
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              id="map-zoom-out-btn"
              className="map-fab-btn map-zoom-btn"
              title={language === "en" ? "Zoom Out" : "Thu nhỏ"}
            >
              -
            </button>

            {/* Reset Center */}
            <button
              onClick={handleResetZoom}
              id="map-reset-btn"
              className="map-fab-btn is-active"
              title={language === "km" ? "ទម្រង់ដើម" : language === "en" ? "Center Map" : "Trung Tâm"}
            >
              <Compass size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Sheet Panel (Mobile) / Sidebar Panel (Desktop) */}
        <div
          id="map-bottom-sheet"
          className={selectedPlace || activeRoute ? "is-expanded" : ""}
        >
          {/* Drag handle */}
          <div className="map-sheet-handle" />

          {selectedPlace && selectedMarker ? (
            <div>
              <div className="map-place-flex">
                <img
                  src={selectedPlace.image_url}
                  alt={selectedPlace.name}
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="map-place-img"
                />

                <div className="map-place-body">
                  <h3 className="map-place-title">
                    {language === "km" && selectedPlace.name_km ? selectedPlace.name_km : language === "en" && selectedPlace.name_en ? selectedPlace.name_en : selectedPlace.name}
                  </h3>
                  <p className="map-place-meta">
                    <MapPin size={10} className="map-place-pin" />
                    GPS: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                  </p>
                  <p className="map-place-desc">
                    {language === "km" && selectedPlace.short_description_km ? selectedPlace.short_description_km : language === "en" && selectedPlace.short_description_en ? selectedPlace.short_description_en : selectedPlace.short_description}
                  </p>
                </div>
              </div>

              <div className="map-place-buttons">
                <button
                  onClick={() => navigate(`/places/${selectedPlace.slug}`)}
                  className="map-btn-info"
                >
                  <Info size={14} />
                  <span>{language === "km" ? "មើលព័ត៌មានលម្អិត" : language === "en" ? "View Details" : "Lịch Sử Di Tích"}</span>
                </button>

                {hasAudioGuide(selectedPlace, language) && (
                  <button
                    onClick={() => navigate(`/places/${selectedPlace.slug}`)}
                    className="map-btn-audio"
                  >
                    <Volume2 size={14} />
                    <span>{language === "km" ? "ស្តាប់ការអធិប្បាយ" : language === "en" ? "Audio Guide" : "Phát Thuyết Minh"}</span>
                  </button>
                )}
              </div>
            </div>
          ) : activeRoute ? (
            <div>
              <div className="map-route-header">
                <h3 className="map-route-title" style={{ color: activeRoute.color }}>
                  {language === "km" ? (activeRoute.name_km || activeRoute.name) : language === "en" ? (activeRoute.name_en || activeRoute.name) : activeRoute.name}
                </h3>
                <p className="map-route-subtitle">
                  {language === "km" ? "ជំហានធ្វើដំណើរដែលណែនាំដោយ AI:" : language === "en" ? "AI recommended travel steps:" : "Lộ trình đề xuất di chuyển chi tiết:"}
                </p>
              </div>

              <div className="map-route-steps">
                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="map-route-step-item">
                    <span className="map-route-step-number" style={{ "--route-color": activeRoute.color } as React.CSSProperties}>
                      {idx + 1}
                    </span>
                    <p className="map-route-step-text">
                      {language === "km" && step.km ? step.km : language === "en" ? step.en : step.vi}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="map-sheet-placeholder">
              <Compass size={13} className="map-sheet-placeholder-icon" />
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
      </div>
    </Page>
  );
};

export default MapPage;
