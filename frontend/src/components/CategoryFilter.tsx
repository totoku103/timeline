import { useState, useRef, useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { useCategories } from '../hooks/useViewportEvents';
import { CATEGORY_COLORS } from '../engine/scale/precisionMapping';

function hexColorToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export default function CategoryFilter() {
  const { filters, setFilters } = useTimelineStore();
  const { data: categories, isLoading } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = filters.categoryIds ?? [];

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

  if (isLoading || !categories) return null;

  const selectedCategories = categories.filter(c => selectedIds.includes(c.id));
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = (id: number) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    setFilters({ categoryIds: newIds.length > 0 ? newIds : undefined });
  };

  const handleRemove = (id: number) => {
    const newIds = selectedIds.filter(i => i !== id);
    setFilters({ categoryIds: newIds.length > 0 ? newIds : undefined });
  };

  const openDropdown = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="category-filter" ref={dropdownRef}>
      {selectedCategories.map(cat => {
        const color = hexColorToCSS(CATEGORY_COLORS[cat.id] ?? 0x95a5a6);
        return (
          <span
            key={cat.id}
            className="category-filter__chip category-filter__chip--active"
            style={{ '--chip-color': color } as React.CSSProperties}
          >
            <span className="category-filter__dot" style={{ background: color }} />
            {cat.name}
            <button
              className="category-filter__remove"
              onClick={() => handleRemove(cat.id)}
            >
              ×
            </button>
          </span>
        );
      })}

      <button className="category-filter__add-btn" onClick={openDropdown}>
        + 태그
      </button>

      {isOpen && (
        <div className="category-filter__dropdown">
          <input
            ref={inputRef}
            className="category-filter__search"
            type="text"
            placeholder="태그 검색..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="category-filter__list">
            {filteredCategories.map(cat => {
              const color = hexColorToCSS(CATEGORY_COLORS[cat.id] ?? 0x95a5a6);
              const isSelected = selectedIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  className={`category-filter__option${isSelected ? ' category-filter__option--selected' : ''}`}
                  onClick={() => handleToggle(cat.id)}
                >
                  <span className="category-filter__dot" style={{ background: color }} />
                  <span className="category-filter__option-name">{cat.name}</span>
                  {isSelected && <span className="category-filter__check">✓</span>}
                </button>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="category-filter__empty">검색 결과 없음</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
