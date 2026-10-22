# sucai 素材清单

整理日期：2026-06-28

这个文件夹用于万花筒项目的“真实小物件拼贴场景 object field”。素材应作为独立物体实例参与场景，再进入镜面折叠与微距镜头后处理，不要直接作为背景平铺。

## 使用规则

- 每张素材都应被裁切或采样成独立物体实例，而不是整张铺满画面。
- 同一素材实例需要有不同缩放、旋转、透明度、模糊层级和深度顺序。
- 渲染时要保留前后遮挡、软阴影、高光、粗糙度、法线/高度带来的厚度感。
- 透明或半透明对象应进入 object field 后再参与 kaleidoscope mirror system。
- 花瓣、叶片、贝壳、纸纤维等自然物要避免规则重复，边缘应有轻微不规则。

## Poly Haven / Texture Haven 来源

授权：Poly Haven 资源为 CC0。来源入口：https://polyhaven.com/textures

| 本地目录 | 来源页面 | 主要用途 | 已下载通道 |
| --- | --- | --- | --- |
| `polyhaven/metal_blue_metal_plate` | https://polyhaven.com/a/blue_metal_plate | 金属丝、反光碎片、冷色金属高光 | diffuse, normal GL, roughness |
| `polyhaven/fabric_gloss_crepe_satin` | https://polyhaven.com/a/crepe_satin | 半透明布面/花瓣柔光参考、珍珠柔高光参考 | diffuse, normal GL, roughness |
| `polyhaven/stone_marble_marble_01` | https://polyhaven.com/a/marble_01 | 贝壳、矿石、珠光白纹理 | diffuse, normal GL, roughness |
| `polyhaven/mineral_stone_rocks_ground_04` | https://polyhaven.com/a/rocks_ground_04 | 矿石、砂砾、背景暗部颗粒 | diffuse, normal GL, roughness |
| `polyhaven/fiber_cotton_jersey` | https://polyhaven.com/a/cotton_jersey | 纸纤维、织物微距颗粒 | diffuse, normal GL, roughness |
| `polyhaven/old_paper_decrepit_wallpaper` | https://polyhaven.com/a/decrepit_wallpaper | 旧纸页、记忆感纤维、金尘背景 | diffuse, normal GL, roughness |

## AmbientCG 来源

授权：AmbientCG 资源为 CC0。来源入口：https://ambientcg.com

每个目录中 `pbr_1k_jpg/` 是 1K JPG PBR 包，通常包含 Color、NormalDX、NormalGL、Roughness、Displacement；部分自然物还包含 Opacity 和 AmbientOcclusion。

| 本地目录 | 来源页面 | 主要用途 | 关键通道 |
| --- | --- | --- | --- |
| `ambientcg/crystal_onyx_Onyx015` | https://ambientcg.com/a/Onyx015 | 水晶碎片、矿物薄片、冷色透明纹理 | color, normal, roughness, displacement |
| `ambientcg/ice_glass_water_Ice003` | https://ambientcg.com/a/Ice003 | 冰、水泡、玻璃珠内部折射纹理 | color, normal, roughness, displacement |
| `ambientcg/pebble_stone_Rocks022` | https://ambientcg.com/a/Rocks022 | 小石、矿石、颗粒环绕层 | color, normal, roughness, displacement, AO |
| `ambientcg/polished_marble_Marble021` | https://ambientcg.com/a/Marble021 | 贝壳、珍珠、白玫瑰矿物底色 | color, normal, roughness, displacement |
| `ambientcg/old_paper_Paper006` | https://ambientcg.com/a/Paper006 | 旧书页、纸纤维、暖色尘埃 | color, normal, roughness, displacement |
| `ambientcg/clean_metal_Metal049A` | https://ambientcg.com/a/Metal049A | 金属丝、银针、局部镜面高光 | color, normal, roughness, displacement, metalness |
| `ambientcg/dust_smudge_SurfaceImperfections015` | https://ambientcg.com/a/SurfaceImperfections015 | 镜筒灰尘、镜头脏污、克制颗粒 | color/imperfection maps |
| `ambientcg/leaf_macro_Leaf001` | https://ambientcg.com/a/Leaf001 | 独立叶片、叶脉、湿润绿色反光 | color, normal, roughness, displacement, opacity, AO |
| `ambientcg/scattered_leaves_ScatteredLeaves008` | https://ambientcg.com/a/ScatteredLeaves008 | 外圈植物碎片、自然错位层 | color, normal, roughness, displacement, opacity, AO |
| `ambientcg/flower_petals_FlowerSet001` | https://ambientcg.com/a/FlowerSet001 | 花瓣、半透明花形中心、杏花/白玫瑰 | color, normal, roughness, displacement, opacity, AO |

## Pexels / Unsplash 说明

Pexels 与 Unsplash 的网页检索在脚本环境中需要浏览器校验或 API 授权，未自动下载摄影图，以免留下不可追溯来源。建议后续手动或通过官方 API 补充以下摄影素材：

- Pexels：https://www.pexels.com/search/flower%20petal%20macro/
- Pexels：https://www.pexels.com/search/wet%20leaf%20macro/
- Unsplash：https://unsplash.com/s/photos/macro-flower-petals
- Unsplash：https://unsplash.com/s/photos/leaf-close-up-texture

补充摄影图时，请放入 `sucai/pexels_unsplash_notes/` 或另建 `sucai/photography/`，并在本清单中记录摄影师、页面 URL 和授权/使用条款。
