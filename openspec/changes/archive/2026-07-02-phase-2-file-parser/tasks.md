## 1. 文件解析核心模块

- [x] 1.1 创建 `src/parser/detectFormat.ts`：读取前 5 行，检测分隔符（Tab vs 逗号）、列数、表头
- [x] 1.2 创建 `src/parser/parseFile.ts`：按检测到的格式解析文件内容为 `ParsedFile`
- [x] 1.3 创建 `src/parser/skipHeaders.ts`：跳过注释行（#、//、[、字母开头），提取字符串标签
- [x] 1.4 创建 `src/parser/index.ts`：统一导出 `parseFileContent(filename, content): ParsedFile`
- [x] 1.5 实现行分隔符统一处理：`\r\n` 和 `\r` → `\n`
- [x] 1.6 实现解析错误处理：含行号和错误原因的 `ParseError`

## 2. 文件上传 UI

- [x] 2.1 创建 `src/components/data/FileUpload.tsx`：拖拽上传区域 + 点击上传按钮
- [x] 2.2 实现拖拽事件处理（dragOver / dragLeave / drop），高亮拖拽状态
- [x] 2.3 实现 FileReader 异步读取，调用 `parseFileContent` 解析
- [x] 2.4 不支持的文件格式显示错误提示
- [x] 2.5 批量上传时按顺序解析，显示进度

## 3. 曲线列表

- [x] 3.1 创建 `src/components/data/CurveList.tsx`：曲线列表组件
- [x] 3.2 每条曲线显示：名称、颜色指示器（默认颜色数组循环分配）
- [x] 3.3 解析结果写入 `curveStore`（curves 和 offsets 初始化）
- [x] 3.4 更新 `LeftPanel.tsx`：替换占位内容为 `FileUpload` + `CurveList`

## 4. 验证

- [x] 4.1 创建测试文件：两列 Tab 分隔 .txt、两列逗号 .csv、多列 .csv、带标签头 .arw
- [x] 4.2 逐个上传测试文件，验证解析结果正确
- [x] 4.3 上传格式错误的文件，验证错误提示含行号
- [x] 4.4 批量上传 3 个文件，验证曲线列表正确显示
- [x] 4.5 `npx tsc --noEmit` 和 `npm run build` 通过