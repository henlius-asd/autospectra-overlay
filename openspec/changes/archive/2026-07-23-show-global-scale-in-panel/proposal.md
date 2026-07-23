## Why

「自动叠图」面板内的「缩放」分区当前只显示标题文字"缩放"，用户无法在面板内直接看到当前全局缩放倍率（`globalScale`），必须看向图表区域读取 badge。在执行归一化或重置前，用户需要确认当前缩放状态，缺少面板内上下文。

## What Changes

- 在 `AlignmentControls.tsx` 的「缩放」分区标题旁显示当前 `globalScale` 值，格式如 `缩放 ×1.5`
- 当 `globalScale` 为 1（默认值）时 SHALL 显示 `×1.0`，不隐藏
- 显示 SHALL 实时更新（订阅 store），用户滚轮调整全局缩放后面板内数值同步变化

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `scale-slider`: 新增需求——在工具箱「自动叠图」面板的「缩放」分区标题旁显示当前 `globalScale` 值

## Impact

- `src/components/toolbox/AlignmentControls.tsx`: 从 `useCurveStore` 读取 `globalScale`，在「缩放」标题旁渲染数值
