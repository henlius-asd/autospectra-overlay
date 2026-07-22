## MODIFIED Requirements

### Requirement: 点标签自由放置

点标签在放置时 SHALL 通过 `convertPixelToY` 将点击像素 Y 转换为绝对数据 Y 坐标（`PointLabel.y`），SHALL NOT 依赖任何曲线的像素位置。数据 Y 坐标 SHALL 只与 y 轴范围绑定，y 轴缩放时标签像素 Y 随轴更新。

#### Scenario: 点击任意位置创建点标签

- **WHEN** 用户在放置模式下于图表某像素位置点击
- **THEN** 点标签的 `y` 数据坐标对应点击的像素 Y，标签渲染在该位置，不依赖任何曲线

#### Scenario: y 轴缩放时标签跟随

- **WHEN** 用户通过 y 轴 dataZoom 缩放
- **THEN** 点标签的像素 Y 随 y 轴缩放同步更新（数据 Y 不变，像素 Y 随轴缩放）

## ADDED Requirements

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