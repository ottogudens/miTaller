const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GUDEX API - Documentación Oficial',
      version: '5.1.0',
      description: 'API REST para gestión de Taller Mecánico GUDEX.',
      contact: { name: 'Soporte Técnico GUDEX' },
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Servidor Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Importante: Ruta relativa a donde se ejecuta node
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;