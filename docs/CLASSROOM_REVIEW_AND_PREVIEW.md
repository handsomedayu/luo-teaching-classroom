# 罗老师课堂｜长期预览与自动审核（候选版）

## 目标与隔离边界

- 正式站点：继续使用现有 GitHub Pages 的 `main`，本方案不改变其发布来源。
- 候选预览：在独立的 Cloudflare Pages 项目中接入同一个 GitHub 仓库，由 `codex/*`、`muse/*` 等候选分支产生独立预览 URL。绝不把候选版本部署到正式站的根目录。
- 自动审核证据：GitHub Actions 在候选 PR 更新时，运行 Chromium 逐页截图和科学模型检查，打包可下载的审核证据 ZIP；人工审核仍是发布的必要步骤。
- 公开发布只复制网站资源白名单：`index.html`、`catalog.js`、`site.js`、`site.css`、`.nojekyll`、`shared/`、`physics/`、`chemistry/`、`math/` 下的网页资产。测试、原始 ZIP、报告和本地资料不会自动进入预览网站。

## 已放进仓库的文件

- `.github/workflows/classroom-review.yml`：候选 PR 自动截屏、科学校验、两个 Actions Artifacts。
- `tools/build-review-preview.cjs`：构建 `dist-review/`，仅从白名单复制可公开的静态课件资源。
- `tools/capture-review.cjs`：读取 `catalog.js`，对其中全部课件逐页截图到 `test-results/classroom-review/`，生成 `review-report.json`。会报告脚本错误、文件缺失及目录页数不一致；截图不等于逐项互动验收。
- `.gitignore`：防止误提交临时预览和审核缓存。

## 一次性连接 Cloudflare Pages（需要老师亲自授权）

1. 打开 https://dash.cloudflare.com/ 并登录或创建 Cloudflare 账户，进入 Workers & Pages → Create application → Pages → Import an existing Git repository。
2. 授权 Cloudflare 访问 GitHub 仓库 `handsomedayu/luo-teaching-classroom`；授权页面由 Cloudflare/GitHub 官方提供，不要把账号密码、Token 发到聊天里。
3. 建立一个**独立的预览项目**（例如 `luo-classroom-review`，若该名称已占用请自行选新名称）。不要替换原 GitHub Pages，不要修改 DNS。
4. 设置 Framework preset=None；Root directory=仓库根目录；Build command=`node tools/build-review-preview.cjs`；Output directory=`dist-review`；Production branch=`main`。
5. 完成初次部署后，到 Pages 项目 Settings → Builds → Branch control：关闭 Production branch 的 automatic deployments；开启 Preview branch 自动构建（可选择只匹配 `codex/*` 与 `muse/*`）。这样普通 `main` 更新不会把候选站误当正式站持续发布。
6. 打开新的同仓库 Draft PR 或向候选分支推送提交。Cloudflare 会产生独立的 `*.pages.dev` 预览地址，并在 PR 中提供预览链接。**实际地址以 Cloudflare 返回的链接为准，不预设域名。**

重要：Cloudflare 预览地址默认可被知道链接的人访问。本仓库是公开仓库；不得把学生姓名、成绩、手机号、试卷个人信息、账号凭据、未授权图片或私人资料提交到候选分支。需要受限分享时须另设 Cloudflare Access；本方案不自动配置认证。

## 自动截图和检查如何使用

GitHub Actions 工作流须经过教师审查并合并到默认分支 `main` 后，才会对后续以 `main` 为基底的 PR 自动触发。对已存在的旧分支，Codex 需先安全整合这套工具文件，且不能覆盖其课件内容。

1. Codex 在独立候选分支修改课件并提交 Draft PR。
2. 在 PR → Checks / Actions 中寻找 `Classroom review evidence`。
3. 下载 `classroom-review-evidence`：含逐页 PNG、`review-report.json`、`README.md` 和科学检查 JSON（如果检查产生文件）。
4. 下载 `classroom-preview-site`：一个独立可解压的静态站 ZIP，备用审阅；在线预览优先使用 Cloudflare 生成的实际 URL。
5. 把自动审核证据包提供给 ChatGPT 复核，同时直接打开在线预览检查教师实际手感；明确区分自动测试通过、教学内容复核通过、教师体验通过。
6. 任何一类失败或未经教师确认，均不得合并、不部署到正式站。

## 现有限制与特别注意

- Chromium 逐页截图只检查是否能加载、页面有无报错并保存可人工审阅的画面；它**不能自动证明电路计算、连线和教学质量正确**。
- 改错、实物连接、电表测量对象等需要继续维护单独的 Playwright 操作测试，并记录学生实际接线图、节点与读数；旧测试脚本若只测试预设模型不能算通过。
- `test-results/` 和 `dist-review/` 绝不能提交到公开仓库。Artifacts 有保留期限，本工作流暂设 14 天。
- GitHub Pages 正式网站与 Cloudflare 独立预览互不覆盖。第一次开启 Cloudflare Pages 属于一次新的公开托管行为，需教师在授权界面确认。
- 本 PR 只交付基础设施草案；在合并工作流前，不能声称自动 CI 已经触发成功；在 Cloudflare 授权前不能声称预览网址已经可用。

## 本机快速检查

在仓库根目录运行 `node tools/build-review-preview.cjs`，应生成 `dist-review/`；本机已经安装 Playwright 的前提下执行 `node tools/capture-review.cjs` 可生成截图与审核清单。Codex 在 Windows 执行时如缺 Playwright，应先安装并记录实际浏览器版本。

教师最终签字：只有审核 PR、实际课堂体验和科学问题均确认后，才允许合并对应课程 PR；自动任务不得代替教师授权。
