## Context

当前三栏布局使用 Tailwind 的 `transition-all duration-300` 实现折叠/展开动画。`transition-all` 设置 `transition-property: all`，导致所有可动画 CSS 属性（width、height、flex-basis 等）都在 300ms 内过渡。同时侧面板缺少 `shrink-0`（`flex-shrink: 0`），在 flex 布局中默认 `flex-shrink: 1`，允许面板被压缩到小于指定宽度。

折叠/展开时，面板内条件渲染的内容会改变面板的计算高度（从 ~40px 到 ~100vh），`transition-all` 同时动画 height 和 width，在 flex 布局中互相干扰，导致浏览器在过渡期间无法正确计算最终宽度。

## Goals / Non-Goals

**Goals:**
- 修复折叠后再展开时面板宽度无法正确恢复的 bug
- 保持折叠/展开的平滑过渡动画效果
- 改动最小化，风险可控

**Non-Goals:**
- 不改变三栏布局的整体结构或宽度规格
- 不改变折叠/展开的交互逻辑
- 不涉及 ECharts 的 resize 行为优化

## Decisions

### 1. 将 `transition-all` 替换为 `transition-[width]`

**选择**: 仅对 `width` 属性设置过渡动画，其他属性变化瞬间完成。

**替代方案**:
- **方案 A**: 保持 `transition-all`，调试过渡时序 — 不选，因为 `transition-all` 从根本上不适合这种场景，多个属性同时过渡不可控
- **方案 B**: 移除所有过渡动画 — 不选，会失去视觉平滑度，且违背 spec 中"SHALL have CSS transition 动画过渡"的要求

**理由**: `transition-[width]` 精确控制只过渡宽度，避免 height 等属性变化干扰 flex 布局计算。Tailwind 的 `transition-[width]` 生成 `transition-property: width`，恰好满足需求。

### 2. 添加 `shrink-0` 防止 flex 压缩

**选择**: 给 LeftPanel 和 RightPanel 添加 `shrink-0` class。

**替代方案**:
- **方案 A**: 不添加，依赖 `width` 的显式设置 — 不选，flex 默认 `flex-shrink: 1` 允许浏览器在布局计算时压缩元素，过渡期间尤其容易触发压缩
- **方案 B**: 使用 `min-w-[240px]` 设置最小宽度 — 可行但冗余，`shrink-0` 更简洁直接

**理由**: `shrink-0` 设置 `flex-shrink: 0`，确保面板在 flex 布局中永远不会被压缩到小于其指定宽度。这是 flex 布局中固定宽度侧栏的标准做法。

### 3. 不改动 CenterPanel 和 ThreeColumnLayout

**选择**: 仅修改 LeftPanel.tsx 和 RightPanel.tsx 的 CSS 类名。

**理由**: 根因在侧面板自身，CenterPanel 的 `flex-1` 和 ThreeColumnLayout 的 flex 容器行为正确，无需改动。

## Risks / Trade-offs

- **风险**: 展开时内容区瞬间出现（无 height 过渡），视觉上可能略微突兀 → **缓解**: height 过渡本身不是原始设计意图，且内容区出现时面板宽度仍在过渡中，视觉上仍有平滑感
- **风险**: `shrink-0` 在小屏幕（< 1366px）下可能导致中栏空间不足 → **缓解**: 现有 spec 已要求最小分辨率 1366px，且三栏总固定宽度 240+320+48*2=656px，在 1366px 下中栏仍有 710px 空间，足够使用