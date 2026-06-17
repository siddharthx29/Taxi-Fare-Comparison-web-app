import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Locate, ArrowUpDown, Search, Loader2 } from 'lucide-react';

interface LocationInfo {
  label: string;
  lat: number;
  lng: number;
}

interface SearchPanelProps {
  onSearch: (source: LocationInfo, destination: LocationInfo) => void;
  loading: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, loading }) => {
  const [sourceInput, setSourceInput] = useState('');
  const [destInput, setDestInput] = useState('');
  
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);

  const [selectedSource, setSelectedSource] = useState<LocationInfo | null>(null);
  const [selectedDest, setSelectedDest] = useState<LocationInfo | null>(null);

  const [geolocating, setGeolocating] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  // Suggestion overlay toggles
  const [showSourceOverlay, setShowSourceOverlay] = useState(false);
  const [showDestOverlay, setShowDestOverlay] = useState(false);

  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Close overlays on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceOverlay(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestOverlay(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions helper
  const fetchSuggestions = async (val: string, setSuggests: (arr: any[]) => void, setLoading: (b: boolean) => void) => {
    if (val.trim().length < 3) {
      setSuggests([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/geocode?q=${encodeURIComponent(val)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggests(data);
      }
    } catch (err) {
      console.error('Failed fetching address recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced input fetch suggestions
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // Only query if input is not matching selected source
      if (sourceInput && (!selectedSource || sourceInput !== selectedSource.label)) {
        fetchSuggestions(sourceInput, setSourceSuggestions, setSourceLoading);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [sourceInput, selectedSource]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // Only query if input is not matching selected dest
      if (destInput && (!selectedDest || destInput !== selectedDest.label)) {
        fetchSuggestions(destInput, setDestSuggestions, setDestLoading);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [destInput, selectedDest]);

  // Geolocation trigger
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode to get human address
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'RideCompare-App/1.0.0 (contact@ridecompare.com)'
            }
          });
          
          let addressLabel = 'Current Location';
          if (response.ok) {
            const data = await response.json();
            addressLabel = data.display_name || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          }

          const locationData = {
            label: addressLabel,
            lat: latitude,
            lng: longitude
          };

          setSelectedSource(locationData);
          setSourceInput(addressLabel);
          setShowSourceOverlay(false);
        } catch (err) {
          console.error('Error reverse geocoding geolocation:', err);
          // Fallback
          const fallback = {
            label: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            lat: latitude,
            lng: longitude
          };
          setSelectedSource(fallback);
          setSourceInput(fallback.label);
        } finally {
          setGeolocating(false);
        }
      },
      (error) => {
        console.error('Geolocation permission error:', error);
        alert('Could not retrieve your location. Please check your location sharing permissions.');
        setGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSwap = () => {
    const tempInput = sourceInput;
    const tempSelected = selectedSource;

    setSourceInput(destInput);
    setSelectedSource(selectedDest);

    setDestInput(tempInput);
    setSelectedDest(tempSelected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSource && selectedDest) {
      onSearch(selectedSource, selectedDest);
    } else {
      alert('Please select valid locations from the suggestion list for both source and destination.');
    }
  };

  return (
    <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-2xl shadow-md transition-all duration-300">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Address Input */}
        <div className="relative" ref={sourceRef}>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
            Pickup Location
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-indigo-500">
              {sourceLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={18} />}
            </span>
            <input
              type="text"
              value={sourceInput}
              onChange={(e) => {
                setSourceInput(e.target.value);
                setShowSourceOverlay(true);
              }}
              onFocus={() => setShowSourceOverlay(true)}
              placeholder="Search pickup city, building or station..."
              className="w-full pl-10 pr-12 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-500 font-medium transition-all"
              required
            />
            {/* Geolocation Button */}
            <button
              type="button"
              onClick={handleCurrentLocation}
              disabled={geolocating}
              className="absolute right-3 p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              title="Detect Current Location"
            >
              {geolocating ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Locate size={16} />}
            </button>
          </div>

          {/* Source Suggestions Dropdown */}
          {showSourceOverlay && sourceSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg divide-y divide-[var(--border-color)]">
              {sourceSuggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    setSelectedSource({
                      label: item.display_name,
                      lat: parseFloat(item.lat),
                      lng: parseFloat(item.lon)
                    });
                    setSourceInput(item.display_name);
                    setShowSourceOverlay(false);
                  }}
                  className="px-4 py-2.5 text-xs font-medium cursor-pointer hover:bg-[var(--bg-primary)] text-[var(--text-primary)] flex gap-2 items-start"
                >
                  <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                  <span>{item.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Swap Buttons */}
        <div className="flex justify-center -my-2.5 relative z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:text-indigo-500 hover:shadow-md hover:scale-105 rounded-full shadow-sm transition-all"
            title="Swap Locations"
          >
            <ArrowUpDown size={14} />
          </button>
        </div>

        {/* Destination Address Input */}
        <div className="relative" ref={destRef}>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
            Destination Location
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-indigo-500">
              {destLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={18} />}
            </span>
            <input
              type="text"
              value={destInput}
              onChange={(e) => {
                setDestInput(e.target.value);
                setShowDestOverlay(true);
              }}
              onFocus={() => setShowDestOverlay(true)}
              placeholder="Search destination city, building or station..."
              className="w-full pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-500 font-medium transition-all"
              required
            />
          </div>

          {/* Destination Suggestions Dropdown */}
          {showDestOverlay && destSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-lg divide-y divide-[var(--border-color)]">
              {destSuggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    setSelectedDest({
                      label: item.display_name,
                      lat: parseFloat(item.lat),
                      lng: parseFloat(item.lon)
                    });
                    setDestInput(item.display_name);
                    setShowDestOverlay(false);
                  }}
                  className="px-4 py-2.5 text-xs font-medium cursor-pointer hover:bg-[var(--bg-primary)] text-[var(--text-primary)] flex gap-2 items-start"
                >
                  <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                  <span>{item.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Compare Button */}
        <button
          type="submit"
          disabled={loading || !selectedSource || !selectedDest}
          className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Optimizing Routes...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>Compare Rides</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
