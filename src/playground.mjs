// Browser-only adapter to the existing pure P3 validator and comparator.
// Never sends user text anywhere; never interprets source as markup.
import {readP3,assessPixels,PixelFault} from "./p3-diff.mjs";
import {baselineP3,oneChangeP3,twoChangesP3} from "./demo-data.mjs";
const $=selector=>document.querySelector(selector);
const presets=Object.freeze({identical:baselineP3,one:oneChangeP3,two:twoChangesP3});
function setExample(){
 $("#baseline").value=baselineP3;
 $("#candidate").value=presets[$("#example").value]??oneChangeP3;
}
function bounds(selector,max){
 const field=$(selector);
 const value=Number(field.value);
 if(!field.value.trim()||!Number.isSafeInteger(value)||value<0||value>max)
  throw new PixelFault("The example bounds must be whole numbers in range.");
 return value;
}
function getInput(selector){
 const input=$(selector).value;
 if(input.length===0||input.length>10000)
  throw new PixelFault("Use an invented P3 sample of at most 10,000 characters.");
 const result=readP3(input);
 if(result.width>32||result.height>32)
  throw new PixelFault("Browser preview supports up to 32 by 32 pixels.");
 return result;
}
function paint(selector,image){
 const holder=$(selector);
 holder.replaceChildren();
 holder.style.gridTemplateColumns="repeat("+image.width+", 1.6rem)";
 for(let i=0;i<image.width*image.height;i++){
  const pixel=document.createElement("span");
  pixel.className="pixel";
  const rgb=image.rgb.slice(i*3,i*3+3);
  pixel.style.backgroundColor="rgb("+rgb.join(",")+")";
  holder.append(pixel);
 }
}
function inspect(){
 $("#error").textContent="";
 $("#summary").textContent="No comparison yet.";
 $("#base-grid").replaceChildren();
 $("#candidate-grid").replaceChildren();
 $("#changes").replaceChildren();
 try{
  const baseline=getInput("#baseline");
  const candidate=getInput("#candidate");
  const tolerance=bounds("#tolerance",255);
  const allowedPercentage=bounds("#allowed",100);
  // The same validated pure comparison used in the Node CLI.
  const result=assessPixels($("#baseline").value,$("#candidate").value,{tolerance,allowedPercentage});
  if(result.verdict==="BLOCKED"){
   $("#summary").textContent="BLOCKED: image dimensions differ.";
   return;
  }
  paint("#base-grid",baseline);
  paint("#candidate-grid",candidate);
  $("#summary").textContent=result.verdict+" · "+result.differentPixels+" of "+result.totalPixels+" pixels differ ("+result.percentage+"%).";
  let shown=0;
  for(let i=0;i<baseline.width*baseline.height;i++){
   const before=baseline.rgb.slice(i*3,i*3+3);
   const after=candidate.rgb.slice(i*3,i*3+3);
   const delta=Math.max(...before.map((v,j)=>Math.abs(v-after[j])));
   if(delta<=tolerance)continue;
   if(shown++>=100)continue;
   const row=Math.floor(i/baseline.width)+1,col=i%baseline.width+1;
   const li=document.createElement("li");
   li.textContent="Column "+col+", row "+row+": "+before.join(", ")+" → "+after.join(", ");
   $("#changes").append(li);
  }
  if(shown>100){
   const li=document.createElement("li");
   li.textContent=(shown-100)+" additional changed pixels omitted from this list.";
   $("#changes").append(li);
  }
 }catch(error){
  $("#error").textContent=error instanceof PixelFault?
   "Invalid fictional P3 sample or comparison bounds. Check the format, size, RGB values and whole-number limits.":
   "Could not compare this example.";
 }
}
$("#example").addEventListener("change",()=>{setExample();inspect();});
$("#compare").addEventListener("click",inspect);
$("#reset").addEventListener("click",()=>{
 $("#example").value="one";
 $("#tolerance").value="0";$("#allowed").value="0";
 setExample();inspect();$("#example").focus();
});
setExample();inspect();
