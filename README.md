# SerialForge

SerialForge 是一个 vibecoding 项目，也是一款基于 Tauri + React + TypeScript + Rust 的现代化桌面串口助手，面向嵌入式开发、串口调试、协议验证和设备模拟场景。

## 当前能力

- 扫描 Windows 物理串口。
- 配置串口参数：波特率、数据位、停止位、校验、流控、DTR、RTS。
- 打开、切换和关闭串口连接。
- 文本 / HEX 发送，支持 CR / LF / CRLF 行尾。
- 接收区支持文本、HEX、混合显示、搜索、方向过滤、时间戳、暂停显示、统计和 LOG / CSV 导出。
- 右侧工具面板显示会话统计：终端行、连接数、RX/TX 行、RX/TX 字节、系统事件和隐藏行。
- 内置虚拟串口对：Virtual Port A/B 可互相收发，并支持基础延迟、丢包和损坏模拟。
- 命令模板、变量替换、循环发送和基础自动应答。
- 主要模块支持拖拽调整大小，便于按调试场景重新组织界面。
- Rust 后端通过 Tauri command 和 event 管理串口读写。
- 协议解析面板支持 HEX 帧校验、SUM8、XOR8、CRC16-Modbus 和 JSON 字段解析。
- 实时曲线面板可从 RX/TX 文本中自动提取数值，绘制趋势并导出 CSV。
- 自动化测试面板支持 JSON 步骤脚本、发送、等待、正则匹配和步骤结果。
- 串口桥接面板支持基础单向 RX 转发，并带有环路保护提示。

## 技术栈

- Tauri 2
- React 18
- TypeScript
- Rust
- Vite
- Tailwind CSS
- Zustand
- Vitest

## 开发环境

建议使用 Windows 10 / Windows 11。

需要安装：

- Node.js 22+
- npm 10+
- Rust stable
- Tauri 2 所需 WebView2 与 Windows C++ 构建工具

安装依赖：

    npm.cmd install

浏览器预览：

    npm.cmd run dev

桌面开发：

    npm.cmd run tauri:dev

## 检查与构建

    npm.cmd run format:check
    npm.cmd run lint
    npm.cmd run typecheck
    npm.cmd run test
    npm.cmd run build

Rust：

    npm.cmd run rust:fmt
    npm.cmd run rust:lint
    npm.cmd run rust:test

生成可执行文件：

    npm.cmd run build:exe

输出位置：

    release\SerialForge.exe

## 阶段规划

- 阶段 2：完整物理串口助手基础能力，已完成基础实现。
- 阶段 3：增强终端、搜索、统计与日志体验，已完成基础实现。
- 阶段 4：内置虚拟串口与虚拟设备，已完成基础虚拟串口对。
- 阶段 5：命令列表、循环发送、变量替换和自动应答，已完成基础实现。
- 阶段 6：协议解析和校验工具，已完成基础实现。
- 阶段 7：实时曲线与数据导出，已完成基础实现。
- 阶段 8：自动化测试和串口桥接，已完成基础实现。
