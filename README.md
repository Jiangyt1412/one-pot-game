<p align="center"><a href="https://jiangyt1412.github.io/one-pot-game/"><img src="public/about/media/hero-v1.10.0.jpg" alt="一锅端：当前引擎与游戏食物素材制作的展示海报" width="100%"></a></p>

<h1 align="center">好东西，一锅端。</h1>
<p align="center">满满一锅美味，等你眼疾手快。<br>找到露出的食物，凑齐三个，让小盘带着美味飞走。</p>
<p align="center"><a href="https://jiangyt1412.github.io/one-pot-game/"><strong>开始游戏 ↗</strong></a> · <a href="https://jiangyt1412.github.io/one-pot-game/about/">游戏简介 / 视频</a> · <a href="CHANGELOG.md">更新记录</a></p>
<p align="center"><strong>Version 1.10.1</strong> · 修订中（WIP） · 2026-10-14</p>
<!-- latest-version: 1.10.1 -->
<p align="center"><sub>手机竖屏 · 无需账号 · 进度保存在当前浏览器</sub></p>

---

## 在一锅热闹里，找准你的美味

每一锅都换个布局，大白菜、鸡腿和小鱼丸随机分散，各有自己的尺寸，同种食物大小一致。食物缓缓漂动，同层物品相互碰撞；点走一个，邻居慢慢补位，下一盘的美味也有机会露出来。

| 一锅够热闹 | 三个刚刚好 |
| --- | --- |
| 每关 **99 件、15 种**食物，全库 **28 种**轮换，50 关。 | 目标盘是**三角形三个位置**，收齐同类食物，满盘飞走，新盘飞入。 |
| **留一点余地** | **遇见新的目标** |
| 非目标食物进入暂存；暂存不会三消，满格就失败。 | 下一盘从剩余库存中随机预排，恰好匹配的暂存食物才会移入目标盘。 |

<p align="center"><img src="public/about/media/gameplay-v1.10.0.jpg" alt="当前引擎初始关卡，离线渲染" width="32%"> <img src="public/about/media/gameplay-detail-v1.10.0.jpg" alt="当前引擎点击后的关卡，离线渲染" width="32%"> <img src="public/about/media/food-guide-v1.10.0.jpg" alt="28种清理后食物素材图鉴" width="32%"></p>

<sub>演示素材：v1.10.0。由当前 GameEngine / FloatingScene 与游戏素材离线渲染；展示布局为绘图重现，不是浏览器截图或手机性能测试。</sub>

## 看它动起来

[![当前引擎的漂动与点击演示](public/about/media/preview-v1.10.0.gif)](https://jiangyt1412.github.io/one-pot-game/about/#video)

**[播放完整视频 ↗](https://jiangyt1412.github.io/one-pot-game/about/#video)** · [MP4 文件](public/about/media/demo-v1.10.0.mp4)

视频按正常游戏时间推进，展示漂动、可见食物选择和点击后的局部补位。选择由脚本完成，位置通过食物像素轮廓核对；画面叠加演示指针，无声。

## 这次更新 · v1.10.1

- 精简 README、简介页和相关说明中的非玩法内容。
- 同步 version 与更新摘要；玩法沿用 v1.10.0，展示素材保留准确的原始版本。

[完整更新记录](CHANGELOG.md) · [本版验证](docs/RELEASE_1.10.1.md) · [发布流程](docs/RELEASING.md)

## 打开就玩

1. 用手机浏览器打开 **[一锅端](https://jiangyt1412.github.io/one-pot-game/)**，选择“开始游戏”。
2. 优先收集目标盘需要的食物；其他食物会占用暂存格。

首次在线成功加载后，游戏资源可离线缓存；简介媒体不加入游戏离线下载。清理网站数据会清除进度，其他设备不会自动同步。

<details><summary><strong>开发、规则与验证</strong></summary>

```bash
npm ci # 安装锁定依赖
npm run dev # 本地开发
npm test # 游戏规则与部署地址测试
npm run release:check # 核对版本、记录和演示素材
npm run build # 本地根目录构建及离线校验
npm run build:pages # GitHub项目子目录构建及离线校验
npm run preview:pages # 预览Pages构建
```

React + TypeScript + Vite；Canvas 绘制食物。实现与验证见 [DEVELOPMENT.md](docs/DEVELOPMENT.md)、[TEST_REPORT.md](docs/TEST_REPORT.md)，素材来源见 [ART_DIRECTION_V15.md](docs/ART_DIRECTION_V15.md)。

当前仍在修订难度、动画和手机适配。广告是占位演示，未接真实广告网络；没有服务器账号或防作弊。全部堆叠布局的几何可解性、真实手机性能与麦克风尚未验证。

GitHub Pages 首次需在 Settings → Pages 将 Source 设为 GitHub Actions；之后主分支更新由工作流发布。是否已上线以部署结果与网站实际返回为准。

</details>
