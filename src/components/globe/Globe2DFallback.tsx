import { useMemo, useRef, useState } from "react";
import { geoEquirectangular, geoPath, geoCircle } from "d3-geo";
import { getSubsolarPoint } from "../../lib/time/solar";
import { findBoundaryAtPoint } from "../../lib/geo/pointInCountry";
import type { BoundaryCollection } from "../../lib/geo/load";

interface Globe2DFallbackProps {
  boundaries: BoundaryCollection;
  marker: { lat: number; lon: number; label?: string } | null;
  selectedCountryCode: string | null;
  referenceInstant: number;
  onSelectCountry: (feature: { code: string | null; name: string } | null) => void;
}

const WIDTH = 960;
const HEIGHT = 500;

/** A flat, 2D equirectangular map shown when WebGL isn't available — every time/search/
 *  comparison feature works identically; only the globe's drag-to-rotate interaction is
 *  replaced with a static, clickable world map. */
export default function Globe2DFallback({
  boundaries,
  marker,
  selectedCountryCode,
  referenceInstant,
  onSelectCountry,
}: Globe2DFallbackProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const projection = useMemo(
    () =>
      geoEquirectangular()
        .scale(WIDTH / (2 * Math.PI))
        .translate([WIDTH / 2, HEIGHT / 2]),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const nightPath = useMemo(() => {
    const sun = getSubsolarPoint(referenceInstant);
    const antiSolar: [number, number] = [sun.lon > 0 ? sun.lon - 180 : sun.lon + 180, -sun.lat];
    const nightCircle = geoCircle().center(antiSolar).radius(90).precision(2)();
    return path(nightCircle) ?? "";
  }, [referenceInstant, path]);

  const markerPoint = marker ? projection([marker.lon, marker.lat]) : null;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
    const lonLat = projection.invert?.([x, y]);
    if (!lonLat) return;
    const feature = findBoundaryAtPoint(boundaries, lonLat[0], lonLat[1]);
    onSelectCountry(feature ? { code: feature.properties.code, name: feature.properties.name } : null);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="A flat world map. Select a country to see its time zone information."
      className="h-full w-full cursor-pointer"
      onClick={handleClick}
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0a0f1d" />
      {boundaries.features.map((feature, i) => {
        const code = feature.properties.code;
        const isSelected = code && code === selectedCountryCode;
        const isHovered = code && code === hoveredCode;
        return (
          <path
            key={i}
            d={path(feature) ?? undefined}
            fill={isSelected ? "#2f99a1" : isHovered ? "#1a2740" : "#111a2d"}
            stroke={isSelected ? "#e8b35e" : "#3a4a66"}
            strokeWidth={isSelected ? 1.5 : 0.5}
            onMouseEnter={() => setHoveredCode(code)}
            onMouseLeave={() => setHoveredCode((c) => (c === code ? null : c))}
          />
        );
      })}
      <path d={nightPath} fill="#060a13" opacity={0.45} pointerEvents="none" />
      {markerPoint && (
        <circle
          cx={markerPoint[0]}
          cy={markerPoint[1]}
          r={5}
          fill="#e8b35e"
          stroke="#060a13"
          strokeWidth={1.5}
          pointerEvents="none"
        />
      )}
      {markerPoint && marker?.label && <text x={Math.max(8, Math.min(WIDTH - 190, markerPoint[0] + 12))} y={Math.max(24, markerPoint[1] - 10)} fill="#f1ece0" stroke="#0a0f1d" strokeWidth={4} paintOrder="stroke" fontSize={16} fontFamily="sans-serif" pointerEvents="none">{marker.label}</text>}
    </svg>
  );
}
