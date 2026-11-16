// 將 build/<主題名> 打包成可在 Xboard 後台上傳的 zip
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'

const { name, version } = JSON.parse(readFileSync(new URL('../theme.config.json', import.meta.url), 'utf8'))
const zipName = `${name}-${version}.zip`
rmSync(new URL(`../build/${zipName}`, import.meta.url), { force: true })
execFileSync('zip', ['-rq', zipName, name], { cwd: new URL('../build', import.meta.url), stdio: 'inherit' })
console.log(`已產生 build/${zipName}`)
