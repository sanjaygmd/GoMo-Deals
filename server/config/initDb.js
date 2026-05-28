import { pool } from './db.js';

export const initSchema = async () => {
    try {
        // Enable pgcrypto for gen_random_uuid() and crypt()
        await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        // --- MIGRATIONS & SCHEMA HARDENING ---
        const tableExists = async (tableName) => {
            const res = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [tableName]);
            return res.rows[0].exists;
        };
        
        // 1. Fix Shiprocket Tables (UUID to VARCHAR migration)
        const checkShiprocket = await pool.query(`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'shiprocket_orders' AND column_name = 'sr_order_id'
        `);
        if (checkShiprocket.rows.length > 0 && checkShiprocket.rows[0].data_type === 'uuid') {
            console.log('Migrating shiprocket_orders: Dropping incompatible UUID-based table...');
            await pool.query('DROP TABLE IF EXISTS shiprocket_orders CASCADE');
        }

        const checkTracking = await pool.query(`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'shiprocket_tracking' AND column_name = 'sr_order_id'
        `);
        if (checkTracking.rows.length > 0 && checkTracking.rows[0].data_type === 'uuid') {
            console.log('Migrating shiprocket_tracking: Dropping incompatible UUID-based table...');
            await pool.query('DROP TABLE IF EXISTS shiprocket_tracking CASCADE');
        }

        const checkDeliveries = await pool.query(`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'deliveries' AND column_name = 'shiprocket_order_id'
        `);
        if (checkDeliveries.rows.length > 0 && checkDeliveries.rows[0].data_type === 'uuid') {
            console.log('Migrating deliveries: Dropping incompatible UUID-based table...');
            await pool.query('DROP TABLE IF EXISTS deliveries CASCADE');
        }

        // 2. Fix super_admins schema (Add missing master_key column and hash it)
        if (await tableExists('super_admins')) {
            await pool.query(`
                ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS master_key VARCHAR(255);
            `);
            
            // Populate existing null master_keys with a hash of the environment key
            const existingAdmins = await pool.query("SELECT super_admin_id FROM super_admins WHERE master_key IS NULL");
            if (existingAdmins.rows.length > 0) {
                const bcrypt = await import('bcryptjs').then(m => m.default);
                const hashedKey = await bcrypt.hash(process.env.MASTER_SECURITY_KEY || 'default_secure_key', 12);
                await pool.query("UPDATE super_admins SET master_key = $1 WHERE master_key IS NULL", [hashedKey]);
                console.log(`Initialized master_key for ${existingAdmins.rows.length} super admins.`);
            }
        }

        // 3. Fix notifications schema (Add missing admin_id column)
        if (await tableExists('notifications')) {
            await pool.query(`
                ALTER TABLE notifications ADD COLUMN IF NOT EXISTS admin_id UUID;
            `);
        }

        // 4. Ensure user_profile column exists on auth_sessions table
        if (await tableExists('auth_sessions')) {
            await pool.query(`
                ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS user_profile JSONB DEFAULT '{}'::jsonb;
            `);
        }

        // 5. Restructure seller payouts ledger & retire seller_commissions
        if (await tableExists('order_sellers')) {
            await pool.query(`
                ALTER TABLE order_sellers ADD COLUMN IF NOT EXISTS seller_platform_fee DECIMAL(15,2) DEFAULT 15.00;
                ALTER TABLE order_sellers ADD COLUMN IF NOT EXISTS seller_earnings DECIMAL(15,2) DEFAULT 0.00;
                ALTER TABLE order_sellers ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'Pending';
                ALTER TABLE order_sellers ADD COLUMN IF NOT EXISTS payout_id UUID;
            `);
            await pool.query(`DROP TABLE IF EXISTS seller_commissions CASCADE`);
        }

        // --- TABLE INITIALIZATION ---

        // Shiprocket Orders Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shiprocket_orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(255) NOT NULL UNIQUE,
                sr_order_id VARCHAR(255) NOT NULL,
                shipment_id VARCHAR(255) NOT NULL,
                awb_code VARCHAR(255),
                courier_name VARCHAR(255),
                sr_status VARCHAR(50) DEFAULT 'NEW',
                sr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Shiprocket Tracking Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shiprocket_tracking (
                id SERIAL PRIMARY KEY,
                sr_order_id VARCHAR(255) NOT NULL,
                status VARCHAR(100),
                status_code INTEGER,
                location VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Categories Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                parent_category_id UUID REFERENCES categories(category_id),
                image_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Customers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                password_hash TEXT NOT NULL,
                date_of_birth DATE,
                gender VARCHAR(20),
                profile_picture_url TEXT,
                membership VARCHAR(50) DEFAULT 'free',
                is_active BOOLEAN DEFAULT TRUE,
                block_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Addresses Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS addresses (
                address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                user_type VARCHAR(20) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                address_line_1 TEXT NOT NULL,
                address_line_2 TEXT,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                pincode VARCHAR(20) NOT NULL,
                country VARCHAR(100) DEFAULT 'India',
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Sellers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sellers (
                seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                password_hash TEXT NOT NULL,
                store_name VARCHAR(255),
                store_logo TEXT,
                store_description TEXT,
                aadhar VARCHAR(20),
                pan VARCHAR(20),
                gstin VARCHAR(20),
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                onboarding_completed BOOLEAN DEFAULT FALSE,
                block_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Products Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                category_id UUID REFERENCES categories(category_id),
                seller_id UUID REFERENCES sellers(seller_id),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                sku VARCHAR(100) UNIQUE,
                price DECIMAL(15,2) NOT NULL,
                mrp DECIMAL(15,2),
                stock_quantity INTEGER DEFAULT 0,
                weight DECIMAL(10,2),
                length DECIMAL(10,2),
                breadth DECIMAL(10,2),
                height DECIMAL(10,2),
                brand VARCHAR(100),
                images TEXT[],
                slug VARCHAR(255) UNIQUE,
                color VARCHAR(50),
                size VARCHAR(50),
                room VARCHAR(100),
                discount_percent DECIMAL(5,2) DEFAULT 0,
                recipient VARCHAR(100),
                occasion VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Product Variants Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_variants (
                variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
                sku VARCHAR(100) UNIQUE,
                variant_name VARCHAR(100),
                variant_value VARCHAR(100),
                price DECIMAL(15,2),
                stock_quantity INTEGER DEFAULT 0,
                weight DECIMAL(10,2),
                name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Product Images Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_images (
                image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
                variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Orders Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID REFERENCES customers(customer_id),
                address_id UUID REFERENCES addresses(address_id),
                subtotal DECIMAL(15,2) NOT NULL,
                shipping_charges DECIMAL(15,2) DEFAULT 0,
                tax_amount DECIMAL(15,2) DEFAULT 0,
                total_amount DECIMAL(15,2) NOT NULL,
                discount_amount DECIMAL(15,2) DEFAULT 0,
                coupon_id UUID,
                platform_fee DECIMAL(15,2) DEFAULT 0,
                cod_fee DECIMAL(15,2) DEFAULT 0,
                order_status VARCHAR(50) DEFAULT 'Pending',
                payment_status VARCHAR(50) DEFAULT 'Pending',
                payment_method VARCHAR(50),
                placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Order Items Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(product_id),
                variant_id UUID REFERENCES product_variants(variant_id),
                seller_id UUID REFERENCES sellers(seller_id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(15,2) NOT NULL,
                total_price DECIMAL(15,2) NOT NULL,
                item_status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Coupons Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                coupon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) UNIQUE NOT NULL,
                type VARCHAR(20) DEFAULT 'percentage',
                discount_percent DECIMAL(5,2),
                discount_amount DECIMAL(15,2),
                max_discount DECIMAL(15,2),
                min_order_value DECIMAL(15,2) DEFAULT 0,
                valid_until DATE,
                max_usage INTEGER,
                used_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                admin_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Coupon Usage Table (Security Fix: UNIQUE constraint for atomic redemption)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS coupon_usage (
                usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                coupon_id UUID REFERENCES coupons(coupon_id) ON DELETE CASCADE,
                customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
                order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(coupon_id, customer_id)
            )
        `);

        // Reviews Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
                customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
                order_item_id UUID REFERENCES order_items(order_item_id) ON DELETE CASCADE,
                variant_id UUID REFERENCES product_variants(variant_id) ON DELETE SET NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                title VARCHAR(255),
                body TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, customer_id)
            )
        `);

        // Audit Logs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                admin_id UUID,
                action VARCHAR(100) NOT NULL,
                table_name VARCHAR(100),
                record_id UUID,
                old_values JSONB,
                new_values JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Cart Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart (
                cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID UNIQUE REFERENCES customers(customer_id) ON DELETE CASCADE,
                total_amount DECIMAL(15,2) DEFAULT 0,
                item_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Cart Items Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cart_id UUID REFERENCES cart(cart_id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
                variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
                quantity INTEGER DEFAULT 1,
                price DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(cart_id, product_id, variant_id)
            )
        `);

        // Admins Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP DEFAULT NULL
            )
        `);

        // Super Admins Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS super_admins (
                super_admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'super_admin',
                master_key VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login_at TIMESTAMP DEFAULT NULL
            )
        `);

        // Notifications Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID,
                seller_id UUID,
                admin_id UUID,
                order_id UUID,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Admin Settings Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_settings (
                admin_id UUID NOT NULL,
                key VARCHAR(255) NOT NULL,
                value JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (admin_id, key)
            )
        `);

        // Order Sellers Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_sellers (
                order_seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
                seller_id UUID NOT NULL REFERENCES sellers(seller_id) ON DELETE CASCADE,
                seller_subtotal DECIMAL(15,2) NOT NULL,
                seller_platform_fee DECIMAL(15,2) DEFAULT 15.00,
                seller_earnings DECIMAL(15,2) DEFAULT 0.00,
                payout_status VARCHAR(50) DEFAULT 'Pending',
                payout_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(order_id, seller_id)
            )
        `);

        // Payments Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID REFERENCES customers(customer_id),
                order_id UUID REFERENCES orders(order_id),
                amount DECIMAL(15,2) NOT NULL,
                payment_method VARCHAR(50),
                payment_status VARCHAR(50),
                transaction_id VARCHAR(255) UNIQUE,
                paid_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Orphaned Payments Table (for Razorpay Webhooks)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orphaned_payments (
                orphaned_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                payment_id VARCHAR(255) UNIQUE NOT NULL,
                razorpay_order_id VARCHAR(255) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'Captured',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // OTP Verifications Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                email VARCHAR(255) NOT NULL,
                otp_hash TEXT NOT NULL,
                purpose VARCHAR(50) NOT NULL,
                attempts INTEGER DEFAULT 0,
                is_verified BOOLEAN DEFAULT FALSE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (email, purpose)
            )
        `);

        // Auth Sessions Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS auth_sessions (
                session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_ref_id UUID NOT NULL,
                user_type VARCHAR(20) NOT NULL,
                token_hash TEXT NOT NULL,
                last_ip VARCHAR(45),
                last_device JSONB,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // --- NEW & MISSING TABLES / COLUMNS INTEGRATION ---

        // Soft-delete and metrics column injections
        await pool.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

            ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
            ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

            ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

            ALTER TABLE sellers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
            ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

            ALTER TABLE admins ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
            ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

            ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NULL;
            ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NULL;
        `);

        // Critical missing columns — cart, cart_items, orders, reviews
        await pool.query(`
            ALTER TABLE cart ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;
            ALTER TABLE cart ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;

            ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS price DECIMAL(15,2) DEFAULT 0;
            ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier VARCHAR(255);
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(255);
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

            ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // Performance indexes for high-frequency lookup columns
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(token_hash);
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
            CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
            CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
            CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
            CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
            CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
            CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);
            CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_seller_id ON notifications(seller_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
            CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
            CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
            CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
            CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
            CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
        `);

        // Wishlists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                wishlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID UNIQUE REFERENCES customers(customer_id) ON DELETE CASCADE,
                item_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS wishlist_items (
                wishlist_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                wishlist_id UUID REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
                variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(wishlist_id, product_id, variant_id)
            )
        `);

        // Pickup locations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seller_pickup_location (
                pickup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                location_name VARCHAR(255),
                contact_name VARCHAR(255),
                contact_phone VARCHAR(20),
                address_line_1 TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(20),
                is_default BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                shipment_location_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Payouts & Finance ledger
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seller_payouts (
                payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                amount DECIMAL(15,2) NOT NULL,
                payout_period_start TIMESTAMP,
                payout_period_end TIMESTAMP,
                status VARCHAR(50) DEFAULT 'Requested',
                notes TEXT,
                transaction_ref VARCHAR(255),
                initiated_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
                payment_method VARCHAR(50),
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS finance_transactions (
                finance_transactions_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
                payment_id UUID REFERENCES payments(payment_id) ON DELETE SET NULL,
                seller_payout_id UUID REFERENCES seller_payouts(payout_id) ON DELETE SET NULL,
                transaction_type VARCHAR(50) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                daily_finance_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Order history & Bank accounts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_status_history (
                history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
                changed_by UUID NOT NULL,
                status VARCHAR(50) NOT NULL,
                notes TEXT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS bank_accounts (
                bank_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                owner_type VARCHAR(50) NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                ifsc_code VARCHAR(50) NOT NULL,
                account_number VARCHAR(100) NOT NULL,
                account_holder_name VARCHAR(255) NOT NULL,
                account_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Return Requests & Logistics
        await pool.query(`
            CREATE TABLE IF NOT EXISTS return_requests (
                return_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
                order_item_id UUID REFERENCES order_items(order_item_id) ON DELETE CASCADE,
                customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                return_type VARCHAR(50) NOT NULL,
                refund_amount DECIMAL(15,2) DEFAULT 0,
                refund_status VARCHAR(50) DEFAULT 'Pending',
                resolution_note TEXT,
                resolved_by_admin_id UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reverse_shipments (
                reverse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                return_request_id UUID REFERENCES return_requests(return_request_id) ON DELETE CASCADE,
                order_item_id UUID REFERENCES order_items(order_item_id) ON DELETE CASCADE,
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                customer_id UUID REFERENCES customers(customer_id) ON DELETE CASCADE,
                pickup_address_id UUID REFERENCES addresses(address_id) ON DELETE SET NULL,
                dropoff_pickup_location_id UUID REFERENCES seller_pickup_location(pickup_id) ON DELETE SET NULL,
                shiprocket_reverse_order_id VARCHAR(255),
                reverse_awb_code VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Initiated',
                initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Webhooks and deliveries
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shiprocket_webhook_log (
                webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sr_order_id VARCHAR(255),
                event_type VARCHAR(100),
                raw_payload JSONB,
                is_processed BOOLEAN DEFAULT FALSE,
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS deliveries (
                delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
                courier_name VARCHAR(255),
                awb_code VARCHAR(255),
                shipping_status VARCHAR(100),
                shiprocket_order_id VARCHAR(255),
                shipment_id VARCHAR(255),
                dispatched_at TIMESTAMP,
                delivered_at TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Analytics Rollups
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_finances (
                daily_finance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                date DATE NOT NULL,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                platform_commission DECIMAL(15,2) DEFAULT 0,
                net_seller_earnings DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (seller_id, date)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS weekly_finances (
                weekly_finance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                platform_commission DECIMAL(15,2) DEFAULT 0,
                net_seller_earnings DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (seller_id, week_number, year)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS month_finances (
                monthly_finance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                month_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                platform_commission DECIMAL(15,2) DEFAULT 0,
                net_seller_earnings DECIMAL(15,2) DEFAULT 0,
                quarterly_finance_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (seller_id, month_number, year)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS quarterly_finances (
                quarterly_finance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                quarter_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                platform_commission DECIMAL(15,2) DEFAULT 0,
                net_seller_earnings DECIMAL(15,2) DEFAULT 0,
                half_yearly_finance_id UUID,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (seller_id, quarter_number, year)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS half_yearly_finances (
                half_yearly_finance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                half_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                platform_commission DECIMAL(15,2) DEFAULT 0,
                net_seller_earnings DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (seller_id, half_number, year)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS annual_finances (
                annual_finance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                seller_id UUID REFERENCES sellers(seller_id) ON DELETE CASCADE,
                year INTEGER NOT NULL,
                total_revenue DECIMAL(15,2) DEFAULT 0,
                platform_commission DECIMAL(15,2) DEFAULT 0,
                net_seller_earnings DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (seller_id, year)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_offers (
                offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
                customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
                offered_price DECIMAL(15,2) NOT NULL,
                seller_counter_price DECIMAL(15,2) DEFAULT NULL,
                status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Rejected', 'Countered', 'Expired'
                offer_token VARCHAR(255) UNIQUE DEFAULT NULL,
                expires_at TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_offers_customer_id ON product_offers(customer_id);
            CREATE INDEX IF NOT EXISTS idx_offers_product_id ON product_offers(product_id);
        `);

        // Ensure unique coupon customer constraint is applied to pre-existing tables safely
        try {
            await pool.query(`
                ALTER TABLE coupon_usage 
                ADD CONSTRAINT unique_coupon_customer UNIQUE (coupon_id, customer_id)
            `);
            console.log('unique_coupon_customer constraint added successfully');
        } catch (err) {
            if (!err.message.includes('already exists')) {
                console.warn('Warning when adding unique_coupon_customer constraint:', err.message);
            }
        }

        console.log('Database schema synchronized and security constraints applied');

    } catch (error) {
        console.error('Failed to initialize database schema:', error);
    }
};
