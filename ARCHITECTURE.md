# SerialForge 架构

## 总体原则

前端只负责界面、状态展示和用户操作，不直接访问串口。所有串口读写、线程管理、缓冲、虚拟链路、协议解析和自动化执行都放在 Rust 后端。

Rust 通过 Tauri command 和 event 与前端通信。高频数据后续需要批量推送，避免每个字节触发一次前端事件。

## 前端目录

    src/
    ├── app/                  # 应用外壳与主布局
    ├── components/           # 通用 UI 组件
    ├── features/             # 按业务功能拆分
    ├── stores/               # Zustand 状态
    ├── hooks/                # React hooks
    ├── services/             # Tauri / API 服务封装
    ├── types/                # 共享类型
    └── utils/                # 工具函数

## 后端目录

    src-tauri/src/
    ├── main.rs
    ├── lib.rs
    ├── commands/             # Tauri 命令
    ├── serial/               # 物理串口管理
    ├── virtual_port/         # 内置虚拟串口和桥接
    ├── protocol/             # 校验和协议帧解析
    ├── automation/           # 自动化测试流程
    ├── logging/              # 日志模型与写入
    ├── storage/              # 配置和工作区存储
    └── error.rs              # 明确错误类型

## 当前后端命令

- backend_status：前端用于验证 Tauri 与 Rust 通信是否正常。
- list_serial_ports：扫描系统串口。
- open_serial_connection：按前端串口参数打开连接。
- close_serial_connection：关闭指定连接。
- write_serial_data：向指定连接写入字节数据。

## 后续重点

- SerialManager 统一管理连接，防止重复打开同一串口。
- 每个连接使用唯一 connection_id。
- 连接关闭时必须安全停止读取任务。
- 接收缓冲必须设置内存上限，完整日志可选择写入文件。
- 自动应答与桥接必须防止无限循环。
