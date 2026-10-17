# 罗老师数理化课堂 · V3 优化候选版

离线：打开根目录 `index.html`，按学科、年级进入课件。复制时保留目录结构和 `shared/`。物理123页、化学105页；数学七至九年级保留待添加目录。

本次仅在 `codex/classroom-v3-optimization` 分支修改，供教师审核。没有合并 main，没有正式部署。保留原站链接和已完成课件。

## 检查与续做

先读 [优化进度](OPTIMIZATION_PROGRESS.md)，再检查 Git 状态；不要重建已完成内容。科学与教学终审、教材版次和海南考试对应仍需老师确认。

- [逐页物理审核](reports/PHYSICS_REVIEW.md)
- [测试结果](reports/TEST_RESULTS.md)
- [性能对比](reports/PERFORMANCE.md)
- [修改记录](reports/CHANGES.md)

验证使用 Node.js、现有 Playwright、Chrome/Edge 与 Playwright WebKit。不为网站增加运行依赖，不调用付费服务。测试优先使用已安装的 `playwright`；也可用 `PLAYWRIGHT_PATH` 指向现有依赖。浏览器启动路径/版本按运行环境准备。

```text
node tests/science.cjs
node tests/network.cjs
node tests/regression.cjs
node tests/chemistry.cjs
node tests/site.cjs
node tests/motion.cjs
node tests/preservation.cjs
node tests/review-interactions.cjs
node tests/review-capture.cjs
node tests/performance.cjs <对照版本目录> before
node tests/performance.cjs . after
node tests/capture.cjs
```

`BASELINE` 可指定保护基线目录，供 preservation/capture 使用；完整性能对比应在同机同环境依次运行，避免并行测试争抢资源。`PHYSICS_MODE` 可选择 `1920`、`1366`、`mobile`、`webkit`，默认全量。

PR #1 二审用关键页前后截图位于 `reports/review-images/`，对应科学与接线复核见 `reports/PHYSICS_REVIEW.md`。更新截图需提供只读 main 基线给 `BASELINE`，不要覆盖正式课件。

截图、Performance traces、逐项结果位于 `test-results/`，已加入 Git 忽略；PR仅包含代码、测试与必要报告，不上传学生资料或本机截图。真机 iPhone Safari 不等同于 WebKit 模拟测试。

审核后如需发布，由老师明确确认再合并；本分支不添加任何自动部署流程。
