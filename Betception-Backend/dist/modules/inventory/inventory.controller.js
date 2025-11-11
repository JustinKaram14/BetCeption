import { AppDataSource } from '../../db/data-source.js';
import { UserPowerup } from '../../entity/UserPowerup.js';
export async function listInventory(req, res) {
    const userId = String(req.user?.sub);
    const repo = AppDataSource.getRepository(UserPowerup);
    const powerups = await repo.find({
        where: { user: { id: userId } },
        relations: ['type'],
        order: { acquiredAt: 'DESC' },
    });
    return res.json({
        items: powerups.map((entry) => ({
            id: entry.id,
            quantity: entry.quantity,
            acquiredAt: entry.acquiredAt,
            type: entry.type
                ? {
                    id: entry.type.id,
                    code: entry.type.code,
                    title: entry.type.title,
                    description: entry.type.description,
                    minLevel: entry.type.minLevel,
                    price: Number(entry.type.price),
                    effect: entry.type.effectJson,
                }
                : null,
        })),
    });
}
