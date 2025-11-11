export const dailyRewardConfig = {
    minAmount: 200,
    maxAmount: 500,
};
export function nextEligibleDateUtc() {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return next.toISOString();
}
