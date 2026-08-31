import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description:
        'A production-minded URL shortener with Redis caching, async analytics, JWT auth, and rate limiting.',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local development' },
      { url: 'http://localhost:8080', description: 'Local via Nginx load balancer' },
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
  },
  // tells swagger-jsdoc which files to scan for documentation comments
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);