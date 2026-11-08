// Original, deterministic static Pages artifact from fictional public P3 files.
// The generated HTML has no scripts, external assets or private history.
import {lstat,readFile,mkdir,writeFile,readdir,rm,realpath} from "node:fs/promises";
import {dirname,join,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {renderPixelReport} from "../src/report.mjs";

const ROOT=fileURLToPath(new URL("../",import.meta.url));
const INPUTS=["examples/original.ppm","examples/modified.ppm"];
function fail(message){throw new Error("VISUAL_PAGES_STAGE_"+message);}
async function ensureSource(root,path){
 let current=root;
 for(const part of path.split("/")){
  current=join(current,part);
  const stat=await lstat(current);
  if(stat.isSymbolicLink())fail("INPUT_SYMLINK");
 }
 if(!(await lstat(current)).isFile())fail("INPUT_NOT_FILE");
}
export async function stagePages(destination){
 if(typeof destination!=="string"||!destination.trim())fail("INVALID_DESTINATION");
 const root=await realpath(ROOT),out=resolve(destination);
 if((out===root||out.startsWith(root+sep))&&out!==join(root,"dist","pages"))
  fail("SOURCE_TREE_DESTINATION");
 for(const path of INPUTS)await ensureSource(root,path);
 const originals=await Promise.all(INPUTS.map(path=>readFile(join(root,path),"utf8")));
 const {html,result}=renderPixelReport(originals[0],originals[1],{tolerance:0,allowedPercentage:0});
 if(result.verdict!=="REVIEW"||result.differentPixels!==1||
    result.percentage!==25 || !html.includes("Baseline") ||
    !html.includes("Candidate") || /<script|<img|https?:\/\//i.test(html))
  fail("FICTIONAL_REPORT_CONTRACT");
 const content=Buffer.from(html,"utf8");
 if(content.length>100000)fail("OVERSIZED_REPORT");
 await mkdir(dirname(out),{recursive:true});
 const parent=await lstat(dirname(out));
 if(!parent.isDirectory()||parent.isSymbolicLink())fail("OUTPUT_PARENT");
 await mkdir(out); // exclusive create; existing output and symlinks refused
 try{
  await writeFile(join(out,"index.html"),content,{flag:"wx"});
  await writeFile(join(out,".nojekyll"),"",{flag:"wx"});
  const actual=(await readdir(out)).sort();
  if(JSON.stringify(actual)!==JSON.stringify([".nojekyll","index.html"]))
   fail("UNEXPECTED_STAGED_FILES");
  return {schema:"fictional-p3-pages-stage-v1",state:"STAGED_ONLY",
    sourceOfTruth:"exact-checked-out-public-commit",
    verifiedHosting:false,publicSyntheticOnly:true,
    pixelVerdict:"REVIEW",differentPixels:1,
    files:actual,
    htmlSha256:createHash("sha256").update(content).digest("hex")};
 }catch(error){await rm(out,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await stagePages(process.argv[2]||"dist/pages"),null,2));}
 catch(error){console.error(JSON.stringify({state:"REJECTED",reason:String(error.message).slice(0,100)}));process.exitCode=2;}
}
