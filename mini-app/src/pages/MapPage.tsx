import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { MapPin, Compass, Navigation, Info, Volume2 } from "lucide-react";
import { getLocation } from "zmp-sdk/apis";
import api, { TouristPlace, hasAudioGuide, Itinerary } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

// Predefined GPS markers matching coordinate database
interface MapMarker {
  slug: string;
  name: string;
  name_en: string;
  lat: number;
  lng: number;
  category: "tam_linh" | "phong_canh" | "dich_vu";
}

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const activeRoute = itineraries.find(r => r.id === activeRouteId);

  // Leaflet Dynamic Loading state
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // GPS States
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Map DOM reference and Leaflet Instance reference
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const gpsMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const markersRef = useRef<{ [slug: string]: any }>({});
  const clusterGroupRef = useRef<any>(null);

  // 1. Dynamic CDN Loading of Leaflet.js and Leaflet.markercluster
  useEffect(() => {
    const L = (window as any).L;
    if (L && L.markerClusterGroup) {
      setLeafletLoaded(true);
      return () => {};
    }

    // Append Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Append Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.onload = () => {
      // Append MarkerCluster CSS
      const clusterLink = document.createElement("link");
      clusterLink.rel = "stylesheet";
      clusterLink.href = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css";
      document.head.appendChild(clusterLink);

      const clusterDefaultLink = document.createElement("link");
      clusterDefaultLink.rel = "stylesheet";
      clusterDefaultLink.href = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css";
      document.head.appendChild(clusterDefaultLink);

      // Append MarkerCluster JS
      const clusterScript = document.createElement("script");
      clusterScript.src = "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js";
      clusterScript.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(clusterScript);
    };
    document.body.appendChild(script);

    return () => {};
  }, []);

  // 2. Fetch place details and itineraries from Supabase to bind with map interactions
  useEffect(() => {
    api.getPlaces().then((data) => {
      setPlaces(data);
    }).catch((err) => {
      console.error("Load map places failed", err);
    });

    api.getItineraries().then((data) => {
      setItineraries(data);
    }).catch((err) => {
      console.error("Load map itineraries failed", err);
    });
  }, []);

  // 3. Initialize Leaflet Map once DOM is ready and Leaflet JS is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapDivRef.current || mapInstanceRef.current) return () => {};

    const L = (window as any).L;
    if (!L) return () => {};

    // Center exact geographic target: Mount Ba Den (11.378345, 106.168924)
    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: false,
      tap: false // CRITICAL: Fixes click/tap unresponsiveness on mobile/WebViews!
    }).setView([11.378345, 106.168924], 15);

    mapInstanceRef.current = map;

    // Load modern CartoDB Voyager tiles for a clean, vibrant tourism experience
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      minZoom: 13,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.basemaps.cartocdn.com/">CARTO</a>'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // 3.5 Plot and update markers dynamically from Supabase database places with clustering
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || places.length === 0) return;

    // Remove existing cluster group and markers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current = {};

    // Create marker cluster group
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      disableClusteringAtZoom: 17
    });
    clusterGroupRef.current = clusterGroup;

    // Custom pulsing marker icons
    const createCustomIcon = (isSelected: boolean, color: string) => {
      return L.divIcon({
        className: "custom-div-icon",
        html: `<div style="
          width: ${isSelected ? "18px" : "14px"};
          height: ${isSelected ? "18px" : "14px"};
          background-color: ${color};
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px ${color};
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform: translate(-2px, -2px);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
    };

    // Plot markers dynamically from Supabase database
    places.forEach((place) => {
      const leafletMarker = L.marker([place.latitude, place.longitude], {
        icon: createCustomIcon(false, "var(--accent-gold)"),
        interactive: true
      });

      // Label Tooltip (native premium display)
      const label = language === "en" ? (place.name_en || place.name) : place.name;
      leafletMarker.bindTooltip(label, {
        permanent: true,
        direction: "top",
        offset: [0, -10],
        className: "leaflet-premium-tooltip"
      });

      // Selection logic on marker click
      leafletMarker.on("click", (e: any) => {
        if (e.originalEvent) e.originalEvent.stopPropagation();
        handleMarkerTap({
          slug: place.slug,
          name: place.name,
          name_en: place.name_en || place.name,
          lat: place.latitude,
          lng: place.longitude,
          category: (place.category || "tam_linh") as any
        });
      });

      clusterGroup.addLayer(leafletMarker);
      markersRef.current[place.slug] = leafletMarker;
    });

    // Bulletproof click event listener at the Cluster Group container level
    clusterGroup.on("click", (event: any) => {
      const leafletMarker = event.layer;
      if (!leafletMarker || typeof leafletMarker.getChildCount === "function") return; // Skip if it's a cluster icon click!
      
      const latlng = leafletMarker.getLatLng();
      if (!latlng) return;

      // Use a tiny float epsilon margin to match markers safely
      const matchedPlace = places.find(p => 
        Math.abs(p.latitude - latlng.lat) < 0.00001 && 
        Math.abs(p.longitude - latlng.lng) < 0.00001
      );
      
      if (matchedPlace) {
        handleMarkerTap({
          slug: matchedPlace.slug,
          name: matchedPlace.name,
          name_en: matchedPlace.name_en || matchedPlace.name,
          lat: matchedPlace.latitude,
          lng: matchedPlace.longitude,
          category: (matchedPlace.category || "tam_linh") as any
        });
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
  }, [leafletLoaded, places, language]);

  // Clean active route polyline on route id change
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear existing polyline
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (activeRouteId) {
      const route = itineraries.find(r => r.id === activeRouteId);
      if (route) {
        // Resolve coordinates dynamically from Supabase database places state!
        const resolvedPath: [number, number][] = [];
        const slugs = route.place_slugs || [];
        slugs.forEach((slug) => {
          const matched = places.find(p => p.slug === slug);
          if (matched) {
            resolvedPath.push([matched.latitude, matched.longitude]);
          }
        });

        if (resolvedPath.length > 0) {
          // Draw the path polyline
          const polyline = L.polyline(resolvedPath, {
            color: route.color,
            weight: 4,
            dashArray: "10, 8",
            opacity: 0.95
          }).addTo(map);

          routePolylineRef.current = polyline;

          // Auto zoom and pan to fit entire route perfectly
          map.fitBounds(polyline.getBounds(), {
            padding: [40, 40],
            maxZoom: 16
          });
        }
      }
    }
  }, [activeRouteId, places]);

  // Draw or update GPS Marker on coordinates change
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
        html: `<div style="
          position: relative;
          width: 20px;
          height: 20px;
        ">
          <!-- Pulse wave ring -->
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
          <!-- Solid core -->
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

  // 4. Unified Marker Icon Controller (Pulsing sequence numbers & highlights)
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const activeItinerary = itineraries.find(r => r.id === activeRouteId);

    Object.keys(markersRef.current).forEach((slug) => {
      const marker = places.find(p => p.slug === slug);
      const leafletMarker = markersRef.current[slug];
      if (!marker || !leafletMarker) return;

      const isSelected = selectedPlace?.slug === slug;
      
      // Determine if this marker belongs to the active itinerary path
      let routeIndex = -1;
      if (activeItinerary) {
        const slugs = activeItinerary.place_slugs || [];
        routeIndex = slugs.indexOf(marker.slug);
      }

      // Base Styling tokens
      let bgColor = "var(--accent-gold)";
      let borderStyle = "2.5px solid #ffffff";
      let scaleClass = isSelected ? "scale(1.25)" : "scale(1)";
      let innerHtml = "";
      let markerSize: [number, number] = [14, 14];
      let anchorSize: [number, number] = [7, 7];

      if (isSelected) {
        bgColor = "#f97316"; // Beautiful active orange highlight
        borderStyle = "2.5px solid #ffffff";
        markerSize = [18, 18];
        anchorSize = [9, 9];
      } else if (routeIndex !== -1) {
        bgColor = activeItinerary?.color || "var(--accent-gold)"; // Route-specific color code
        borderStyle = "2px solid #ffffff";
        markerSize = [20, 20];
        anchorSize = [10, 10];
        // Embed the sequence index 1, 2, 3...
        innerHtml = `<span style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--primary-navy);
          font-size: 10px;
          font-weight: 900;
          font-family: Arial, sans-serif;
          line-height: 1;
        ">${routeIndex + 1}</span>`;
      }

      // Apply leaflet DivIcon changes dynamically
      leafletMarker.setIcon(
        L.divIcon({
          className: "custom-leaflet-poi-icon",
          html: `<div style="
            width: ${markerSize[0]}px;
            height: ${markerSize[1]}px;
            background-color: ${bgColor};
            border: ${borderStyle};
            border-radius: 50%;
            box-shadow: 0 0 12px ${bgColor};
            transform: ${scaleClass};
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${innerHtml}
          </div>`,
          iconSize: markerSize,
          iconAnchor: anchorSize
        })
      );
    });
  }, [activeRouteId, selectedPlace, places, leafletLoaded]);

  // Update selected marker scale icon dynamically on click
  const handleMarkerTap = (marker: MapMarker) => {
    const matchedPlace = places.find(p => p.slug === marker.slug);
    setSelectedPlace(matchedPlace ?? null);
    setSelectedMarker(marker);
    setActiveRouteId(null); // Clear active AI suggestion route to avoid UI clash

    // Pan map to marker center
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([marker.lat, marker.lng], 16, {
        animate: true,
        duration: 0.5
      });
    }
  };

  // Real Native Zalo GPS Activation
  const handleActivateGPS = async (isAutoLoad: boolean = false) => {
    setGpsLoading(true);
    try {
      const locationRes = await getLocation({});
      if (locationRes && locationRes.latitude && locationRes.longitude) {
        const latitude = Number(locationRes.latitude);
        const longitude = Number(locationRes.longitude);

        setGpsLocation({ lat: latitude, lng: longitude });

        const isRemote = latitude < 11.35 || latitude > 11.41 || longitude < 106.12 || longitude > 106.21;

        // Pan map target center ONLY if they are not remote OR if it's an explicit manual click
        if (mapInstanceRef.current && (!isRemote || !isAutoLoad)) {
          mapInstanceRef.current.setView([latitude, longitude], 16, {
            animate: true,
            duration: 0.5
          });
        }

        // Bounding check: if outside Tay Ninh mountain area and manually clicked
        if (isRemote && !isAutoLoad) {
          alert(
            language === "en"
              ? `You are exploring remotely (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Map centered on your position.`
              : `Bạn đang ở vị trí từ xa (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Bản đồ đã định vị tiêu điểm về bạn.`
          );
        }
      }
    } catch (error) {
      console.warn("Zalo GPS retrieval failed:", error);
      if (!isAutoLoad) {
        alert(
          language === "en"
            ? "GPS permission denied. Please allow Zalo to access your device location."
            : "Không lấy được quyền định vị GPS. Vui lòng cấp quyền vị trí cho Zalo trên điện thoại."
        );
      }
    } finally {
      setGpsLoading(false);
    }
  };

  // 3.7 Auto-activate native Zalo GPS on load once Leaflet is ready
  useEffect(() => {
    if (leafletLoaded && mapInstanceRef.current) {
      handleActivateGPS(true); // Pass true to silently register GPS on load
    }
  }, [leafletLoaded]);

  // Zoom controls wrappers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };
  const handleResetZoom = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([11.378345, 106.168924], 15, {
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
        height: "100vh",
        paddingTop: "calc(48px + var(--zaui-safe-area-inset-top, env(safe-area-inset-top, 0px)))",
        color: "#f4f7f6",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 0%, #17375e 0%, #06152a 100%)",
        zIndex: 97
      }}
    >
      {/* Dynamic Keyframe style blocks specifically for map pulsing beacons and dark theme overlay */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Clean, vibrant light background matching modern tourism aesthetics */
        .leaflet-container {
          background-color: #f4f8fa !important;
        }

        /* Pulsing CSS animations for location beacons */
        @keyframes gps-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        /* Premium label markers style overrides - with click-through pointer events */
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
          pointer-events: none !important; /* Critical: allows clicking marker under label! */
        }

        /* Custom Marker Cluster Styling (HSL Gold/Navy theme) */
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background-color: rgba(11, 37, 69, 0.6) !important;
          border: 1.5px solid var(--accent-gold) !important;
        }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background-color: rgba(212, 175, 55, 0.2) !important;
          color: var(--accent-gold) !important;
          font-weight: 800 !important;
        }

        /* Force pointer events on all custom leaflet marker icons and pane items */
        .custom-leaflet-poi-icon, .custom-div-icon, .leaflet-marker-icon {
          pointer-events: auto !important;
          cursor: pointer !important;
        }
      ` }} />

      {/* Premium Dark Header */}
      <Header
        title={
          <span style={{ color: "var(--accent-gold)", fontWeight: 800 }}>
            {language === "en" ? "Real Geolocation Map" : "Bản Đồ Số Thực Địa"}
          </span> as any
        }
        showBackIcon={true}
      />

      {/* Control bar */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px 16px",
        background: "rgba(11, 37, 69, 0.8)",
        borderBottom: "1px solid rgba(212, 175, 55, 0.3)",
        zIndex: 10
      }}>
        {/* GPS Control tools */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "11px", color: "#f4f7f6", opacity: 0.85 }}>
            {gpsLocation ? (
              <span style={{ color: "#22c55e", fontWeight: 700 }}>
                {language === "en" ? "GPS Live Active" : "GPS Thực Địa Đang Bật"}
              </span>
            ) : (
              language === "en" ? "GPS Target: Mount Ba Den" : "Tiêu điểm: Núi Bà Đen"
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleActivateGPS(false)}
              disabled={gpsLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "16px",
                border: "1px solid var(--accent-gold)",
                backgroundColor: gpsLocation ? "var(--accent-gold)" : "rgba(255, 255, 255, 0.08)",
                color: gpsLocation ? "var(--primary-navy)" : "var(--accent-gold)",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                minHeight: "30px"
              }}
            >
              <Navigation size={12} style={{ transform: "rotate(45deg)", strokeWidth: 3 }} />
              {gpsLoading ? (language === "en" ? "Locating..." : "Đang lấy...") : (language === "en" ? "Định Vị GPS" : "Định Vị GPS")}
            </button>
          </div>
        </div>

        {/* Curated AI routes list */}
        <div style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
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
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "14px",
                border: activeRouteId === itinerary.id ? `2px solid ${itinerary.color}` : "1px solid rgba(255, 255, 255, 0.15)",
                backgroundColor: activeRouteId === itinerary.id ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
                color: activeRouteId === itinerary.id ? itinerary.color : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Compass size={12} style={{ marginRight: "4px", display: "inline-block", verticalAlign: "middle" }} />
              {language === "en" ? (itinerary.name_en || itinerary.name) : itinerary.name} ({language === "en" ? (itinerary.duration_en || itinerary.duration) : itinerary.duration})
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Container DOM */}
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
              {language === "en" ? "Loading Leaflet Map Tiles..." : "Đang tải bản đồ số..."}
            </p>
          </div>
        )}
        
        {/* Actual map div target */}
        <div ref={mapDivRef} style={{ width: "100%", height: "100%", backgroundColor: "var(--primary-navy)" }} />

        {/* Zoom controls */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 1000 // leaflet uses z-indexes around 400
        }}>
          <button
            onClick={handleZoomIn}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(11, 37, 69, 0.85)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "18px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(11, 37, 69, 0.85)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: "18px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            -
          </button>
          <button
            onClick={handleResetZoom}
            style={{
              padding: "6px 12px",
              borderRadius: "14px",
              backgroundColor: "rgba(11, 37, 69, 0.85)",
              color: "var(--accent-gold)",
              border: "1px solid var(--accent-gold)",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            {language === "en" ? "Center" : "Thu Nhỏ"}
          </button>
        </div>
      </div>

      {/* Pop-up bottom details sheet */}
      {/* Pop-up bottom details sheet - Optimized with Zalo UI Level Specification */}
      <div style={{
        backgroundColor: "var(--primary-navy)",
        borderTop: "2.5px solid var(--accent-gold)",
        padding: (selectedPlace || activeRoute) 
          ? "10px 16px calc(16px + var(--zaui-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))) 16px" 
          : "6px 16px calc(8px + var(--zaui-safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))) 16px",
        maxHeight: (selectedPlace || activeRoute) ? "260px" : "80px",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        overflowY: "auto",
        zIndex: 1001,
        boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
        gap: (selectedPlace || activeRoute) ? "10px" : "2px"
      }}>
        {/* Zalo UI Level Spec: Bottom Sheet Drag Handle Indicator */}
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
                width={80}
                height={80}
                style={{ borderRadius: "10px", objectFit: "cover", border: "1px solid var(--accent-gold)", flexShrink: 0 }}
              />
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--accent-gold)", margin: "0 0 4px 0" }}>
                  {language === "en" && selectedPlace.name_en ? selectedPlace.name_en : selectedPlace.name}
                </h3>
                <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={10} style={{ stroke: "var(--accent-gold)" }} />
                  GPS: {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                </p>
                <p style={{
                  fontSize: "12px",
                  color: "var(--cream-white)",
                  opacity: 0.85,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.4"
                }}>
                  {language === "en" && selectedPlace.short_description_en ? selectedPlace.short_description_en : selectedPlace.short_description}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
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
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: "40px"
                }}
              >
                <Info size={14} />
                <span>{language === "en" ? "View Details" : "Lịch Sử Di Tích"}</span>
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
                    borderRadius: "10px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    minHeight: "40px"
                  }}
                >
                  <Volume2 size={14} />
                  <span>{language === "en" ? "Audio Guide" : "Phát Thuyết Minh"}</span>
                </button>
              )}
            </div>
          </div>
        ) : activeRoute ? (
          <div>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: activeRoute.color, margin: "0 0 2px 0" }}>
                {language === "en" ? (activeRoute.name_en || activeRoute.name) : activeRoute.name}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--cream-white)", opacity: 0.8, margin: 0 }}>
                {language === "en" ? "AI recommended travel steps:" : "Lộ trình đề xuất di chuyển chi tiết:"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", maxHeight: "150px" }}>
              {activeRoute.steps.map((step, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12.5px" }}>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: activeRoute.color,
                    color: "var(--primary-navy)",
                    fontSize: "10px",
                    fontWeight: 800,
                    marginTop: "2px",
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </span>
                  <p style={{ margin: 0, color: "var(--cream-white)", opacity: 0.9, lineHeight: "1.4" }}>
                    {language === "en" ? step.en : step.vi}
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
              {language === "en" 
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
