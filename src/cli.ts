#!/usr/bin/env node

import process from 'node:process'
import chalk from 'chalk'
import { Command } from 'commander'
import { installDevTools } from './installer'

const program = new Command()

program
  .name('dev-tools-installer')
  .description('一键安装和配置代码质量工具链')
  .version('1.0.0')

program
  .command('install')
  .description('安装开发工具到当前项目')
  .argument('[directory]', '目标项目目录', process.cwd())
  .option('-d, --dir <directory>', '目标项目目录')
  .action(async (directory, options) => {
    try {
      console.log(chalk.blue('🚀 开始安装开发工具...'))
      const targetDir = options.dir || directory
      await installDevTools(targetDir)
      console.log(chalk.green('✅ 开发工具安装完成!'))
    }
    catch (error) {
      console.error(chalk.red('❌ 安装失败:'), error)
      process.exit(1)
    }
  })

program.parse()
