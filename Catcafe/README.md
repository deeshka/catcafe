# 🐱 Cat Cafe Game - Technical Documentation

## Overview
A 2D cafe simulation game where a chef cat serves customers food. Built with HTML5 Canvas and vanilla JavaScript.

## Game Flow

```
Customer Enters → Orders at Cashier → Moves to Table → Eats Food (3s) → Leaves → Earn Coin!
                         ↓
                   Chef Takes Order
                         ↓
                  Chef Prepares Food
                         ↓
                   Chef Serves Food
```

## File Structure

- **index.html** - Main HTML structure
- **style.css** - Game styling
- **config.js** - Game configuration and constants
- **entities.js** - Customer, Chef, and Order classes
- **game.js** - Main game logic and loop

## Architecture

### 1. Configuration System ([config.js](config.js))

The configuration file maps all positional data from `cafebackgroundcoded.png`:

- **Black box** → Food preparation area
- **Red box** → Chef station (where chef stands)
- **Green box** → Customer ordering area
- **Blue/Yellow boxes** → Table seats (only one customer per seat)

Key settings:
- `EATING_DURATION`: 3000ms (3 seconds)
- `CUSTOMER_SPAWN_INTERVAL`: 10000ms (10 seconds)
- `COIN_PER_DELIVERY`: 1 coin per successful delivery

### 2. Entity Classes ([entities.js](entities.js))

#### Customer Class
Handles customer behavior and state management.

**States:**
- `ENTERING` - Walking from entry point to cashier
- `WAITING_TO_ORDER` - Arrived at green box, waiting for chef
- `ORDERING` - Chef is taking the order
- `MOVING_TO_TABLE` - Walking to assigned table
- `SITTING` - Seated at table, waiting for food
- `EATING` - Consuming food (3 seconds)
- `LEAVING` - Finished eating, exiting cafe

**Key Methods:**
- `placeOrder()` - Selects random food from CONFIG.FOOD_ITEMS
- `moveTowards(x, y)` - Smooth movement with CONFIG.CUSTOMER_SPEED
- `startEating()` - Begins 3-second eating timer
- `isDoneEating()` - Checks if 3 seconds elapsed

#### Chef Class
Manages the chef cat's actions and order processing.

**States:**
- `IDLE` - Waiting for customers
- `TAKING_ORDER` - Receiving order from customer
- `PREPARING_FOOD` - Cooking the food
- `READY_TO_SERVE` - Food ready for delivery

**Key Methods:**
- `takeOrder(order)` - Accepts order and begins preparation
- `serveFood(customer)` - Delivers food to customer at table

#### Order Class
Represents a food order with preparation tracking.

**Properties:**
- `customerId` - Which customer ordered
- `foodItem` - What food was ordered
- `isPrepared` - Has chef finished cooking?
- `isServed` - Has food been delivered?
- `isComplete` - Has customer finished eating?

### 3. Game Manager ([game.js](game.js))

The main `CafeGame` class orchestrates all game systems.

#### Table Management
```javascript
tables: {
    seat1: { occupied: false, customer: null, position: {...} },
    seat2: { occupied: false, customer: null, position: {...} }
}
```

**Rules:**
- Only one customer can occupy a seat at a time
- Tables are released when customer leaves
- If no tables available, customer waits at cashier

#### Customer Spawning
- New customer every 10 seconds (configurable)
- Maximum 2 active customers at once
- Alternates between c1.png and c2.png sprites

#### Order Processing Flow
1. Customer reaches green box → state = `WAITING_TO_ORDER`
2. Chef is idle → Chef takes order, customer state = `ORDERING`
3. Chef prepares food (1 second)
4. Table assigned to customer → customer moves to table
5. Customer sits → state = `SITTING`
6. Chef ready → serves food to customer
7. Customer eats (3 seconds) → state = `EATING`
8. Done eating → customer leaves, table released, +1 coin

## Customization Guide

### Adding New Foods

1. Add PNG to `Visuals/without background/`
2. Update [config.js](config.js):
```javascript
FOOD_ITEMS: [
    // ... existing foods
    { name: 'newdish', image: 'Visuals/without background/newdish.png' }
]
```

### Adjusting Positions

Edit [config.js](config.js) `POSITIONS` object to match your background:
```javascript
POSITIONS: {
    FOOD_PREP: { x: 120, y: 180 },
    CHEF_STATION: { x: 120, y: 200 },
    // ... adjust coordinates as needed
}
```

### Changing Game Speed

In [config.js](config.js):
```javascript
EATING_DURATION: 3000,        // Time to eat (ms)
CUSTOMER_SPAWN_INTERVAL: 10000, // Time between spawns (ms)
CUSTOMER_SPEED: 2,            // Movement speed (pixels/frame)
```

### Adjusting Canvas Size

In [config.js](config.js):
```javascript
CANVAS_WIDTH: 800,  // Adjust to match your background
CANVAS_HEIGHT: 600,
```

## Animation Suggestions

### 1. Simple Sprite Flipping
Add direction-based sprite flipping in [entities.js](entities.js):

```javascript
draw(ctx) {
    ctx.save();

    // Flip sprite based on movement direction
    if (this.x < this.targetX) {
        ctx.scale(-1, 1);
        ctx.drawImage(this.image, -this.x - 32, this.y - 32, 64, 64);
    } else {
        ctx.drawImage(this.image, this.x - 32, this.y - 32, 64, 64);
    }

    ctx.restore();
}
```

### 2. Walking Animation
If you have multi-frame sprite sheets:

```javascript
class Customer {
    constructor(...) {
        this.frame = 0;
        this.frameTimer = 0;
    }

    update() {
        // Animate when moving
        if (this.x !== this.targetX || this.y !== this.targetY) {
            this.frameTimer++;
            if (this.frameTimer > 10) {
                this.frame = (this.frame + 1) % 4; // 4-frame walk cycle
                this.frameTimer = 0;
            }
        }
    }
}
```

### 3. Food Icon Bounce
Add a subtle bounce to food icons in [entities.js](entities.js):

```javascript
draw(ctx, x, y) {
    const bounce = Math.sin(Date.now() / 200) * 3; // Gentle bounce
    this.drawImage(this.foodImage, x, y + bounce, ...);
}
```

### 4. Smooth Movement (Easing)
Replace linear movement with easing in Customer class:

```javascript
moveTowards(targetX, targetY) {
    const easing = 0.05; // Lower = smoother
    this.x += (targetX - this.x) * easing;
    this.y += (targetY - this.y) * easing;

    return Math.abs(targetX - this.x) < 1 && Math.abs(targetY - this.y) < 1;
}
```

### 5. Particle Effects
Add simple particles when serving food:

```javascript
serveFood(customer) {
    // Create coin particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: customer.x,
            y: customer.y,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 - 2,
            life: 30
        });
    }
}
```

## Testing Controls

- **SPACE** - Manually spawn a customer (useful for testing)
- Open browser console for detailed logs of game events

## Performance Tips

1. **Image Preloading**: All images load asynchronously with fallback shapes
2. **Update Before Draw**: Game logic separated from rendering
3. **Array Cleanup**: Customers removed from array when they leave
4. **Efficient Collision**: Uses simple distance checks, no complex physics

## Extending the Game

### Add More Tables
In [config.js](config.js):
```javascript
POSITIONS: {
    TABLE_SEAT_3: { x: 300, y: 460 },
    TABLE_SEAT_4: { x: 380, y: 460 }
}
```

In [game.js](game.js):
```javascript
this.tables = {
    seat1: {...},
    seat2: {...},
    seat3: { occupied: false, customer: null, position: CONFIG.POSITIONS.TABLE_SEAT_3 },
    seat4: { occupied: false, customer: null, position: CONFIG.POSITIONS.TABLE_SEAT_4 }
}
```

### Add Manual Chef Control
In [game.js](game.js) `setupInputHandlers()`:
```javascript
document.addEventListener('keydown', (e) => {
    const speed = 5;
    switch(e.key) {
        case 'ArrowUp': this.chef.y -= speed; break;
        case 'ArrowDown': this.chef.y += speed; break;
        case 'ArrowLeft': this.chef.x -= speed; break;
        case 'ArrowRight': this.chef.x += speed; break;
    }
});
```

### Add Difficulty Levels
```javascript
setDifficulty(level) {
    switch(level) {
        case 'easy':
            CONFIG.CUSTOMER_SPAWN_INTERVAL = 15000;
            CONFIG.EATING_DURATION = 5000;
            break;
        case 'hard':
            CONFIG.CUSTOMER_SPAWN_INTERVAL = 5000;
            CONFIG.EATING_DURATION = 2000;
            break;
    }
}
```

### Add Sound Effects
```javascript
class SoundManager {
    constructor() {
        this.orderSound = new Audio('sounds/order.mp3');
        this.serveSound = new Audio('sounds/serve.mp3');
        this.coinSound = new Audio('sounds/coin.mp3');
    }

    playOrder() { this.orderSound.play(); }
    playServe() { this.serveSound.play(); }
    playCoin() { this.coinSound.play(); }
}
```

## Running the Game

1. Open [index.html](index.html) in a web browser
2. Ensure all files are in the correct directory structure:
   ```
   Catcafe/
   ├── index.html
   ├── style.css
   ├── config.js
   ├── entities.js
   ├── game.js
   └── Visuals/
       ├── cafebackground.png
       ├── chef.png
       ├── c1.png
       ├── c2.png
       └── without background/
           ├── pancakes.png
           ├── waffle.png
           ├── croissant.png
           ├── steak.png
           └── eggsoup.png
   ```

3. Use a local server for best results:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx http-server
   ```

4. Open browser to `http://localhost:8000`

## Troubleshooting

**Images not loading?**
- Check file paths in config.js
- Use browser DevTools Console to see errors
- Ensure all PNGs are in correct folders

**Customers not spawning?**
- Check console for spawn messages
- Press SPACE to manually spawn
- Verify CUSTOMER_SPAWN_INTERVAL in config.js

**Food not serving?**
- Check that customer reached table (state = SITTING)
- Verify chef has prepared food (state = READY_TO_SERVE)
- Check order customerId matches customer.id

## Future Enhancements

1. **Multiple Chefs** - Add assistant chefs for faster service
2. **Customer Patience** - Add timer, customer leaves if wait too long
3. **Combo System** - Bonus coins for serving multiple customers quickly
4. **Upgrades Shop** - Spend coins on faster prep time, more tables
5. **Day/Night Cycle** - Different customer patterns
6. **Special Orders** - Rare orders worth more coins
7. **Achievements** - Track stats and unlock rewards
8. **Save System** - Persist coins and progress using localStorage

## License

Free to use and modify for your project!
