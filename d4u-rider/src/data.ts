import { Coordinate, DeliveryOrder } from './types';

export const SF_LANDMARKS: Coordinate[] = [
  // Restaurants
  { id: 'burger_barn', name: 'Burger Barn - Central Kitchen', x: 75, y: 35, address: '888 Market St, San Francisco', isSurgeZone: true },
  { id: 'pizzeria_manifesto', name: 'Pizza Manifesto Headquarters', x: 50, y: 25, address: '333 Post St, San Francisco' },
  { id: 'wok_heaven', name: 'Wok Heaven Thai Diner', x: 38, y: 48, address: '1 Dr Carlton B Goodlett Pl, San Francisco' },
  { id: 'flanders_fries', name: 'Flanders Organic Fries Lab', x: 68, y: 72, address: '700 King St, San Francisco' },
  
  // Customers
  { id: 'cust_sarah', name: 'Sarah Johnson (Apt 4C)', x: 42, y: 15, address: '245 Montgomery St, Apt 4C' },
  { id: 'cust_evergreen', name: 'Homer Simpson (Apt 4B)', x: 62, y: 55, address: '742 Evergreen Terrace, Apt 4B' },
  { id: 'cust_elena', name: 'Elena Rostova (Suite 91)', x: 22, y: 35, address: '100 Marina Blvd, Suite 91' },
  { id: 'cust_marcus', name: 'Marcus Vance (Unit 18)', x: 82, y: 80, address: '202 Montgomery St, Unit 18' }
];

export const ROAD_CONNECTIONS = [
  { from: 'burger_barn', to: 'pizzeria_manifesto' },
  { from: 'pizzeria_manifesto', to: 'cust_sarah' },
  { from: 'cust_sarah', to: 'cust_elena' },
  { from: 'wok_heaven', to: 'cust_elena' },
  { from: 'wok_heaven', to: 'pizzeria_manifesto' },
  { from: 'burger_barn', to: 'cust_evergreen' },
  { from: 'cust_evergreen', to: 'flanders_fries' },
  { from: 'flanders_fries', to: 'cust_marcus' },
  { from: 'cust_marcus', to: 'burger_barn' }
];

export const DISPATCHABLE_MOCK_ORDERS: DeliveryOrder[] = [];

export const INITIAL_PAST_MISSIONS = [];
