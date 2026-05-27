export function formatParams(n: number): string {
  if (n < 1e3) {
    return `${n}`;
  }

  if (n < 1e6) {
    return `${(n / 1e3).toFixed(1)} K`;
  }

  if (n < 1e9) {
    return `${(n / 1e6).toFixed(1)} M`;
  }

  return `${(n / 1e9).toFixed(1)} B`;
}

export function formatShape(...dims: (number | string)[]): string {
  return dims.join(' × ');
}
