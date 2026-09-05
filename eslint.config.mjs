import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      // Every flagged site is a mount-time read of localStorage / matchMedia /
      // URL state into React state — correct as written, but the rule wants
      // useSyncExternalStore. Keep it visible as a warning (not an error) so
      // `npm run lint` can gate CI; migrate these incrementally.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])

export default eslintConfig
