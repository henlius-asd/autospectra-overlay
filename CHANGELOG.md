# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Release workflow: see [docs/VERSIONING.md](docs/VERSIONING.md).

## [Unreleased]

Pending release as `v0.3.0` — the annotation/export polish work currently on
`master` but not yet deployed to GitHub Pages.

### Added
- 点标签贴近最高曲线上方（`getTopCurvePixelYAtX` 基线 + 默认 `yOffset = -10`），去除外框 / 对齐原点 / 虚线，仅保留文字。
- 区域标签（brace）整段横向拖拽平移（宽度不变，5px 阈值区分点击 / 拖拽），Y 基线改为最高曲线峰值上方约 14px。
- PNG 导出跟随 `showAxes` 开关：去除图例与 x 轴预览条、保留当前缩放视图、try/finally 还原线上 option。
- 共享纯函数 helper `labelClamp.ts` / `labelGeometry.ts`，保证屏幕与导出标注位置一致。
- `updateBrace` store action（参与 undo/redo）。
- 构建时注入 `__APP_VERSION__`（来自 `package.json`），工具栏显示版本号。

### Changed
- `deploy.yml` 触发条件由 `push: branches: [master]` 改为 `push: tags: ['v*']`，推 master 不再自动部署。

## [0.2.0] - 2026-07-07

### Changed
- 移除过时的 `gh-pages` 分支依赖，改用 GitHub Actions 制品部署（`actions/deploy-pages`）。

## [0.1.0] - 2026-07-07

### Added
- 首个 GitHub Pages 自动部署工作流（push to master 触发构建并发布）。

[Unreleased]: https://github.com/henlius-asd/autospectra-overlay/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/v0.2.0
[0.1.0]: https://github.com/henlius-asd/autospectra-overlay/releases/tag/history-v0.1.0
