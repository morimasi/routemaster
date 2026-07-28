import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, MapPin, Navigation, Utensils, Hotel, ShoppingBag, HeartPulse, Fuel, Car } from 'lucide-react';
import { PlacesService } from './PlacesService';
import type { AutocompletePrediction, PlaceResultExtended, PlaceType } from './types';
import { PLACE_TYPE_LABELS } from './types';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: PlaceResultExtended) => void;
  onClear?: () => void;
  placeholder?: string;
  types?: string[];
  componentRestrictions?: google.maps.places.ComponentRestrictions;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  showIcon?: boolean;
  debounceMs?: number;
  minChars?: number;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  onClear,
  placeholder = 'Yer, adres veya işletme ara...',
  types = ['establishment', 'geocode'],
  componentRestrictions = { country: 'tr' },
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  showIcon = true,
  debounceMs = 300,
  minChars = 2,
}) => {
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (inputValue: string) => {
    if (!window.google?.maps?.places) {
      setPredictions([]);
      return;
    }

    if (inputValue.length < minChars) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await PlacesService.getPlacePredictions(
        { input: inputValue },
        { types, componentRestrictions }
      );
      setPredictions(results);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, [types, componentRestrictions, minChars]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchPredictions, debounceMs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, predictions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handleSelectPrediction(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectPrediction = async (prediction: AutocompletePrediction) => {
    if (!prediction.place_id) return;

    try {
      setIsLoading(true);
      const place = await PlacesService.getPlaceDetails({
        placeId: prediction.place_id,
        fields: [
          'place_id', 'name', 'formatted_address', 'geometry', 'types',
          'rating', 'user_ratings_total', 'photos', 'opening_hours',
          'website', 'formatted_phone_number', 'international_phone_number',
          'price_level', 'reviews'
        ],
      });
      onSelect?.(place as PlaceResultExtended);
      onChange(prediction.description || '');
      setIsOpen(false);
      setSelectedIndex(-1);
      PlacesService.newSession();
    } catch (error) {
      console.error('Place details error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    if (predictions.length > 0) setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    setPredictions([]);
    setIsOpen(false);
  };

  const getTypeIcon = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('cafe') || types.includes('food')) return <Utensils className="w-4 h-4 text-amber-500" />;
    if (types.includes('lodging') || types.includes('hotel')) return <Hotel className="w-4 h-4 text-blue-500" />;
    if (types.includes('shopping_mall') || types.includes('store')) return <ShoppingBag className="w-4 h-4 text-purple-500" />;
    if (types.includes('hospital') || types.includes('pharmacy') || types.includes('doctor')) return <HeartPulse className="w-4 h-4 text-red-500" />;
    if (types.includes('gas_station') || types.includes('parking')) return <Fuel className="w-4 h-4 text-green-500" />;
    if (types.includes('transit_station') || types.includes('bus_station') || types.includes('train_station')) return <Car className="w-4 h-4 text-indigo-500" />;
    return <MapPin className="w-4 h-4 text-slate-500" />;
  };

  const getTypeLabel = (types: string[]) => {
    for (const type of types) {
      if (PLACE_TYPE_LABELS[type as PlaceType]) {
        return PLACE_TYPE_LABELS[type as PlaceType];
      }
    }
    return types[0] || 'Yer';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {showIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full pl-${showIcon ? '10' : '4'} pr-${value || isLoading ? '10' : '4'} py-2.5
            bg-slate-900/50 border border-slate-700/50 rounded-xl
            text-white placeholder-slate-500
            focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            transition-all
            ${inputClassName}
          `}
          autoComplete="off"
          spellCheck={false}
        />
        {(value || isLoading) && (
          <button
            onClick={isLoading ? undefined : handleClear}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Temizle"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 w-full mt-1.5
            bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-xl
            shadow-2xl overflow-hidden
            ${dropdownClassName}
          `}
          role="listbox"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id || index}
              onClick={() => handleSelectPrediction(prediction)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full px-4 py-3 text-left transition-all
                ${index === selectedIndex ? 'bg-blue-600/15' : 'hover:bg-slate-800/50'}
                flex items-start gap-3
              `}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex-shrink-0 mt-0.5 text-slate-400">
                {getTypeIcon(prediction.types || [])}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-slate-200'}`}>
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </p>
                  <span className="px-2 py-0.5 text-[9px] font-medium bg-slate-800 text-slate-400 rounded-full whitespace-nowrap">
                    {getTypeLabel(prediction.types || [])}
                  </span>
                </div>
                {prediction.structured_formatting?.secondary_text && (
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                )}
                {prediction.distance_meters && (
                  <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {(prediction.distance_meters / 1000).toFixed(1)} km
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && predictions.length === 0 && value.length >= minChars && !isLoading && (
        <div className="absolute z-50 w-full mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-xl shadow-2xl p-4 text-center">
          <MapPin className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Sonuç bulunamadı</p>
          <p className="text-slate-600 text-xs mt-1">Farklı bir arama terimi deneyin</p>
        </div>
      )}
    </div>
  );
};