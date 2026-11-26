export const profileNameValidationRules = {
  required: 'Ingresa un nombre para el perfil.',
  minLength: {
    value: 2,
    message: 'El nombre debe tener al menos 2 caracteres.',
  },
  maxLength: {
    value: 50,
    message: 'El nombre no puede superar los 50 caracteres.',
  },
  setValueAs: (value) => value.trim(),
}

export const requiredPinValidationRules = {
  required: 'Ingresa un PIN de 4 dígitos.',
  pattern: {
    value: /^\d{4}$/,
    message: 'El PIN debe tener exactamente 4 dígitos.',
  },
}

export const optionalPinValidationRules = {
  validate: (value) => (
    !value || /^\d{4}$/.test(value) || 'El PIN debe tener exactamente 4 dígitos.'
  ),
}

export const profileTypeValidationRules = {
  required: 'Selecciona un tipo de perfil.',
}

export const avatarUrlValidationRules = {
  validate: (value) => {
    if (!value) return true
    try {
      new URL(value)
      return true
    } catch {
      return 'Ingresa una URL válida.'
    }
  },
}
