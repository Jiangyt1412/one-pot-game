# 美术与生成记录 · v1.2

方向：参考用户提供的三张游戏截图，采用自然食物色、暖色餐桌、深色铁锅、瓷白目标盘、木质暂存区及红黄操作按钮。第一、二张主要用于立体食物和铁锅方向；第三张主要用于清楚轮廓、紧凑收集物和明确操作层级。未把参考图本身复制进游戏。

执行方式：内置image_gen工具，transparent_background=true。只生成一个食物图集资产，随后使用sharp按5×5格子切分、保持alpha并编码为无损WebP；切分是资源打包，没有绘制替代原图。

## 保存路径

- 原始生成图集：docs/art/food-atlas-v2.png。
- 已解码透明素材的米色背景检查图：docs/art/sprite-contact-sheet.jpg，仅为素材预览，不是游戏界面截图。
- 23种运行时素材：public/assets/items/{食物id}.webp。
- 资源路径配置：src/config/items.ts；锅内Canvas、目标盘、暂存盘、飞行动画和首页统一使用这组素材。
- 切分脚本：scripts/extract-food-atlas.mjs。需要sharp；维护环境可临时安装sharp，或通过SHARP_MODULE_ROOT指定已有sharp所在package.json。
- 旧SVG源稿继续保留，但已不作为游戏食物的运行时图片。

工具实际返回1254×1254原图，单格约250–251px；单图打包为256×256。提示词希望2560×2560，但实际输出未达到该尺寸，因此不宣称2560原生图集、4K或512px食物细节。食物在游戏中缩小显示，Canvas按devicePixelRatio分配绘制缓冲，比例上限3；实际手机清晰度和性能仍需实机检查。

## 最终生成提示词

Use case: stylized-concept. Asset type: ONE production game sprite ATLAS, a single square image containing 23 isolated food sprites in a STRICT 5 by 5 equal cell layout, on a truly transparent alpha background. Generate a 2560x2560 square atlas if possible. Every sprite is centered within its cell, fits inside 75% of cell width/height, with generous empty transparent gutters, no overlap between cells. NO visible grid, NO frames, NO plates, NO text, NO labels. Rows and columns exactly ordered:

Row 1: curled cooked orange shrimp; crescent Chinese dumpling with pleated white wrapper; bright green broccoli floret with pale stalk; golden roasted chicken drumstick with white bone; plump brown shiitake mushroom with cross cut.

Row 2: pale green napa cabbage leaf; yellow corn cob chunk with green husk; off-white tofu cube; red-and-white imitation crab stick; round white fish ball.

Row 3: red beef roll with cream spiral; beige lotus-root slice with clearly visible holes; orange carrot with green leafy top; sunny-side-up egg with vivid golden yolk; folded Chinese wonton.

Row 4: fresh ruffled green lettuce; yellow steamed siu mai dumpling with orange topping; round white steamed bun with pinched folds; red strawberry with green leaves; round orange fruit with green leaf.

Row 5: triangular watermelon wedge with green rind and seeds; strawberry cream cake slice; pink glazed doughnut with multicolor sprinkles; EMPTY transparent cell; EMPTY transparent cell.

Style: original polished casual mobile game food art, chunky rounded semi-3D clay render, playful toy-like realistic food, top-down / subtle three-quarter overhead angle consistent across all sprites. Warm appetizing natural food colors, strong color separation, bright saturated orange red yellow green foods, NOT a pastel candy palette. Clear dark brown silhouette definition, smooth dimensional shading, crisp highlights, subtle baked texture, softly exaggerated cute proportions, detailed food material. These are food objects, no human-like faces, eyes or smiles. Coherent lighting from upper-left with small tightly contained contact shadow in alpha, no huge fuzzy shadows. Each food is recognizable at 60px. Must look like high quality collectible food objects in a hotpot sorting game. Do not imitate any existing game's exact assets, logos or characters. The original objects should combine dimensional appetizing food with clear stylized silhouettes. Avoid flat SVG/vector style, flat line drawings, washed-out beige foods, background checkerboard, scene, text, watermarks, visual clutter. All 23 sprites must be complete and non-cropped and centered accurately on the exact 5x5 lattice.

## 配色锚点

| 用途 | 色值 |
|---|---|
| 暖桌面 | #f5e6ce |
| 木托盘 | #cb9c63 |
| 文字 | #573820 |
| 铁锅 | #28302c |
| 瓷盘 | #fffef5 |
| 主操作黄 | #ffb622 |
| 标题与次操作红 | #d92218 |
| 匹配道具绿 | #69a537 |
