import { useTimelineStore } from '../store/useTimelineStore';
import { useCategories } from '../hooks/useViewportEvents';
import { CATEGORY_COLORS } from '../engine/scale/precisionMapping';

function hexColorToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export default function CategoryFilter() {
  const { filters, setFilters } = useTimelineStore();
  const { data: categories, isLoading } = useCategories();

  if (isLoading || !categories || categories.length === 0) return null;

  const selectedId = filters.categoryId;

  const handleToggle = (id: number) => {
    if (selectedId === id) {
      setFilters({ categoryId: undefined });
    } else {
      setFilters({ categoryId: id });
    }
  };

  return (
    <div className="category-filter">
      {categories.map((cat) => {
        const color = hexColorToCSS(CATEGORY_COLORS[cat.id] ?? 0x95a5a6);
        const isSelected = selectedId === cat.id;
        return (
          <button
            key={cat.id}
            className={`category-filter__chip${isSelected ? ' category-filter__chip--active' : ''}`}
            style={
              {
                '--chip-color': color,
              } as React.CSSProperties
            }
            onClick={() => handleToggle(cat.id)}
            title={cat.description}
          >
            <span
              className="category-filter__dot"
              style={{ background: color }}
            />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
