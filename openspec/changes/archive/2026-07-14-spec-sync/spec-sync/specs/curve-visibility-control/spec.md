# curve-visibility-control — Delta Spec

## MODIFIED Requirements

### Requirement: 可见曲线颜色分配

系统 SHALL 为每条曲线使用其 `curve.color` 属性作为渲染颜色。新上传曲线的颜色默认值为 `#000000`（黑色）。系统 SHALL NOT 自动从调色板按可见曲线顺序分配颜色。颜色不随可见性变化而重新分配。

#### Scenario: 颜色取自 curve.color 属性

- **WHEN** 用户上传新曲线数据
- **THEN** 该曲线的渲染颜色为 `#000000`（黑色），除非 `curve.color` 被显式设置

#### Scenario: 可见性变化不影响颜色

- **WHEN** 用户勾选或取消勾选曲线，改变可见曲线集合
- **THEN** 每条可见曲线的颜色保持不变，不按可见曲线顺序重新分配