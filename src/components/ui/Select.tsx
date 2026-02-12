/**
 * Select Component
 *
 * Reusable select dropdown with label, error states, and accessibility.
 */

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
   label?: string;
   error?: string;
   options: Array<{ value: string | number; label: string }>;
   placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
   ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
      const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

      return (
         <div className="w-full">
            {label && (
               <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700">
                  {label}
                  {props.required && <span className="ml-1 text-red-500">*</span>}
               </label>
            )}
            <select
               ref={ref}
               id={selectId}
               className={`w-full text-gray-800 rounded-lg border bg-white px-4 py-2 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${error ? 'border-red-500' : 'border-gray-300'} ${className} `}
               aria-invalid={!!error}
               aria-describedby={error ? `${selectId}-error` : undefined}
               {...props}
            >
               {placeholder && (
                  <option value="" disabled>
                     {placeholder}
                  </option>
               )}
               {options.map((option) => (
                  <option key={option.value} value={option.value}>
                     {option.label}
                  </option>
               ))}
            </select>
            {error && (
               <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600" role="alert">
                  {error}
               </p>
            )}
         </div>
      );
   }
);

Select.displayName = 'Select';
