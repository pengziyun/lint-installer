import { execSync } from 'node:child_process'
import * as path from 'node:path'
import chalk from 'chalk'
import * as fs from 'fs-extra'
import inquirer from 'inquirer'
import ora from 'ora'

interface PackageJson {
  [key: string]: any
  'devDependencies'?: Record<string, string>
  'scripts'?: Record<string, string>
  'simple-git-hooks'?: Record<string, string>
  'lint-staged'?: Record<string, string[]>
}

const DEV_DEPENDENCIES = {
  '@antfu/eslint-config': 'latest',
  '@commitlint/cli': 'latest',
  '@commitlint/config-conventional': 'latest',
  '@ls-lint/ls-lint': 'latest',
  'czg': 'latest',
  'eslint': 'latest',
  'eslint-plugin-format': 'latest',
  'lint-staged': 'latest',
  'simple-git-hooks': 'latest',
}

// 降级版本配置，当最新版本安装失败时使用
const FALLBACK_DEPENDENCIES = {
  '@antfu/eslint-config': '^4.17.0',
  '@commitlint/cli': '^19.8.1',
  '@commitlint/config-conventional': '^19.8.1',
  '@ls-lint/ls-lint': '^2.3.1',
  'czg': '^1.12.0',
  'eslint': '^9.31.0',
  'eslint-plugin-format': '^1.0.1',
  'lint-staged': '^16.1.2',
  'simple-git-hooks': '^2.13.0',
}

const SCRIPTS = {
  'lint:eslint': 'eslint --fix',
  'lint:ls': 'ls-lint',
  'lint': 'git add . && npx lint-staged',
  'commit': 'git add . && czg && git pull && git push',
}

const GIT_HOOKS = {
  'commit-msg': 'npx commitlint --config commitlint.config.cjs --edit',
  'pre-commit': 'npx lint-staged',
}

const LINT_STAGED = {
  '*': [
    'ls-lint',
    'eslint --fix',
  ],
}

// 需要清理的配置文件列表
const CONFIG_FILES_TO_CLEAN = [
  // ESLint 配置文件
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.ts',
  'eslint.config.mjs',
  'eslint.config.cjs',
  // Prettier 配置文件
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  // CommitLint 配置文件
  'commitlint.config.js',
  'commitlint.config.ts',
  'commitlint.config.cjs',
  'commitlint.config.mjs',
  '.commitlintrc.js',
  '.commitlintrc.json',
  '.commitlintrc.yml',
  '.commitlintrc.yaml',
  // Husky 配置
  '.husky/',
  // 其他 lint 工具配置
  '.ls-lint.yml',
  '.ls-lint.yaml',
  // VSCode 配置
  '.vscode/',
]

// 需要清理的依赖项列表
const DEPENDENCIES_TO_CLEAN = [
  // ESLint 相关
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@vue/eslint-config-prettier',
  '@vue/eslint-config-typescript',
  'eslint-config-prettier',
  'eslint-plugin-prettier',
  'eslint-plugin-vue',
  'eslint-plugin-import',
  'eslint-plugin-node',
  'eslint-plugin-promise',
  'eslint-plugin-standard',
  '@eslint/js',
  // Prettier 相关
  'prettier',
  // Husky 相关
  'husky',
  // 其他可能冲突的工具
  '@vitest/eslint-plugin',
  'eslint-plugin-playwright',
]

// 需要清理的脚本列表
const SCRIPTS_TO_CLEAN = [
  'lint:eslint',
  'lint:prettier',
  'lint:fix',
  'format',
  'format:check',
  'prepare', // husky 相关
]

async function createPackageJson(targetDir: string): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json')
  const dirName = path.basename(targetDir)

  const basicPackageJson = {
    name: dirName,
    version: '1.0.0',
    description: '',
    main: 'index.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    keywords: [],
    author: '',
    license: 'ISC',
  }

  const spinner = ora('正在创建 package.json...').start()

  try {
    await fs.writeJson(packageJsonPath, basicPackageJson, { spaces: 2 })
    spinner.succeed('package.json 创建完成')
  }
  catch (error) {
    spinner.fail('创建 package.json 失败')
    throw error
  }
}

export async function installDevTools(targetDir: string): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json')

  // 检查是否存在 package.json，不存在则创建
  if (!await fs.pathExists(packageJsonPath)) {
    await createPackageJson(targetDir)
  }

  // 首先检测包管理器（在修改任何文件之前）
  const packageManager = await detectPackageManager(targetDir)

  const spinner = ora('正在更新 package.json...').start()

  try {
    // 读取并更新 package.json
    const packageJson: PackageJson = await fs.readJson(packageJsonPath)

    // 添加 devDependencies
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...DEV_DEPENDENCIES,
    }

    // 添加 scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      ...SCRIPTS,
    }

    // 添加 simple-git-hooks 配置
    packageJson['simple-git-hooks'] = GIT_HOOKS

    // 添加 lint-staged 配置
    packageJson['lint-staged'] = LINT_STAGED

    // 写回 package.json
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })

    spinner.succeed('package.json 更新完成')

    // 清理已有配置
    await cleanExistingConfigs(targetDir)

    // 更新 .gitignore 文件
    await updateGitignore(targetDir)

    // 复制配置文件
    await copyConfigFiles(targetDir)

    // 安装依赖
    await installDependencies(targetDir, packageManager)

    // 初始化 git hooks
    await initializeGitHooks(targetDir)
  }
  catch (error) {
    spinner.fail('更新失败')
    throw error
  }
}

async function cleanExistingConfigs(targetDir: string): Promise<void> {
  const spinner = ora('正在清理已有配置文件...').start()
  const packageJsonPath = path.join(targetDir, 'package.json')

  try {
    let cleanedFiles = 0
    let cleanedDeps = 0
    let cleanedScripts = 0

    // 1. 清理配置文件
    for (const configFile of CONFIG_FILES_TO_CLEAN) {
      const filePath = path.join(targetDir, configFile)

      if (await fs.pathExists(filePath)) {
        const stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
          await fs.remove(filePath)
          cleanedFiles++
          spinner.text = `正在清理配置目录: ${configFile}`
        }
        else {
          await fs.remove(filePath)
          cleanedFiles++
          spinner.text = `正在清理配置文件: ${configFile}`
        }
      }
    }

    // 2. 清理 package.json 中的依赖项和脚本
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson: PackageJson = await fs.readJson(packageJsonPath)
      let packageJsonChanged = false

      // 清理依赖项
      if (packageJson.devDependencies) {
        for (const dep of DEPENDENCIES_TO_CLEAN) {
          if (packageJson.devDependencies[dep]) {
            delete packageJson.devDependencies[dep]
            cleanedDeps++
            packageJsonChanged = true
            spinner.text = `正在清理依赖: ${dep}`
          }
        }
      }

      if (packageJson.dependencies) {
        for (const dep of DEPENDENCIES_TO_CLEAN) {
          if (packageJson.dependencies[dep]) {
            delete packageJson.dependencies[dep]
            cleanedDeps++
            packageJsonChanged = true
            spinner.text = `正在清理依赖: ${dep}`
          }
        }
      }

      // 清理脚本
      if (packageJson.scripts) {
        for (const script of SCRIPTS_TO_CLEAN) {
          if (packageJson.scripts[script]) {
            delete packageJson.scripts[script]
            cleanedScripts++
            packageJsonChanged = true
            spinner.text = `正在清理脚本: ${script}`
          }
        }
      }

      // 清理可能存在的旧配置
      const configsToRemove = ['husky', 'lint-staged', 'simple-git-hooks']
      for (const config of configsToRemove) {
        if (packageJson[config]) {
          delete packageJson[config]
          packageJsonChanged = true
          spinner.text = `正在清理配置: ${config}`
        }
      }

      // 如果有变更，写回文件
      if (packageJsonChanged) {
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
      }
    }

    const totalCleaned = cleanedFiles + cleanedDeps + cleanedScripts
    if (totalCleaned > 0) {
      spinner.succeed(`配置清理完成 (清理了 ${cleanedFiles} 个文件, ${cleanedDeps} 个依赖, ${cleanedScripts} 个脚本)`)
    }
    else {
      spinner.succeed('未发现需要清理的配置')
    }
  }
  catch {
    spinner.fail('配置清理失败')
    console.warn(chalk.yellow('⚠️  配置清理失败，但安装将继续进行'))
    console.warn(chalk.yellow('⚠️  建议手动检查并清理可能冲突的配置文件'))
  }
}

async function copyConfigFiles(targetDir: string): Promise<void> {
  const spinner = ora('正在复制配置文件...').start()

  try {
    const templatesDir = path.join(__dirname, '../templates')

    // 复制所有配置文件
    const configFiles = [
      'eslint.config.mjs',
      'commitlint.config.cjs',
      '.ls-lint.yml',
    ]

    for (const file of configFiles) {
      const sourcePath = path.join(templatesDir, file)
      const targetPath = path.join(targetDir, file)

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath)
      }
    }

    // 复制 VSCode 配置文件
    const vscodeSourceDir = path.join(templatesDir, '.vscode')
    const vscodeTargetDir = path.join(targetDir, '.vscode')

    if (await fs.pathExists(vscodeSourceDir)) {
      await fs.ensureDir(vscodeTargetDir)
      await fs.copy(vscodeSourceDir, vscodeTargetDir)
    }

    spinner.succeed('配置文件复制完成')
  }
  catch (error) {
    spinner.fail('配置文件复制失败')
    throw error
  }
}

async function installDependencies(targetDir: string, packageManager: 'npm' | 'yarn' | 'pnpm'): Promise<void> {
  const spinner = ora('正在安装最新版本依赖...').start()
  const packageJsonPath = path.join(targetDir, 'package.json')

  try {
    const installCommand = packageManager === 'pnpm'
      ? 'pnpm install'
      : packageManager === 'yarn'
        ? 'yarn install'
        : 'npm install'

    try {
      // 停止 spinner 以显示安装进度
      spinner.stop()
      console.log(chalk.blue(`📦 正在安装最新版本依赖 (使用 ${packageManager})...`))

      // 首先尝试安装最新版本，显示实时进度
      execSync(installCommand, {
        cwd: targetDir,
        stdio: 'inherit',
      })

      console.log(chalk.green(`✅ 依赖安装完成 (使用 ${packageManager} - 最新版本)`))
    }
    catch {
      console.log(chalk.yellow('⚠️  最新版本安装失败，正在使用稳定版本...'))

      // 读取并更新 package.json 为降级版本
      const packageJson = await fs.readJson(packageJsonPath)
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...FALLBACK_DEPENDENCIES,
      }
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })

      console.log(chalk.blue(`📦 正在安装稳定版本依赖 (使用 ${packageManager})...`))

      // 重新安装降级版本，显示实时进度
      execSync(installCommand, {
        cwd: targetDir,
        stdio: 'inherit',
      })

      console.log(chalk.green(`✅ 依赖安装完成 (使用 ${packageManager} - 稳定版本)`))
      console.log(chalk.yellow('⚠️  已自动降级到稳定版本，确保兼容性'))
    }
  }
  catch (error) {
    console.log(chalk.red('❌ 依赖安装失败'))
    throw error
  }
}

async function updateGitignore(targetDir: string): Promise<void> {
  const gitignorePath = path.join(targetDir, '.gitignore')

  if (!await fs.pathExists(gitignorePath)) {
    return
  }

  const spinner = ora('正在检查 .gitignore 文件...').start()

  try {
    const content = await fs.readFile(gitignorePath, 'utf-8')
    const lines = content.split('\n')

    // 检查是否包含 .vscode/ 相关规则（包括忽略和否定规则）
    const vscodeIgnorePatterns = ['.vscode/', '.vscode', '.vscode/*']
    const vscodeNegatePatterns = ['!.vscode/', '!.vscode', '!.vscode/*']
    let hasVscodeIgnore = false
    const modifiedLines = lines.filter((line) => {
      const trimmedLine = line.trim()
      // 检查普通忽略规则
      if (vscodeIgnorePatterns.includes(trimmedLine)) {
        hasVscodeIgnore = true
        return false // 移除这一行
      }
      // 检查否定规则（以!开头的规则）
      if (vscodeNegatePatterns.includes(trimmedLine)) {
        hasVscodeIgnore = true
        return false // 移除这一行
      }
      // 检查更复杂的否定规则，如 !.vscode/extensions.json
      if (trimmedLine.startsWith('!.vscode/')) {
        hasVscodeIgnore = true
        return false // 移除这一行
      }
      return true
    })

    if (hasVscodeIgnore) {
      // 写回修改后的内容
      await fs.writeFile(gitignorePath, modifiedLines.join('\n'))
      spinner.succeed('.gitignore 文件已更新，移除了 .vscode/ 忽略规则')
    }
    else {
      spinner.succeed('.gitignore 文件检查完成，未发现 .vscode/ 忽略规则')
    }
  }
  catch {
    spinner.fail('.gitignore 文件处理失败')
    console.warn(chalk.yellow('⚠️  .gitignore 文件处理失败，请手动检查并移除 .vscode/ 相关忽略规则'))
  }
}

async function initializeGitHooks(targetDir: string): Promise<void> {
  const spinner = ora('正在初始化 Git Hooks...').start()

  try {
    // 检查是否存在 .git 目录
    const gitDir = path.join(targetDir, '.git')
    if (!fs.existsSync(gitDir)) {
      spinner.text = '检测到项目未初始化 Git，正在执行 git init...'
      execSync('git init', {
        cwd: targetDir,
        stdio: 'pipe',
      })
      spinner.text = '正在初始化 Git Hooks...'
    }

    execSync('npx simple-git-hooks', {
      cwd: targetDir,
      stdio: 'pipe',
    })

    spinner.succeed('Git Hooks 初始化完成')
  }
  catch {
    spinner.fail('Git Hooks 初始化失败')
    console.warn(chalk.yellow('⚠️  请手动运行: git init && npx simple-git-hooks'))
  }
}

async function detectPackageManager(targetDir: string): Promise<'npm' | 'yarn' | 'pnpm'> {
  const lockFiles = [
    { file: 'pnpm-lock.yaml', manager: 'pnpm' as const },
    { file: 'yarn.lock', manager: 'yarn' as const },
    { file: 'package-lock.json', manager: 'npm' as const },
  ]

  const existingManagers = lockFiles.filter(({ file }) => {
    const exists = fs.existsSync(path.join(targetDir, file))
    return exists
  })

  if (existingManagers.length === 0) {
    console.log(chalk.yellow('⚠️  未检测到包管理器锁文件，默认使用 pnpm'))
    return 'pnpm'
  }

  if (existingManagers.length === 1) {
    const manager = existingManagers[0].manager
    console.log(chalk.blue(`📦 检测到项目使用 ${manager}，将使用相同的包管理器`))
    return manager
  }

  // 存在多个包管理器锁文件，询问用户选择
  console.log(chalk.yellow('⚠️  检测到多个包管理器锁文件，请选择要使用的包管理器:'))
  const choices = existingManagers.map(({ file, manager }) => ({
    name: `${manager} (${file})`,
    value: manager,
  }))

  const { selectedManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedManager',
      message: '请选择要使用的包管理器:',
      choices,
    },
  ])

  console.log(chalk.green(`✅ 已选择使用 ${selectedManager}`))
  return selectedManager
}
