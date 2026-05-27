const gradientStops = [
  { t: 0, rgb: [15, 23, 42] },
  { t: 0.15, rgb: [30, 58, 138] },
  { t: 0.35, rgb: [6, 182, 212] },
  { t: 0.55, rgb: [34, 197, 94] },
  { t: 0.75, rgb: [250, 204, 21] },
  { t: 1, rgb: [239, 68, 68] },
] as const;

const tokenGradientStops = [
  { t: 0, rgb: [59, 130, 246] },
  { t: 0.25, rgb: [6, 182, 212] },
  { t: 0.5, rgb: [34, 197, 94] },
  { t: 0.75, rgb: [250, 204, 21] },
  { t: 1, rgb: [239, 68, 68] },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function colorForWeight(w: number): string {
  const value = clamp(w, 0, 1);

  for (let index = 0; index < gradientStops.length - 1; index += 1) {
    const start = gradientStops[index];
    const end = gradientStops[index + 1];

    if (value <= end.t) {
      const span = end.t - start.t || 1;
      const localT = clamp((value - start.t) / span, 0, 1);
      const rgb = start.rgb.map((channel, channelIndex) =>
        Math.round(lerp(channel, end.rgb[channelIndex], localT)),
      );
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  }

  const [r, g, b] = gradientStops[gradientStops.length - 1].rgb;
  return `rgb(${r}, ${g}, ${b})`;
}

export function tokenColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : clamp(index / (total - 1), 0, 1);

  for (let i = 0; i < tokenGradientStops.length - 1; i += 1) {
    const start = tokenGradientStops[i];
    const end = tokenGradientStops[i + 1];

    if (t <= end.t) {
      const span = end.t - start.t || 1;
      const localT = clamp((t - start.t) / span, 0, 1);
      const rgb = start.rgb.map((channel, channelIndex) =>
        Math.round(lerp(channel, end.rgb[channelIndex], localT)),
      );
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  }

  const [r, g, b] = tokenGradientStops[tokenGradientStops.length - 1].rgb;
  return `rgb(${r}, ${g}, ${b})`;
}
