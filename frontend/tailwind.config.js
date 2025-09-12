/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors from the existing design system
        'label-normal': '#1a1a1a',
        'label-neutral': '#6b7280',
        'label-alternative': '#9ca3af',
        'label-assistive': '#d1d5db',
        'line-normal': '#e5e7eb',
        'line-neutral': '#d1d5db',
        'surface-alternative': '#f9fafb',
        'primary-normal': '#2563eb',
        'coolGray-40': '#9ca3af',
        'coolGray-99': '#f8fafc',
      },
      borderRadius: {
        '6': '6px',
        '8': '8px',
        '24': '24px',
      },
      fontSize: {
        'body-13-medium': ['13px', { lineHeight: '16px', fontWeight: '500' }],
        'body-13-regular': ['13px', { lineHeight: '16px', fontWeight: '400' }],
        'body-13-semibold': ['13px', { lineHeight: '16px', fontWeight: '600' }],
        'body-14-medium': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-14-regular': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-15-medium': ['15px', { lineHeight: '22px', fontWeight: '500' }],
        'body-16-medium': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'body-16-regular': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'title-28-medium': ['28px', { lineHeight: '36px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}