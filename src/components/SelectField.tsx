export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-base font-normal text-primary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="h-[42px] rounded-[8px] border border-stroke bg-object px-2 text-base font-normal text-primary outline-none transition-colors focus:ring-[3px] focus:ring-zinc-400/40 disabled:opacity-40"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
