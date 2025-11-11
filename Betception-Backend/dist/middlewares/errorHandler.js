import { ZodError } from 'zod';
export function errorHandler(err, _req, res, _next) {
    console.error(err);
    if (err instanceof ZodError) {
        return res.status(400).json({ errors: err.flatten() });
    }
    res.status(err.status ?? 500).json({ message: err.message ?? 'Internal server error' });
}
