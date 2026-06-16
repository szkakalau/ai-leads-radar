# V1.0 部署检查清单

## 云开发配置
- [ ] 云开发环境 ID 已替换 `app.js` 中的 `YOUR_ENV_ID`
- [ ] 云开发环境 ID 已替换 `admin/index.html` 中的 `YOUR_ENV_ID`
- [ ] `project.config.json` 中 `appid` 已替换为真实 AppID

## 云函数
- [ ] 所有云函数已上传部署（12个）
- [ ] 每个云函数目录已执行 `npm install`
- [ ] `DEEPSEEK_API_KEY` 环境变量已在 generate-report 云函数中设置

## 数据库
- [ ] 4 个集合已创建：daily_report, week_rank, user_info, payment_order
- [ ] 集合权限设置为「仅创建者及管理员可读写」
- [ ] 种子数据已填充（执行 seed-data 云函数）

## 管理后台
- [ ] 管理员账号密码已确认：admin / radar2026
- [ ] 管理后台 HTML 已上传至云托管

## 资源文件
- [ ] 微信收款码图片已上传至云存储
- [ ] 客服微信号已配置（mine/index.js 中 kefu_wechat_id_here）
- [ ] Tab 图标已替换为正式图标（当前为占位图）

## 上线前确认
- [ ] 全链路权限验证通过（见 docs/permission-verification.md）
- [ ] .gitignore 已包含 .superpowers/
- [ ] 小程序已提交审核
