export function notFoundHandler(req, res, _next) {
    res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
}
