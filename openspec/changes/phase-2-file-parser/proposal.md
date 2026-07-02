## Why

用户需要将色谱仪器导出的数据文件（.arw, .txt, .csv）加载到工作台中进行可视化分析。Phase 2 实现文件解析模块，自动检测文件格式并解析为统一的数据结构，为后续曲线渲染（Phase 3）提供数据输入。

## What Changes

- 实现 `src/parser/` 模块：文件格式自动检测 + 解析器路由
- 支持 4 种数据格式：两列制表符分隔 .txt、两列逗号分隔 .csv、多列 .csv（Time + 多通道）、带字符串标签头的 .arw
- 解析输出统一为 `ParsedFile { id, name, tags?, curves: CurveData[] }`
- 解析失败时给出明确错误提示（含行号和错误原因）
- 左栏支持文件拖拽上传和点击上传
- 上传成功后左栏显示已解析的曲线列表

## Capabilities

### New Capabilities

- `file-parser`: 文件格式自动检测与解析模块，支持 .txt / .csv / .arw 格式，输出统一的 ParsedFile 结构

### Modified Capabilities

- `three-column-layout`: 左栏从占位文本升级为真实的文件拖拽上传区 + 曲线列表

## Impact

- 新增 `src/parser/` 模块（纯函数，禁止引用 React 或 DOM API）
- 修改 `src/components/layout/LeftPanel.tsx`：替换占位内容为上传组件 + 曲线列表
- 修改 `src/components/data/`：新增 FileUpload 和 CurveList 组件