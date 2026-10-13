# 1.5美术与资源记录

本轮界面改为奶油白与珊瑚橙，蓝绿色道具作点缀。背景用轻格纹厨房桌面，锅为浅色搪瓷与银灰锅沿，锅底为带油花和小气泡的番茄汤。界面、锅和汤底通过CSS及项目原生SVG实现，没有生成或复制整页游戏截图。

新增5种食物使用内置image_gen工具，transparent_background=true，分别生成独立图片。未使用CLI或外部API，也未把用户截图复制为游戏素材。

| 食物 | 最终运行时文件 | 原始生成文件 |
|---|---|---|
| 寿司 | public/assets/items/sushi.webp | docs/art/new-foods-v15/sushi.png |
| 烤肠 | public/assets/items/sausage.webp | docs/art/new-foods-v15/sausage.png |
| 葡萄 | public/assets/items/grapes.webp | docs/art/new-foods-v15/grapes.png |
| 蜜桃 | public/assets/items/peach.webp | docs/art/new-foods-v15/peach.png |
| 雪糕 | public/assets/items/ice-pop.webp | docs/art/new-foods-v15/ice-pop.png |

每张实际返回1254×1254、带alpha的PNG，保持原图在工作区，另打包为512×512无损WebP。所有原图、提示词和结果均已保存，没有只引用工具默认目录中的文件。

完整逐项生成提示词保存在art/food-manifest-v15.json。使用的是stylized-concept，单个居中的食物、透明背景、完整轮廓、上左光源、略俯视的立体玩具食物风格；没有人物、脸、文字、盘子或散落碎屑。

原有图集中的部分格子确实带入邻格碎片，例如藕片左边的独立碎片。运行时SpriteSanitizer提取最大连接主体，保留其边缘抗锯齿，移除远离主体的残余；原始图集和旧源文件未被覆盖。清理后的轮廓统一用于锅内绘图、点击、目标盘、暂存和飞行动画。

素材检查图：art/food-contact-sheet-v15.jpg。它展示28个清理后的食物主体，不是游戏画面。真实素材数据检查记录：art/asset-audit-v15.json；可选脚本scripts/audit-assets.ts，需要sharp。

锅底原生SVG：public/assets/broth-v15.svg。主题：src/theme.css。食物尺寸始终按种类固定；上浮下沉不通过改变物品大小实现。
