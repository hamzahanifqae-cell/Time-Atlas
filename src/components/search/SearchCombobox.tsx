import { cityLocationHints } from "../../lib/geo/display";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useGeoData } from "../../lib/hooks/useGeoData";
import { search, type SearchResult } from "../../lib/search/index";
import { selectCity, selectCountry } from "../../stores/location";

interface SearchComboboxProps {
  placeholder?: string;
  /** Called after a selection is made, so callers can e.g. scroll to the result. */
  onSelect?: (result: SearchResult) => void;
}

function resultLabel(result: SearchResult): string {
  if (result.kind === "city") {
    const { city } = result;
    const region = city.admin1 ? `${city.admin1}, ` : "";
    return `${city.name}, ${region}${city.country}`;
  }
  return `${result.country.name} (country)`;
}

export default function SearchCombobox({ placeholder, onSelect }: SearchComboboxProps) {
  const geo = useGeoData(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const locationHints = useMemo(() => cityLocationHints(geo.cities), [geo.cities]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const results = useMemo(() => {
    if (geo.status !== "ready" || query.trim().length === 0) return [];
    return search(query, 8);
  }, [geo.status, query]);

  useEffect(() => {
    setActiveIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length === 0) {
      setAnnouncement("");
    } else if (geo.status === "loading") {
      setAnnouncement("Loading locations…");
    } else if (results.length === 0) {
      setAnnouncement(`No matches for "${query}".`);
    } else {
      setAnnouncement(`${results.length} result${results.length === 1 ? "" : "s"} available.`);
    }
  }, [results, query, open, geo.status]);

  function handleFocus() {
    setOpen(true);
    geo.trigger();
  }

  function commitSelection(result: SearchResult) {
    if (result.kind === "city") {
      selectCity(result.city.id);
      setQuery(`${result.city.name}, ${result.city.country}`);
    } else {
      selectCountry(result.country.code);
      setQuery(result.country.name);
    }
    setOpen(false);
    setActiveIndex(-1);
    onSelect?.(result);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => (results.length === 0 ? -1 : Math.min(i + 1, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? -1 : Math.max(i - 1, 0)));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        commitSelection(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  }

  const listboxId = `${baseId}-listbox`;
  const activeOptionId = activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;
  const showListbox = open && query.trim().length > 0;

  return (
    <div className="relative w-full">
      <label htmlFor={`${baseId}-input`} className="sr-only">
        Search for a city or country
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper-600"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={`${baseId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showListbox}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder ?? "Search for a city or country…"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay so a click on an option (which fires blur first) still registers.
            window.setTimeout(() => setOpen(false), 120);
          }}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 py-3 pl-10 pr-4 text-base text-paper-100 placeholder:text-paper-600 focus-visible:border-cyan-500"
        />
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {showListbox && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-navy-600 bg-navy-800 py-1 shadow-xl"
        >
          {geo.status === "loading" && (
            <li className="px-4 py-3 text-sm text-paper-400" aria-hidden="true">
              Loading the location index…
            </li>
          )}
          {geo.status === "error" && (
            <li className="px-4 py-3 text-sm text-danger-400" aria-hidden="true">
              Couldn't load location data. Check your connection and try again.
            </li>
          )}
          {geo.status === "ready" && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-paper-400" aria-hidden="true">
              No matches for "{query}". Try a different spelling, or search a country name.
            </li>
          )}
          {geo.status === "ready" &&
            results.map((result, i) => (
              <li
                key={result.kind === "city" ? `city-${result.city.id}` : `country-${result.country.code}`}
                id={`${baseId}-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSelection(result);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`search-result-option cursor-pointer px-4 py-2.5 text-sm ${
                  i === activeIndex ? "bg-navy-700 text-paper-100" : "text-paper-200"
                }`}
              >
                <span className="search-result-name">{resultLabel(result)}{result.kind === "city" && locationHints.has(result.city.id) && <span className="block text-xs text-paper-600">{locationHints.get(result.city.id)}</span>}</span>
                {result.kind === "city" && (
                  <span className="shrink-0 text-xs text-paper-600 tabular">{result.city.tz}</span>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
