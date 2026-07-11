# Custom UI Popups Only
Never use native browser popups (e.g., `alert()`, `confirm()`, `prompt()`) anywhere in the frontend applications (`d4u-admin`, `d4u-pos-client`, `d4u-rider`, `d4u-website`). Native browser popups can be blocked by the browser. Always use custom UI elements (like Toast notifications or Modal dialogues) for alerts and confirmations.
