const COUNTRY_FLAGS: Record<string, string> = {
  '한국': '🇰🇷',
  '미국': '🇺🇸',
  '중국': '🇨🇳',
  '일본': '🇯🇵',
  '영국': '🇬🇧',
  '프랑스': '🇫🇷',
  '독일': '🇩🇪',
  '러시아': '🇷🇺',
  '이탈리아': '🇮🇹',
  '인도': '🇮🇳',
  '이집트': '🇪🇬',
  '그리스': '🇬🇷',
  '터키': '🇹🇷',
  '스페인': '🇪🇸',
  '글로벌': '🌍',
};

export function getCountryFlag(name: string): string | null {
  return COUNTRY_FLAGS[name] ?? null;
}

export function formatTagName(name: string): string {
  const flag = COUNTRY_FLAGS[name];
  return flag ? `${flag} ${name}` : name;
}
