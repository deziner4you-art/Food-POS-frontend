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

export const DISPATCHABLE_MOCK_ORDERS: DeliveryOrder[] = [
  {
    id: 'ORD-4029',
    source: 'POS',
    restaurantName: 'Burger Barn - Central Kitchen',
    restaurantAddress: '888 Market St, San Francisco',
    restaurantX: 75,
    restaurantY: 35,
    customerName: 'Sarah Johnson',
    customerAddress: '245 Montgomery St, Apt 4C',
    customerX: 42,
    customerY: 15,
    earnings: 8.40,
    distance: 2.4,
    itemsCount: 3,
    itemsList: ['1x Steakhouse Prime Burger', '1x Big Boy Truffle Fries', '1x Cherry Cola'],
    estTimeMins: 12,
    paymentMethod: 'ONLINE_PAID',
    paymentStatus: 'PAID'
  },
  {
    id: 'ORD-8941',
    source: 'POS',
    restaurantName: 'Pizza Manifesto Headquarters',
    restaurantAddress: '333 Post St, San Francisco',
    restaurantX: 50,
    restaurantY: 25,
    customerName: 'Homer Simpson',
    customerAddress: '742 Evergreen Terrace, Apt 4B',
    customerX: 62,
    customerY: 55,
    earnings: 12.50,
    distance: 3.2,
    itemsCount: 2,
    itemsList: ['1x Large Spicy Pepperoni Supreme', '1x Family Nutella Dip Sticks'],
    estTimeMins: 18,
    paymentMethod: 'COD', // cash on delivery
    paymentStatus: 'UNPAID'
  },
  {
    id: 'ORD-3011',
    source: 'ONLINE_ORDER',
    restaurantName: 'Wok Heaven Thai Diner',
    restaurantAddress: '1 Dr Carlton B Goodlett Pl, San Francisco',
    restaurantX: 38,
    restaurantY: 48,
    customerName: 'Marcus Vance',
    customerAddress: '202 Montgomery St, Unit 18',
    customerX: 82,
    customerY: 80,
    earnings: 14.80,
    distance: 4.1,
    itemsCount: 4,
    itemsList: ['2x Spicy Seafood Pad Thai', '1x Crispy Spring Rolls (4pc)', '1x Thai Iced Tea'],
    estTimeMins: 20,
    paymentMethod: 'PAY_ON_DELIVERY_REQUESTED',
    paymentStatus: 'PENDING_CUSTOMER_TAP'
  }
];

export const INITIAL_PAST_MISSIONS = [
  {
    id: 'mission-301',
    orderId: 'ORD-1092',
    restaurant: 'Burger Barn - Central Kitchen',
    customer: 'Sarah Johnson',
    earnings: 18.20,
    itemsCount: 3,
    completedAt: 'Today, 11:20 AM'
  },
  {
    id: 'mission-302',
    orderId: 'ORD-9821',
    restaurant: 'Pizza Manifesto Headquarters',
    customer: 'Elena Rostova',
    earnings: 12.50,
    itemsCount: 1,
    completedAt: 'Yesterday, 8:44 PM'
  }
];
