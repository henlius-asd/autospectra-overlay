## 1. 实现 ROI 偏置补偿

- [x] 1.1 在 `handleAlign` 中，将目标曲线数据偏置到基准线坐标系：`applyOffset(targetCurve.data, { xOffset: baselineOffset.xOffset, yOffset: targetOffset.yOffset })`
- [x] 1.2 在 ROI 最大峰对齐的分支中，使用基准线坐标系下的目标数据，并对齐结果转换为 `newXOffset = result.xOffset + baselineOffset.xOffset`
- [x] 1.3 在互相关波形对齐的分支中，同样使用基准线坐标系下的目标数据，对齐结果做相同转换

## 2. 验证

- [x] 2.1 运行 `npx tsc --noEmit` 确认 TypeScript 编译通过
- [x] 2.2 手动验证：目标曲线有较大偏置时，ROI 峰值对齐仍能正确收敛
- [x] 2.3 手动验证：目标曲线有较大偏置时，互相关波形对齐仍能正确收敛
- [x] 2.4 手动验证：多次对齐不累积偏置（幂等性）