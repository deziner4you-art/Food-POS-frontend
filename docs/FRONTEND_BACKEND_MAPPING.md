# Frontend to Backend Integration Mapping

This document maps the KDS frontend components to their respective backend NestJS endpoints, including the authentication state and permissions required.

## Kitchen Display System (KDS) - `d4u-pos-client`

### 1. KDS Auth & Sessions (`StitchKDS.tsx`)

| Operation | Component Action | Backend API Used | HTTP Method | Endpoint | Authentication | Permissions |
|-----------|-----------------|------------------|-------------|----------|----------------|-------------|
| **Chef Login** | `handleChefLogin` | Chef Session | `POST` | `/kitchen/chef-auth/login` | PIN | `kitchen.sessions.create` |
| **Chef Logout**| `handleChefLogout`| Chef Session | `POST` | `/kitchen/chef-auth/sessions/{id}/logout` | Bearer Token | `kitchen.sessions.manage` |

### 2. Dashboard View (`DashboardView.tsx`)

| Operation | Component Action | Backend API Used | HTTP Method | Endpoint | Authentication | Permissions |
|-----------|-----------------|------------------|-------------|----------|----------------|-------------|
| **Analytics** | `syncKOTs` -> `dashboardMetrics` | Kitchen Dashboard | `GET` | `/kitchen/dashboard?store_id={id}` | Bearer Token | `kitchen.dashboard.read` |

### 3. Kitchen Stations (`SettingsView.tsx` & `KitchenView.tsx`)

| Operation | Component Action | Backend API Used | HTTP Method | Endpoint | Authentication | Permissions |
|-----------|-----------------|------------------|-------------|----------|----------------|-------------|
| **Load Stations** | `syncKOTs` -> `kitchenStations` | Kitchen Stations | `GET` | `/kitchen/stations?store_id={id}` | Bearer Token | `kitchen.stations.read` |

### 4. Inventory View (`InventoryView.tsx`)

| Operation | Component Action | Backend API Used | HTTP Method | Endpoint | Authentication | Permissions |
|-----------|-----------------|------------------|-------------|----------|----------------|-------------|
| **Stock Sync** | `syncInventory` | Store Inventory | `GET` | `/inventory/items/{id}` | Bearer Token | `inventory.read` |
| **Active Locks** | `syncInventory` -> `isLocked` | Inventory Locks | `GET` | `/kitchen/inventory-locks?store_id={id}` | Bearer Token | `inventory.read` |
| **Unlock Item** | `handleInventoryUnlock` | Inventory Locks | `POST` | `/kitchen/inventory-locks/{id}/unlock` | Bearer Token | `kitchen.inventory.manage` |
| **Stock Request**| `handleStockRequest` | Stock Requests | `POST` | `/kitchen/stock-requests` | Bearer Token | `kitchen.stock.request` |
| **Quick Adjust** | `onUpdateInventory` | Inventory Adjust | `POST` | `/inventory/adjust` | Bearer Token | `inventory.manage` |
| **Recipe Avail.**| `syncInventory` -> `unavailable`| Recipe Availability | `GET` | `/kitchen/availability/unavailable?store_id={id}`| Bearer Token | `recipe.recipes.read` |

### 5. Orders (`KitchenView.tsx`)

| Operation | Component Action | Backend API Used | HTTP Method | Endpoint | Authentication | Permissions |
|-----------|-----------------|------------------|-------------|----------|----------------|-------------|
| **Sync KOTs** | `syncKOTs` | Fetch Active KOTs | `GET` | `/kots?store_id={id}` | Bearer Token | `orders.view` |
| **Accept Order** | `handleAcceptOrder` | Update KOT Status | `POST` | `/kitchen/tickets/{id}/accept` | Bearer Token | `kitchen.tickets.bump` |
| **Mark Ready** | `handleMarkReady` | Update KOT Status | `POST` | `/kitchen/tickets/{id}/bump` | Bearer Token | `kitchen.tickets.bump` |

### Real-Time Socket Events
| Event Name | Emitter (Backend) | Listener (Frontend) | Description |
|------------|-------------------|---------------------|-------------|
| `kds_update` | `KotsService.updateKotStatus()` | `StitchKDS.tsx` | Triggers a full re-fetch of KOTs when an order status changes globally. |
| `new_order` | `OrdersService` | `StitchKDS.tsx` | Triggers fetching new orders into the kitchen queue. |
