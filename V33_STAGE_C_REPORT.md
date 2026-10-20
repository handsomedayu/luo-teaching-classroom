# V3.3 阶段 C｜第三章第 14 页自由接电压表

## PR #16 审核证据补齐（2026-10-20）

回应 [审核评论 6288882778](https://github.com/handsomedayu/luo-teaching-classroom/pull/16#issuecomment-6288882778)，审核源提交为完整 SHA `4065009cd72313b9bde436aec01ffb1e4a857191`。本轮在独立 worktree 重测；未修改任何课件源码或第26—31页。下文旧 `bf948bc` 结果仅作历史记录，不作为新 SHA 的通过证据。

本地 Windows 实测 Chrome 156.0.8078.35（1920×1080、1366×768）、Playwright 1.62.1 / WebKit 26.5（844×390 触控），浏览器阻断外部 HTTP(S)。第14页 `node tests/v33-p14.cjs` 57/57；覆盖两柱接表、一笔悬空、先预测再验证、错误预测反馈、同为3 V的不同对象、反接−6 V、同节点0 V、右键/触控删线、Ctrl+Z、按钮撤销与重置。关键截图已人工查看，窄屏整体缩放较小，仍待真机投屏确认。

相关回归：`node tests/science.cjs` 601/601；`node tests/network.cjs` 935/935；`node tests/advanced-circuits.cjs` 22个模型通过；`node tests/interact-circuits.cjs` 46/46；`P23_WEBKIT=1 node tests/v32-p23.cjs` 122/122（含电源短路阻止及危险提示）；`ADVANCED_WEBKIT=1 node tests/advanced-interactions.cjs` 211/211；`ADVANCED_WEBKIT=1 node tests/advanced-browser.cjs` 第三章34页948/948；`node tools/build-review-preview.cjs` 58个公开资源构建成功。最终失败数均0，浏览器无脚本错误。

初测确实发现旧 `interact-circuits.cjs` 使用废弃的 `ac:term/doneCount` 接口而失败；已改为真实接线动作、拓扑判定、0.20 A和撤销后断路断言，保留其余物理约束，重测46/46。未放宽课件判题条件。第14页测试新增按钮撤销断言和逐项结果、真实浏览器版本记录。

可核验本地产物：[local-results.json](reports/pr16-review-6288882778/local-results.json)，含完整源SHA、运行时间、命令、通过/失败、文件与截图SHA-256。截图原件位于本机独立worktree的 `test-results/v33-p14/` 等目录。没有把旧截图或旧报告冒充新提交结果。

新增 `.github/workflows/pr16-evidence.yml` 仅监听本PR候选分支；以 `node tools/pr16-evidence.cjs` 在干净检出上重跑上述项目，将完整 `github.sha`、真实命令退出码、JSON结果和公开课件生成截图存为30天GitHub Actions产物。CI状态和产物地址必须以真实运行结果及后续PR完成评论为准；本报告不预先宣称CI成功。提交后的本地复测另保存完整HEAD SHA清单，确保测试与最终部署SHA对应。

限制：WebKit自动化不等同真机iPhone Safari；器材外观、教室投屏尺寸、教材版次及海南考纲对应仍待教师确认。未进行合并、正式发布或页序调整。

## 历史实现记录

候选分支 `codex/v33-stage-c`，[Draft PR #16](https://github.com/handsomedayu/luo-teaching-classroom/pull/16)，基于阶段 B 的 `db210c0`。提交 `bf948bc` 的 [固定预览](https://a9181cbf.luo-classroom-review.pages.dev/physics/grade-9/electricity-03/) 已成功部署；Chrome 实际访问并接表验证 V＝1.00 V、主回路 0.10 A、无脚本错误。本阶段只调整第三章第 14 页及相应测试；正式 `main`、公开网站和其他学科未改动。

旧页预先画好三只电压表，让学生识图。新版保留三灯串联基础回路，只给一只初始悬空的电压表。左键点 V+ / V−，再点 A/B/C/D 接线点；右键断开已有引线，触屏先选线再点断开；支持撤销、重置、Ctrl+Z。两笔接妥后先选预测对象，再点“验证”。未接妥或尚未验证时读数显示“—”，不先显示答案；按实际端点归纳测量对象，不从电压数值倒推。

物理核对：理想 6 V、10/20/30 Ω 三灯串联，主回路电流 0.10 A；L₁、L₂、L₃ 分别 1、2、3 V；A—C 的 L₁＋L₂ 也为 3 V，C—D 的 L₃ 同为 3 V，但系统按节点正确区分；A—D 为整段/电源两端 6 V；反接显示 −6 V 并提示极性；同点接表为 0 V。理想高内阻电压表不改变主回路。

真实浏览器使用本地 `file://` 并阻断外部网络：Chrome 1920×1080、1366×768，WebKit 844×390 触控，第 14 页专项 54/54；第三章模型专项通过，原第 26—31 页专项均通过；Chrome 整章交互 103/103、Chrome＋WebKit 211/211，Chrome 逐页 632/632、WebKit 横屏逐页 316/316，基础科学 601/601，失败均 0。发现 1920×1080 操作按钮被截断，已缩小此页图形高度并复测。截图在本机忽略目录 `test-results/v33-p14/`，未进入公开预览。

仍需教师体验：投屏上接线柱大小、学生预测流程和移动端真机 Safari 的手感。教材版次及海南具体中考要求未核实。阶段 D 的十章内容去重和科学复审仍待推进。
