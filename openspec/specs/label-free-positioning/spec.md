# label-free-positioning Specification

## Purpose
TBD - created by archiving change brace-style-free-position. Update Purpose after archive.
## Requirements
### Requirement: 区间标签自由纵向定位

区间标签 SHALL 支持自由纵向定位。每个区间标签的 Y 基线 SHALL 独立计算为 `braceY + (brace.yOffset ?? 0)`，其中 `braceY` 为默认基线（水平主线贴近顶曲线峰值），`yOffset` 为像素偏移（正值向下，默认 0）。`yOffset` SHALL 存储在 `BraceAnnotation.yOffset` 字段中，通过 IndexedDB 持久化并纳入 workspace JSON 导入/导出。

#### Scenario: 纵向拖拽区间标签

- **WHEN** 用户按住一个已有区间标签并纵向拖动超过 5px
- **THEN** 该区间标签的 yOffset 随拖拽实时更新，标签沿纵向移动，释放后保留新位置

#### Scenario: 新旧快照兼容

- **WHEN** 导入不含 `yOffset` 字段的旧工作区 JSON
- **THEN** 该字段默认为 0，区间标签渲染在默认基线位置，无报错

### Requirement: 区间标签和点标签无位置约束

区间标签和点标签的文字位置 SHALL NOT 被 clamp 约束到 grid 绘图区域内。标签文字 SHALL 渲染在计算出的原始像素坐标上，不进行边界裁切。用户可通过拖拽将标签放置在画布任意位置。

#### Scenario: 标签拖到画布边缘外

- **WHEN** 用户拖拽区间标签或点标签到画布 grid 边界之外
- **THEN** 标签文字 SHALL 渲染在原始坐标上，不被 clamp 回 grid 内，可能部分或完全不可见

#### Scenario: 拖拽回画布内

- **WHEN** 用户拖拽已移出画布的标签回到画布内
- **THEN** 标签文字重新可见，位置由拖拽决定

### Requirement: 点标签自由放置

点标签在放置时 SHALL 通过 `convertPixelToY` 将点击像素 Y 转换为绝对数据 Y 坐标（`PointLabel.y`），SHALL NOT 依赖任何曲线的像素位置。数据 Y 坐标 SHALL 只与 y 轴范围绑定，y 轴缩放时标签像素 Y 随轴更新。

#### Scenario: 点击任意位置创建点标签

- **WHEN** 用户在放置模式下于图表某像素位置点击
- **THEN** 点标签的 `y` 数据坐标对应点击的像素 Y，标签渲染在该位置，不依赖任何曲线

#### Scenario: y 轴缩放时标签跟随

- **WHEN** 用户通过 y 轴 dataZoom 缩放
- **THEN** 点标签的像素 Y 随 y 轴缩放同步更新（数据 Y 不变，像素 Y 随轴缩放）

### Requirement: 标签双击编辑

区间标签和点标签 SHALL 通过双击触发编辑浮层。单击 SHALL NOT 触发编辑。拖拽 SHALL NOT 触发编辑。编辑浮层内的按钮 SHALL 保留单击行为。

#### Scenario: 双击标签弹出编辑

- **WHEN** 用户双击已有区间标签或点标签
- **THEN** 弹出标签编辑浮层，可修改文字或删除

#### Scenario: 拖拽后单击不弹出编辑

- **WHEN** 用户拖拽标签后释放（位移 >= 5px），然后快速单击
- **THEN** SHALL NOT 弹出编辑浮层

### Requirement: 标签命中区域

区间标签和点标签 SHALL 在可见元素下方叠加透明命中区域，使鼠标在元素周围均可命中拖拽和双击编辑。命中区域 SHALL 不改变视觉效果。区间标签括号 SHALL 使用 16px 宽透明描边路径，点标签文字 SHALL 使用透明矩形（`textW + 8px` × `fontSize * 1.4`）。

#### Scenario: 鼠标靠近标签即可拖拽

- **WHEN** 鼠标指针位于标签元素周围命中区域内
- **THEN** 光标变为拖拽状态，按住可拖拽标签，无需精确命中可见元素

#### Scenario: 命中区域不可见

- **WHEN** 标签被渲染
- **THEN** 命中区域 SHALL NOT 影响图表视觉效果，标签外观与无命中区域时一致

