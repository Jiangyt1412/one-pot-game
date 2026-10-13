# v1.9.0 发布验证

日期：2026-10-14。状态：修订中（WIP）。本版增加 GitHub Pages 发布配置、游戏简介与版本记录，玩法沿用 v1.8.0。

## 已完成的本地检查

| 检查 | 结果与范围 |
| --- | --- |
| npm test | 6 个测试文件、45 项通过；其中新增3项部署资源地址测试。 |
| npm run build | TypeScript、Vite构建及根目录资源、离线范围校验通过。 |
| npm run build:pages | /one-pot-game/ 子目录构建、图标、CSS背景、食物和Service Worker地址检查通过。 |
| 离线缓存检查 | 在Node VM中执行生成的Service Worker：安装资源位于自身目录，保留其他项目缓存，离线导航回退自身首页。并非浏览器离线实测。 |
| npm run release:check | package、锁文件、README、简介页、CHANGELOG版本与日期一致；媒体文件尺寸与SHA-256核对。 |
| 演示引擎 | 第2关、种子1412，按正常游戏时间运行16秒，24fps、384帧；4次通过真实alpha轮廓检查的脚本选择，1次匹配。 |
| 视频文件 | FFmpeg完整解码通过；H.264、540×960、无声。 |
| 图片 | 本地查看海报与图鉴，修正缺失中文字形；素材来源与哈希保存在media-manifest.json。 |

## 展示与验证边界

图片、GIF与MP4来自当前GameEngine、FloatingScene和游戏素材的离线渲染。UI由Canvas绘图重现，不能称为浏览器截图、真人操作录屏或手机实测。

浏览器控制此前超时，本地游戏预览也曾被安全策略拒绝。本轮没有绕过这些限制；简介在浏览器中的最终布局、真实手机性能、触控与麦克风尚未验证。

GitHub Pages首次需仓库Settings → Pages → Source选择GitHub Actions。工作流部署结论以Actions实际结果及公开网站version.json为准；源码构建通过不等于网站已经上线。

全部关卡堆叠布局的几何可解性尚未证明。广告仍为占位演示，进度保存在当前浏览器。
