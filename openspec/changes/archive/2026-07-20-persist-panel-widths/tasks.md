# Tasks: persist-panel-widths

## 1. 实施

- [x] 1.1 在 `ThreeColumnLayout.tsx` 增加 localStorage 读写辅助函数（try/catch 包裹，key `autospectra:panel-widths`）
- [x] 1.2 `useState` 初始值改为从 localStorage 读取并 clamp 到 MIN/MAX
- [x] 1.3 mouseup 时写入 localStorage（在现有 handleMouseUp 中追加）
- [x] 1.4 移除 auto-collapse reset effect（第 50-53 行）

## 2. 验收

- [x] 2.1 运行 `npm run build` + vitest 全绿
- [x] 2.2 运行 playwright e2e 全绿
- [x] 2.3 验证脚本：拖拽→刷新→宽度保持；clamp 生效；auto-collapse 后展开恢复持久化宽度
