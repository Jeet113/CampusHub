import { spawnSync } from 'node:child_process'
import path from 'node:path'

const result = spawnSync(process.execPath, [path.resolve('node_modules/vitest/vitest.mjs'), 'run', 'tests/integration'], {
  stdio: 'inherit',
  env: { ...process.env, RUN_INTEGRATION_TESTS: 'true' },
})

process.exit(result.status || 0)
