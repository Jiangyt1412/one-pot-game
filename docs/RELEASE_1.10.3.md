# v1.10.3 发布记录

日期：2026-10-15。状态：修订中（WIP）。

用户反馈简介视频卡顿、无法正常播放。检查确认旧MP4可完整解码，线上MIME为video/mp4，两处字节范围请求均返回206和正确Content-Range。旧片为24帧/秒、3,090,645字节，只有0秒和10.416667秒两个关键帧；页面仅预载元数据。这些检查无法单独确定用户设备上的卡顿原因。

本版从实际GameEngine / FloatingScene重新渲染16秒演示，每秒推进30个独立模拟帧。PNG帧缩放为450×800，再转换为有限范围BT.709、yuv420p、H.264 Constrained Baseline，关键帧间隔1秒，保留moov前置。文件为1,666,990字节，比旧片减少46.06%。未使用补帧或加速播放。

播放器使用preload=auto，并根据原生waiting、stalled与error事件显示简短状态。Service Worker不接管简介媒体、音视频或Range请求，由浏览器直接处理网络流。README改为点击封面播放完整视频，避免把低帧率预览动图当成视频。更新本版图片、视频和来源清单；图片保持自然比例。

已完成的验证：

- FFmpeg完整解码480帧，时间戳逐帧间隔1/30秒；关键帧准确位于0至15秒的每个整秒。
- 实际输出为450×800、30帧/秒、有限范围BT.709、yuv420p；不含旧ICC侧数据；moov位于mdat之前。
- 演示脚本完成4次经像素轮廓核对的合法选择和1次三消。查看解码后的12.5秒帧，文字和食物画面可辨认。这是媒体文件检查。
- 49项既有单元测试、release:check、TypeScript、根目录构建与Pages项目路径构建通过。
- 两个构建的Service Worker检查包含媒体、音频和Range放行，并保留游戏离线回退与其他项目缓存隔离。

限制：浏览器DOM检查工具超时，未取得真实浏览器播放、掉帧或手机网络测试结果；不能据上述解码与构建检查保证所有设备都流畅。发布状态应以GitHub Actions和线上version.json实际结果为准。

设计依据：[MDN的video/preload说明](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)将auto定义为可预载整个文件的提示，浏览器可按自身策略忽略它；[Apple的Safari视频交付说明](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingVideoforSafarioniPhone/CreatingVideoforSafarioniPhone.html)说明了video/mp4与字节范围交付要求。预载和兼容编码用于降低播放负担，不能代替实际设备验证。

首次GitHub部署被测试时限阻止：[工作流38605108859](https://github.com/Jiangyt1412/one-pot-game/actions/runs/38605108859)中48项通过，200种子重复布局测试超过默认5秒时限；构建和部署未执行。后续修复见v1.10.4。
