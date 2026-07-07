## 1. V2 格式探测

- [x] 1.1 在 `src/parser/detectFormat.ts` 新增 `EMPOWER_V2_KEYS` 常量（7 个已知 key，按 Empower 输出顺序）
- [x] 1.2 在 `src/parser/detectFormat.ts` 新增 `isEmpowerV2(lines: string[], filename: string): boolean`
- [x] 1.3 从 `detectFormat.ts` 导出 `isEmpowerV2`，并在 `src/parser/index.ts` 中 re-export

## 2. V2 转换层（采用 V2 → V1 转换方案）

- [x] 2.1 在 `src/parser/parseFile.ts` 新增 `transformEmpowerV2ToV1(content: string): string`，将 V2 格式转换为 V1 格式
- [x] 2.2 实现 V2 元数据重组算法：识别 7 行元数据 + 1 行衔接行，提取每个 key 的 value
- [x] 2.3 衔接行解析：提取 Comments value 和第一个 x 值
- [x] 2.4 实现 V2 数据区解析：按 y x 格式提取数据点，配对为 (x1, y1), (x2, y2), ...
- [x] 2.5 生成 V1 格式字符串：`"key"\t"value"` 元数据 + TAB 分隔的 x y 数据
- [x] 2.6 新增 `parseEmpowerV2(filename, content)` 调用转换函数后复用 V1 解析逻辑

## 3. 入口分发

- [x] 3.1 修改 `parseFileContent`：检测到 V2 格式后调用 `parseEmpowerV2`
- [x] 3.2 V2 分支返回的 `ParsedFile` 与 V1 分支结构完全一致

## 4. 单元测试

- [x] 4.1 在 `src/parser/__tests__/parseFile.test.ts` 新增 V2 测试用例
- [x] 4.2 V2 文件解析成功返回 1 条曲线，数据点格式正确
- [x] 4.3 `ParsedFile.metadata` 包含完整的 7 个已知 key
- [x] 4.4 `CurveData.name` 等于 `metadata.SampleName`
- [x] 4.5 行首/行尾多余空格的 V2 数据行能被正确解析
- [x] 4.6 V1 文件解析路径未被影响（回归保护）
- [x] 4.7 `isEmpowerV2` 对 V1 文件、`.csv` 文件、`.txt` 文件返回 `false`
- [x] 4.8 真实数据测试：使用 `raw_data/empower_raw2407.arw` 验证解析正确性

## 5. 验证与回归

- [x] 5.1 运行 `vitest` 确保所有 14 个用例通过
- [x] 5.2 运行 `tsc` 确保类型检查无错误
- [ ] 5.3 启动应用手动验证（可选）

## 6. OpenSpec 归档

- [ ] 6.1 运行 `openspec archive adapt-empower-arw-v2`，把新增与修改的 spec delta 合并进 `openspec/specs/` 中的对应能力

## 备注

- 采用 V2 → V1 转换方案，复用现有 V1 解析管线
- V2 格式正确理解：数据行是 y x 格式，衔接行包含 Comments value 和第一个 x
- 无 SamplingInterval 字段（用户确认该字段不存在）
