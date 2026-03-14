import { useState, useEffect, useCallback } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useTimelineStore();
  const [localValue, setLocalValue] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, setSearchQuery]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <div className="search-bar">
      <div className="search-bar__icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <input
        className="search-bar__input"
        type="text"
        placeholder="이벤트 검색..."
        value={localValue}
        onChange={handleChange}
        aria-label="이벤트 검색"
      />
      {localValue && (
        <button className="search-bar__clear" onClick={handleClear} aria-label="검색어 지우기">
          ✕
        </button>
      )}
    </div>
  );
}
