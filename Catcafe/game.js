// Main Game Manager
class CafeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Game state
        this.customers = [];
        this.chef = null;
        this.coins = 0;
        this.customerIdCounter = 1;

        // Table management
        this.tables = {
            seat1: { occupied: false, customer: null, position: CONFIG.POSITIONS.TABLE_SEAT_1 },
            seat2: { occupied: false, customer: null, position: CONFIG.POSITIONS.TABLE_SEAT_2 }
        };

        // Background image
        this.background = new Image();
        this.background.src = 'Visuals/cafebackground.png';
        this.backgroundLoaded = false;
        this.background.onload = () => { this.backgroundLoaded = true; };

        // Timing
        this.lastCustomerSpawn = Date.now();

        // Keyboard input tracking for manual chef movement
        this.keysPressed = {};

        // Initialize game
        this.init();
    }

    init() {
        // Create chef at the red box position
        this.chef = new Chef(
            CONFIG.POSITIONS.CHEF_STATION.x,
            CONFIG.POSITIONS.CHEF_STATION.y,
            'Visuals/chef.png'
        );

        // Set up input handlers
        this.setupInputHandlers();

        // Ensure the page has focus for keyboard input
        window.focus();
        document.body.focus();

        // Add click listener to canvas to ensure focus
        this.canvas.addEventListener('click', () => {
            console.log('Canvas clicked - ensuring focus');
        });

        // Start game loop
        this.gameLoop();

        // Spawn first customer after 2 seconds
        setTimeout(() => {
            this.spawnCustomer();
        }, 2000);

        console.log('Game initialized! Chef position:', this.chef.x, this.chef.y);
    }

    // Spawn a new customer
    spawnCustomer() {
        // Don't spawn if there are already 2 customers active
        if (this.customers.length >= 2) {
            return;
        }

        const customerId = `c${this.customerIdCounter}`;
        const customerImage = this.customerIdCounter % 2 === 1 ?
                             'Visuals/c1.png' : 'Visuals/c2.png';

        const customer = new Customer(
            customerId,
            CONFIG.POSITIONS.CUSTOMER_ENTRY.x,
            CONFIG.POSITIONS.CUSTOMER_ENTRY.y,
            customerImage
        );

        this.customers.push(customer);
        this.customerIdCounter++;
        this.lastCustomerSpawn = Date.now();

        console.log(`Customer ${customerId} spawned`);
    }

    // Find and assign an available table
    assignTable(customer) {
        // Check seat 1
        if (!this.tables.seat1.occupied) {
            this.tables.seat1.occupied = true;
            this.tables.seat1.customer = customer;
            customer.assignedTable = this.tables.seat1.position;
            customer.state = CUSTOMER_STATE.MOVING_TO_TABLE;
            console.log(`${customer.id} assigned to seat 1`);
            return true;
        }

        // Check seat 2
        if (!this.tables.seat2.occupied) {
            this.tables.seat2.occupied = true;
            this.tables.seat2.customer = customer;
            customer.assignedTable = this.tables.seat2.position;
            customer.state = CUSTOMER_STATE.MOVING_TO_TABLE;
            console.log(`${customer.id} assigned to seat 2`);
            return true;
        }

        // No tables available
        return false;
    }

    // Release table when customer leaves
    releaseTable(customer) {
        if (this.tables.seat1.customer === customer) {
            this.tables.seat1.occupied = false;
            this.tables.seat1.customer = null;
            console.log(`Seat 1 is now available`);
        }
        if (this.tables.seat2.customer === customer) {
            this.tables.seat2.occupied = false;
            this.tables.seat2.customer = null;
            console.log(`Seat 2 is now available`);
        }
    }

    // Calculate distance between two points
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Update chef position based on keyboard input
    updateChefMovement() {
        let moved = false;

        if (this.keysPressed['w'] || this.keysPressed['W']) {
            this.chef.y -= CONFIG.CHEF_SPEED;
            moved = true;
        }
        if (this.keysPressed['s'] || this.keysPressed['S']) {
            this.chef.y += CONFIG.CHEF_SPEED;
            moved = true;
        }
        if (this.keysPressed['a'] || this.keysPressed['A']) {
            this.chef.x -= CONFIG.CHEF_SPEED;
            moved = true;
        }
        if (this.keysPressed['d'] || this.keysPressed['D']) {
            this.chef.x += CONFIG.CHEF_SPEED;
            moved = true;
        }

        if (moved) {
            console.log('Chef moved to:', this.chef.x, this.chef.y);
        }

        // Keep chef within canvas bounds
        this.chef.x = Math.max(CONFIG.CHARACTER_WIDTH / 2,
                              Math.min(CONFIG.CANVAS_WIDTH - CONFIG.CHARACTER_WIDTH / 2, this.chef.x));
        this.chef.y = Math.max(CONFIG.CHARACTER_HEIGHT / 2,
                              Math.min(CONFIG.CANVAS_HEIGHT - CONFIG.CHARACTER_HEIGHT / 2, this.chef.y));
    }

    // Handle customer ordering
    processOrders() {
        for (let customer of this.customers) {
            // Customer is ready to order and chef is idle
            if (customer.state === CUSTOMER_STATE.WAITING_TO_ORDER &&
                this.chef.state === CHEF_STATE.IDLE) {

                // Customer places order
                const order = customer.placeOrder();
                console.log(`${customer.id} ordered ${order.foodItem.name}`);

                // Chef takes the order
                this.chef.takeOrder(order);
                customer.state = CUSTOMER_STATE.ORDERING;

                // After chef takes order, assign table to customer
                setTimeout(() => {
                    if (this.assignTable(customer)) {
                        console.log(`${customer.id} moving to table`);
                    } else {
                        // No table available - customer waits
                        console.log(`No table available for ${customer.id}`);
                    }
                }, 1500);
            }

            // MANUAL SERVING: Chef must walk close to customer to serve
            if (customer.state === CUSTOMER_STATE.SITTING &&
                this.chef.state === CHEF_STATE.READY_TO_SERVE &&
                this.chef.currentOrder &&
                this.chef.currentOrder.customerId === customer.id) {

                // Check if chef is close enough to the customer
                const distance = this.getDistance(this.chef.x, this.chef.y, customer.x, customer.y);

                if (distance <= CONFIG.SERVING_DISTANCE) {
                    // Serve the food
                    if (this.chef.serveFood(customer)) {
                        this.coins += CONFIG.COIN_PER_DELIVERY;
                        console.log(`Served ${customer.id}! Coins: ${this.coins}`);
                    }
                }
            }
        }
    }

    // Update all game entities
    update() {
        // Update chef movement based on keyboard input
        this.updateChefMovement();

        // Update customers
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const customer = this.customers[i];
            customer.update();

            // Remove customer if they've left
            if (customer.state === CUSTOMER_STATE.LEAVING &&
                customer.x >= CONFIG.POSITIONS.CUSTOMER_ENTRY.x - 10) {
                this.releaseTable(customer);
                this.customers.splice(i, 1);
                console.log(`${customer.id} has left the cafe`);
            }
        }

        // Process customer orders
        this.processOrders();

        // Spawn new customers periodically
        const timeSinceLastSpawn = Date.now() - this.lastCustomerSpawn;
        if (timeSinceLastSpawn > CONFIG.CUSTOMER_SPAWN_INTERVAL) {
            this.spawnCustomer();
        }
    }

    // Draw all game entities
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (this.backgroundLoaded) {
            this.ctx.drawImage(this.background, 0, 0,
                              this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#F5E6D3';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw chef
        if (this.chef) {
            this.chef.draw(this.ctx);
        }

        // Draw customers
        for (let customer of this.customers) {
            customer.draw(this.ctx);
        }

        // Draw UI
        this.drawUI();
    }

    // Draw UI elements (score, etc.)
    drawUI() {
        // Draw coin count
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Coins: ${this.coins}`, 20, 40);

        // Draw chef status
        this.ctx.font = '16px Arial';
        let statusText = 'Chef: ';
        switch (this.chef.state) {
            case CHEF_STATE.IDLE:
                statusText += 'Waiting...';
                this.ctx.fillStyle = '#7F8C8D';
                break;
            case CHEF_STATE.TAKING_ORDER:
                statusText += 'Taking order';
                this.ctx.fillStyle = '#3498DB';
                break;
            case CHEF_STATE.PREPARING_FOOD:
                statusText += 'Preparing food';
                this.ctx.fillStyle = '#F39C12';
                break;
            case CHEF_STATE.READY_TO_SERVE:
                statusText += 'Ready to serve!';
                this.ctx.fillStyle = '#2ECC71';
                break;
        }
        this.ctx.fillText(statusText, 20, 70);

        // Draw table status
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = '14px Arial';
        const seat1Status = this.tables.seat1.occupied ? 'Occupied' : 'Available';
        const seat2Status = this.tables.seat2.occupied ? 'Occupied' : 'Available';
        this.ctx.fillText(`Table 1: ${seat1Status}`, 20, 100);
        this.ctx.fillText(`Table 2: ${seat2Status}`, 20, 120);

        // Draw instructions
        this.ctx.fillStyle = '#7F8C8D';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Use WASD to move chef. Walk close to customers to serve!', 20, CONFIG.CANVAS_HEIGHT - 20);

        // DEBUG: Show which keys are pressed
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = '14px Arial';
        const pressedKeys = Object.keys(this.keysPressed).filter(k => this.keysPressed[k]);
        if (pressedKeys.length > 0) {
            this.ctx.fillText('Keys: ' + pressedKeys.join(', '), 20, CONFIG.CANVAS_HEIGHT - 40);
        }

        // DEBUG: Show chef position
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fillText(`Chef: (${Math.round(this.chef.x)}, ${Math.round(this.chef.y)})`, 20, 140);
    }

    // Set up keyboard/mouse input handlers
    setupInputHandlers() {
        // Track key presses for WASD movement
        document.addEventListener('keydown', (e) => {
            this.keysPressed[e.key] = true;

            // Debug log
            console.log('Key pressed:', e.key, 'Keys:', this.keysPressed);

            // Space bar to manually trigger customer spawn (for testing)
            if (e.code === 'Space') {
                this.spawnCustomer();
            }

            // Prevent default scrolling for arrow keys and space
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        // Track key releases
        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;
        });

        console.log('Input handlers set up successfully!');
    }

    // Main game loop
    gameLoop() {
        this.update();
        this.draw();

        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new CafeGame();
    console.log('Cafe game started!');
});
