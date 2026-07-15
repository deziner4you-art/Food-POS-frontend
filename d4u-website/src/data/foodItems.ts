import type { FoodItem } from '../types';

// ⚠️ This file is intentionally empty.
// All food items are fetched dynamically from the backend API:
// GET /catalog/sync/:store_id
// See: d4u-website/src/App.tsx → fetchCatalog()
export const foodItems: FoodItem[] = [];
