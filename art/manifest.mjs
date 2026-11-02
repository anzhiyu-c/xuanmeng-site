// 全站素材清单。每项一张图：path 是输出路径，kind 决定构图与是否抠图。
// 立绘基准是 art/raw/style/d_she2.png（用户确认过的画风）。国风旧图在 art/raw/_guofeng。
import { readFileSync } from 'node:fs';

const NO_TEXT = 'No text, no letters, no logo, no signature, no watermark, no border.';

// 用户否决了糖果色和彩虹光（太亮太花）。场景要克制通透，靠光影和纵深出高级感
const SCENE = `Style: elegant, premium animated-film background painting, like a high-end animated feature. Soft natural light, clear atmospheric perspective, calm composition with generous quiet space. A restrained, harmonious palette of moderate saturation with one or two dominant hues. Smooth painterly shapes and simplified detail. No neon, no rainbow, no iridescence, no glitter, no lens flare, no excessive particles, no oversaturated candy colours. No people in the scene. ${NO_TEXT}`;

const CUTOUT = `Create the subject on a transparent background if the tool supports it, otherwise on a perfectly flat solid #ff00ff background with no shadows, gradients, texture or floor plane. Do not use #ff00ff in the subject. Crisp edges. The whole subject must sit completely inside the frame with at least 6% empty margin on all four sides, and no part of it (hair, feet, wings, tails, ribbons, weapons, props, flames) may touch or be cut off by the image edge. No cast shadow, no text, no watermark.`;

const CHAR_REF = 'Use the reference image only for head size, proportions, eye style, shading and outline treatment. Do not copy its pose, costume, hair, face or colours; this is a different character.';

const CHAR = `Very large round head, about 3.5 heads tall overall, soft round cheeks, huge sparkling eyes with many-layered saturated irises and big catchlights, tiny nose. Big chunky voluminous hair shapes. Clean large colour areas with minimal ornament; simple readable silhouette. A full-length outfit that fully covers the chest, shoulders and legs.
Style: polished Chinese cartoon fantasy game splash art. Soft airbrushed gradient shading with rounded, slightly glossy 3D-like volume, like a high-end cartoon render. Warm rim light. Thin coloured outlines in dark red-brown only: no thick black outline, no white sticker border. Rich saturated colours and a few glowing sparks.`;

const role = (name, desc) => ({
  path: `art/raw/role_${name}.png`,
  size: 'portrait 2:3 at the largest size available',
  ref: 'art/raw/style/d_she2.png',
  prompt: `${CHAR_REF}\n${CUTOUT}\nSubject: ${desc}\n${CHAR}`,
});

// 飞燕女、虎头怪直接用用户确认过的样图，见 art/raw/style
export const ROLES = [
  role('英女侠', 'an original poised noble heroine, female, long sapphire-blue hair with a jade hairpin, ivory and indigo robe with long skirt, turning in a graceful spin while a long gold chain-whip spirals around her in a big glowing loop, calm clever smile.'),
  role('巫蛮儿', 'an original bright-eyed shaman maiden, female, teal-green braided hair under a small silver headdress with tiny bells, leaf-green and indigo tribal robe, a glowing jade orb floating above one palm and a vine-wrapped staff in the other hand, fireflies around her, cheerful.'),
  role('偃无师', 'an original cold proud master artificer, male, spiky silver-grey hair, one big bronze mechanical arm with glowing blue joints, resting an enormous runed greatsword on his shoulder, dark steel-blue long coat, stern frown, standing with feet apart.'),
  role('逍遥生', 'an original carefree scholar-swordsman, male, long honey-blonde hair streaming in the wind, pure white robe with gold trim, an open folding fan in one hand and a sword at his hip, a little wine gourd on his belt, relaxed wink and smile, strolling on a curl of cloud.'),
  role('剑侠客', 'an original wild master swordsman, male, spiky flame-red and orange hair, bright blue eyes, red cloth headband, simple crimson and black battle robe, a large glowing broad sword trailing an arc of golden fire, leaping forward in a dynamic lunge, wide confident grin.'),
  role('狐美人', 'an original elegant fox-spirit lady, female, long white-gold hair, fluffy fox ears, several lush white and gold tails fanned out behind her, deep crimson and violet high-collared court robe, small gold claw gauntlets, sly playful smile.'),
  role('骨精灵', 'an original mischievous bone-spirit girl, young adult female, lilac-silver twin-tail hair, small carved ivory bone hair ornaments, violet and ivory hooded robe, a slender bone wand tipped with violet ghost-fire, sticking out her tongue playfully, hopping pose.'),
  role('鬼潇潇', 'an original melancholic ghost lady, female, long black hair fading into crimson tips, flame-red flowing robe whose hem dissolves into soft smoke, holding an open oiled-paper umbrella, red spider-lily petals drifting around her, gentle sad smile, floating with no visible feet.'),
  role('杀破狼', 'an original handsome wolf-spirit archer, male, spiky silver-white hair, wolf ears, white fur mantle over ice-blue and black armour, drawing a big horned bow with a glowing frost arrow, snowflakes around him, fierce focused eyes.'),
  role('巨魔王', 'an original colossal horned demon king, male, enormous chubby armoured body with a big round head, curved horns, a burning orange mane, heavy black and gold armour with one broad flat barrel-shaped breastplate and glowing ember cracks, a thick short beard, holding a huge battle axe, big toothy proud grin, wide stance.'),
  role('舞天姬', 'an original celestial dancer, female, rose-pink hair in looped buns with a small jewelled tiara, airborne mid-dance, enormously long pearl-white and rose ribbons looping around her, one gold ring in each hand, full-length gown, serene closed-mouth smile.'),
  role('玄彩娥', 'an original moon maiden, female, long lavender hair, translucent butterfly wings in lavender and azure, flowing lavender robe, a jade wand raised, small glowing butterflies around her, dreamy smile.'),
  role('桃夭夭', 'an original peach-blossom fairy, young adult female, peach-pink curly hair with blossoms, rose-pink and willow-green layered gown, holding high a big glowing lantern shaped like a peach, swirling petals, joyful open-mouth laugh.'),
  role('羽灵神', 'an original radiant winged ranger, clearly a man with a broad flat chest and strong shoulders, short golden-blond hair, great white and gold feathered wings half open, a long bow in hand, sky-blue and gold light armour, warm open smile, feathers drifting.'),
  role('神天兵', 'an original heavenly general, male, shining gold armour with a narrow azure war cape, small phoenix-crest helmet with dark blue hair, a long spear held upright close to his body, standing on a small curl of cloud, compact upright silhouette, fierce noble eyes.'),
  role('龙太子', 'an original dragon prince, male, sea-blue swept-back hair, small coral-gold antlers, sea-blue and silver robe, a long spear in hand and a small slender azure water dragon of swirling water coiling around him, proud smirk.'),
];

const sect = (name, desc) => ({
  path: `art/raw/sect_${name}.png`,
  size: 'square 1:1 at the largest size available',
  prompt: `${desc} A single clear, bold subject filling the frame. ${SCENE}`,
});

export const SECTS = [
  sect('大唐官府', 'The Tang imperial military headquarters on a clear morning: red pillars and huge gold roofs against a deep blue sky, rows of banners and weapon racks in a courtyard.'),
  sect('方寸山', 'A Taoist cave on a tall crag at dawn with a pale crescent moon and three bright stars in a pale sky, glowing paper talismans swirling upward, bent green pines.'),
  sect('化生寺', 'A great Buddhist monastery in golden sunlight, one giant bodhi tree above the roofs, rows of lotus lamps, drifting incense smoke.'),
  sect('女儿村', 'A hidden seaside village in a peach grove, calm blue-green water, little wooden bridges and pavilions, pink petals in the air, pale violet flowers.'),
  sect('神木林', 'A colossal sacred tree in a lush emerald forest with shafts of sunlight, its trunk carved with shaman totems, soft green spirit lights, falling golden leaves.'),
  sect('天宫', 'The Southern Gate of Heaven seen from below: one monumental gate of gold and vermilion among towering clouds, a few thin bolts of lightning in a deep blue sky, banners streaming.'),
  sect('龙宫', 'An undersea crystal dragon palace with coral towers in deep clear blue water, shafts of light from above, schools of small fish, a vast dragon silhouette circling.'),
  sect('普陀山', 'A serene island in a calm southern sea, a purple bamboo grove, a giant luminous lotus throne, a willow branch in a white jade vase, gentle waves.'),
  sect('五庄观', 'A Taoist temple on a green mountain under a soft dusk sky, one ancient tree heavy with pale fruit, seven stars above, drifting incense.'),
  sect('凌波城', 'A fortress city built on surging blue-green waves, big war drums on its ramparts, towering breakers crashing against gold-trimmed walls, sunlight through the spray.'),
  sect('花果山', 'A soaring green mountain with an immense waterfall hiding a cave mouth, peach trees heavy with fruit, a stone monkey statue, soft sunlight.'),
  sect('魔王寨', 'A volcanic fortress with a gate shaped like a huge horned bull skull, rivers of dim fire, drifting embers in a smoky wine-red sky.'),
  sect('阴曹地府', 'The court of the underworld beside a dark teal river under a dim violet sky, a long stone bridge, blue-green spirit flames in bronze braziers, red spider lilies along the bank.'),
  sect('狮驼岭', 'A savage ridge fortress gate built from giant beast ribs and tusks, two colossal snarling stone lions in front, a vast roc with spread wings against a muted orange sunset.'),
  sect('盘丝洞', 'A cave mouth under a large pale moon in a deep blue sky, draped in silver spider silk, enormous webs strung between crags, dark peonies and pale moths.'),
  sect('无底洞', 'A vertiginous abyss with spiral stone stairs, a giant golden lotus in a soft shaft of light, drifting golden pollen, dim violet stone walls.'),
];

// 特色图里有人物，画风跟立绘走
const feature = (key, desc) => ({
  path: `art/raw/feat_${key}.png`,
  size: 'landscape 3:2 at the largest size available',
  ref: 'art/raw/style/d_she2.png',
  prompt: `${CHAR_REF}\n${desc} A clean cinematic composition with a clear focal point and a calm, softly lit background with depth. Characters are about 3.5 heads tall with huge glossy eyes and wear full-length outfits. Style: polished cartoon fantasy game key art, soft airbrushed glossy shading, thin dark red-brown outlines. A restrained harmonious palette, elegant soft lighting, effects kept minimal and tasteful. No neon, no rainbow, no glitter, no busy particles. ${NO_TEXT}`,
});

export const FEATURES = [
  feature('battle', 'Two heroes clash in the centre of a glowing rune circle: a flame-haired swordsman on the left and a blue-haired sorceress on the right, their spells of fire and lightning meeting between them. A warm-versus-cool colour split on a dim background.'),
  feature('meridian', 'A robed martial master with white hair seated in meditation with eyes closed, thin golden channel lines tracing through his indigo robe, a large ring of diagrams behind him.'),
  feature('beasts', 'A cheerful young tamer in a moonlit jade-green glade surrounded by cute mythical spirit beasts: a golden qilin, a nine-tailed white fox, a blue-and-white crane and a small azure dragon curling on the shoulder. Soft moonlight.'),
  feature('dungeon', 'A colossal ancient stone gate half sunk in glowing teal water, two enormous hooded stone guardians on either side, a small party with torches wading in the foreground seen from behind, one soft shaft of warm light from the opening.'),
  feature('festival', 'Lantern festival night over a Chinese city: many warm lanterns, a few fireworks far away, a long dragon dance along an avenue, happy characters in the foreground.'),
  feature('guild', 'Three sworn companions laughing and raising cups together, faces lit by warm lanterns beneath a heavy branch of peach blossom at dusk, a guild banner behind them.'),
  feature('fashion', 'A violet-haired heroine twirling at the centre of a sunlit palace hall while three magnificent outfits float around her, long ribbons of dyed silk in red, blue and green drifting through the air.'),
  feature('artifact', 'Legendary artifacts floating in a quiet shrine of pale stone and soft light: a golden pagoda in the centre, with a bronze bell, a gourd, a jade sword and a glowing orb orbiting it, each with a faint glow.'),
];

const map = (key, desc) => ({
  path: `art/raw/map_${key}.png`,
  size: 'landscape 3:2 at the largest size available',
  prompt: `A cartoon fantasy game world map seen from an oblique bird's-eye view, of a mythical continent: ${desc} Small rounded mountains and tiny buildings, clear landmarks, a calm muted teal sea around the land with simple stylised waves. Leave clear open areas between landmarks. Absolutely no text, labels, compass letters or numbers. ${SCENE}`,
});

export const MAPS = [
  map('南赡部洲', 'a broad central continent with one grand walled imperial city in the middle, canals, trade towns to the south, dark jagged mountains to the west, islands and an undersea palace to the southeast.'),
  map('东胜神洲', 'a chain of lush green islands in an eastern sea, a soaring fruit-covered mountain with a waterfall, a hidden peach-grove village, a floating fairy isle in the mists.'),
  map('西牛贺洲', 'a vast western land of ochre and gold, several small desert kingdoms with stupas and domes, a crescent-shaped holy mountain to the northeast, a dark sinkhole in the interior.'),
  map('北俱芦洲', 'a frozen northern wasteland of ice-blue glaciers and aurora, a dragon cavern to the west, a phoenix nest on an eastern peak, one immense divine ruin floating high in the sky.'),
];

const layer = (name, desc) => ({
  path: `art/raw/${name}.png`,
  size: 'landscape 16:9 at the largest size available',
  ref: `art/raw/${name.split('_')[0]}_far.png`,
  prompt: `Use the reference image only as a style, lighting and palette reference.\nCreate the subject on a perfectly flat solid #ff00ff background with no shadows or gradients; never draw a checkerboard or white background. Do not use #ff00ff in the subject. Crisp edges.\nSubject: ${desc} Keep the centre of the image completely empty. ${SCENE}`,
});

const far = (name, desc) => ({
  path: `art/raw/${name}.png`,
  size: 'landscape 16:9 at the largest size available',
  prompt: `${desc} The upper third stays calm. ${SCENE}`,
});

// 远景先出，中景和近景拿它当配色参考，所以分两组
export const SCENES_FAR = [
  far('xian_far', 'The heavenly realm on a clear morning: a soft gradient sky from muted azure to pale warm cream at the horizon, a calm sea of soft white clouds, a distant Chinese palace with gold roofs on a floating island at the centre.'),
  far('ren_far', 'A great Chinese capital at golden hour seen from high above: warm red and gold roofs with small warm lantern lights, a calm river through the middle reflecting gold light, a distant palace, a clear sky fading from soft warm blue at the very top to pale gold and warm amber at the horizon. Warm palette only: absolutely no purple, no violet, no pink, no magenta, including in the mountains and shadows, which stay warm brown and soft grey-blue.'),
  far('mo_far', 'The demon realm at twilight: a deep plum and wine-red sky with slow dark clouds, a large dim crimson moon, distant jagged dark mountains, thin lines of ember glow in the valleys.'),
];

export const SCENES = [
  layer('xian_mid', 'Two groups of floating green islands, left and right, with thin waterfalls and little pavilions with gold roofs, soft wisps of cloud at their bases.'),
  layer('xian_near', 'Foreground framing only: big soft white clouds along the bottom edge, nothing else.'),
  layer('ren_mid', 'Two groups of monumental Chinese architecture at golden hour: on the left a tall multi-eaved pagoda with warm windows, on the right a grand gate tower with upturned gold roofs and red pillars, soft mist at their bases.'),
  layer('ren_near', 'Foreground framing only: along the bottom a sweep of upturned tiled roof eaves with gold ridge beasts; from the upper left willow branches hanging down; from the upper right a few strings of red lanterns on ropes.'),
  layer('mo_mid', 'Two colossal dark stone gate towers with thin gold trim of the demon realm, left and right, carved with fierce demon faces, roofs like upturned blades, braziers of low flame, chains hanging, smoke at the bases.'),
  layer('mo_near', 'Foreground framing only: along the bottom jagged dark rock with thin ember cracks and clusters of red spider lilies; on the left a bare twisted tree.'),
  {
    path: 'art/raw/gate.png',
    size: 'landscape 16:9 at the largest size available',
    prompt: `A tall circular gate of pale stone with gold inlay standing on a floating island at sunset, soft warm light passing through it, a calm sea of white and pale gold clouds below, a clear sky fading from soft blue to warm gold, one tiny traveller silhouette walking toward it. Absolutely no purple, no violet, no pink. The lower third of the image is calm cloud. ${SCENE}`,
  },
  {
    // 区块之间的云带：底边和左右都贴边，往上渐渐散开
    path: 'art/raw/cloud_band.png',
    size: 'landscape 16:9 at the largest size available',
    prompt: `A wide bank of big soft white clouds with faint warm shading, on a transparent background if the tool supports it, otherwise a perfectly flat solid #ff00ff background. The clouds fill the lower half of the image and span the full width, touching the left, right and bottom edges; their top edge is a billowing rounded silhouette against the empty upper half. Soft painterly animated-film rendering, gentle and quiet. Do not use #ff00ff in the clouds. ${NO_TEXT}`,
  },
  {
    path: 'art/raw/weapons.png',
    size: 'landscape 3:2 at the largest size available',
    prompt: `${CUTOUT}\nSubject: a neat 6 by 3 grid sheet of eighteen separate chunky cartoon fantasy weapons, each isolated with clear space around it, drawn vertically, in order row by row: sword, broad sabre, spear, battle axe, war hammer, folding fan; twin rings, twin swords, chain whip, claw gauntlet, staff, short wand; flowing ribbon, bow, jewelled orb, greatsword, oiled-paper umbrella, hanging lantern. Glossy game item icons with rounded forms, gold, sapphire, ruby and jade colours, soft glossy highlights, thin dark outlines.`,
  },
];

const logo = (key, desc) => ({
  path: `art/raw/logo_${key}.png`,
  size: 'landscape 3:2 at the largest size available',
  prompt: `${CUTOUT}\nSubject: a game logo made of exactly the two Chinese characters 玄梦, side by side from left to right, correctly written, large and filling most of the frame. No other characters, no English, nothing else except what is described. ${desc}`,
});

// 用户否决了火焰毛笔字：标题多出几款让用户选
export const LOGOS = [
  logo('blade', 'Lettering: a heavy modern display face with straight angular strokes and sword-tip ends, wide and powerful, like a premium fantasy game title. Surface: polished white-gold metal with hot white highlights and a thin deep violet bevel.'),
  logo('gloss', 'Lettering: chunky rounded bold game-logo characters with a thick 3D bevel. Face: glossy sun-yellow to orange gradient with a bright highlight. Thick side extrusion in deep violet to magenta. A slim crescent moon and a few star sparkles behind the characters.'),
  logo('neon', 'Lettering: wide, heavy, sharply cut geometric characters. Face: electric cyan to violet to hot magenta gradient, glowing like neon energy, with small lightning arcs jumping off the corners and a thin white core line.'),
  logo('moon', 'Lettering: elegant and powerful sharp-cut strokes, high contrast between thick and thin, the long final stroke of the second character sweeping out like a crescent moon. Face: bright pearl white with a rim of violet and gold glow.'),
  // 亮色背景上要压得住，下面两款用深色宝石和厚金边
  logo('crystal', 'Lettering: bold, wide, sharply faceted characters cut like gemstones. Face: faceted crystal in deep sapphire, violet and rose with bright internal sparkles. A thick polished gold rim around every stroke, a few four-point star glints on the corners.'),
  logo('royal', 'Lettering: heavy, wide, elegant modern characters with subtle flared stroke ends, like a luxurious fantasy game title. Face: deep royal indigo to violet gradient with a glossy highlight along the top. A thick gold 3D rim with a thin white inner line. A slim golden crescent moon behind the characters, four-point star glints.'),
];

// 梦影：描述直接取自游戏数据里的器物说明
function loadPets() {
  const src = readFileSync(new URL('../src/data/mengying-data.js', import.meta.url), 'utf8');
  const json = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1);
  const data = JSON.parse(json);
  const STYLE = `Huge sparkling eyes, big rounded head, charming chunky cartoon proportions. Soft airbrushed glossy shading like a high-end cartoon render, thin coloured outlines, no thick black outline, no white sticker border. If the creature is humanoid it wears a full-length costume that fully covers the chest, shoulders and legs.`;
  const qing = data.series.qinghua.list.map((p) => ({
    path: `art/raw/${p.img.replace('.webp', '.png')}`,
    size: 'square 1:1 at the largest size available',
    prompt: `${CUTOUT}\nSubject: an original cute-but-cool spirit creature born from an enchanted blue-and-white porcelain object. Creature type: ${p.base}. The object it was born from: ${p.note.slice(0, 90)}. Body of glossy white porcelain painted with bold cobalt-blue patterns and a little gold trim, swirls of glowing cobalt energy around it. A dynamic, clearly readable single pose with all limbs connected.\n${STYLE}`,
  }));
  const yun = data.series.yunmo.list.map((p) => ({
    path: `art/raw/${p.img.replace('.webp', '.png')}`,
    size: 'square 1:1 at the largest size available',
    prompt: `${CUTOUT}\nSubject: an original immortal spirit stepped out of a magical ink scroll. Creature type: ${p.base}. Description: ${p.intro}. Coloured only in glossy black, charcoal and pearl white with one vivid vermilion accent, swirling ink splashes around the hems and hair, a clearly readable single pose.\n${STYLE}`,
  }));
  return [...qing, ...yun];
}

export const PETS = loadPets();

const jinyi = (name, desc) => ({
  path: `art/raw/jinyi_${name}.png`,
  size: 'portrait 2:3 at the largest size available',
  ref: 'art/raw/style/d_she2.png',
  prompt: `${CHAR_REF}\n${CUTOUT}\nSubject: ${desc}\n${CHAR}`,
});

export const JINYI = [
  jinyi('白娘子', 'an original white-snake immortal lady, female, long silver-white hair, a flowing snow-white and pearl gown with faint scale patterns, a slender jade umbrella, drifting rain-mist ribbons, gentle gaze.'),
  jinyi('青蛇醉', 'an original green-snake spirit lady, female, emerald hair, layered celadon and emerald gown with subtle scale pattern, holding a small wine cup, playful tipsy smile, ribbons curling like a serpent.'),
  jinyi('凤栖金枝', 'an original young noblewoman, female, ruby-red hair with a tall gold phoenix ornament, a magnificent vermilion and gold gown with phoenix-feather patterns, proud smile.'),
  jinyi('女儿情', 'an original graceful maiden, female, soft coral-pink hair, a spring gown of peony pink and fresh green with butterfly patterns, soft ribbons, shy smile, petals in the air.'),
  jinyi('幽蔷盛宴', 'an original mysterious noblewoman, female, dark plum hair with a small black lace veil, an ink-violet evening gown with dark roses and thorny gold vines, one glowing rose in hand.'),
  jinyi('浮生绡', 'an original moonlit fairy, female, pale blue hair, silver-blue gown woven with tiny stars, long flowing sleeves dissolving into starlight.'),
];

export const GROUPS = { SCENES_FAR, SCENES, ROLES, SECTS, FEATURES, MAPS, PETS, LOGOS, JINYI };
