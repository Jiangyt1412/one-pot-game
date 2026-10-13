# v1.9.1 发布验证

日期：2026-10-14。状态：修订中（WIP）。

[首次GitHub工作流](https://github.com/Jiangyt1412/one-pot-game/actions/runs/38453323152)的依赖安装与版本检查通过，测试为44项通过、1项超时。失败项运行2400帧，耗时约5.6秒；没有记录断言失败。v1.9.1仅为这一项测试设置15秒时限，保留全部模拟步骤和断言。

图片与视频继续使用v1.9.0素材并保留原始标签；玩法与画面未改动。媒体验证和浏览器验证边界见 [v1.9.0发布验证](RELEASE_1.9.0.md)。

本地验证：45项测试通过；release:check、根目录构建与/one-pot-game/构建通过，离线资源范围和版本一致性检查通过。Linux runner验证结果由本版工作流另行确认。

首次启用Pages仍需Settings → Pages → Source选择GitHub Actions。部署成功与否以工作流实际结果及公开网站version.json为准。
