import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMapEvents,
  useMap,
  Popup,
} from 'react-leaflet'
import { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { haversine } from '../../game/distance'
function MapClick({
  onChange,
  disabled,
}: {
  onChange: (p: [number, number]) => void
  disabled: boolean
}) {
  useMapEvents({
    click: (e) => {
      if (!disabled) onChange([e.latlng.lat, ((((e.latlng.lng + 180) % 360) + 360) % 360) - 180])
    },
  })
  return null
}
function FitResult({
  value,
  correct,
  disabled,
}: {
  value: [number, number] | null
  correct: [number, number]
  disabled: boolean
}) {
  const map = useMap()
  useEffect(() => {
    if (disabled && value)
      map.fitBounds([value, correct], { padding: [35, 35], maxZoom: 12, animate: false })
  }, [map, value, correct, disabled])
  return null
}
export function WhereChallenge({
  value,
  correct,
  scope,
  disabled,
  onChange,
}: {
  value: [number, number] | null
  correct: [number, number]
  scope: string
  disabled: boolean
  onChange: (p: [number, number]) => void
}) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [tileError, setTileError] = useState(false)
  const valid =
    lat.trim() !== '' &&
    lng.trim() !== '' &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lng)) <= 180
  return (
    <>
      <p className="mechanic-help">Click the map to drop your pin. Zoom in to get closer.</p>
      <div className="map-wrap">
        <MapContainer
          center={scope === 'philippines' ? [12.5, 122] : [25, 15]}
          zoom={scope === 'philippines' ? 5 : 2}
          minZoom={2}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
          <MapClick onChange={onChange} disabled={disabled} />
          <FitResult value={value} correct={correct} disabled={disabled} />
          {value && (
            <CircleMarker
              center={value}
              radius={9}
              pathOptions={{ color: '#a77b38', fillOpacity: 0.8 }}
            >
              <Popup>Your guess</Popup>
            </CircleMarker>
          )}
          {disabled && (
            <>
              <CircleMarker
                center={correct}
                radius={9}
                pathOptions={{ color: '#3d7059', fillOpacity: 0.8 }}
              >
                <Popup>Correct location</Popup>
              </CircleMarker>
              {value && (
                <Polyline
                  positions={[value, correct]}
                  pathOptions={{ color: '#3d7059', dashArray: '5 8' }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>
      {tileError && (
        <p role="status" className="small-note">
          Map tiles could not load. Check your connection or enter coordinates below.
        </p>
      )}
      <details className="coordinate-input">
        <summary>Keyboard alternative: enter coordinates</summary>
        <div>
          <label>
            Latitude
            <input
              type="number"
              min="-90"
              max="90"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              disabled={disabled}
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              min="-180"
              max="180"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              disabled={disabled}
            />
          </label>
          <button
            className="button secondary"
            disabled={!valid || disabled}
            onClick={() => onChange([Number(lat), Number(lng)])}
          >
            Place pin
          </button>
        </div>
      </details>
      {value && (
        <p className="small-note">
          Your pin: {value[0].toFixed(3)}°, {value[1].toFixed(3)}°{' '}
          {disabled &&
            ` · ${Math.round(haversine(value, correct)).toLocaleString()} km from the target`}
        </p>
      )}
    </>
  )
}
