// 全站素材清单。每项一张图：path 是输出路径，kind 决定构图与是否抠图。
import { readFileSync } from 'node:fs';

const NO_TEXT = 'No text, no letters, no seal, no signature, no watermark, no border.';

const SCENE = `Tradition of Tang and Song "jinbi shanshui" (gold-and-blue-green landscape painting) merged with contemporary AAA game matte painting lighting. Fine gold-leaf contour lines, mineral pigments, visible silk-painting texture, rich and opulent. ${NO_TEXT}`;

const PAINT = `Chinese gongbi meticulous painting merged with contemporary AAA game key art: fine gold-leaf line work, mineral pigments, visible silk-painting texture, dramatic cinematic lighting, rich and opulent. Everyone wears dignified full-length costume. ${NO_TEXT}`;

const CHROMA = `Create the subject on a perfectly flat solid #ff00ff chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation. Keep the subject fully separated from the background with crisp edges. The whole subject must sit completely inside the frame with at least 8% empty background margin on all four sides: make the subject smaller if needed, and no part of it (wings, tail, ribbons, hair, feet, weapons, props, smoke) may touch or be cut off by the image edge. Do not use #ff00ff anywhere in the subject. No cast shadow, no reflection, no watermark, no text.`;

const CHAR = `Full-body original character, the entire figure from head to feet inside the frame with generous padding. Style: Chinese gongbi meticulous painting with fine gold contour lines and mineral pigments, merged with contemporary AAA game splash art rendering and dramatic rim light. Opulent and refined. Adult proportions, elegant realistic face. Dignified full-length layered costume that fully covers the chest and legs. Not chibi, not anime moe.`;

const role = (name, desc) => ({
  path: `art/raw/role_${name}.png`,
  size: 'portrait 2:3 at the largest size available',
  prompt: `${CHROMA}\nSubject: ${desc}\n${CHAR}`,
});

export const ROLES = [
  role('飞燕女', 'a young swordswoman light as a swallow, airborne mid-leap, twin slender swords, long flowing ribbons and layered silk robes in azurite blue, malachite green and cinnabar with burnished gold embroidery of cloud and swallow motifs, long full skirt and trousers.'),
  role('英女侠', 'a noble-born heroine of poise and intelligence, standing in a turning stance, a long gold chain-whip spiralling around her, ivory and indigo robes embroidered with plum blossom, jade hairpins, composed gaze.'),
  role('巫蛮儿', 'a bright-eyed shaman maiden of the southwestern mountains, tall silver filigree headdress with tiny bells, leaf-green and indigo tribal embroidery, a glowing jade orb hovering over one palm and a vine-wrapped staff, vines and small fireflies around her.'),
  role('偃无师', 'a cold, proud master artificer with one intricate bronze-and-iron mechanical arm, wielding an enormous runed greatsword resting on his shoulder, dark steel-blue long coat, bronze gears and gold engravings, stern expression.'),
  role('逍遥生', 'a carefree scholar-swordsman in a pure white robe with gold cloud trim, an open painted folding fan in one hand and a sword at his hip, a wine gourd on his belt, long hair and sash streaming in the wind, faint smile.'),
  role('剑侠客', 'a wild untamed master swordsman in a dynamic lunge, crimson headband and tousled black hair, deep red and black battle robes, a long blade trailing a golden arc of sword energy.'),
  role('狐美人', 'an elegant fox-spirit noblewoman with fox ears and several lush white-gold tails fanned behind her, deep crimson and violet court robes, gold claw gauntlets, a sly knowing smile.'),
  role('骨精灵', 'a mischievous bone-spirit girl with pale silver hair, carved ivory bone ornaments, violet and ivory robes, a slender bone wand tipped with violet ghost-fire, playful pose.'),
  role('鬼潇潇', 'a melancholic ghost beauty with ink-black hair, flame-red flowing robes that fade to smoke at the hem, holding an open oiled-paper bamboo umbrella, red spider lily petals drifting around her.'),
  role('杀破狼', 'a handsome wolf-spirit archer with silver-white hair and wolf ears, a white wolf-fur mantle over ice-blue and black armour, drawing a great horned bow with an arrow of frost, snow and wind around him.'),
  role('巨魔王', 'a colossal horned demon king in heavy black and gold armour with ember-glowing cracks, holding an immense battle axe, massive shoulders, burning mane, imposing and regal.'),
  role('虎头怪', 'a huge jovial tiger-headed warrior with orange and black striped fur, a wide grin, bronze and gold armour, carrying a giant hammer over his shoulder, powerful and friendly.'),
  role('舞天姬', 'a celestial dancer in the spirit of Dunhuang flying apsaras, airborne, enormously long pearl-white and rose ribbons looping through the air, a gold ring in each hand, jewelled tiara, serene expression, full-length gown.'),
  role('玄彩娥', 'a moon-maiden with translucent butterfly wings of gauze in lavender and azure, flowing lavender robes, a jade wand and drifting silk ribbons, small glowing butterflies around her.'),
  role('桃夭夭', 'a peach-blossom fairy with a glowing lantern shaped like a peach held high, rose-pink and willow-green layered gown, peach petals swirling, joyful expression.'),
  role('羽灵神', 'a radiant male winged ranger, clearly a handsome young man with a masculine build and short tied-back hair, great white and gold feathered wings half open, a long bow in hand, sky-blue and gold light armour with a broad flat chest plate, warm open smile, feathers drifting.'),
  role('神天兵', 'a heavenly general in shining gold armour with an azure war cape, long spear held upright close to his body, phoenix-crest helmet, standing on a small curl of cloud, the war cape hanging straight down behind him and kept narrow, compact upright silhouette, fierce and noble.'),
  role('龙太子', 'a dragon prince with small coral-gold antlers, sea-blue and silver robes, a long spear in hand and a slender azure water dragon of swirling water coiling around him, proud gaze.'),
];

const sect = (name, desc) => ({
  path: `art/raw/sect_${name}.png`,
  size: 'square 1:1 at the largest size available',
  ref: 'art/raw/test_hero.png',
  prompt: `Use the reference image only as a style and palette reference, not for composition. A painted vista with no people in the foreground: ${desc} ${SCENE}`,
});

export const SECTS = [
  sect('大唐官府', 'the Tang imperial military headquarters at dawn, rows of banners and halberd racks in a vast courtyard, Chang\'an roofs beyond, cinnabar pillars and gold tiles.'),
  sect('方寸山', 'a Taoist cave on a misty crag beneath a crescent moon and three stars, glowing paper talismans drifting in the air, ancient pines.'),
  sect('化生寺', 'a great Buddhist monastery in Chang\'an at golden hour, a giant bodhi tree, rows of lotus lamps and incense smoke rising from bronze censers.'),
  sect('女儿村', 'a hidden seaside village deep in a peach grove, slender wooden bridges and pavilions, drifting pink petals and strange violet poison flowers.'),
  sect('神木林', 'a colossal sacred tree in a primeval forest, its trunk carved with shaman totems, glowing green spirit lights, falling golden leaves.'),
  {
    path: 'art/raw/sect_天宫.png',
    size: 'square 1:1 at the largest size available',
    prompt: `The Southern Gate of Heaven seen from below, one monumental gate of gold and vermilion filling the frame, set against a dark storm of indigo thunderclouds split by bolts of golden lightning, celestial banners streaming. Strong dark-versus-gold contrast and a clear central silhouette. ${PAINT}`,
  },
  sect('龙宫', 'an undersea crystal dragon palace with coral towers, shafts of blue light from above, schools of glowing fish and a vast dragon silhouette circling.'),
  sect('普陀山', 'a serene island in the southern sea, a purple bamboo grove and a giant luminous lotus throne, a willow branch in a white jade vase, gentle waves.'),
  sect('五庄观', 'a tranquil Taoist temple on Longevity Mountain, an ancient ginseng-fruit tree heavy with glowing fruit, seven stars above, drifting incense.'),
  sect('凌波城', 'a fortress city built upon surging waves, great war drums on its ramparts, towering breakers crashing against gold-trimmed walls.'),
  sect('花果山', 'the Water Curtain Cave, an immense waterfall hiding a cave mouth, peach trees laden with fruit, jagged green peaks, a monkey-king statue of stone.'),
  sect('魔王寨', 'a volcanic fortress of black stone with a gate shaped like a great horned bull skull, rivers of fire, burning embers filling a red sky.'),
  sect('阴曹地府', 'the court of the underworld beside a dark river, a long stone bridge, blue-green spirit flames in bronze braziers, red spider lilies along the bank.'),
  {
    path: 'art/raw/sect_狮驼岭.png',
    size: 'square 1:1 at the largest size available',
    prompt: `A savage ridge fortress gate built from giant beast ribs and tusks with two colossal snarling stone lions in front, filling the frame, a vast roc with spread wings black against a blood-orange sunset. Strong dark silhouette against fiery sky. ${PAINT}`,
  },
  sect('盘丝洞', 'a moonlit cave mouth draped in glowing silver spider silk, enormous webs strung between crags, dark peonies and pale moths.'),
  sect('无底洞', 'a vertiginous bottomless abyss with spiral stone stairs, a giant golden lotus blooming upward out of the darkness, drifting golden pollen.'),
];


const feature = (key, desc) => ({
  path: `art/raw/feat_${key}.png`,
  size: 'landscape 3:2 at the largest size available',
  prompt: `${desc} The subject fills the frame as a close, bold composition. Do not paint a sea of clouds, pine-covered cliffs or a distant peak landscape. ${PAINT}`,
});

export const FEATURES = [
  feature('battle', 'Two mythic heroes clash at the centre of a glowing golden rune circle: a swordsman in crimson battle robes on the left and a sorceress in azure robes on the right, their spells of fire and lightning colliding between them in a blinding burst. Strong warm-versus-cool colour split against a dark background.'),
  feature('meridian', 'A close three-quarter view of a fully robed martial master seated in meditation, eyes closed, glowing golden meridian lines tracing through his deep indigo robe, a giant ring of bronze channel diagrams turning behind him, drifting gold qi, dark azurite background.'),
  feature('beasts', 'A young tamer crouching at the heart of a jade-green moonlit glade, closely surrounded by mythical spirit beasts: a qilin, a nine-tailed white fox, a blue-and-white porcelain crane and a small azure dragon curling on the shoulder. Malachite greens and firefly light.'),
  feature('dungeon', 'A colossal stone gate half sunk in black water, two enormous hooded stone guardians towering on either side, a small party with torches wading in the foreground seen from behind, cold teal darkness pierced by a single shaft of gold light from the opening.'),
  feature('festival', 'Lantern festival night over Chang\'an, thousands of lanterns, fireworks in gold and red, a long dragon dance through a crowded avenue beside the river.'),
  feature('guild', 'Three sworn companions raising wine cups together in a close warm scene, faces lit by lanterns beneath a heavy branch of peach blossom at dusk, a guild banner behind them, rose pinks and burnished gold.'),
  feature('fashion', 'A row of three magnificent silk court robes displayed on tall lacquer stands in a dark hall, long ribbons of dye in cinnabar, azurite and malachite streaming through the air between them and pooling on a polished floor.'),
  feature('artifact', 'Legendary artifacts floating in a pitch-dark shrine, a golden pagoda at the centre with a bronze bell, a gourd, a jade sword and a soul-jade orbiting it, each trailing thin gold light, plain dark stone behind.'),
];

const map = (key, desc) => ({
  path: `art/raw/map_${key}.png`,
  size: 'landscape 3:2 at the largest size available',
  ref: 'art/raw/test_hero.png',
  prompt: `Use the reference image only as a style and palette reference. An antique oblique bird's-eye illustrated map painted on silk, of a mythical continent: ${desc} Mountains drawn as small jinbi peaks with gold outlines, stylised curling waves and clouds around the coast, tiny buildings. Leave clear open areas between landmarks. Absolutely no text, labels, compass letters or numbers. ${SCENE}`,
});

export const MAPS = [
  map('南赡部洲', 'a broad central continent with one grand walled imperial city in the middle, canals, trade towns to the south, dark jagged mountains to the west, islands and an undersea palace to the southeast.'),
  map('东胜神洲', 'a chain of lush green islands in an eastern sea, a soaring fruit-covered mountain with a waterfall, a hidden peach-grove village, a floating fairy isle in the mists.'),
  map('西牛贺洲', 'a vast western land of ochre and gold, several small desert kingdoms with stupas and domes, a crescent-shaped holy mountain to the northeast, a dark sinkhole in the interior.'),
  map('北俱芦洲', 'a frozen northern wasteland of ice-blue glaciers and aurora, a dragon cavern to the west, a phoenix nest on an eastern peak, one immense divine ruin floating high in the sky.'),
];

const near = (desc) => `${CHROMA}\nSubject: ${desc} Keep the centre of the image completely empty magenta. ${SCENE}`;

export const SCENES = [
  {
    path: 'art/raw/xian_far.png',
    size: 'landscape 16:9 at the largest size available',
    edit: 'art/raw/test_hero.png',
    prompt: `Edit this painting. Preserve the sky, the sun, the far horizon, the distant peaks, the golden celestial palace and the sea of clouds exactly as they are. Completely remove the foreground: the left cliff, the pine tree, the robed figure, the large peaks on the far left and right edges and the large gold stylised clouds along the bottom. Repaint those areas as a continuous luminous sea of clouds and small distant peaks in the same style, palette and lighting. Same framing. ${NO_TEXT}`,
  },
  {
    path: 'art/raw/xian_mid.png',
    size: 'landscape 16:9 at the largest size available',
    edit: 'art/raw/test_hero.png',
    prompt: `Edit this painting into a cut-out layer. Keep, exactly in place and with the same painting detail, only the large malachite and azurite peaks with waterfalls and bridges on the right third, the tall peaks on the upper left, and the mid-distance isolated peaks. Replace everything else (sky, sun, palace, sea of clouds, left foreground cliff, figure, bottom gold clouds) with a perfectly flat solid #ff00ff background with no gradients. Crisp clean edges around each peak; the base of each peak fades into a soft wisp of cloud. Do not use #ff00ff in the subject. ${NO_TEXT}`,
  },
  {
    path: 'art/raw/xian_near.png',
    size: 'landscape 16:9 at the largest size available',
    edit: 'art/raw/test_hero.png',
    prompt: `Edit this painting into a cut-out layer. Keep, exactly in place and with the same painting detail, only the foreground: the left cliff with the pine tree, the red-ribboned robed figure standing on it, the large gold and malachite stylised curling clouds along the bottom and lower left and the gold curling clouds at the lower right. Replace everything else with a perfectly flat solid #ff00ff background with no gradients. Crisp clean edges. Do not use #ff00ff in the subject. ${NO_TEXT}`,
  },
  {
    path: 'art/raw/ren_far.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: `Use the reference image only as a style reference. The great Tang capital Chang'an at dusk seen from high above: an immense grid city of gold and vermilion roofs lit by thousands of warm lanterns stretching to the horizon, a river of light through the middle, a grand palace complex far in the centre, deep azurite evening sky with bands of cinnabar and gold sunset, faint jinbi mountains on the horizon. The upper third stays calm. ${SCENE}`,
  },
  {
    path: 'art/raw/ren_mid.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: near(`Use the reference image only as a style reference. Two groups of monumental Tang dynasty architecture: on the left a tall multi-eaved wooden pagoda with glowing lanterns, on the right a grand gate tower with upturned gold roofs and vermilion pillars, both at dusk with warm window light, soft wisps of evening mist at their bases.`),
  },
  {
    path: 'art/raw/ren_near.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: near(`Use the reference image only as a style reference. Foreground framing elements only: along the bottom a dark sweep of upturned tiled roof eaves with gold ridge beasts; from the upper left, willow branches hanging down; from the upper right, strings of glowing red and gold paper lanterns hanging on ropes.`),
  },
  {
    path: 'art/raw/mo_far.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: `Use the reference image only as a style reference. The underworld realm of Fengdu: a violet-black sky with slow rivers of ember clouds, a blood-red eclipsed sun with gold corona, jagged obsidian mountain ranges with gold-leaf contour lines fading into distance, rivers of magma winding between them, ash in the air. Dark, majestic, opulent. The upper third stays calm. ${SCENE}`,
  },
  {
    path: 'art/raw/mo_mid.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: near(`Use the reference image only as a style reference. Two colossal obsidian and black-gold gate towers of the underworld, left and right, carved with fierce demon faces, roofs like upturned blades, braziers of ember-orange and violet ghost-fire, chains hanging, smoke at the bases.`),
  },
  {
    path: 'art/raw/mo_near.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: near(`Use the reference image only as a style reference. Foreground framing elements only: along the bottom jagged black volcanic rock with glowing magma cracks and dense clusters of red spider lilies; on the left a dead twisted black tree with violet ghost-flames.`),
  },
  {
    path: 'art/raw/title.png',
    size: 'landscape 3:2 at the largest size available',
    prompt: `${CHROMA}\nSubject: the two Chinese characters 玄梦, written side by side from left to right, in powerful flowing Chinese running-script brush calligraphy with dramatic dry-brush streaks and flying white, solid pure black ink, extremely bold, filling most of the frame. Exactly these two characters, correctly written, nothing else.`,
  },
  {
    path: 'art/raw/silk.png',
    size: 'landscape 3:2 at the largest size available',
    prompt: `A seamless flat top-down texture of aged Chinese painting silk (juan), warm pale ochre, fine woven threads, faint mottled age stains, very even lighting, no objects. ${NO_TEXT}`,
  },
  {
    path: 'art/raw/gate.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/test_hero.png',
    prompt: `Use the reference image only as a style reference. A monumental circular moon gate of gold and malachite stone standing on a cliff at night, a blinding soft golden dream-light pouring through it, a sea of moonlit clouds below, azurite night sky with stars, one tiny robed traveller walking toward it. ${SCENE}`,
  },
  {
    path: 'art/raw/weapons.png',
    size: 'landscape 3:2 at the largest size available',
    prompt: `${CHROMA}\nSubject: a neat 6 by 3 grid sheet of eighteen separate ancient Chinese fantasy weapons, each isolated and evenly spaced, drawn vertically, in order row by row: sword, broad sabre, spear, battle axe, war hammer, folding fan; twin rings, twin swords, chain whip, claw gauntlet, staff, short wand; flowing ribbon, bow, jewelled orb, greatsword, oiled-paper umbrella, hanging lantern. Gold, azurite and cinnabar enamel with fine gold contour lines, gongbi meets AAA game icon rendering. No text.`,
  },
];

export const CLOUDS = [
  {
    path: 'art/raw/cloud_light.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/xian_near.png',
    prompt: `${CHROMA}\nUse the reference image only for its painting style of curling clouds. Subject: one enormous dense bank of stylised auspicious Chinese clouds that spans the full width of the frame edge to edge and fills the whole middle of the image with no gaps. Only the very top edge and very bottom edge are scalloped, made of big curling swirls outlined in burnished gold leaf; the top and bottom edges are the only places the magenta shows. Colours: pearl white, pale azurite and soft malachite with gold line work. ${SCENE}`,
  },
  {
    path: 'art/raw/cloud_dark.png',
    size: 'landscape 16:9 at the largest size available',
    ref: 'art/raw/xian_near.png',
    prompt: `${CHROMA}\nUse the reference image only for its painting style of curling clouds. Subject: one enormous dense bank of stylised infernal smoke clouds that spans the full width of the frame edge to edge and fills the whole middle of the image with no gaps. Only the very top edge and very bottom edge are scalloped, made of big curling swirls outlined in glowing ember-gold; the top and bottom edges are the only places the magenta shows. Colours: charcoal black, deep crimson and dark violet with ember-orange line work. ${SCENE}`,
  },
];

// 梦影：描述直接取自游戏数据里的器物说明
function loadPets() {
  const src = readFileSync(new URL('../src/data/mengying-data.js', import.meta.url), 'utf8');
  const json = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1);
  const data = JSON.parse(json);
  const qing = data.series.qinghua.list.map((p) => ({
    path: `art/raw/${p.img.replace('.webp', '.png')}`,
    size: 'square 1:1 at the largest size available',
    prompt: `${CHROMA}\nSubject: an original mythic spirit creature born from an enchanted blue-and-white Ming porcelain object. Creature type: ${p.base}. The object it was born from: ${p.note.slice(0, 90)}. Body of glossy white porcelain painted with cobalt-blue patterns and fine gold trim, wisps of cobalt glaze and small auspicious clouds swirling around it. Dynamic but clearly readable single pose with all limbs connected. If the creature is humanoid it wears a dignified full-length costume that fully covers the chest, shoulders and legs, with no bare legs, no low neckline and no see-through fabric. Refined AAA game splash art with gongbi line quality.`,
  }));
  const yun = data.series.yunmo.list.map((p) => ({
    path: `art/raw/${p.img.replace('.webp', '.png')}`,
    size: 'square 1:1 at the largest size available',
    prompt: `${CHROMA}\nSubject: an original immortal spirit stepped out of a Chinese ink-wash scroll. Creature type: ${p.base}. Description: ${p.intro}. Elegant adult figure in dignified full-length layered robes that fully cover the chest, shoulders and legs, with no bare legs, no leg slit and no low neckline, rendered strictly in black and grey sumi ink washes and dry brush on white with a single small vivid vermilion accent and no other colour at all, her hems and hair dissolving into ink splashes. Refined AAA game splash art with ink-painting texture.`,
  }));
  return [...qing, ...yun];
}

export const PETS = loadPets();

export const LOGO = [
  {
    path: 'art/raw/logo_hi.png',
    size: 'square 1:1 at the largest size available',
    edit: 'art/raw/logo_src.png',
    prompt: `Redraw this exact logo at much higher resolution and sharpness. Preserve exactly: the gold crescent moon on the left, the two calligraphic characters 玄梦 written in the same stacked diagonal arrangement and same brush shapes, the small curling gold clouds at lower left and right, the thin gold orbit lines and star sparkles. Burnished gold leaf material. Do not add anything and do not change the characters. ${CHROMA}`,
  },
];

const jinyi = (name, desc) => ({
  path: `art/raw/jinyi_${name}.png`,
  size: 'portrait 2:3 at the largest size available',
  prompt: `${CHROMA}\nSubject: ${desc}\n${CHAR}`,
});

export const JINYI = [
  jinyi('白娘子', 'a white-snake immortal lady in a flowing snow-white and pearl silk gown with faint scale patterns and silver embroidery, a slender jade umbrella and drifting rain-mist ribbons, gentle sorrowful gaze.'),
  jinyi('青蛇醉', 'a green-snake spirit lady in layered celadon and emerald silk with subtle scale embroidery, holding a small wine cup, playful tipsy smile, ribbons curling like a serpent.'),
  jinyi('凤栖金枝', 'a young noblewoman in a magnificent Shu brocade gown of vermilion and gold embroidered with phoenix feathers and golden branches, tall gold phoenix hair ornament.'),
  jinyi('女儿情', 'a graceful maiden in a spring gown of peony pink and spring green embroidered with mandarin ducks and butterflies, soft ribbons, shy smile, petals in the air.'),
  jinyi('幽蔷盛宴', 'a mysterious noblewoman in an ink-violet evening gown embroidered with dark roses and thorny gold vines, a veil of black lace, one glowing rose in hand.'),
  jinyi('浮生绡', 'a moonlit fairy in translucent silver-blue gauze robes woven with the Milky Way and tiny stars, long flowing sleeves dissolving into starlight.'),
];

export const GROUPS = { SCENES, ROLES, SECTS, FEATURES, MAPS, PETS, LOGO, CLOUDS, JINYI };
