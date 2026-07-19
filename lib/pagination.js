export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage) || 10));
  const skip = (page - 1) * perPage;
  
  return { page, perPage, skip };
}

export function buildPagination(total, page, perPage) {
  const totalPages = Math.ceil(total / perPage);
  
  return {
    page,
    perPage,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function parseSort(query, allowedFields = [], defaultField = 'createdAt') {
  const sort = query.sort || defaultField;
  const order = query.order === 'asc' ? 'asc' : 'desc';
  
  const field = allowedFields.includes(sort) ? sort : defaultField;
  
  return { [field]: order };
}

export function parseSearch(query) {
  const search = query.search?.trim() || '';
  return search;
}
