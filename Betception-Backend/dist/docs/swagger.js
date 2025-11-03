import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
export function setupSwagger(app) {
    const spec = swaggerJSDoc({
        definition: {
            openapi: '3.0.3',
            info: { title: 'BetCeption API', version: '1.0.0' },
            components: {
                schemas: {
                    RegisterInput: {
                        type: 'object',
                        required: ['email', 'password', 'username'],
                        properties: {
                            email: { type: 'string', format: 'email' },
                            password: { type: 'string', minLength: 8 },
                            username: { type: 'string', minLength: 3, maxLength: 32 }
                        }
                    }
                },
                securitySchemes: {
                    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
                }
            },
            security: [{ bearerAuth: [] }]
        },
        apis: ['src/**/*.router.ts'],
    });
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
}
