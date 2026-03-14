import { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { useCountries } from '../hooks/useViewportEvents';

export default function CountryFilter() {
  const { filters, setFilters } = useTimelineStore();
  const { data: countries, isLoading } = useCountries();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = filters.countryIds ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchText('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading || !countries) return null;

  const selectedCountries = countries.filter(c => selectedIds.includes(c.id));
  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = (id: number) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    setFilters({ countryIds: newIds.length > 0 ? newIds : undefined });
  };

  const handleRemove = (id: number) => {
    const newIds = selectedIds.filter(i => i !== id);
    setFilters({ countryIds: newIds.length > 0 ? newIds : undefined });
  };

  const openDropdown = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="country-filter" ref={dropdownRef}>
      {selectedCountries.map(country => (
        <span
          key={country.id}
          className="country-filter__chip country-filter__chip--active"
        >
          {country.name}
          <button
            className="country-filter__remove"
            onClick={() => handleRemove(country.id)}
          >
            ×
          </button>
        </span>
      ))}

      <button className="country-filter__add-btn" onClick={openDropdown}>
        + 국가
      </button>

      {isOpen && (
        <div className="country-filter__dropdown">
          <input
            ref={inputRef}
            className="country-filter__search"
            type="text"
            placeholder="국가 검색..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="country-filter__list">
            {filteredCountries.map(country => {
              const isSelected = selectedIds.includes(country.id);
              return (
                <button
                  key={country.id}
                  className={`country-filter__option${isSelected ? ' country-filter__option--selected' : ''}`}
                  onClick={() => handleToggle(country.id)}
                >
                  <span className="country-filter__option-name">{country.name}</span>
                  <span className="country-filter__option-code">{country.code}</span>
                  {isSelected && <span className="country-filter__check">✓</span>}
                </button>
              );
            })}
            {filteredCountries.length === 0 && (
              <div className="country-filter__empty">검색 결과 없음</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
