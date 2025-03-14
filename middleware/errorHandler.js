// middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
    // Set status code, defaulting to 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;
  
    // Log the error stack for debugging (you might want to remove this in production)
    console.error(err.stack);
  
    // Send a JSON response with error message.
    // In production, only send the message; in development, send the full stack.
    res.status(statusCode).json({
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
  };
  
  module.exports = errorHandler;
  