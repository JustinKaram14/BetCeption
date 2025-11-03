import { app } from './app.js';
import { env } from './config/env.js';
app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Swagger UI at http://localhost:${env.port}/docs`);
});
