## Context

当前 `parseFileContent` 通过 `detectFormat` 走统一的"探测分隔符 → 定位数据起点 → 提取元数据 → 解析数据行"路径，假设 ARW 元数据为 `"Key"\t"Value"` + `\r` 分隔、数据为 TAB 分隔两列数值。新版 Waters Empower 导出（`empower_raw2407.arw`）结构完全不同：元数据无引号、以"下一行行首为上一键的值、同行尾部为下一键"串联书写，行分隔符为 `\r\r\n`，数据为空格分隔。两种格式在文件特征上差异显著，可通过早期探测进行分发。

## Goals / Non-Goals

**Goals:**
- 同时支持 ARW V1 与 V2 格式，解析入口对调用方透明。
- V2 完整保留 7 个已知元数据键 + 新增 `SamplingInterval`。
- 曲线命名统一使用 `SampleName`，与旧格式行为一致。
- V1 解析路径零改动，回归风险最小化。

**Non-Goals:**
- 不修改 `FileUpload`、`types/curve.ts`、下游组件。
- 不引入新的字段到 `ParsedFile` / `CurveData`（复用 `metadata: Record<string, string>`）。
- 不支持 V2 多曲线（V2 当前仅单通道；若未来出现多通道再扩展）。
- 不替换 V1 逻辑（两套解析并存）。

## Decisions

### Decision 1：在入口最早期做格式分发

在 `parseFileContent` 顶部先调用 `isEmpowerV2(lines, filename)`，识别到 V2 直接走 `parseEmpowerV2`，**不经过 `detectFormat`**。

**替代方案**：扩展 `detectFormat` 让其同时返回 V1/V2 标识 → 需修改 `FormatInfo` 结构、改动 `extractMetadata` / `findDataStartLine` 等多处分支，污染 V1 路径。分发方案更干净。

### Decision 2：V2 识别启发式

`isEmpowerV2` 同时满足以下条件即判定为 V2：
1. 文件名以 `.arw` 结尾（不依赖扩展名大小写）。
2. 前 20 行无 `"` 字符。
3. 前 20 行无 `\t` 字符。
4. 前 10 行中至少 5 行以已知 key 之一结尾（`SampleName` / `Channel Description` / `Date Acquired` / `Det. Units` / `Acq Method Set` / `Instrument Method Name` / `Comments`）。
5. 首次出现数值行时，按空格 split 恰好得到 2 列。

条件 1+2+3 足以把 V1（`"` + TAB）与 V2 区分；条件 4+5 是防御性校验，防止非 ARW 的纯文本文件误判。

### Decision 3：元数据重组算法（V2 专用）

已知 7 个 key 按 Empower 输出顺序固定为：
`[SampleName, Channel Description, Date Acquired, Det. Units, Acq Method Set, Instrument Method Name, Comments]`。

算法：
1. 从 line 0 开始扫描非数值行，维护 `keyQueue`（剩余待匹配 key）与 `currentKey`。
2. 对每一行：
   - 若为空行，跳过。
   - 若 `keyQueue` 非空且行以 `keyQueue[0]` 结尾（`line.endsWith(key)`），则：
     - 前缀 `line.slice(0, -key.length).trim()` 即为 `currentKey` 的值（若 `currentKey` 已有值则追加）；
     - 把 `currentKey` 推入结果字典，`currentKey = keyQueue.shift()`。
   - 否则整行作为 `currentKey` 的值累加（空格分隔拼接）。
3. 扫描结束后，若遇到行匹配 `^Run samples\s+([0-9.eE+-]+)$`：
   - 把该数值写入 `metadata.SamplingInterval`；
   - 前缀 `Run samples` 作为 `Comments` 的值（若 `Comments` 已有值则丢弃该前缀）。

**为何用 endswith 匹配**：V2 的值被"挤到下一行行首"，单看一行无法区分"值的剩余部分"与"下一个 key"。已知 key 列表足够小且互不为子串，从行尾反向匹配是稳定做法。

### Decision 4：数据区解析（V2 专用）

从首个数值行起，按空格 split，过滤空 token；每行必须恰好 2 列；解析为 `[number, number]`；单条曲线 `CurveData.name = metadata.SampleName`。

### Decision 5：曲线命名

统一使用 `metadata.SampleName`；缺失时回退到文件名去扩展名。与 V1 在 `parseFileContent` 中的行为一致（V1 也是 `metadata.SampleName ?? stem(filename)`）。

## Risks / Trade-offs

- **[Empower 后续版本增减 key]** → 算法依赖固定 key 顺序。若新增字段：endswith 匹配失败，未识别行会被累积到 `currentKey` 的值中，可能导致脏数据。缓解：解析函数在无法匹配到全部 7 个 key 时，记录一条 warning 到 metadata 的 `__v2ParseWarning` 字段，不抛错。
- **[值中包含 key 字面子串]** → 极端场景（如 SampleName 恰好是 `"Channel Description"`）会触发误匹配。缓解：已知 key 之间不存在后缀关系，且匹配使用 `endsWith` 要求整段命中，误匹配概率极低；可在实现时加长度阈值或断言保护。
- **[V2 与 V1 误判]** → 已用"无引号 + 无 TAB + 至少 5 行已知 key 结尾"三条件联合约束，V1 因含 `"` 与 TAB 永远不会命中 V2 分支。
- **[SamplingInterval 格式变异]** → 当前正则 `[0-9.eE+-]+` 覆盖常规科学计数法；若 Empower 改为带单位（如 `"0.00833 min"`），正则失效。缓解：匹配失败时不写入 `SamplingInterval`，但保留原始行到 metadata 的 `Comments`。

## Migration Plan

- 向后兼容新增；现有 V1 解析路径无任何修改；无数据迁移。
- 回滚：常规 `git revert`，无外部依赖或状态需清理。
- 部署：纯前端变更，构建产物替换即生效。

## Open Questions

- 无。所有关键技术决策（格式识别、元数据算法、命名策略）已在讨论中确认。
