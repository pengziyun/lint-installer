# Lint Installer

一键安装和配置代码质量工具链的CLI工具。

## 功能特性

自动安装和配置以下开发工具：

- **@antfu/eslint-config** - Anthony Fu 的 ESLint 配置
- **commitlint** - Git 提交信息规范检查
- **@ls-lint/ls-lint** - 文件和目录命名规范检查
- **czg** - 交互式 Git 提交工具
- **eslint** - JavaScript/TypeScript 代码检查
- **lint-staged** - Git 暂存文件检查
- **simple-git-hooks** - 简单的 Git 钩子管理

## 安装

```bash
npm install -g lint-installer
```

## 使用方法

### 在当前项目中安装开发工具

```bash
lint-installer install
```

### 在指定目录安装开发工具

```bash
lint-installer install -d /path/to/your/project
```

## 安装内容

### 依赖包

工具会自动添加以下 devDependencies 到你的 package.json：

```json
{
  "@antfu/eslint-config": "^4.17.0",
  "@commitlint/cli": "^19.8.1",
  "@commitlint/config-conventional": "^19.8.1",
  "@ls-lint/ls-lint": "^2.3.1",
  "czg": "^1.12.0",
  "eslint": "^9.31.0",
  "eslint-plugin-format": "^1.0.1",
  "lint-staged": "^16.1.2",
  "simple-git-hooks": "^2.13.0"
}
```

### 脚本命令

添加以下 npm scripts：

```json
{
  "lint:eslint": "eslint --fix",
  "lint:ls": "ls-lint",
  "lint": "git add . && npx lint-staged",
  "commit": "git add . && czg && git pull && git push"
}
```

### 配置文件

- `eslint.config.mjs` - ESLint 配置
- `commitlint.config.cjs` - Commitlint 配置（中文版）
- `.ls-lint.yml` - LS-Lint 配置

### Git Hooks

自动配置以下 Git 钩子：

- `commit-msg`: 检查提交信息格式
- `pre-commit`: 运行代码检查和格式化

## 使用示例

安装完成后，你可以使用以下命令：

```bash
# 运行代码检查
npm run lint

# 交互式提交代码
npm run commit

# 单独运行 ESLint
npm run lint:eslint

# 单独运行文件命名检查
npm run lint:ls
```

## 注意事项

1. 如果目标项目已存在相同的配置文件，工具会覆盖它们
2. 工具会自动检测项目使用的包管理器（npm/yarn/pnpm）
3. 安装完成后会自动初始化 Git Hooks

## 许可证

MIT
