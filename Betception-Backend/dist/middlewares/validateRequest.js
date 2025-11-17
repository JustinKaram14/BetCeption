/**
 * Validates the specified request segment against a Zod schema.
 * Sanitized data overwrites the original request segment to keep downstream handlers typed.
 */
export function validateRequest(schema, target = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.flatten() });
        }
        req[target] = result.data;
        next();
    };
}
