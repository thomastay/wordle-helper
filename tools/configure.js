import { writeFileSync } from "node:fs";

/** Taken from esbuild's node-install.ts
 *  https://github.com/evanw/esbuild/blob/master/lib/npm/node-install.ts
 */
function isYarn() {
  const { npm_config_user_agent } = process.env;
  if (npm_config_user_agent) {
    return /\byarn\//.test(npm_config_user_agent);
  }
  return false;
}

// argv[0] == node, argv[1] == __filename__
const outFile = process.argv[2];
const isWindows = process.platform === "win32";
const platformExt = isWindows ? ".exe" : "";
const esbuildBinary = isWindows || isYarn() ? "node ./node_modules/esbuild/bin/esbuild" : "./node_modules/esbuild/bin/esbuild"
const ninjaTemplate = `\
wordleOut = ${outFile}
minifyOpts = --minify
src = src
dist = dist
bin = bin
relative = .
tools = tools

rule nodeRun
    command = node $in $out

rule buildTemplate
    command = $bin/build_template${platformExt} $in $out

rule esbuild
    command = ${esbuildBinary} $minifyOpts --bundle $in --outfile=$out

rule gobuilddir
    command = go build -o $bin/ $relative/$in

build $bin/build_template${platformExt}: gobuilddir cmd/build_template

build $dist/index.css: esbuild $src/index.css

build $dist/index.js: esbuild $src/index.js | $src/compile-guesses.ts $src/common.ts $src/filter-guesses.ts $src/common-dom.ts

build $dist/make-suggestion-nodes.cjs: esbuild $tools/make-suggestion-nodes.js | $src/common.ts $src/filter-guesses.ts $src/common-dom.ts $src/compile-guesses.ts
  minifyOpts = --platform=node

build $dist/suggestions.txt $dist/afterSuggestions.txt: nodeRun $dist/make-suggestion-nodes.cjs

build $dist/index.test.js: esbuild $src/index.test.ts | $src/compile-guesses.ts $src/common.ts $src/filter-guesses.ts
  minifyOpts = --platform=node

build $wordleOut: buildTemplate $src/template.html $dist/index.js $dist/index.css $dist/suggestions.txt $dist/afterSuggestions.txt | $bin/build_template${platformExt}
`;
writeFileSync("./build.ninja", ninjaTemplate);
