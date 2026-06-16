import { Coordinate } from './types';

/**
 * Calculates Euclidean distance between two points, scaled to miles.
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const dx = coord2.x - coord1.x;
  const dy = coord2.y - coord1.y;
  const rawDist = Math.sqrt(dx * dx + dy * dy);
  // Scale down to a realistic mileage (e.g., between 0.5 to 8.5 miles)
  const miles = Math.max(0.4, Number((rawDist * 0.08).toFixed(1)));
  return miles;
}

/**
 * Calculates real-time fare estimates based on distance, ride option multiplier, and dynamic surge.
 */
export function calculateFare(distance: number, multiplier: number, isSurge: boolean): number {
  const basePrice = 3.50;
  const perMileRate = 1.95;
  const surgeMultiplier = isSurge ? 1.5 : 1.0;
  
  const fare = (basePrice + distance * perMileRate) * multiplier * surgeMultiplier;
  return Number(fare.toFixed(2));
}

/**
 * Generates a realistic street-grid path (L-shaped or stair-step) between two points.
 * This makes the animated vehicle follow realistic horizontal and vertical city blocks!
 */
export function generateGridPath(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  type: 'pickup' | 'trip' = 'trip'
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  const segments = 40; // Total nodes in animation path
  
  // To make it look even more urban, let's inject a realistic staircase/zigzag pattern 
  // or a clean L-shape. Let's do an L-shape for 'pickup' and a two-turn staircase for 'trip'
  if (type === 'pickup') {
    // Single pivot: go horizontally, then vertically
    const half = Math.floor(segments / 2);
    for (let i = 0; i < half; i++) {
      const t = i / half;
      path.push({
        x: x1 + (x2 - x1) * t,
        y: y1
      });
    }
    for (let i = 0; i <= half; i++) {
      const t = i / half;
      path.push({
        x: x2,
        y: y1 + (y2 - y1) * t
      });
    }
  } else {
    // 3-segment staircase: 33% vertical, 33% horizontal, 33% remainder or vice versa
    const third = Math.floor(segments / 3);
    const midX = x1 + (x2 - x1) * 0.5;
    
    // Segment 1: x1 to midX at y1
    for (let i = 0; i < third; i++) {
      const t = i / third;
      path.push({ x: x1 + (midX - x1) * t, y: y1 });
    }
    // Segment 2: midX from y1 to y2
    for (let i = 0; i < third; i++) {
      const t = i / third;
      path.push({ x: midX, y: y1 + (y2 - y1) * t });
    }
    // Segment 3: midX to x2 at y2
    const remaining = segments - 2 * third;
    for (let i = 0; i <= remaining; i++) {
      const t = i / remaining;
      path.push({ x: midX + (x2 - midX) * t, y: y2 });
    }
  }
  
  return path;
}

/**
 * Formats currency values
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};
