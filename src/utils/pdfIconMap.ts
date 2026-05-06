export const pdfIconMap: Record<string, string> = {
  calendar: "📅",
  ticket: "🎫",
  dollar: "💲",
  money: "💰",
  wallet: "👛",
};

export const pdfIconSvgMap: Record<string, string> = {
  calendar:
    "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><rect x='3' y='5' width='18' height='16' rx='3' fill='#f9fafb' stroke='#374151' stroke-width='1.5'/><path d='M7 2v4' stroke='#374151' stroke-width='1.5' stroke-linecap='round'/><path d='M17 2v4' stroke='#374151' stroke-width='1.5' stroke-linecap='round'/><path d='M6 10h12' stroke='#374151' stroke-width='1.5' stroke-linecap='round'/><text x='12' y='17' text-anchor='middle' font-size='7' fill='#111827'>31</text></svg>",
  ticket:
    "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M5 7h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9a2 2 0 0 1 2-2Z' fill='#fef3c7' stroke='#92400e' stroke-width='1.5'/><circle cx='6.5' cy='12' r='1' fill='#92400e'/><circle cx='12' cy='12' r='1' fill='#92400e'/><circle cx='17.5' cy='12' r='1' fill='#92400e'/></svg>",
  dollar:
    "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M12 5v14' stroke='#047857' stroke-width='1.8' stroke-linecap='round'/><path d='M10 7h4a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-4' stroke='#047857' stroke-width='1.8' stroke-linecap='round' fill='none'/></svg>",
  money:
    "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><rect x='3' y='7' width='18' height='10' rx='2' fill='#ecfccb' stroke='#15803d' stroke-width='1.5'/><path d='M8 12h8' stroke='#15803d' stroke-width='1.8' stroke-linecap='round'/><path d='M12 8v8' stroke='#15803d' stroke-width='1.8' stroke-linecap='round'/><circle cx='12' cy='12' r='7' fill='none' stroke='#15803d' stroke-width='1.2'/></svg>",
  wallet:
    "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><rect x='3' y='6' width='18' height='12' rx='3' fill='#f8fafc' stroke='#0f172a' stroke-width='1.5'/><path d='M7 9h10' stroke='#0f172a' stroke-width='1.5' stroke-linecap='round'/><circle cx='17' cy='14' r='1.5' fill='#0f172a'/></svg>",
};

export function resolvePdfIcon(iconName?: string): string | undefined {
  if (!iconName) {
    return undefined;
  }
  return pdfIconMap[iconName] ?? iconName;
}

export function replaceIconTokens(value: string): string {
  return value.replace(/`([^`]+)`/g, (_, key) => {
    const icon = resolvePdfIcon(key.trim());
    return icon ?? _;
  });
}

export function getPdfSvgIcon(iconName: string): string | undefined {
  return pdfIconSvgMap[iconName];
}
