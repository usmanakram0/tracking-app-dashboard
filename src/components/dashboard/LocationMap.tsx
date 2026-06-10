'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LocationLog } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const latestIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapBounds({ locations }: { locations: LocationLog[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(
      locations.map((l) => [l.latitude, l.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [locations, map]);

  return null;
}

type LocationMapProps = {
  locations: LocationLog[];
  highlightLat?: number | null;
  highlightLng?: number | null;
};

export function LocationMap({
  locations,
  highlightLat,
  highlightLng,
}: LocationMapProps) {
  const sorted = useMemo(
    () =>
      [...locations].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      ),
    [locations]
  );

  const trail = sorted.map((l) => [l.latitude, l.longitude] as [number, number]);

  const center: [number, number] =
    highlightLat && highlightLng
      ? [highlightLat, highlightLng]
      : sorted.length > 0
        ? [sorted[sorted.length - 1].latitude, sorted[sorted.length - 1].longitude]
        : [24.8607, 67.0011];

  if (locations.length === 0 && !highlightLat) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/50 sm:h-[420px]">
        <p className="text-sm font-medium text-slate-400">No location history yet</p>
        <p className="mt-1 text-xs text-slate-600">GPS points appear after the child app reports location</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 ring-1 ring-slate-800/50">
      <MapContainer
        center={center}
        zoom={13}
        className="h-[360px] w-full z-0 sm:h-[420px]"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds locations={sorted} />
        {trail.length > 1 && (
          <Polyline positions={trail} color="#34d399" weight={3} opacity={0.75} />
        )}
        {sorted.map((loc, index) => {
          const isLatest = index === sorted.length - 1;
          return (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              icon={isLatest ? latestIcon : defaultIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{isLatest ? 'Latest' : `Point ${index + 1}`}</p>
                  <p>{formatTimestamp(loc.recorded_at)}</p>
                  {loc.accuracy && <p>Accuracy: {loc.accuracy.toFixed(0)}m</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {highlightLat && highlightLng && (
          <Marker position={[highlightLat, highlightLng]} icon={latestIcon}>
            <Popup>Live GPS Response</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
