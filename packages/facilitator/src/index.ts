import express, { Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PaymentVerificationService } from './services/verification.js';
import { SettlementService } from './services/settlement.js';
import { PaymentStorageService } from './services/storage.js';
import { createFacilitatorRoutes } from './routes/facilitator.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.API_RATE_LIMIT || '100'),
    message: 'Too many requests from this IP',
});
app.use('/api', limiter);

// Initialize services
const verificationService = new PaymentVerificationService(
    process.env.MAX_PAYMENT_AMOUNT
);

const settlementService = new SettlementService(
    process.env.SEPOLIA_RPC_URL || 'https://sepolia.gateway.tenderly.co',
    process.env.FACILITATOR_PRIVATE_KEY || '',
    parseInt(process.env.MIN_CONFIRMATION_BLOCKS || '1')
);

const storageService = new PaymentStorageService();

const autoSettle = process.env.AUTO_SETTLE === 'true';

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'x402-facilitator',
    });
});

// Mount facilitator routes
app.use('/api/facilitator', createFacilitatorRoutes(
    verificationService,
    settlementService,
    storageService,
    autoSettle
));

// Cleanup old payments every hour
setInterval(() => {
    storageService.cleanup();
}, 60 * 60 * 1000);

// Start server
app.listen(port, async () => {
    console.log(`x402 Facilitator Service`);
    console.log(`================================`);
    console.log(`Server: http://localhost:${port}`);
    console.log(`Facilitator Address: ${settlementService.getAddress()}`);
    console.log(`Auto-settle: ${autoSettle ? 'Enabled' : 'Disabled'}`);

    try {
        const balance = await settlementService.getBalance();
        console.log(`Balance: ${balance} ETH`);

        if (parseFloat(balance) < 0.01) {
            console.warn(` WARNING: Low balance! Fund facilitator wallet for settlements`);
        }
    } catch (error) {
        console.error('Failed to get balance:', error);
    }

    console.log(`================================\n`);
})

    ;

export default app;
