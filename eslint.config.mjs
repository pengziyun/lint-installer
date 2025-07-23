import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  // unocss: true,
  vue: true,
}, {
  rules: {
    'ts/no-unsafe-assignment': ['off'],
    'ts/strict-boolean-expressions': ['off'],
    'ts/no-unsafe-member-access': ['off'],
    'ts/no-unsafe-return': ['off'],
    'no-console': ['off'],
    'ts/no-unsafe-argument': ['off'],
    'ts/no-unsafe-call': ['off'],
    'ts/return-await': ['off'],
    'vue/first-attribute-linebreak': ['off'],
    'ts/no-floating-promises': ['off'],
    'ts/no-misused-promises': ['off'],
    'ts/ban-ts-comment': ['off'],
    'ts/switch-exhaustiveness-check': ['off'],
  },
})
