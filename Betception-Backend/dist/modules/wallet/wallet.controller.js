import { AppDataSource } from '../../db/data-source.js';
import { User } from '../../entity/User.js';
import { WalletTransaction } from '../../entity/WalletTransaction.js';
import { WalletTransactionKind } from '../../entity/enums.js';
import { centsToDecimal, decimalToCents } from '../../utils/money.js';
export async function getWalletSummary(req, res) {
    const userId = String(req.user?.sub);
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({
        where: { id: userId },
        select: ['id', 'username', 'balance', 'xp', 'level', 'lastDailyRewardAt'],
    });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    return res.json({
        id: user.id,
        username: user.username,
        balance: user.balance,
        xp: user.xp,
        level: user.level,
        lastDailyRewardAt: user.lastDailyRewardAt,
    });
}
export async function getWalletTransactions(req, res) {
    const userId = String(req.user?.sub);
    const { limit, page } = req.query;
    const repo = AppDataSource.getRepository(WalletTransaction);
    const [items, total] = await repo.findAndCount({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: (page - 1) * limit,
    });
    return res.json({
        page,
        pageSize: limit,
        total,
        items: items.map((tx) => ({
            id: tx.id,
            kind: tx.kind,
            amount: tx.amount,
            refTable: tx.refTable,
            refId: tx.refId,
            createdAt: tx.createdAt,
        })),
    });
}
class WalletAdjustmentError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'WalletAdjustmentError';
    }
}
export async function depositFunds(req, res) {
    try {
        const userId = String(req.user?.sub);
        const amountCents = decimalToCents(req.body.amount);
        const result = await performWalletAdjustment(userId, amountCents, WalletTransactionKind.DEPOSIT, req.body.reference);
        return res.status(201).json({
            message: 'Deposit recorded',
            balance: result.balance,
            transactionId: result.transactionId,
        });
    }
    catch (error) {
        return handleWalletError(res, error);
    }
}
export async function withdrawFunds(req, res) {
    try {
        const userId = String(req.user?.sub);
        const amountCents = decimalToCents(req.body.amount);
        const result = await performWalletAdjustment(userId, amountCents, WalletTransactionKind.WITHDRAW, req.body.reference);
        return res.status(201).json({
            message: 'Withdrawal recorded',
            balance: result.balance,
            transactionId: result.transactionId,
        });
    }
    catch (error) {
        return handleWalletError(res, error);
    }
}
async function performWalletAdjustment(userId, amountCents, kind, reference) {
    return AppDataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const walletRepo = manager.getRepository(WalletTransaction);
        const user = await userRepo.findOne({
            where: { id: userId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!user) {
            throw new WalletAdjustmentError(404, 'USER_NOT_FOUND', 'User not found');
        }
        const balanceCents = decimalToCents(user.balance);
        if (kind === WalletTransactionKind.WITHDRAW && balanceCents < amountCents) {
            throw new WalletAdjustmentError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
        }
        const newBalance = kind === WalletTransactionKind.WITHDRAW
            ? balanceCents - amountCents
            : balanceCents + amountCents;
        user.balance = centsToDecimal(newBalance);
        await userRepo.save(user);
        const signedAmount = kind === WalletTransactionKind.WITHDRAW ? -amountCents : amountCents;
        const tx = walletRepo.create({
            user,
            kind,
            amount: centsToDecimal(signedAmount),
            refTable: reference ?? 'wallet_manual',
            refId: null,
        });
        await walletRepo.save(tx);
        return {
            balance: centsToDecimal(newBalance),
            transactionId: tx.id,
        };
    });
}
function handleWalletError(res, error) {
    if (error instanceof WalletAdjustmentError) {
        return res
            .status(error.statusCode)
            .json({ message: error.message, code: error.code });
    }
    throw error;
}
