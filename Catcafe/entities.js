// Customer Class
class Customer {
    constructor(id, x, y, imageSrc) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.state = CUSTOMER_STATE.ENTERING;
        this.order = null;
        this.assignedTable = null;
        this.eatingStartTime = null;

        // Load customer image
        this.image = new Image();
        this.image.src = imageSrc;
        this.imageLoaded = false;
        this.image.onload = () => { this.imageLoaded = true; };
    }

    // Request a random food item
    placeOrder() {
        const randomIndex = Math.floor(Math.random() * CONFIG.FOOD_ITEMS.length);
        const foodItem = CONFIG.FOOD_ITEMS[randomIndex];
        this.order = new Order(this.id, foodItem);
        return this.order;
    }

    // Move towards target position
    moveTowards(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.CUSTOMER_SPEED) {
            this.x = targetX;
            this.y = targetY;
            return true; // Reached destination
        }

        const ratio = CONFIG.CUSTOMER_SPEED / distance;
        this.x += dx * ratio;
        this.y += dy * ratio;
        return false; // Still moving
    }

    // Check if customer has reached target
    hasReachedTarget() {
        return Math.abs(this.x - this.targetX) < 5 &&
               Math.abs(this.y - this.targetY) < 5;
    }

    // Start eating
    startEating() {
        this.state = CUSTOMER_STATE.EATING;
        this.eatingStartTime = Date.now();
    }

    // Check if done eating
    isDoneEating() {
        if (this.state === CUSTOMER_STATE.EATING && this.eatingStartTime) {
            return Date.now() - this.eatingStartTime >= CONFIG.EATING_DURATION;
        }
        return false;
    }

    // Update customer behavior each frame
    update() {
        switch (this.state) {
            case CUSTOMER_STATE.ENTERING:
                if (this.moveTowards(CONFIG.POSITIONS.CUSTOMER_ORDER.x,
                                    CONFIG.POSITIONS.CUSTOMER_ORDER.y)) {
                    this.state = CUSTOMER_STATE.WAITING_TO_ORDER;
                }
                break;

            case CUSTOMER_STATE.MOVING_TO_TABLE:
                if (this.assignedTable) {
                    if (this.moveTowards(this.assignedTable.x, this.assignedTable.y)) {
                        this.state = CUSTOMER_STATE.SITTING;
                    }
                }
                break;

            case CUSTOMER_STATE.EATING:
                if (this.isDoneEating()) {
                    this.state = CUSTOMER_STATE.LEAVING;
                    this.order.isComplete = true;
                }
                break;

            case CUSTOMER_STATE.LEAVING:
                if (this.moveTowards(CONFIG.POSITIONS.CUSTOMER_ENTRY.x,
                                    CONFIG.POSITIONS.CUSTOMER_ENTRY.y)) {
                    // Customer has left - will be removed by game manager
                }
                break;
        }
    }

    // Draw customer on canvas
    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image,
                this.x - CONFIG.CHARACTER_WIDTH / 2,
                this.y - CONFIG.CHARACTER_HEIGHT / 2,
                CONFIG.CHARACTER_WIDTH,
                CONFIG.CHARACTER_HEIGHT
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = this.id === 'c1' ? '#FF6B6B' : '#4ECDC4';
            ctx.fillRect(
                this.x - 20,
                this.y - 20,
                40,
                40
            );
        }

        // Draw order icon only when waiting to order or eating (not while sitting and waiting)
        if (this.order && !this.order.isComplete &&
            (this.state === CUSTOMER_STATE.WAITING_TO_ORDER ||
             this.state === CUSTOMER_STATE.EATING)) {
            this.order.draw(ctx, this.x, this.y - 40);
        }
    }
}

// Chef Class
class Chef {
    constructor(x, y, imageSrc) {
        this.x = x;
        this.y = y;
        this.state = CHEF_STATE.IDLE;
        this.currentOrder = null;

        // Load chef image
        this.image = new Image();
        this.image.src = imageSrc;
        this.imageLoaded = false;
        this.image.onload = () => { this.imageLoaded = true; };
    }

    // Chef takes an order from a customer
    takeOrder(order) {
        this.currentOrder = order;
        this.state = CHEF_STATE.TAKING_ORDER;

        // Automatically prepare the food
        setTimeout(() => {
            this.state = CHEF_STATE.PREPARING_FOOD;

            setTimeout(() => {
                this.state = CHEF_STATE.READY_TO_SERVE;
                this.currentOrder.isPrepared = true;
            }, 1000); // 1 second to prepare
        }, 500); // 0.5 second to take order
    }

    // Serve food to customer
    serveFood(customer) {
        if (this.currentOrder && this.currentOrder.customerId === customer.id) {
            this.currentOrder.isServed = true;
            customer.startEating();
            this.currentOrder = null;
            this.state = CHEF_STATE.IDLE;
            return true;
        }
        return false;
    }

    // Draw chef on canvas
    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.image,
                this.x - CONFIG.CHARACTER_WIDTH / 2,
                this.y - CONFIG.CHARACTER_HEIGHT / 2,
                CONFIG.CHARACTER_WIDTH,
                CONFIG.CHARACTER_HEIGHT
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = '#FFD93D';
            ctx.fillRect(
                this.x - 20,
                this.y - 20,
                40,
                40
            );
        }

        // Draw current order being prepared at food prep station
        if (this.currentOrder && this.state === CHEF_STATE.PREPARING_FOOD) {
            this.currentOrder.draw(ctx, CONFIG.POSITIONS.FOOD_PREP.x,
                                  CONFIG.POSITIONS.FOOD_PREP.y);
        }

        // Draw food in chef's hands when ready to serve (follows chef position)
        if (this.currentOrder && this.state === CHEF_STATE.READY_TO_SERVE) {
            // Draw food icon above the chef
            this.currentOrder.draw(ctx, this.x, this.y - 50);

            // Draw carrying indicator
            ctx.fillStyle = '#2ECC71';
            ctx.font = '14px Arial';
            ctx.fillText('Carrying', this.x - 25, this.y + 45);
        }
    }
}

// Order Class
class Order {
    constructor(customerId, foodItem) {
        this.customerId = customerId;
        this.foodItem = foodItem;
        this.isPrepared = false;
        this.isServed = false;
        this.isComplete = false;

        // Load food icon
        this.foodImage = new Image();
        this.foodImage.src = foodItem.image;
        this.imageLoaded = false;
        this.foodImage.onload = () => { this.imageLoaded = true; };
    }

    // Draw the food icon
    draw(ctx, x, y) {
        if (this.imageLoaded) {
            ctx.drawImage(this.foodImage,
                x - CONFIG.FOOD_ICON_SIZE / 2,
                y - CONFIG.FOOD_ICON_SIZE / 2,
                CONFIG.FOOD_ICON_SIZE,
                CONFIG.FOOD_ICON_SIZE
            );
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = '#FF9F43';
            ctx.fillRect(
                x - 15,
                y - 15,
                30,
                30
            );
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(this.foodItem.name.slice(0, 4), x - 12, y + 3);
        }
    }
}
