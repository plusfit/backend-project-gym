export const validateMongoId = (id: string) => {
  return id.match(/^[\dA-Fa-f]{24}$/);
};
