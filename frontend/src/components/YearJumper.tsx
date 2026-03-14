import { useState, useRef, useCallback } from 'react';
import type { ViewportManager } from '../engine/scale/ViewportManager';

/**
 * YearJumper
 *
 * 연도를 직접 입력해 해당 시점으로 타임라인을 이동하는 컴포넌트.
 * - 양수: AD 연도  (예: 1969)
 * - 음수: BC 연도  (예: -3000 → 기원전 3000년)
 * - 약어: "13.8B", "100M", "10K" 등 지원
 */

interface YearJumperProps {
  viewportManagerRef: React.RefObject<ViewportManager | null>;
  onJump?: (year: number, label: string) => void;
}

function parseYearInput(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '');
  if (!s) return null;

  // 약어 처리: 13.8B, 500M, 10K (대소문자 무관, BCE/BC/AD 접두/접미 처리)
  const isBce = /bce?$/i.test(s) || s.startsWith('-');
  const cleaned = s.replace(/bce?|ad|ce/gi, '').trim();
  const match = cleaned.match(/^(-?\d+\.?\d*)\s*([bBmMkK]?)$/);
  if (!match) return null;

  let value = parseFloat(match[1]);
  const suffix = match[2].toLowerCase();
  if (suffix === 'b') value *= 1_000_000_000;
  else if (suffix === 'm') value *= 1_000_000;
  else if (suffix === 'k') value *= 1_000;

  // BCE이면 음수로
  if (isBce && value > 0) value = -value;

  if (isNaN(value)) return null;
  return value;
}

function formatYearLabel(year: number): string {
  const abs = Math.abs(year);
  const suffix = year < 0 ? ' BCE' : '';
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B${suffix}`;
  if (abs >= 1_000_000)     return `${(abs / 1_000_000).toFixed(1).replace(/\.?0+$/, '')}M${suffix}`;
  if (abs >= 10_000)        return `${Math.round(abs / 1000)}K${suffix}`;
  return `${abs}${suffix}`;
}

export default function YearJumper({ viewportManagerRef, onJump }: YearJumperProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const year = parseYearInput(value);
    if (year === null) {
      setError(true);
      inputRef.current?.focus();
      return;
    }
    setError(false);
    const vm = viewportManagerRef.current;
    if (vm) {
      vm.jumpToYear(year);
      onJump?.(year, formatYearLabel(year));
    }
    setValue('');
    setOpen(false);
  }, [value, viewportManagerRef, onJump]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setValue('');
      setError(false);
    }
  }, []);

  if (!open) {
    return (
      <button
        className="year-jumper__trigger"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        aria-label="연도 직접 입력하여 이동"
        title="연도로 이동 (예: 1969, -3000, 13.8B BCE)"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="8" y1="4" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
        </svg>
        <span>이동</span>
      </button>
    );
  }

  return (
    <form
      className="year-jumper__form"
      onSubmit={handleSubmit}
      role="search"
      aria-label="연도 이동"
    >
      <label htmlFor="year-jumper-input" className="year-jumper__label">
        연도
      </label>
      <input
        ref={inputRef}
        id="year-jumper-input"
        className={`year-jumper__input${error ? ' year-jumper__input--error' : ''}`}
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(false); }}
        onKeyDown={handleKeyDown}
        placeholder="예: 1969, -3000, 13.8B"
        aria-invalid={error}
        aria-describedby={error ? 'year-jumper-error' : 'year-jumper-hint'}
        autoComplete="off"
        spellCheck={false}
      />
      {error && (
        <span id="year-jumper-error" className="year-jumper__error" role="alert">
          올바른 연도를 입력하세요
        </span>
      )}
      {!error && (
        <span id="year-jumper-hint" className="year-jumper__hint">
          음수 = BCE, B/M/K 약어 사용 가능
        </span>
      )}
      <div className="year-jumper__actions">
        <button type="submit" className="year-jumper__go">이동</button>
        <button
          type="button"
          className="year-jumper__cancel"
          onClick={() => { setOpen(false); setValue(''); setError(false); }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
