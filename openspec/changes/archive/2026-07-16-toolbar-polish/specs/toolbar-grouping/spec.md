## MODIFIED Requirements

### Requirement: 工具栏按钮分组

工具栏按钮 SHALL 按"操作对象"分为两组，组间以竖线分隔：

1. **标注工具组**：在图表上添加标注的交互模式按钮
   - 区间标签（BraceIcon：花括号 `{ }`）
   - 点标签（PointLabelIcon：地图定位标记）
   - 框选缩放（BoxSelectIcon：虚线矩形）

2. **变形工具组**：改变曲线形态的交互模式按钮
   - 手动移动（MoveIcon：曲线 + 水平双向箭头 ↔）
   - 全局缩放（ZoomGlobalIcon：多条水平线 + 垂直双向箭头 ↕）
   - 单曲线缩放（ZoomCurveIcon：单条曲线 + 垂直双向箭头 ↕）

变形工具组 SHALL 在手动移动激活且选中曲线时，额外显示锁定/解锁按钮（LockIcon/UnlockIcon）。

#### Scenario: 标注工具组视觉一致

- **WHEN** 用户查看标注工具组（Brace、PointLabel、BoxSelect）
- **THEN** 三个按钮使用相同的图标视觉语言（标记/区域符号），激活时 bg-blue-500 text-white

#### Scenario: 变形工具组视觉一致

- **WHEN** 用户查看变形工具组（Move、ZoomGlobal、ZoomCurve）
- **THEN** 三个按钮使用相同的图标视觉语言（曲线 + 方向箭头），激活时 bg-blue-500 text-white

#### Scenario: 标注与变形组之间分隔

- **WHEN** 工具栏渲染完成
- **THEN** 标注工具组与变形工具组之间显示竖线分隔符（`w-px h-5 bg-gray-300`）
