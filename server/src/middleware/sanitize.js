/**
 * Middleware to sanitize inputs and prevent NoSQL injection.
 * It recursively deletes keys starting with '$' or containing '.' from req.body, req.query, and req.params.
 */
export function sanitizeInput(req, res, next) {
  const clean = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
          } else {
            clean(obj[key]);
          }
        }
      }
    }
  };

  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);

  next();
}
