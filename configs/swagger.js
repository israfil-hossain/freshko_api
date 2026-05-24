import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GreenCart API',
            version: '1.0.0',
            description: 'API documentation for GreenCart grocery delivery application',
        },
        servers: [
            { url: 'http://localhost:5001', description: 'Development server' },
            { url: process.env.API_URL || 'https://freshko-api.vercel.app', description: 'Production server' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            { bearerAuth: [] },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);