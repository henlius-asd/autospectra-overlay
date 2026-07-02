## Context

Phase 2 在 Phase 1 的三栏布局骨架之上，为左栏注入真实功能：文件拖拽上传和曲线列表。parser/ 模块需设计为纯函数（符合 ARCHITECTURE.md 约束 #1），不依赖 React 或 DOM API。

## Goals / Non-Goals

**Goals:**
- 实现文件拖拽/点击上传 UI
- 实现 4 种格式的自动检测与解析
- 解析结果以 `ParsedFile` 统一数据结构输出
- 解析失败时给出含行号的错误提示
- 上传后左栏显示曲线列表

**Non-Goals:**
- 不读取文件内容到图表渲染（Phase 3）
- 不做 Web Worker 解析（文件读取在主线程，解析逻辑纯函数）
- 不支持 .raw / .D 等二进制格式

## Decisions

### D1: 解析器使用策略模式，自动检测后路由

- **选择**：`detectFormat()` 返回分隔符/列数/表头信息 → `parseWithFormat()` 按格式解析
- **理由**：检测逻辑与解析逻辑分离，后续新增格式只需加解析器，不修改检测逻辑

### D2: 文件读取使用 FileReader API，非拖拽事件中直接读取

- **选择**：`FileReader.readAsText()` 异步读取，`encoding` 默认 UTF-8
- **理由**：`.arw` 和 `.txt` 文件通常为 UTF-8 或 ASCII 编码，FileReader 足够

### D3: 曲线名称规则

- 单列文件：取文件名（去扩展名）
- 多列文件：`文件名_列名`（列名来自表头或自动编号 `Channel1`, `Channel2`...）
- 双击别名可自定义（Phase 2 仅实现默认命名，编辑功能延后）

## Risks / Trade-offs

- **[Risk] 大文件（>50MB）读取阻塞 UI** → 当前曲线文件通常 < 5MB，暂不处理；大文件优化延后至后续 Phase
- **[Risk] `\r` 行分隔符兼容** → 读取后统一 replace `\r\n` 和 `\r` 为 `\n` 再按行 split