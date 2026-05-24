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
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
