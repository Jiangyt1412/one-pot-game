# Release instructions for 一锅端

- 完成并发布用户要求的修改时更新 version。修复、小幅视觉调整递增补丁号；新增功能递增次版本。package.json 是版本、日期和“修订中”状态的来源，同时更新 package-lock.json。
- 在 CHANGELOG.md 最上方记录真实日期、实际新增和修复内容、验证结果。保留历史版本，不得把未完成或未验证的事项写成已完成。
- README.md 和 public/about/index.html 同时显示当前 version、最新更新、游戏入口、图片和视频。保留“修订中”，直到用户明确要求改变。
- 游戏画面改变后更新展示素材与 media-manifest.json。不能重录时，保留素材原始版本和准确来源，不能把旧图标成新版截图。
- 发布前运行 npm run release:check、npm test、npm run build、npm run build:pages。通过后，除非有新修改或问题，不重复扩大检查。
- 用户授权发布后提交到 GitHub 主分支，由 Pages 工作流发布。核对部署结果、公开网址及 version.json，仅推送代码不等于部署成功。
- 首次启用 Pages 需 Source=GitHub Actions。普通 GITHUB_TOKEN 不能代替首次启用所需的管理权限。
- 父项目的 sources/ 仅为只读参考资料，不属于游戏，绝不上传。
