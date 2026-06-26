# SerialForge 开发说明

## 阶段策略

项目按需求拆成 9 个阶段。每个阶段完成后必须运行格式化、lint、类型检查、测试和构建，并修复实际错误后再进入下一阶段。

当前阶段：阶段 7。

## 代码约定

- TypeScript 使用 strict 模式。
- Rust 使用明确错误类型，不使用大量 unwrap()。
- 界面文案使用中文。
- 代码变量使用英文。
- 注释保持简洁中文，不写教程式注释。
- 未实现功能必须标记为开发阶段或不进入正式交互路径。

## 常用命令

    npm.cmd run format:check
    npm.cmd run lint
    npm.cmd run typecheck
    npm.cmd run test
    npm.cmd run build

Rust：

    npm.cmd run rust:fmt
    npm.cmd run rust:lint
    npm.cmd run rust:test

## PowerShell 注意事项

如果 npm --version 报 npm.ps1 执行策略错误，请使用 npm.cmd。
