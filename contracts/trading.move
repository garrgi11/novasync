module trading_hooks::grid_trading {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use sui::event;

    // Error codes
    const E_MISMATCHED_PAIRS: u64 = 1;
    const E_NO_PAIRED_ORDER: u64 = 2;
    const E_NOT_OWNER: u64 = 3;

    // Structs
    public struct GridTradingHook has key {
        id: UID,
        owner: address,
        // Maps order hash to its paired order hash
        paired_orders: Table<vector<u8>, vector<u8>>,
        // Tracks which orders are currently active
        is_active: Table<vector<u8>, bool>,
    }

    // Events
    public struct GridRegistered has copy, drop {
        user: address,
        number_of_pairs: u64,
    }

    public struct OrderActivated has copy, drop {
        order_hash: vector<u8>,
    }

    // Initialize the grid trading hook
    public entry fun create_grid_hook(ctx: &mut TxContext) {
        let hook = GridTradingHook {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            paired_orders: table::new(ctx),
            is_active: table::new(ctx),
        };
        transfer::share_object(hook);
    }

    // Predicate function to check if order is active
    public fun check_is_active(hook: &GridTradingHook, order_hash: vector<u8>): bool {
        if (table::contains(&hook.is_active, order_hash)) {
            *table::borrow(&hook.is_active, order_hash)
        } else {
            false
        }
    }

    // Post-interaction hook to activate paired order after fill
    public entry fun activate_paired_order(
        hook: &mut GridTradingHook,
        filled_order_hash: vector<u8>,
        _ctx: &mut TxContext
    ) {
        // Deactivate the filled order
        if (table::contains(&hook.is_active, filled_order_hash)) {
            table::remove(&mut hook.is_active, filled_order_hash);
        };

        // Get paired order
        assert!(table::contains(&hook.paired_orders, filled_order_hash), E_NO_PAIRED_ORDER);
        let order_to_activate = *table::borrow(&hook.paired_orders, filled_order_hash);

        // Activate the paired order
        if (table::contains(&hook.is_active, order_to_activate)) {
            *table::borrow_mut(&mut hook.is_active, order_to_activate) = true;
        } else {
            table::add(&mut hook.is_active, order_to_activate, true);
        };

        event::emit(OrderActivated { order_hash: order_to_activate });
    }

    // Register the entire grid with buy/sell pairs
    public entry fun register_grid(
        hook: &mut GridTradingHook,
        buy_order_hashes: vector<vector<u8>>,
        sell_order_hashes: vector<vector<u8>>,
        initial_active_hashes: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == hook.owner, E_NOT_OWNER);
        
        let buy_len = vector::length(&buy_order_hashes);
        let sell_len = vector::length(&sell_order_hashes);
        assert!(buy_len == sell_len, E_MISMATCHED_PAIRS);

        // Pair up orders
        let mut i = 0;
        while (i < buy_len) {
            let buy_hash = *vector::borrow(&buy_order_hashes, i);
            let sell_hash = *vector::borrow(&sell_order_hashes, i);
            
            table::add(&mut hook.paired_orders, buy_hash, sell_hash);
            table::add(&mut hook.paired_orders, sell_hash, buy_hash);
            
            i = i + 1;
        };

        // Activate initial orders
        let mut j = 0;
        let active_len = vector::length(&initial_active_hashes);
        while (j < active_len) {
            let hash = *vector::borrow(&initial_active_hashes, j);
            table::add(&mut hook.is_active, hash, true);
            event::emit(OrderActivated { order_hash: hash });
            j = j + 1;
        };

        event::emit(GridRegistered {
            user: tx_context::sender(ctx),
            number_of_pairs: buy_len,
        });
    }
}

// =============================================================================
// TIME HOOK MODULE
// =============================================================================

module trading_hooks::time_hook {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use sui::event;

    // Error codes
    const E_SERIES_ALREADY_REGISTERED: u64 = 1;
    const E_NOT_OWNER: u64 = 2;

    // Constants
    const TIME_INTERVAL: u64 = 86400000; // 24 hours in milliseconds

    // Structs
    public struct TimeHook has key {
        id: UID,
        owner: address,
        // Maps series ID to last execution timestamp
        last_execution_time: Table<vector<u8>, u64>,
    }

    // Events
    public struct OrderSeriesRegistered has copy, drop {
        series_id: vector<u8>,
        user: address,
    }

    public struct TimestampUpdated has copy, drop {
        series_id: vector<u8>,
        new_timestamp: u64,
    }

    // Initialize the time hook
    public entry fun create_time_hook(ctx: &mut TxContext) {
        let hook = TimeHook {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            last_execution_time: table::new(ctx),
        };
        transfer::share_object(hook);
    }

    // Predicate function to check if enough time has passed
    public fun check_time(hook: &TimeHook, series_id: vector<u8>, clock: &Clock): bool {
        if (!table::contains(&hook.last_execution_time, series_id)) {
            return true // First execution is always valid
        };

        let last_time = *table::borrow(&hook.last_execution_time, series_id);
        let current_time = clock::timestamp_ms(clock);
        
        current_time >= last_time + TIME_INTERVAL
    }

    // Post-interaction hook to update timestamp
    public entry fun update_timestamp(
        hook: &mut TimeHook,
        series_id: vector<u8>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        if (table::contains(&hook.last_execution_time, series_id)) {
            *table::borrow_mut(&mut hook.last_execution_time, series_id) = current_time;
        } else {
            table::add(&mut hook.last_execution_time, series_id, current_time);
        };

        event::emit(TimestampUpdated {
            series_id,
            new_timestamp: current_time,
        });
    }

    // Register a new order series
    public entry fun register_order_series(
        hook: &mut TimeHook,
        series_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(!table::contains(&hook.last_execution_time, series_id), E_SERIES_ALREADY_REGISTERED);
        
        table::add(&mut hook.last_execution_time, series_id, 0);
        
        event::emit(OrderSeriesRegistered {
            series_id,
            user: tx_context::sender(ctx),
        });
    }
}

// =============================================================================
// PRICE PREDICATE MODULE
// =============================================================================

module trading_hooks::price_predicate {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;

    // Error codes
    const E_INVALID_PRICE: u64 = 1;

    // Oracle interface struct (simplified)
    public struct PriceOracle has key {
        id: UID,
        price: u64,
        decimals: u8,
    }

    // Stateless predicate check
    public fun check_price(oracle: &PriceOracle, max_price: u64): bool {
        assert!(oracle.price > 0, E_INVALID_PRICE);
        oracle.price < max_price
    }

    // Helper function to get current price
    public fun get_price(oracle: &PriceOracle): u64 {
        oracle.price
    }

    // Create a mock oracle (for testing - in production, use Pyth or Switchboard)
    public entry fun create_oracle(price: u64, decimals: u8, ctx: &mut TxContext) {
        let oracle = PriceOracle {
            id: object::new(ctx),
            price,
            decimals,
        };
        transfer::share_object(oracle);
    }
}

// =============================================================================
// TIMELOCK MODULE (Lock contract equivalent)
// =============================================================================

module trading_hooks::timelock {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;

    // Error codes
    const E_UNLOCK_TIME_PAST: u64 = 1;
    const E_NOT_UNLOCKED: u64 = 2;
    const E_NOT_OWNER: u64 = 3;

    // Structs
    public struct Lock has key {
        id: UID,
        unlock_time: u64,
        owner: address,
        balance: Coin<SUI>,
    }

    // Events
    public struct Withdrawal has copy, drop {
        amount: u64,
        when: u64,
    }

    // Create a new timelock
    public entry fun create_lock(
        payment: Coin<SUI>,
        unlock_time: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < unlock_time, E_UNLOCK_TIME_PAST);

        let lock = Lock {
            id: object::new(ctx),
            unlock_time,
            owner: tx_context::sender(ctx),
            balance: payment,
        };

        transfer::share_object(lock);
    }

    // Withdraw funds after unlock time
    public entry fun withdraw(
        lock: &mut Lock,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= lock.unlock_time, E_NOT_UNLOCKED);
        assert!(tx_context::sender(ctx) == lock.owner, E_NOT_OWNER);

        let amount = coin::value(&lock.balance);
        let withdrawn = coin::split(&mut lock.balance, amount, ctx);

        event::emit(Withdrawal {
            amount,
            when: current_time,
        });

        transfer::public_transfer(withdrawn, lock.owner);
    }

    // View functions
    public fun get_unlock_time(lock: &Lock): u64 {
        lock.unlock_time
    }

    public fun get_owner(lock: &Lock): address {
        lock.owner
    }

    public fun get_balance(lock: &Lock): u64 {
        coin::value(&lock.balance)
    }
}