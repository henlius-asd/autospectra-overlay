## 1. 修复 LeftPanel 过渡动画

- [x] 1.1 将 `transition-all` 替换为 `transition-[width]`，仅对 width 属性做过渡动画
- [x] 1.2 添加 `shrink-0`，防止 flex 布局压缩面板宽度

## 2. 修复 RightPanel 过渡动画

- [x] 2.1 将 `transition-all` 替换为 `transition-[width]`，仅对 width 属性做过渡动画
- [x] 2.2 添加 `shrink-0`，防止 flex 布局压缩面板宽度
- [x] 2.3 RightPanel 额外改用 inline style `style={{ transition: 'width 300ms' }}` 替代 Tailwind 类名

## 3. 修复 CenterPanel 最小宽度约束

- [x] 3.1 添加 `min-w-0` 到 CenterPanel，覆盖 flex 子元素默认 `min-width: auto`，允许其收缩到小于内容（ECharts 图表）的固有最小宽度

## 4. 验证

- [x] 4.1 手动验证：反复折叠/展开左右栏，确认展开后宽度精确恢复为 240px/320px
- [x] 4.2 手动验证：同时折叠左右栏后再展开，确认两栏宽度均正确恢复
- [x] 4.3 手动验证：中栏 `flex-1` 在折叠/展开过程中正确填充剩余空间