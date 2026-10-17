const fs=require('fs'),vm=require('vm');let c={};vm.createContext(c);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../physics/grade-9/shared/models.js'),'utf8')+';this.P=Physics;this.renderModel=renderModel;this.initial=initial;',c);const P=c.P,results=[];
function test(name,ok){results.push({name,pass:!!ok});}const eq=(a,b)=>Math.abs(a-b)<1e-8;
for(const U of [1,3,6])for(const r1 of [5,10,20])for(const r2 of [5,10,20]){
 const s=P.circuit({U,r1,r2}),p=P.circuit({U,r1,r2,mode:'parallel'});
 test('串联KVL '+[U,r1,r2],eq(s.U1+s.U2,U)&&eq(s.I1,s.I2)&&eq(s.P,s.I1*s.I1*r1+s.I2*s.I2*r2));
 test('并联KCL '+[U,r1,r2],eq(p.I,p.I1+p.I2)&&eq(p.U1,p.U2)&&eq(p.P,p.I1*p.I1*r1+p.I2*p.I2*r2)&&p.R<Math.min(r1,r2));
}
for(const r of [0,5,10,20]){const m=P.circuit({U:6,r1:10,r2:r});test('安全范围 '+r,(m.I<=.400001&&m.U2<=3.000001)===(r>=5&&r<=10));}
let m=P.circuit({fault:'open'});test('R₂断路：A=0,V₂=6V',m.I===0&&m.U1===0&&m.U2===6);
m=P.circuit({fault:'short'});test('R₂短接：I=0.6A,U₂=0,I₂=0',eq(m.I,.6)&&m.U2===0&&m.I2===0);
m=P.circuit({mode:'parallel',b2:false});test('支路断开：支路电流和该电阻压降为0',m.I2===0&&m.U2===0&&eq(m.I1,.6));
for(const mode of ['series','parallel','single'])test('总开关断开 '+mode,P.circuit({mode,closed:false}).I===0);
for(const term of ['AC','AD','BC','BD','AB','CD'])for(const pos of [0,.25,.5,1]){const expected=term==='AB'?20:term==='CD'?0:(term[0]==='A'?pos*20:(1-pos)*20);test('变阻器 '+term+' '+pos,P.rheostat(pos,term)===expected);}
test('灯额定功率',eq(P.lamp(2.5)*2.5,.75));test('灯低压功率',eq(P.lamp(2)*2,.54));test('灯R非恒定',1/P.lamp(1)<2.5/P.lamp(2.5));
test('焦耳热600J',eq(P.heat(.5,20,120),600));test('加倍电流四倍热',eq(P.heat(1,10,60),4*P.heat(.5,10,60)));test('电动机热40J',P.heat(2,1,10)===40);
for(const R of [5,10,15])test('控制3V须匹配变阻器 '+R,eq(6*R/(R+R),3)&&eq(6/(R+R),3/R));
const chapters=Array.from({length:10},(_,i)=>({id:'electricity-'+String(i+1).padStart(2,'0')}));
for(const ch of chapters){const data={};vm.createContext(data);vm.runInContext('window=this;'+fs.readFileSync(require('path').join(__dirname,'../physics/grade-9',ch.id,'lesson.js'),'utf8'),data);for(const p of data.LESSON.pages)for(const q of [0,1,2,3]){const model=c.renderModel(p,c.initial(p),q);test(ch.id+'/'+p.title+'/阶段'+q,!!model.picture&&!/NaN|undefined/.test(model.picture+model.metrics));if(p.scene==='charge')test('电子守恒',model.data.electrons===(p.contact?8:6)&&model.data.totalCharge===(p.contact?-2:0));}}
fs.writeFileSync(require('path').join(__dirname,'../test-results/science-results.json'),JSON.stringify({passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results},null,2));console.log({passed:results.filter(x=>x.pass).length,failures:results.filter(x=>!x.pass)});
