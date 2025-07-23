# 使用示例

## 全局安装

```bash
npm install -g lint-installer
```

## 在现有项目中使用

```bash
# 进入你的项目目录
cd your-project

# 安装开发工具
lint-installer install
```

## 为其他项目安装

```bash
# 为指定目录的项目安装开发工具
lint-installer install -d /path/to/your/project
```

## 安装后的使用

### 代码检查和格式化

```bash
# 运行所有检查（包括 ESLint 和 ls-lint）
npm run lint

# 只运行 ESLint
npm run lint:eslint

# 只运行文件命名检查
npm run lint:ls
```

### 提交代码

```bash
# 使用交互式提交工具
npm run commit
```

这个命令会：

1. 添加所有更改到暂存区
2. 启动交互式提交界面
3. 自动拉取远程更改
4. 推送到远程仓库

### Git Hooks

安装后会自动配置以下 Git 钩子：

- **pre-commit**: 在提交前自动运行代码检查
- **commit-msg**: 检查提交信息格式是否符合规范

## 配置文件说明

### eslint.config.mjs

基于 @antfu/eslint-config 的 ESLint 配置，包含：

- TypeScript 支持
- Vue 支持
- UnoCSS 支持
- 格式化工具集成

### commitlint.config.cjs

中文化的提交信息规范配置，支持：

- 标准的提交类型（feat, fix, docs 等）
- 中文提示信息
- Emoji 支持

### .ls-lint.yml

文件和目录命名规范：

- 目录使用 kebab-case
- 代码文件使用 kebab-case
- 图片文件使用 snake_case

## 故障排除

### Git Hooks 未生效

如果 Git Hooks 没有自动初始化，请手动运行：

```bash
npx simple-git-hooks
```

### 依赖安装失败

确保你的项目目录包含有效的 package.json 文件，并且有网络连接。

### 配置文件冲突

工具会覆盖现有的配置文件。如果你有自定义配置，请在安装前备份。
