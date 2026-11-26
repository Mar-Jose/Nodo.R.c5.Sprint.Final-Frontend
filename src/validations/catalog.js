export const searchTextValidationRules = {
  required: 'Escribe el nombre de una serie para buscar.',
  validate: (value) => (
    value.trim().length > 0 || 'Escribe el nombre de una serie para buscar.'
  ),
}

export const searchYearValidationRules = {
  validate: (value) => (
    !value
    || (Number.isInteger(Number(value)) && Number(value) >= 1900 && Number(value) <= 2100)
    || 'El año debe estar entre 1900 y 2100.'
  ),
}
