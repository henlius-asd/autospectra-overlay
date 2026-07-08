# 版本发布管理指南

本项目（AutoSpectraOverlay，Vite + React 前端，部署于 GitHub Pages）的版本与发布规范。
按本指南操作可避免版本号、tag、线上部署三者不一致。

---

## 1. 单一真相源

- **版本号唯一来源 = `package.json` 的 `version` 字段。**
- 工具栏右下角显示的 `v<x.y.z>`（来自构建时注入的 `__APP_VERSION__`）必须与线上对应 tag 一致。
- 任何版本号变更都必须先改 `package.json`，再打对应 tag——不要凭空打 tag。

## 2. 语义化版本（SemVer，当前 0.x 阶段）

开发期使用 `0.MINOR.PATCH`：

| 变更类型 | bump | 示例 |
|---|---|---|
| 新功能 / 行为变化 | minor | `0.2.0` → `0.3.0` |
| 纯 bug 修复 | patch | `0.3.0` → `0.3.1` |
| 重大重写 / 公开 API 破坏 | major（达到稳定后再用） | `0.x` → `1.0.0` |

commit 前缀与 bump 的对应（已在用）：
- `feat:` → 通常 minor
- `fix:` → patch
- `chore:` / `docs:` / `ci:` / `test:` → 一般不发布，或并入下一个版本

> 0.x 阶段下，minor 之间允许不兼容；到 `1.0.0` 再严格遵循 SemVer 兼容性承诺。

## 3. 黄金规则：tag 触发部署

`.github/workflows/deploy.yml` 仅在推送 `v*` tag 时部署到 GitHub Pages：

```yaml
on:
  push:
    tags: ['v*']
  workflow_dispatch:
```

因此：

- **推 `master` 不会部署** —— 可以随时推代码备份 / 协作，线上不受影响。
- **推一个 `v*` tag = 把那个 tag 指向的代码部署到线上。**
- `workflow_dispatch` 可在 GitHub Actions 页面手动触发，部署当前 `master` HEAD（用于紧急回滚或测试部署）。

## 4. 标准发布流程

发布新版本（以 `0.3.0` 为例）：

```bash
# 1. 确保 master 干净、本地与远端同步、CI 本地通过
rtk git status                  # 工作树干净
rtk vitest                      # 测试通过
rtk tsc                         # 类型检查通过

# 2. 更新 CHANGELOG：把 [Unreleased] 的内容移到新版本小节下，新增 [Unreleased]

# 3. bump 版本（npm version 自动改 package.json + 提交 + 打 tag）
npm version minor               # 0.2.0 → 0.3.0；patch/minor/major 按需
# 等价于手动：改 package.json version → git commit -m "release: v0.3.0" → git tag -a v0.3.0 -m "release 0.3.0"

# 4. 推送代码与 tag（tag 推送触发部署）
rtk git push origin master --follow-tags

# 5. 在 GitHub Releases 页面基于该 tag 发一个 release（可选，便于人类阅读）
```

> `npm version` 默认提交信息是 `0.3.0`，可用 `npm version minor -m "release: v%s"` 自定义。

## 5. 紧急回滚

若线上版本有故障，回退到上一个 tag：

```bash
# 方式 A：手动 dispatch 部署指定 commit（推荐，不引入新 tag）
#   GitHub Actions → Deploy to GitHub Pages → Run workflow → 选 master
#   先 git checkout <旧 tag> 并强制推 master？不要——改用方式 B

# 方式 B：推一个回滚 tag 指向旧版本
git tag -a v0.3.1 <上一个稳定 commit> -m "rollback to 0.2.0"
git push origin v0.3.1          # 触发部署该 commit
```

回滚时**不要删除已推的坏 tag**（会留下悬空部署记录）；用更高 patch 号覆盖。

## 6. 历史回溯 tag 的坑

给已部署过的旧版本补打 `v*` tag **会触发部署**，可能把线上回退：

| 旧版本 | 推 `v*` tag 的后果 |
|---|---|
| 当前线上版本（如 v0.2.0 @ `ed50887`） | 重新构建同款代码，线上无变化。**安全**。 |
| 更早版本（如 v0.1.0 @ `0922261`） | **把线上回退到该旧版本！** 禁止直接推 `v*` tag。 |

给历史版本留档的安全方式：
- **本地打 tag，不推远端**：`git tag -a v0.1.0 0922261 -m "..."`（仅本地参考）。
- 或用**非 `v*` 前缀**的 tag 推远端留记录：本项目 v0.1.0 即采用 `history-v0.1.0`（`git tag -a history-v0.1.0 0922261 -m "..."` → `git push origin history-v0.1.0`），不触发部署，GitHub 上可作 release 锚点。
- 或在 GitHub Releases 面板手动建一个 release 指向该 commit，但**不要**让其创建 `v*` tag。

## 7. CHANGELOG 维护

- 文件：[CHANGELOG.md](../CHANGELOG.md)，Keep a Changelog 格式。
- 日常开发把变更记在 `[Unreleased]` 下；发布时把 `[Unreleased]` 改为新版本号小节，并重建空的 `[Unreleased]`。
- 底部的对比链接（`compare/v0.2.0...HEAD` 等）随版本递增。

## 8. 版本号不一致自检清单

发布前确认这三者一致：

- [ ] `package.json` 的 `version`
- [ ] 即将推送的 git tag `v<version>`
- [ ] CHANGELOG 顶部对应版本小节 + 日期

部署后确认：

- [ ] 工具栏显示的 `v<x.y.z>` 与 tag 一致
- [ ] GitHub Actions 该次 deploy workflow 成功（Pages 已更新）

不一致时：以 `package.json` 为准，补打 / 删除本地 tag 对齐，再推。

## 9. 速查

| 操作 | 命令 |
|---|---|
| 发布 minor | `npm version minor && rtk git push origin master --follow-tags` |
| 发布 patch | `npm version patch && rtk git push origin master --follow-tags` |
| 手动部署当前 master | GitHub Actions → Run workflow |
| 查看本地 tag | `rtk git tag` |
| 查看某 tag 指向 | `rtk git show v0.2.0 --oneline -s` |
| 删除本地误打 tag | `git tag -d v0.x.0` |
| 删除远端误推 tag | `git push origin :refs/tags/v0.x.0`（注意会先触发一次部署） |

---

历史发布：
- `0.1.0` @ `0922261`（2026-07-07）— 首个 Pages 自动部署。远端 tag 为 `history-v0.1.0`（非 `v*`，回溯留档、不触发部署）。
- `0.2.0` @ `ed50887`（2026-07-07）— 移除 gh-pages 分支依赖。远端 tag 为 `v0.2.0`（同款重建，安全）。
- 下一个：`v0.3.0` — 标注 / 导出优化（当前 `master` 未发布）
