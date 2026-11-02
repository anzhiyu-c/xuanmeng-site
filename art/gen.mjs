// 用法：node art/gen.mjs SCENES ROLES ... [--jobs=4] [--chunk=6] [--only=正则]
// 已存在的文件会跳过，所以中断后可以直接重跑。
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { GROUPS } from './manifest.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => Number(args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const names = args.filter((a) => !a.startsWith('--'));
const jobs = opt('jobs', 4);
const chunkSize = opt('chunk', 6);

const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const todo = names
  .flatMap((n) => GROUPS[n])
  .filter((it) => !existsSync(it.path) && (!only || new RegExp(only).test(it.path)));
console.log(`待生成 ${todo.length} 张`);
if (!todo.length) process.exit(0);

const chunks = [];
for (let i = 0; i < todo.length; i += chunkSize) chunks.push(todo.slice(i, i + chunkSize));

const HEADER = `Use the imagegen skill with the built-in image_gen tool (not the CLI fallback). Do not read the skill reference files. Generate each item below with exactly one image_gen call, in order. After each call, immediately copy the output PNG from the generated images directory to the exact path given. Do not post-process the images and do not write any other files. If an item says REFERENCE or EDIT TARGET, first load that local file with view_image so it is available, then use it as stated. If an item fails twice, skip it and continue. Finish by printing the saved paths.`;

const promptFor = (list) =>
  [
    HEADER,
    ...list.map((it, i) => {
      const lines = [`ITEM ${i + 1}. Save to ${it.path}. Size: ${it.size}.`];
      if (it.ref) lines.push(`REFERENCE: ${it.ref}`);
      if (it.edit) lines.push(`EDIT TARGET: ${it.edit}`);
      lines.push(it.prompt);
      return lines.join('\n');
    }),
  ].join('\n\n');

mkdirSync('art/logs', { recursive: true });
const stamp = Date.now();
let next = 0;
let failed = 0;

const run = (list, idx) =>
  new Promise((resolve) => {
    const child = spawn(
      'codex',
      ['exec', '-m', 'gpt-5.6-luna', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'model_reasoning_effort="low"', promptFor(list)],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => {
      writeFileSync(`art/logs/gen-${stamp}-${idx}.log`, out);
      const missing = list.filter((it) => !existsSync(it.path)).map((it) => it.path);
      if (missing.length) failed += missing.length;
      console.log(`批次 ${idx + 1}/${chunks.length} 结束 code=${code} 缺失=${missing.length} ${missing.join(' ')}`);
      resolve();
    });
  });

const worker = async () => {
  while (next < chunks.length) {
    const i = next++;
    await run(chunks[i], i);
  }
};

await Promise.all(Array.from({ length: jobs }, worker));
console.log(`全部结束，缺失 ${failed} 张`);
