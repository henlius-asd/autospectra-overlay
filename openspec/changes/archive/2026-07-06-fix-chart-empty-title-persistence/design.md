## Context

`WaterfallChart` 使用 `ReactECharts` 渲染曲线。当 `curves` 为空时，`useMemo` 返回包含 `title: { text: '尚未加载曲线数据' }` 的 option；当数据加载后，返回的 option 包含 `series` 等配置但**不包含 `title` 字段**。

`ReactECharts` 默认 `notMerge={false}`，即 ECharts 的 `setOption` 采用 merge 模式。merge 模式下，新 option 中不存在的属性会被保留。因此旧的 `title` 配置不会被清除。

之前为了保留 dataZoom 的缩放状态，刻意不设置 `notMerge={true}`。

## Goals / Non-Goals

**Goals:**
- 数据加载后，图表的"尚未加载曲线数据"标题立即消失

**Non-Goals:**
- 不改变 `notMerge` 行为（保持 dataZoom 状态不受影响）
- 不改变 ECharts option 的整体结构

## Decisions

### 采用 `title: { show: false }` 而非 `title: undefined`

**选型**: 在非空 option 中添加 `title: { show: false }`

**理由**:
- ECharts 内部 merge 工具（`zrUtil.merge`）会跳过值为 `undefined` 的属性，因此 `title: undefined` 在 merge 模式下会被忽略，修复无效
- `show: false` 是 ECharts 官方支持的显式隐藏方式，在 merge 模式下可靠生效
- 当用户撤销回到空状态时，新的 `title: { text: '...' }` 会完整覆盖 `title: { show: false }`，空状态提示正常恢复

**替代方案**:
| 方案 | 是否可行 | 原因 |
|------|---------|------|
| `notMerge={true}` | ❌ 不可行 | 会重置 dataZoom 状态 |
| `title: undefined` | ❌ 不可行 | merge 工具跳过 undefined 值 |
| `title: { show: false }` | ✅ 采用 | 显式可靠，双向转换正常 |

## Risks / Trade-offs

- **无已知风险**：改动仅影响 title 组件的可见性，不影响 dataZoom、series、legend、grid、axes 等任何其他 ECharts 配置项
- **回滚策略**：删除新增的一行代码即可恢复原状