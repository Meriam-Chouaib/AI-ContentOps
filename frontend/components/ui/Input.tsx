import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div className='flex flex-col gap-1 w-full'>
      <label className='text-sm font-semibold text-gray-700'>{label}</label>
      <input
        {...props}
        className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm'
      />
    </div>
  )
}
