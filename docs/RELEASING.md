# 发布一锅端

版本、日期和状态存于 package.json 的 version / gameRelease；游戏和 version.json 自动读取。每次对外发布新修改递增版本，同时更新 package-lock.json、README.md、CHANGELOG.md、public/about/index.html。

```bash
npm version 1.10.3 --no-git-tag-version # 示例：下一补丁版本
npm run release:check # 核对版本、记录与媒体
npm test # 游戏和部署地址验证
npm run build # 本地预览构建
npm run build:pages # Pages项目路径构建与离线隔离检查
```

CHANGELOG 最新条目写真实日期、实际新增和修复、验证结果及未验证限制。新功能递增次版本，例如1.10.0；仅推送代码不等于部署成功。

视觉变化时重录图片或视频，更新 media-manifest.json。无法重录时保留原始版本与来源，不把旧图标成新版截图。

媒体脚本用 @napi-rs/canvas 和 FFmpeg 离线渲染。MEDIA_MODULE_ROOT 可指定绘图库的 require 入口，ONE_POT_FFMPEG 指向可信 FFmpeg 二进制。ONE_POT_MEDIA_FONT 可指定包含所需中文字形的字体；默认使用 macOS 的 Arial Unicode.ttf，字体不可用时脚本会报错。

```bash
npm run media:render # 重绘媒体，需安装上述绘图和视频工具
```

首次启用 GitHub Pages：Settings → Pages → Source 选择 GitHub Actions，不必选择模板。标准 GITHUB_TOKEN 无法代替首次启用的管理权限。依据：[GitHub发布源说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[configure-pages参数](https://github.com/actions/configure-pages/blob/main/action.yml)。

主分支更新后检查 Actions 的 Publish One Pot Game；部署成功后核对网站与 version.json。

- 游戏：https://jiangyt1412.github.io/one-pot-game/
- 简介：https://jiangyt1412.github.io/one-pot-game/about/
- 版本：https://jiangyt1412.github.io/one-pot-game/version.json

不要强制覆盖远程修改。父项目 sources/ 是只读参考资料，不属于发布范围。
