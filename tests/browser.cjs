let location=process.env.PLAYWRIGHT_PATH;
if(!location){try{location=require.resolve('playwright');}catch{location='C:/Users/0/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';}}
module.exports=require(location);
