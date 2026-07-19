export function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(res, message = 'Internal Server Error', statusCode = 500, details = null) {
  const response = {
    success: false,
    message,
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

export function paginatedResponse(res, data, pagination, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data: {
      items: data,
      pagination,
    },
    message,
  });
}

export function validationErrorResponse(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    details: errors,
  });
}

export function unauthorizedResponse(res, message = 'Unauthorized') {
  return errorResponse(res, message, 401);
}

export function forbiddenResponse(res, message = 'Forbidden') {
  return errorResponse(res, message, 403);
}

export function notFoundResponse(res, message = 'Not found') {
  return errorResponse(res, message, 404);
}

export function methodNotAllowed(res) {
  return errorResponse(res, 'Method not allowed', 405);
}

export function extractRequestMetadata(req, actorId = null) {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;
  return { actorId, ipAddress, userAgent };
}
