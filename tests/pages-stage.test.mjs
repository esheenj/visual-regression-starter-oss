import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,rmSync,mkdirSync,writeFileSync,existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {stagePages} from "../scripts/stage_pages.mjs";
test("reproducible public static HTML uses exact fictional pixel comparator",async()=>{
 const root=mkdtempSync(join(tmpdir(),"visual-pages-"));
 try{
  const a=join(root,"one"),b=join(root,"two");
  const x=await stagePages(a),y=await stagePages(b);
  assert.equal(x.schema,"fictional-p3-pages-stage-v1");
  assert.equal(x.state,"STAGED_ONLY");
  assert.equal(x.verifiedHosting,false);
  assert.equal(x.pixelVerdict,"REVIEW");
  assert.equal(x.differentPixels,1);
  assert.deepEqual(x.files,[".nojekyll","index.html"]);
  const html=readFileSync(join(a,"index.html"));
  assert.deepEqual(html,readFileSync(join(b,"index.html")));
  assert.equal(x.htmlSha256,createHash("sha256").update(html).digest("hex"));
  assert.equal(x.htmlSha256,y.htmlSha256);
  assert.match(html.toString(),/Verdict: REVIEW/);
  assert.match(html.toString(),/1 of 4 pixels differ \(25%\)/);
  assert.match(html.toString(),/Column 2, row 2/);
  assert.doesNotMatch(html.toString(),/<script|<img|https?:\/\//i);
  for(const forbidden of ["AGENTS.md",".git",".github","src","tests","examples","CONTRIBUTING.md"])
   assert.equal(existsSync(join(a,forbidden)),false);
  await assert.rejects(stagePages(a),/EEXIST/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test("refuses private source tree output and preserves unrelated existing files",async()=>{
 await assert.rejects(stagePages("src/fixture"),/SOURCE_TREE_DESTINATION/);
 const root=mkdtempSync(join(tmpdir(),"visual-pages-existing-"));
 try{
  const target=join(root,"existing");mkdirSync(target);
  writeFileSync(join(target,"keep.txt"),"never overwrite");
  await assert.rejects(stagePages(target),/EEXIST/);
  assert.equal(readFileSync(join(target,"keep.txt"),"utf8"),"never overwrite");
 }finally{rmSync(root,{recursive:true,force:true});}
});
