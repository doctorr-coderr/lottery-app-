"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// Import routes
const withdraw_1 = __importDefault(require("./routes/withdraw"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const deposits_1 = __importDefault(require("./routes/deposits"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const draws_1 = __importDefault(require("./routes/draws"));
const admin_1 = __importDefault(require("./routes/admin"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Import DB
const db_1 = __importDefault(require("./utils/db"));
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploads statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath) => {
        res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:3000');
        // Set cache headers for production
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/deposits', deposits_1.default);
app.use('/api/tickets', tickets_1.default);
app.use('/api/withdraw', withdraw_1.default);
app.use('/api/draws', draws_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/notifications', notifications_1.default);
// Basic health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is running!' });
});
// Test DB connection
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await db_1.default.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.users);
        res.json({ success: true, userCount: result[0].count });
    }
    catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ success: false, error: 'Database connection failed' });
    }
});
// Debug: all users
app.get('/api/debug/users', async (req, res) => {
    try {
        const allUsers = await db_1.default.select().from(schema_1.users);
        res.json(allUsers);
    }
    catch (error) {
        console.error('Debug users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Debug: all deposits
app.get('/api/debug/deposits', async (req, res) => {
    try {
        const allDeposits = await db_1.default.select().from(schema_1.depositRequests);
        res.json(allDeposits);
    }
    catch (error) {
        console.error('Debug deposits error:', error);
        res.status(500).json({ error: 'Failed to fetch deposits' });
    }
});
// Debug: all draws
app.get('/api/debug/draws', async (req, res) => {
    try {
        const allDraws = await db_1.default.select().from(schema_1.draws);
        res.json(allDraws);
    }
    catch (error) {
        console.error('Debug draws error:', error);
        res.status(500).json({ error: 'Failed to fetch draws' });
    }
});
// Debug: uploaded files
app.get('/api/debug/uploads', (req, res) => {
    try {
        const files = fs_1.default.readdirSync(uploadsDir);
        res.json({
            uploadsDirectory: uploadsDir,
            fileCount: files.length,
            files: files
        });
    }
    catch (error) {
        console.error('Error reading uploads directory:', error);
        res.status(500).json({ error: 'Error reading uploads directory' });
    }
});
// 404 handler - must be last
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
