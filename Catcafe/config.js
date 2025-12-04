// Game Configuration
const CONFIG = {
    // Canvas dimensions - adjust based on your background image
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // Position mappings from cafebackgroundcoded.png
    POSITIONS: {
        // Black box - food ordering/preparation area
        FOOD_PREP: { x: 120, y: 180 },

        // Red box - chef stands here to take orders
        CHEF_STATION: { x: 120, y: 200 },

        // Green box - customers stand here to place orders
        CUSTOMER_ORDER: { x: 120, y: 320 },

        // Blue box - table seat 1
        TABLE_SEAT_1: { x: 80, y: 460 },

        // Yellow box - table seat 2
        TABLE_SEAT_2: { x: 160, y: 460 },

        // Entry point for customers (right side of screen)
        CUSTOMER_ENTRY: { x: 700, y: 400 }
    },

    // Available food items matching your PNG files
    FOOD_ITEMS: [
        { name: 'pancakes', image: 'Visuals/without background/pancakes.png' },
        { name: 'waffle', image: 'Visuals/without background/waffle.png' },
        { name: 'croissant', image: 'Visuals/without background/croissant.png' },
        { name: 'steak', image: 'Visuals/without background/steak.png' },
        { name: 'eggsoup', image: 'Visuals/without background/eggsoup.png' }
    ],

    // Game settings
    EATING_DURATION: 3000, // 3 seconds in milliseconds
    CUSTOMER_SPAWN_INTERVAL: 10000, // Spawn new customer every 10 seconds
    COIN_PER_DELIVERY: 1,

    // Movement speeds (pixels per frame)
    CUSTOMER_SPEED: 2,
    CHEF_SPEED: 4,

    // Serving distance - how close chef needs to be to serve
    SERVING_DISTANCE: 60,

    // Character sizes
    CHARACTER_WIDTH: 64,
    CHARACTER_HEIGHT: 64,
    FOOD_ICON_SIZE: 40
};

// Game state constants
const CUSTOMER_STATE = {
    ENTERING: 'entering',
    WAITING_TO_ORDER: 'waiting_to_order',
    ORDERING: 'ordering',
    MOVING_TO_TABLE: 'moving_to_table',
    SITTING: 'sitting',
    EATING: 'eating',
    LEAVING: 'leaving'
};

const CHEF_STATE = {
    IDLE: 'idle',
    TAKING_ORDER: 'taking_order',
    PREPARING_FOOD: 'preparing_food',
    READY_TO_SERVE: 'ready_to_serve'
};
