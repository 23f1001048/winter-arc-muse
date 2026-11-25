const http = require("node:http");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const origin = "http://127.0.0.1:3000";
const uid = "125a169d-4adb-4d93-a153-38c327e41caf";
const stamp = new Date().toISOString();
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const user = { id: uid, aud:"authenticated", role:"authenticated", email:"fixture@example.invalid",
  app_metadata:{provider:"email",providers:["email"]},user_metadata:{}, created_at:stamp,updated_at:stamp };
const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const token = b64({alg:"HS256",typ:"JWT"}) + "." + b64({sub:uid,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+3600}) + ".fixture";
const tables = { profiles:[{id:uid,updated_at:stamp}], challenges:[{id:"7f322af4-d727-41ef-a858-5464815d2923",owner:uid,is_active:true,title:"November training",subtitle:null,start_date:day(-2),duration_days:30,updated_at:stamp,created_at:stamp}] };
// This local fixture serves only the synthetic account. It never contacts Supabase.
const api=http.createServer((req,res)=>{
  const url=new URL(req.url,"http://127.0.0.1:54321");
  res.setHeader("access-control-allow-origin",origin);
  res.setHeader("access-control-allow-headers",req.headers["access-control-request-headers"]||"*");
  res.setHeader("access-control-allow-methods","GET,POST,HEAD,OPTIONS,PATCH,DELETE");
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end();}
  res.setHeader("content-type","application/json");
  if(url.pathname==="/auth/v1/token"){return res.end(JSON.stringify({access_token:token,refresh_token:"fixture-refresh",expires_in:3600,token_type:"bearer",user}));}
  if(url.pathname==="/auth/v1/user" && req.headers.authorization==="Bearer "+token)return res.end(JSON.stringify(user));
  if(url.pathname.startsWith("/rest/v1/")){
    let rows=tables[url.pathname.split("/").pop()]||[];
    for (const [key,val] of url.searchParams) {
      if(val.startsWith("eq."))rows=rows.filter(r=>String(r[key])===val.slice(3));
      if(val.startsWith("gt."))rows=rows.filter(r=>String(r[key])>val.slice(3));
      if(key==="or")rows=[];
    }
    return res.end(JSON.stringify(req.headers.accept?.includes("object+json")?rows[0]||null:rows));
  }
  res.writeHead(401);res.end(JSON.stringify({message:"Unauthorized"}));
});
(async()=>{
  await new Promise(resolve=>api.listen(54321,"127.0.0.1",resolve));
  const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox"]});
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:"block"});
  page.setDefaultTimeout(18000);
  const overflows=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),"Horizontal overflow: "+page.url());
  fs.mkdirSync("journal-screens",{recursive:true});
  try {
    await page.goto(origin+"/login"); await page.getByRole("heading",{name:"Sign in"}).waitFor();
    await page.evaluate(()=>document.fonts.ready); await overflows();
    await page.screenshot({path:"journal-screens/mobile-login.png"});
    await page.setViewportSize({width:1280,height:850}); await page.screenshot({path:"journal-screens/desktop-login.png"});
    await page.getByLabel("Email").fill(user.email); await page.getByLabel("Password").fill("fixture-only-password");
    await page.getByRole("button",{name:"Sign in",exact:true}).click();
    await page.getByRole("heading",{name:"Day 3 of 30"}).waitFor();
    await page.screenshot({path:"journal-screens/desktop-calendar.png"});
    await page.setViewportSize({width:390,height:844});
    await page.getByRole("button",{name:"Next challenge week"}).click();
    await page.getByRole("heading",{name:"Challenge days 8–14"}).waitFor();
    await page.getByRole("button",{name:"Previous challenge week"}).click(); await overflows();
    await page.screenshot({path:"journal-screens/mobile-calendar.png"});
    await page.getByRole("button",{name:"More",exact:true}).click();
    await page.getByRole("dialog").getByRole("link",{name:"Settings"}).click();
    await page.getByRole("heading",{name:"Settings",exact:true}).waitFor();
    await page.getByRole("button",{name:"Light",exact:true}).click();
    assert.equal(await page.locator("html").evaluate(el=>el.classList.contains("dark")),false);
    await page.getByRole("button",{name:"Dark",exact:true}).click();
    await page.getByRole("link",{name:"Progress",exact:true}).last().click();
    await page.getByRole("heading",{name:"Progress",exact:true}).waitFor(); await overflows();
    await page.screenshot({path:"journal-screens/mobile-progress.png"});
    await page.goto(origin+"/calendar?date="+day(-1)); await page.getByRole("heading",{name:"Day 3 of 30"}).waitFor();
    assert.match(await page.getByRole("group",{name:"Select a challenge day"}).locator('[aria-pressed="true"]').getAttribute("aria-label"),/^Day 2,/);
    await page.setViewportSize({width:320,height:740}); await overflows();
    console.log("Verified phone and desktop layouts, sign-in, challenge navigation, appearance, progress and date deep links.");
  } catch(error) {console.error("Failed at",page.url(),(await page.locator("body").innerText()).slice(0,2400));throw error;}
  finally {await browser.close();api.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
