## 1. 在 AlignmentControls 中显示全局缩放值

- [x] 1.1 在 `AlignmentControls.tsx` 中新增 `const globalScale = useCurveStore((s) => s.globalScale);`
- [x] 1.2 将「缩放」分区标题从纯文本改为带数值显示：`<span>缩放</span><span className="text-ink-faint font-mono tabular-nums">×{globalScale.toFixed(1)}</span>`

## 2. 验证

- [x] 2.1 运行 `npx tsc --noEmit` 确认无类型错误
- [x] 2.2 运行 `npx vitest run` 确认所有测试通过
- [ ] 2.3 手动验证：全局缩放模式下滚轮调整后，面板内 `×` 数值实时更新
