export const emailValidationRules = {
  required: 'Ingresa tu correo electrónico.',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Ingresa un correo electrónico válido.',
  },
  setValueAs: (value) => value.trim(),
}

export const passwordValidationRules = {
  required: 'Ingresa tu contraseña.',
  minLength: {
    value: 8,
    message: 'La contraseña debe tener al menos 8 caracteres.',
  },
}
