require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// --- Database Connection (Pool) ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bi_dashboard",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// db (Promise) สำหรับใช้กับ async/await
const db = pool.promise(); 

// เช็ค Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ DB Error:", err.message);
    } else {
        console.log(`✅ Connected to Database: ${process.env.DB_NAME || "bi_dashboard"}`);
        connection.release();
    }
});

// --- Upload Config ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// ==========================================
// 🚀 SERVE REACT BUILD (Production)
// ==========================================
const distPath = path.join(__dirname, "dist");
const buildPath = path.join(__dirname, "build");
let finalFrontendPath = "";

if (fs.existsSync(distPath)) {
    finalFrontendPath = distPath;
} else if (fs.existsSync(buildPath)) {
    finalFrontendPath = buildPath;
}

if (finalFrontendPath) {
    app.use(express.static(finalFrontendPath));
}

// ==========================================
// 🔐 Auth APIs (Login / Register)
// ==========================================

app.post("/api/register", async (req, res) => {
    const { org_name, username, password, role } = req.body;
    if (!org_name || !username || !password) return res.status(400).json({ message: "ข้อมูลไม่ครบ" });

    pool.getConnection(async (err, conn) => {
        if (err) return res.status(500).json({ message: "DB Error" });

        try {
            const [existingUsers] = await conn.promise().query("SELECT id FROM users WHERE username = ?", [username]);
            if (existingUsers.length > 0) {
                conn.release();
                return res.status(400).json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
            }

            await conn.promise().beginTransaction();

            const [orgResult] = await conn.promise().query("INSERT INTO organizations (name) VALUES (?)", [org_name]);
            const newOrgId = orgResult.insertId;
            const hashedPassword = await bcrypt.hash(password, 10);

            await conn.promise().query(
                "INSERT INTO users (organization_id, username, password, role, created_at) VALUES (?, ?, ?, ?, NOW())",
                [newOrgId, username, hashedPassword, role || 'Admin']
            );

            await conn.promise().commit();
            conn.release();
            res.status(201).json({ message: "Registration successful" });

        } catch (error) {
            await conn.promise().rollback();
            conn.release();
            res.status(500).json({ message: "Register Failed", error });
        }
    });
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT u.*, o.name as org_name FROM users u JOIN organizations o ON u.organization_id = o.id WHERE u.username = ?`;
    pool.query(sql, [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: "User not found" });
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Password Incorrect" });
        res.json({ id: user.id, username: user.username, role: user.role, organization_id: user.organization_id, org_name: user.org_name });
    });
});

// ==========================================
// 🏷️ Metadata APIs (Category / Variants)
// ==========================================

app.get("/api/categories", (req, res) => {
    const { org_id } = req.query;
    const sql = "SELECT * FROM product_categories WHERE organization_id = ? ORDER BY name ASC";
    pool.query(sql, [org_id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.post("/api/categories", (req, res) => {
    const { org_id, name } = req.body;
    pool.query("SELECT id FROM product_categories WHERE organization_id = ? AND name = ?", [org_id, name], (err, results) => {
        if (results && results.length > 0) return res.json({ id: results[0].id });
        pool.query("INSERT INTO product_categories (organization_id, name) VALUES (?, ?)", [org_id, name], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId, name });
        });
    });
});

app.get("/api/variant-options", (req, res) => {
    const { org_id } = req.query;
    pool.query("SELECT * FROM variant_options WHERE organization_id = ? ORDER BY name ASC", [org_id], (err, results) => {
        res.json(results || []);
    });
});

app.post("/api/variant-options", (req, res) => {
    const { org_id, name } = req.body;
    pool.query("INSERT INTO variant_options (organization_id, name) VALUES (?, ?)", [org_id, name], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, name });
    });
});

// ==========================================
// 📦 Product Management APIs (Production)
// ==========================================

app.get("/api/products", (req, res) => {
    const { org_id } = req.query;
    const sql = `
    SELECT p.*, c.name AS category_name 
    FROM products p 
    LEFT JOIN product_categories c ON p.category_id = c.id 
    WHERE p.organization_id = ? 
    ORDER BY p.id DESC
  `;

    pool.query(sql, [org_id], (err, products) => {
        if (err) return res.status(500).json(err);
        if (!products || products.length === 0) return res.json([]);

        const productIds = products.map(p => p.id);
        const sqlVariants = `SELECT * FROM product_variants WHERE product_id IN (?)`;

        pool.query(sqlVariants, [productIds], (err, variants) => {
            const variantsList = err ? [] : variants;
            const finalData = products.map(p => ({
                ...p,
                category: p.category_name || 'ไม่ระบุ',
                image_url: p.image_url ? `/uploads/${p.image_url}` : null,
                cost_breakdown: p.cost_breakdown ? JSON.parse(p.cost_breakdown) : {},
                variants: variantsList.filter(v => v.product_id === p.id)
            }));
            res.json(finalData);
        });
    });
});

// 📌 ฟังก์ชันช่วยแปลงวันที่ให้ MySQL อ่านได้ชัวร์ๆ
const getMySQLDate = (dateStr) => {
    if (dateStr && dateStr.includes(':')) return dateStr;
    const now = new Date();
    // ปรับ Timezone ให้ตรงกับเครื่อง (ป้องกันเวลาเพี้ยนบน Host)
    const tzOffset = now.getTimezoneOffset() * 60000;
    return (new Date(now - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');
};

// ✅ แก้ไข API เพิ่มสินค้า/บันทึกการผลิต (Fix สต็อกและบัญชี)
app.post("/api/products", upload.single("image"), async (req, res) => {
    let { name, category_id, price, cost, stock, unit, cost_breakdown, org_id, variants, transaction_date } = req.body;
    
    // แปลง Data Type ให้ปลอดภัย
    org_id = parseInt(org_id) || 0;
    category_id = category_id && category_id !== "null" ? parseInt(category_id) : null;
    price = parseFloat(price) || 0;
    cost = parseFloat(cost) || 0;
    stock = parseInt(stock) || 0;
    const variantsList = variants ? JSON.parse(variants) : [];
    
    // จัดการรูปภาพ
    let finalImage = req.file ? req.file.filename : (req.body.image_url || null);
    if (finalImage && finalImage.includes('/uploads/')) {
        finalImage = finalImage.split('/uploads/')[1];
    }

    // จัดการเวลา
    const finalDate = getMySQLDate(transaction_date);

    if (!org_id) return res.status(400).json({ message: "Org ID required" });

    try {
        if (variantsList.length > 0) {
            // --- กรณีมีรุ่นแยก (Variants) ---
            let totalAddedStock = 0;
            let targetProductId = null;

            for (const v of variantsList) {
                const [existing] = await db.query(
                    `SELECT p.id as p_id, v.id as v_id 
                     FROM products p 
                     JOIN product_variants v ON p.id = v.product_id 
                     WHERE p.name = ? AND (p.category_id = ? OR p.category_id IS NULL) AND v.name = ? AND p.organization_id = ?`,
                    [name, category_id, v.name, org_id]
                );

                const addedQty = parseInt(v.stock) || 0;
                totalAddedStock += addedQty;

                if (existing.length > 0) {
                    const { p_id, v_id } = existing[0];
                    targetProductId = p_id;
                    await db.query("UPDATE product_variants SET stock = stock + ?, price = ?, cost = ? WHERE id = ?", [addedQty, price, cost, v_id]);
                } else {
                    if (!targetProductId) {
                        const [newP] = await db.query(
                            "INSERT INTO products (organization_id, name, category_id, price, cost, stock, unit, image_url, cost_breakdown) VALUES (?,?,?,?,?,0,?,?,?)",
                            [org_id, name, category_id, price, cost, unit, finalImage, cost_breakdown]
                        );
                        targetProductId = newP.insertId;
                    }
                    await db.query("INSERT INTO product_variants (product_id, name, price, cost, stock) VALUES (?,?,?,?,?)", [targetProductId, v.name, price, cost, addedQty]);
                }
            }

            if (targetProductId) {
                await db.query("UPDATE products SET stock = stock + ?, unit = ?, cost_breakdown = ?, price = ?, cost = ? WHERE id = ?", 
                    [totalAddedStock, unit, cost_breakdown, price, cost, targetProductId]);
                
                await saveLogAndLedgerPromise(org_id, targetProductId, totalAddedStock, cost, price, `ผลิตเพิ่ม: ${name} (รวมทุกขนาด)`, finalDate);
            }
        } else {
            // --- กรณีไม่มีรุ่นแยก ---
            const addedQty = stock;
            const [existingProd] = await db.query(
                "SELECT id FROM products WHERE name = ? AND (category_id = ? OR category_id IS NULL) AND organization_id = ?", 
                [name, category_id, org_id]
            );
            
            if (existingProd.length > 0) {
                const pId = existingProd[0].id;
                await db.query("UPDATE products SET stock = stock + ?, price = ?, cost = ?, unit = ?, cost_breakdown = ? WHERE id = ?", [addedQty, price, cost, unit, cost_breakdown, pId]);
                await saveLogAndLedgerPromise(org_id, pId, addedQty, cost, price, `ผลิตเพิ่ม: ${name}`, finalDate);
            } else {
                const [newP] = await db.query("INSERT INTO products (organization_id, name, category_id, price, cost, stock, unit, image_url, cost_breakdown) VALUES (?,?,?,?,?,?,?,?,?)", 
                    [org_id, name, category_id, price, cost, addedQty, unit, finalImage, cost_breakdown]);
                await saveLogAndLedgerPromise(org_id, newP.insertId, addedQty, cost, price, `ผลิตสินค้าใหม่: ${name}`, finalDate);
            }
        }
        res.json({ message: "Process Completed Successfully" });
    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", error: error.message });
    }
});

// ✅ ปรับปรุงให้โยน Error ออกมาถ้าระบบบัญชีพัง
async function saveLogAndLedgerPromise(org_id, product_id, qty, cost, price, note, finalDate) {
    try {
        await db.query("INSERT INTO stock_logs (organization_id, product_id, type, quantity, note, transaction_date) VALUES (?, ?, 'RESTOCK', ?, ?, ?)", [org_id, product_id, qty, note, finalDate]);
        
        const totalCost = Number(cost) * Number(qty);
        if (totalCost > 0) {
            const refNo = `PROD-${product_id}-${Math.floor(Math.random() * 10000)}`;
            await db.query(`INSERT INTO ledger (organization_id, transaction_date, description, category, reference_no, debit, credit) VALUES (?, ?, ?, 'ค่าวัตถุดิบ/ผลิต', ?, 0, ?)`, [org_id, finalDate, note, refNo, totalCost]);
        }
    } catch (err) { 
        console.error("❌ Log & Ledger Error:", err);
        throw err; // โยน Error กลับไปให้ route เพื่อแจ้งเตือนไปที่เว็บ 
    }
}

app.post("/api/products/restock", (req, res) => {
    const { org_id, product_name, variant_name, add_stock, new_cost, new_price } = req.body;
    const transactionDate = getMySQLDate();
    pool.query("SELECT id FROM products WHERE organization_id = ? AND name = ?", [org_id, product_name], (err, products) => {
        if (!products || products.length === 0) return res.status(404).json({ message: "Not found" });
        const productId = products[0].id;
        pool.query("UPDATE products SET stock = stock + ?, cost = ?, price = ? WHERE id = ?", [add_stock, new_cost, new_price, productId]);
        if (variant_name) {
            pool.query("UPDATE product_variants SET stock = stock + ? WHERE product_id = ? AND name = ?", [add_stock, productId, variant_name]);
        }
        saveLogAndLedger(org_id, productId, add_stock, new_cost, new_price, `เติมสต็อก: ${product_name} ${variant_name ? "(" + variant_name + ")" : ""}`, transactionDate, res);
    });
});

app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, category_id, price, cost, stock, unit, image_url, organization_id } = req.body;
    let finalImage = image_url;
    if (image_url && image_url.includes('/uploads/')) finalImage = image_url.split('/uploads/')[1];
    
    // จัดการ category_id ถ้าเป็นค่าว่างหรือ null ให้เป็น null จริงๆ เพื่อป้องกัน strict mode error
    const finalCatId = category_id && category_id !== "null" ? category_id : null;

    const sql = `UPDATE products SET name=?, category_id=?, price=?, cost=?, stock=?, unit=?, image_url=? WHERE id=? AND organization_id=?`;
    pool.query(sql, [name, finalCatId, price, cost, stock, unit, finalImage, id, organization_id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Updated");
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { org_id } = req.query;
    pool.query("DELETE FROM product_variants WHERE product_id = ?", [id], () => {
        pool.query("DELETE FROM products WHERE id = ? AND organization_id = ?", [id, org_id], (err) => {
            if (err) return res.status(500).send(err);
            res.send("Deleted");
        });
    });
});

function saveLogAndLedger(org_id, product_id, qty, cost, price, note, transactionDate, res) {
    const finalDate = transactionDate || getMySQLDate();
    pool.query("INSERT INTO stock_logs (organization_id, product_id, type, quantity, note, transaction_date) VALUES (?, ?, 'RESTOCK', ?, ?, ?)", [org_id, product_id, qty, note, finalDate], () => {
        const totalCost = Number(cost) * Number(qty);
        if (totalCost > 0) {
            const refNo = `RESTOCK-${product_id}`;
            pool.query(`INSERT INTO ledger (organization_id, transaction_date, description, category, reference_no, debit, credit) VALUES (?, ?, ?, 'ค่าวัตถุดิบ/ผลิต', ?, 0, ?)`, [org_id, finalDate, note, refNo, totalCost], () => {
                res.json({ message: "Success" });
            });
        } else { res.json({ message: "Success" }); }
    });
}

// ==========================================
// 📝 Stock Logs & Transactions
// ==========================================

app.get("/api/stock-logs", (req, res) => {
    const { org_id } = req.query;
    const sql = `
        SELECT l.*, p.name AS product_name, p.image_url, c.name AS category_name
        FROM stock_logs l 
        LEFT JOIN products p ON l.product_id = p.id 
        LEFT JOIN product_categories c ON p.category_id = c.id
        WHERE l.organization_id = ? 
        ORDER BY l.transaction_date DESC
    `;
    pool.query(sql, [org_id], (err, results) => {
        if (err) return res.status(500).json(err);
        const logs = results.map(l => ({
            ...l,
            image_url: l.image_url ? `/uploads/${l.image_url}` : null
        }));
        res.json(logs);
    });
});

// ==========================================
// 🛒 Orders & Sales
// ==========================================

app.post("/api/orders", (req, res) => {
    const { org_id, user_id, customer_name, payment_method, channel, total_amount, items, sale_date } = req.body;
    
    if (!org_id || total_amount === undefined || total_amount === null) {
        return res.status(400).json({ message: "Data incomplete" });
    }

    pool.getConnection((err, conn) => {
        if (err) return res.status(500).json({ message: "DB Connection Error" });
        
        conn.beginTransaction(async (err) => {
            if (err) { conn.release(); return res.status(500).json({ message: "Transaction Error" }); }
            
            try {
                const finalDate = sale_date || getMySQLDate();

                const sqlOrder = `INSERT INTO orders (organization_id, user_id, customer_name, payment_method, channel, total_amount, order_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                const [orderResult] = await conn.promise().query(sqlOrder, [org_id, user_id || 0, customer_name || 'ทั่วไป', payment_method, channel, total_amount, finalDate]);
                const orderId = orderResult.insertId;

                const itemPromises = items.map(item => {
                    const sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?)";
                    const p1 = conn.promise().query(sqlItem, [orderId, item.product_id, item.quantity, item.price, item.cost]);
                    
                    const p2 = conn.promise().query("UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?", [item.quantity, item.product_id]);
                    
                    const logNote = item.price <= 0.01 ? `ขาย Order #${orderId} (แจกฟรี/ทดลอง)` : `ขาย Order #${orderId}`;
                    const p3 = conn.promise().query("INSERT INTO stock_logs (organization_id, product_id, type, quantity, note, transaction_date) VALUES (?, ?, 'SALE', ?, ?, ?)", [org_id, item.product_id, item.quantity, logNote, finalDate]);
                    
                    return Promise.all([p1, p2, p3]);
                });

                await Promise.all(itemPromises);

                const incomeAmount = parseFloat(total_amount);
                if (incomeAmount >= 0) {
                    const ledgerDesc = incomeAmount <= 0.01 ? `แจกสินค้าทดลอง Order #${orderId}` : `รายรับจากการขาย Order #${orderId}`;
                    const sqlLedger = `INSERT INTO ledger (organization_id, transaction_date, description, category, reference_no, debit, credit) VALUES (?, ?, ?, 'รายรับ (ขายสินค้า)', ?, ?, 0)`;
                    await conn.promise().query(sqlLedger, [org_id, finalDate, ledgerDesc, `ORD-${orderId}`, incomeAmount]);
                }

                conn.commit(err => {
                    conn.release();
                    if (err) return res.status(500).json({ message: "Commit Error" });
                    res.json({ message: "Success", orderId });
                });
            } catch (error) {
                conn.rollback(() => { 
                    conn.release(); 
                    res.status(500).json({ message: "Failed", error: error.message }); 
                });
            }
        });
    });
});

app.get("/api/orders", (req, res) => {
    const { org_id } = req.query;
    pool.query("SELECT * FROM orders WHERE organization_id = ? ORDER BY order_date DESC", [org_id], (err, results) => res.json(results));
});

// ==========================================
// 📒 General Ledger APIs
// ==========================================

app.get("/api/ledger", (req, res) => {
    const { org_id } = req.query;
    const sql = "SELECT * FROM ledger WHERE organization_id = ? ORDER BY transaction_date DESC";
    pool.query(sql, [org_id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post("/api/ledger", (req, res) => {
    const { transaction_date, description, category, reference_no, debit, credit, organization_id } = req.body;
    const finalDate = getMySQLDate(transaction_date);
    const sql = "INSERT INTO ledger (organization_id, transaction_date, description, category, reference_no, debit, credit) VALUES (?, ?, ?, ?, ?, ?, ?)";
    pool.query(sql, [organization_id, finalDate, description, category, reference_no, debit, credit], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Saved", id: result.insertId });
    });
});

app.put("/api/ledger/:id", (req, res) => {
    const { id } = req.params;
    const { transaction_date, description, category, debit, credit } = req.body;
    const finalDate = getMySQLDate(transaction_date);
    const sql = `UPDATE ledger SET transaction_date=?, description=?, category=?, debit=?, credit=? WHERE id=?`;
    pool.query(sql, [finalDate, description, category, debit, credit, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Updated" });
    });
});

app.delete("/api/ledger/:id", (req, res) => {
    pool.query("DELETE FROM ledger WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Deleted" });
    });
});

app.get("/api/transactions", (req, res) => {
    const { org_id } = req.query;
    const sql = `
    SELECT 
      oi.id, o.order_date as transaction_date, p.name as product, p.category_id, c.name as category, 
      oi.quantity, oi.unit_cost as cost, oi.unit_price as price, (oi.unit_price * oi.quantity) as total_sales
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE o.organization_id = ?
    ORDER BY o.order_date DESC
  `;
    pool.query(sql, [org_id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ==========================================
// 👑 Admin APIs
// ==========================================

app.get("/api/admin/users", (req, res) => {
    const sql = `
        SELECT u.id, u.username, u.role, u.organization_id, o.name as org_name 
        FROM users u 
        JOIN organizations o ON u.organization_id = o.id 
        ORDER BY u.id DESC
    `;
    pool.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.put("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    const { username, org_name, password } = req.body;

    pool.getConnection(async (err, conn) => {
        if (err) return res.status(500).json({ message: "DB Error" });
        try {
            await conn.promise().beginTransaction();
            const [userRows] = await conn.promise().query("SELECT organization_id FROM users WHERE id = ?", [id]);
            if (userRows.length === 0) {
                conn.release();
                return res.status(404).json({ message: "User not found" });
            }
            const orgId = userRows[0].organization_id;
            await conn.promise().query("UPDATE organizations SET name = ? WHERE id = ?", [org_name, orgId]);
            let updateUserSql = "UPDATE users SET username = ? WHERE id = ?";
            let updateParams = [username, id];
            if (password && password.trim() !== "") {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateUserSql = "UPDATE users SET username = ?, password = ? WHERE id = ?";
                updateParams = [username, hashedPassword, id];
            }
            await conn.promise().query(updateUserSql, updateParams);
            await conn.promise().commit();
            conn.release();
            res.json({ message: "Updated successfully" });
        } catch (error) {
            await conn.promise().rollback();
            conn.release();
            res.status(500).json({ message: "Update failed", error });
        }
    });
});

app.get("/api/orders/:id/items", (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT oi.*, p.name as product_name, p.image_url, p.unit
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `;
    pool.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        const items = results.map(item => ({
            ...item,
            image_url: item.image_url ? `/uploads/${item.image_url}` : null
        }));
        res.json(items);
    });
});

app.delete("/api/admin/users/:id", (req, res) => {
    pool.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Deleted" });
    });
});

// Final fallback for React Router
app.get(/(.*)/, (req, res) => {
    if (finalFrontendPath) {
        res.sendFile(path.join(finalFrontendPath, "index.html"));
    } else {
        res.status(404).send("Frontend build not found");
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});