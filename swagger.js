// swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  definition: { // Changed from swaggerDefinition to definition
    openapi: "3.0.1",
    info: {
      title: "Threat Combat Backend API",
      version: "1.0.0",
      description: "API documentation for the Threat Combat Backend",
    },
    servers: [
      {
        url: "http://localhost:5000", // Change to your live URL in production
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"], // Files containing annotations for the OpenAPI specification
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerDocs, swaggerUi };
