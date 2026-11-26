import { useForm } from 'react-hook-form'
import {
  searchTextValidationRules,
  searchYearValidationRules,
} from '../../validations/catalog.js'

export default function SearchBar({
  onSearch,
  onSearchTextChange,
  onSearchYearChange,
  searchText,
  searchYear,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { searchText, searchYear } })

  const searchTextField = register('searchText', searchTextValidationRules)
  const searchYearField = register('searchYear', searchYearValidationRules)

  return (
    <form className="search-form" onSubmit={handleSubmit(onSearch)} noValidate>
      <div className="search-field-container">
        <label className="search-field">
          <span className="sr-only">Buscar serie</span>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar una serie…"
            value={searchText}
            aria-invalid={Boolean(errors.searchText)}
            aria-describedby={errors.searchText ? 'catalog-search-error' : undefined}
            {...searchTextField}
            onChange={(event) => {
              searchTextField.onChange(event)
              onSearchTextChange(event.target.value)
            }}
          />
        </label>
        {errors.searchText && (
          <span className="validation-error" id="catalog-search-error" role="alert">
            {errors.searchText.message}
          </span>
        )}
      </div>
      <label className="search-year-field">
        <span className="sr-only">Filtrar por año</span>
        <input
          className="year-input"
          type="number"
          min="1900"
          max="2100"
          placeholder="Año"
          value={searchYear}
          aria-invalid={Boolean(errors.searchYear)}
          aria-describedby={errors.searchYear ? 'catalog-year-error' : undefined}
          {...searchYearField}
          onChange={(event) => {
            searchYearField.onChange(event)
            onSearchYearChange(event.target.value)
          }}
        />
        {errors.searchYear && (
          <span className="validation-error" id="catalog-year-error" role="alert">
            {errors.searchYear.message}
          </span>
        )}
      </label>
      <button className="primary-button search-button" type="submit">Buscar</button>
    </form>
  )
}
