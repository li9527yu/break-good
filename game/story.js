(function(root){
'use strict';
const names={walter:'沃尔特',gus:'古斯',jesse:'杰西',self:'你',scene:'实验室'};
const days=['入场','隐瞒','试探','追问','拉拢','失衡','兑现'];
const nodes={};
function node(id,day,speaker,title,text,choices,extra={}){nodes[id]={id,day,speaker,title,text,choices,...extra};}
function c(id,label,next,effects={},when){return {id,label,next,effects,when};}
const rel=(who,value)=>({[who]:value});
function work(id,day,next,text){node(id,day,'scene','工作台',text,[],{kind:'work',next,reactor:[1,3,7].includes(day)});}
function report(id,day,next){node(id,day,'self','工作记录',s=>`今天的实际操作已经结束。记录板上自动填入了任务状态和设备历史。你只需决定如何描述原因，以及是否写出协助者。纸张提交后，古斯能读到的是这张报告，而不是你脑海里的全部经过。`,[],{kind:'report',next});}
node('d1-entry',1,'scene','新的工牌','电梯在地下停住，洗衣房的声音被厚门隔在身后。你拿到一张没有姓名的工牌。桌上只有今天的安排，没有合同，也没有离职手续。古斯说这是一份稳定的工作。直到现在，你才意识到，“稳定”可能也意味着别人决定你什么时候离开。',[
 c('look','先记住出口和工作区的位置。','d1-gus',{facts:{observedExit:true},note:'电梯是我目前知道的唯一出口。'}),c('focus','先去找负责指导我的人。','d1-gus',{relations:rel('walter',1)})]);
node('d1-gus',1,'gus','规则','“你不需要一天学会所有事情。”古斯把工牌推到你面前。“但我需要知道什么时候可以依靠你。工作记录每天提交，问题发生时及时告诉我。”他停了一下。“这里的安排由我负责。具体操作，听沃尔特的。”两句话之间，已经有一条很窄的缝。',[
 c('rules','如果要求冲突，我该听谁的？','d1-walter',{note:'古斯负责安排，沃尔特负责操作；他们的要求可能不一致。'}),c('accept','明白。我会把问题记清楚。','d1-walter',{relations:rel('gus',1)})]);
node('d1-walter',1,'walter','第一次纠正','沃尔特没有问你的名字。他把你面前的虚构校准卡转正，指着上面的两个符号：“顺序。不是猜测。”你刚伸手，他便按住容器边缘。“你先告诉我打算做什么。”你听见杰西在身后收拾工具，动作放慢了。这里的人似乎都在等待你如何回应。',[
 c('learn','请你再示范一次，我会记录。','d1-work',{relations:rel('walter',2),facts:{learned:true}}),c('defend','我还没动手，你可以先听我的判断。','d1-work',{relations:rel('walter',-1),facts:{assertive:true}}),c('quiet','点头，按他要求重新检查。','d1-work',{relations:rel('walter',1)})]);
work('d1-work',1,'d1-jesse','今天只做虚构的色谱校准。材料代号为“雾盐”和“琥珀片”，读数使用没有物理单位的游戏刻度。沃尔特站在旁边，等你按照卡片完成操作。');
node('d1-jesse',1,'jesse','下班之前','“他对谁都这样。”杰西把一块擦布递给你。“你不用每次都跟他争，但也别什么都往自己身上揽。”他看向空白的记录板。“以后要是出问题，先看清到底发生了什么。有时候写下来的东西，比当时发生的事更难收回。”',[
 c('thanks','谢谢。以后我们互相提醒。','d1-report',{relations:rel('jesse',1),note:'杰西提醒我：记录会留下来。'}),c('distance','我会先做好自己的部分。','d1-report')]);
report('d1-report',1,'d1-end');
node('d1-end',1,'self','第一晚','你把工牌放在床头。今天没有人明确告诉你已经被录用，但明天的到岗时间已经发来了。你回想沃尔特按住容器的手，也回想古斯说的“依靠”。这里对能力的期待，似乎比你想象的更急迫。', [c('sleep','结束第一天。','d2-entry')]);
node('d2-entry',2,'scene','异常','你到场时，控制台上已经亮过一次告警。杰西站在工作台前，手里拿着错位的虚构校准片。他重新插回原位，却没有擦掉仪表旁的一小块浅色残留。“我刚才看错了标记。”他说。你亲眼看见了经过：这次问题来自操作，不是设备自己坏了。',[
 c('inspect','检查残留和设备记录。','d2-jesse',{facts:{sawJesseError:true},note:'第二天，杰西插错校准片，引发告警；仪表旁留有残留。'})]);
node('d2-jesse',2,'jesse','一个请求','“能不能先别写我的名字？”杰西问得很轻。“我会修好。你不知道沃尔特会怎么说。”他没有要求你撒谎，只是把问题留在了你面前。修正会让今天晚一点结束；直接提交异常记录，就不需要你承担额外工作。',[
 c('cover','我会帮你保密，我们先处理现场。','d2-work',{relations:rel('jesse',2),promises:{protectJesse:'open'},facts:{d2Response:'cover'}}),c('repair','先一起修好，但我不能保证报告怎么写。','d2-work',{relations:rel('jesse',1),facts:{d2Response:'repair'}}),c('report','我会如实写明原因。你应该先知道。','d2-work',{relations:rel('jesse',-1),facts:{d2Response:'truth'}})]);
work('d2-work',2,'d2-after','告警已经停止，但设备需要重新校准。杰西留下帮助你，实际协助者将被系统记为杰西。纠正这次异常会占用本班的余量，不能同时假装什么都没发生。');
node('d2-after',2,'walter','留下的痕迹','沃尔特经过仪表，拇指擦过浅色残留。他没有马上说话，只问：“今天的记录是谁提交？”你说是你。他点点头，拿走旧的校准卡。你无法确定他已经看出了多少，但你知道，他看过这处痕迹。',[
 c('ack','告诉他，记录由我负责。','d2-report',{knowledge:{walter:['d2-residue']},note:'沃尔特看到了仪表旁的残留。'})]);
report('d2-report',2,'d2-end');
node('d2-end',2,'self','纸面上的一天',s=>s.reports[2]?.helper==='omit'?'报告里没有杰西的名字。他看了一眼盖章的位置，说了声谢谢。走到电梯口，你才发现：一张纸可以让事情安静下来，但不能把残留和目击一起抹掉。':'杰西看见了报告上的名字，没有争辩。他只是问你，下次能不能在提交前让他看一眼。你答应以后先告诉他自己的打算。诚实留下了证据，也改变了你们之间说话的方式。',[
 c('sleep','结束第二天。','d3-entry')]);
node('d3-entry',3,'walter','离开之前','沃尔特摘下手套，说他需要出去一趟。“今天只做准备。读数不稳定就停下来，等我回来。”你问交付怎么办。他收起眼镜盒：“我会处理。”电梯门关上后，杰西去了储物区。实验室第一次显得空旷，而今天的截止时间仍写在白板上。',[
 c('prepare','按要求整理工作台，暂不启动。','d3-phone',{facts:{walterOrderedStop:true},note:'第三天，沃尔特要求等待，不要独立继续。'})]);
node('d3-phone',3,'gus','古斯来电','手机在桌面上震动。“沃尔特已经走了。”古斯没有问候。“我想知道，今晚的工作能否按时完成。”他没有提高声音，也没有提起沃尔特留下的要求。你看向准备好的工作台，意识到他的真正问题是：如果沃尔特不在，这里还能不能继续运转。',[
 c('solo','我可以独立完成。','d3-work',{facts:{d3Plan:'solo'},promises:{deliver:'open'},relations:rel('gus',1)}),c('help','我需要杰西帮忙。','d3-help',{facts:{d3Plan:'help'},promises:{deliver:'open'}}),c('stop','沃尔特要求我们停工。','d3-work',{facts:{d3Plan:'stop'},relations:rel('walter',1)}),c('notify','我先联系沃尔特，确认后给你答复。','d3-notify',{facts:{d3Plan:'notify'}})]);
node('d3-help',3,'jesse','谁来承担决定','“我能帮你，但这是谁的主意？”杰西把手套放在台上。他不愿意再成为报告里方便解释一切的名字。“你得告诉沃尔特，是你决定继续的。”他看着你，没有立刻去碰设备。你可以作出这个承诺，也可以现在改变主意。',[
 c('own','决定是我的。我会向他说明。','d3-work',{facts:{d3Ownership:true},promises:{ownDecision:'open'},relations:rel('jesse',1)}),c('back','算了，我们停工。','d3-work',{facts:{d3Plan:'stop'},promises:{deliver:'broken'}})]);
node('d3-notify',3,'walter','第二通电话','沃尔特在电话另一头沉默了几秒。“他直接找你了？”你听见门被关上的声音。“按我的要求停下来。把现场留着。”你现在已经知道：继续操作不再是误解；停工也意味着你要向古斯明确承认，自己没有完成他的期待。',[
 c('obey','我会停工，并记录原因。','d3-work',{facts:{d3Plan:'stop',notifiedWalter:true},relations:rel('walter',2),knowledge:{walter:['gus-called']}}),c('continue','我理解，但我会承担完成任务的责任。','d3-work',{facts:{d3Plan:'solo',notifiedWalter:true},promises:{deliver:'open'},relations:rel('walter',-1),knowledge:{walter:['gus-called','player-continues']}})]);
work('d3-work',3,'d3-after','台上的卡片没有替你决定该听谁的。继续操作会生成运行记录；停工则保留未完成状态。报告不能改变这两种事实。');
node('d3-after',3,'self','在提交之前',s=>s.facts.d3Plan==='stop'?'你切断了本轮任务的操作权限。白板上的截止时间过去了，设备仍停在原位。遵从沃尔特的要求，并不等于什么都没做：你已经让古斯知道，谁的话能决定这里是否工作。':s.tasks[3]?.reactor?(s.tasks[3].quality==='签收'?'留样达到交付线，古斯确认签收。工作台依然留下了运行记录，沃尔特回来就会看见。':'这批结果是「'+s.tasks[3].quality+'」。交付承诺没有兑现，运行记录却会留下来。你得把这两件事写进工作报告。'):'设备留下了新的运行记录。你确实做到了沃尔特不在时继续工作，代价却还没有出现。你可以把报告写得轻描淡写，但明天他只要看一眼设备，就会知道有人跨过了他的要求。',[
 c('write','打开工作记录板。','d3-report')]);
report('d3-report',3,'d3-end');
node('d3-end',3,'gus','收到报告','“我已经收到。”古斯说。“明天请准时来。”他没有评价你的选择。电话挂断后，你发现自己一直在猜测，哪一种回答让他满意。你还不知道，明天真正需要回答的人并不是他。',[
 c('sleep','结束第三天。','d4-entry')]);
node('d4-audit',4,'gus','临时抽查',s=>s.tasks[3].alarm?'“值班记录里有一条告警。”古斯把报告和设备日志并排放下。“签收的是样品。我现在问的是工作台上发生的事。”':'“这次交付抽到了复核。”古斯把留样签推过来。“我需要知道，换一批材料，你能不能做到同样的结果。”',[
 c('disclose','交出完整记录，把偏差说清楚。','d4-entry',{relations:rel('gus',1),facts:{auditResponse:'open'},note:'古斯抽查了这批的操作记录，我交出了完整记录。'}),
 c('limit','只确认已经提交的结果。','d4-entry',{relations:rel('gus',-1),facts:{auditResponse:'limited'},note:'古斯抽查了这批。我只确认了报告上的结果。'})
]);
node('d4-warning',4,'jesse','杰西的提醒','杰西在工作台旁等你。“沃尔特刚回来就问日志在哪。”他压低声音。“如果你想让他听你的解释，现在得由你先开口。”',[
 c('confide','告诉杰西我打算如实解释。','d4-entry',{relations:rel('jesse',1),facts:{warnedByJesse:true},note:'杰西提前提醒我，沃尔特在找设备日志。'}),
 c('listen','道谢，自己去找沃尔特。','d4-entry',{facts:{warnedByJesse:true}})
]);
node('d4-entry',4,'walter','现场不会失忆',s=>s.facts.d3Plan==='stop'?'沃尔特先看了未完成标记，再翻开记录。“你停下来了。”这句话像是认可，也像确认自己仍然有权让实验室安静。他随后抬起头：“古斯跟你说了什么？从第一句话开始。”':'沃尔特翻开设备日志，看见上次新增的运行记录。“这不是待机记录。”他转向你。“我离开以后，到底是谁让这里继续的？”'+(s.facts.followup==='audit'?'他指着已经被翻过的那一页，等你开口。':s.facts.warnedByJesse?'杰西的提醒给你留了准备解释的时间。':'你刚想拿起记录板，他把它压回桌面：“我现在问的是你。”'),[
 c('listen','听完他的追问。','d4-question',{knowledge:{walter:['d3-run-log']},note:'沃尔特检查了第三天设备运行记录，知道任务是否继续。'})]);
node('d4-question',4,'walter','你的解释','“别告诉我别人想听什么。”沃尔特说。“告诉我你做了什么。”现在坦白可能让他不满，却能说明你的决定。隐瞒可以减少眼前冲突，但设备记录已经给出了无法否认的一部分。杰西在另一侧整理东西，他听得见你们的谈话。',[
 c('truth','说明电话、自己的决定，以及实际协助者。','d4-response',{facts:{d4Answer:'truth'},relations:rel('walter',1),note:'我向沃尔特说明了第三天的决定。'}),c('partial','只说明任务结果，不提古斯的要求。','d4-response',{facts:{d4Answer:'partial'},relations:rel('walter',-1)}),c('deny','说我只是照原来的安排，没有改变什么。','d4-response',{facts:{d4Answer:'deny'},relations:rel('walter',-2)})]);
node('d4-response',4,'walter','他如何理解',s=>{
 if(s.facts.d4Answer==='deny'&&s.facts.d3Plan!=='stop')return '“运行记录就在这里。”沃尔特推开纸张。“你可以不同意我，但不要以为我看不懂自己的设备。”他不再询问你做得如何。你意识到，让他愤怒的不只是继续工作，还有你试图把发生过的事情从谈话里抹掉。';
 if(s.facts.d4Answer==='truth')return s.facts.d3Plan==='stop'?'“下次他打来，告诉我。”沃尔特终于松开记录板。他接受了你的说明，但他把“告诉我”说得很重。你获得了一点信任，同时也接受了另一种监督。':'“所以你认为自己可以决定了。”沃尔特看着你，随后又看了一眼工作结果。“至少这次你肯承认。”他没有说原谅，也没有否认你完成了工作。两件事都留在你们之间。';
 return '“我问的不是结果。”沃尔特停了一下，决定暂时不追问。他把记录板收进抽屉。没有被当场戳破，不代表解释已经被接受。你看不见抽屉里的纸，也不知道下一次他会拿哪一张出来。';
},[c('work','开始今天的复核。','d4-work',{resolveExplanation:true})]);
work('d4-work',4,'d4-jesse','沃尔特让你核对上一次的设备日志。确认读数、签名和告警记录都还在，才能把记录归档。');
node('d4-jesse',4,'jesse','旁观者',s=>s.promises.ownDecision==='broken'?'“我说过，别把决定留给我解释。”杰西把工具放得很响。“你刚才没有说明，是谁决定继续的。以后你再说‘我负责’，我得想一想。”':'“至少今天没人假装昨天没有发生。”杰西说。他看了一眼沃尔特离开的方向。“他们会一直问你同一个问题，直到你给出他们想要的答案。你最好先知道自己要说什么。”',[
 c('listen','记住他的提醒。','d4-end',{note:'杰西在意我是否承担自己的决定，而不只是有没有帮助他。'})]);
node('d4-end',4,'self','第四晚','你开始能够从脚步和停顿里辨认不同的问题。古斯问能不能完成，沃尔特问谁作了决定，杰西问代价由谁承担。它们不是同一个问题。你也不能再用同一句“我会做好工作”回答所有人。',[c('sleep','结束第四天。','d5-entry')]);
node('d5-entry',5,'gus','新的安排','古斯递来一份新的轮班表，你的名字第一次排在沃尔特前面。“不需要现在对外宣布。”他说。“我只是希望工作不依赖任何一个人的临时安排。”报酬和权限都更好，但没有写结束日期。你明白，这份机会本身，就是一条准备替代沃尔特的路径。',[
 c('accept','我接受独立值班的安排。','d5-walter',{facts:{gusOffer:'accept'},relations:rel('gus',2),note:'我接受了古斯提出的独立值班安排。'}),c('delay','让我先完成这一周，再给答复。','d5-walter',{facts:{gusOffer:'delay'}}),c('refuse','我不接受成为替代者。','d5-walter',{facts:{gusOffer:'refuse'},relations:rel('gus',-1)})]);
node('d5-walter',5,'walter','另一种忠诚','沃尔特似乎已经知道轮班表的变化。“他不会把真正的条件写在纸上。”他说。“如果他再联系你，先告诉我。不要独自答应。”他的语气像警告，也像请求。你知道他需要你，但他需要的是一个帮手，还是一个永远不会越过他的人？',[
 c('tell','把古斯的安排和我的答复全部告诉他。','d5-work',{facts:{toldOffer:true},knowledge:{walter:['gus-offer']},relations:rel('walter',2)}),c('loyal','答应今后先告诉他，但不解释今天。','d5-work',{promises:{informWalter:'open'},relations:rel('walter',1)}),c('boundary','我会负责自己的决定，不作这种保证。','d5-work',{facts:{setBoundary:true},relations:rel('walter',-1)})]);
work('d5-work',5,'d5-jesse','墙上的轮班表已经换过。核对你名下的交接栏，再看一眼沃尔特的名字被移到了什么位置。');
node('d5-jesse',5,'jesse','留一点余地','杰西在下班前叫住你：“如果哪天你真不想来了，最好别到那天才想办法。”他没有说自己是否也想走。你可以把今天剩下的时间用来整理自己的工时与交接记录，确认离开的流程；也可以留下加班，证明新的安排没有选错人。',[
 c('exit','整理自己的交接材料，准备退路。','d5-end',{facts:{exitPrepared:true},note:'我整理了自己的工时与交接记录，准备在有机会时退出。'}),c('overtime','留下完成额外的复核。','d5-end',{relations:rel('gus',1),facts:{extraShift:true}}),c('ask','先听听杰西的打算。','d5-end',{relations:rel('jesse',1),facts:{askedJesseFuture:true},note:'杰西也在担心自己能否离开这里。'})]);
node('d5-end',5,'self','第五晚','你把今天得到的东西摆在一起：一份更好的轮班表，一个要求事先告知的承诺，以及一条并不确定的退路。它们都像帮助，也都可能成为别人要求你留下的理由。你还剩两天，让自己的选择变得可信。',[c('sleep','结束第五天。','d6-entry')]);
node('d6-entry',6,'gus','核对记录',s=>s.facts.reportContradictions>0?'“有几份记录需要解释。”古斯把设备日志和你的报告并排放下。“报告中的描述，与后来的复核不完全一致。”他没有说你撒谎。正因为如此，你必须自己决定，要把哪一部分说出来。他手里已经有足够的材料，不能再用沉默把两份记录变成同一件事。':'“记录很清楚。”古斯翻过最后一页。“现在我想知道，接下来的安排是否同样清楚。”你没有留下明显的纸面矛盾，但这并没有让你脱离问题。古斯仍然希望你选定一个位置，并在那里待下去。',[
 c('own','解释自己作过的决定，承担记录的责任。','d6-jesse',{facts:{ownedRecords:true},relations:rel('gus',1),knowledge:{gus:['audit-explanation']}}),c('blame','强调问题最早来自杰西的失误。','d6-jesse',{facts:{blamedJesse:true},relations:rel('jesse',-3),knowledge:{gus:['jesse-error']},promises:{protectJesse:'broken'}}),c('procedure','只核对记录内容，不评论任何人的动机。','d6-jesse',{facts:{reservedAudit:true}})]);
node('d6-jesse',6,'jesse','不再模糊','“我不想再猜了。”杰西把工牌从脖子上摘下来，却没有放下。“他们让你继续工作，让你解释记录，再让你证明自己站在哪边。最后谁会被留下承担问题？”他抬起头。“如果事情真的坏了，你会不会把我推出去？”这一次，你不能靠转移话题结束谈话。',[
 c('protect','我不会让你一个人承担。','d6-action',{facts:{d6Stance:'jesse'},promises:{standWithJesse:'open'},relations:rel('jesse',1)}),c('walter','我会和沃尔特一起面对古斯。','d6-action',{facts:{d6Stance:'walter'},relations:rel('walter',1)}),c('gus','我会按古斯的安排完成交接。','d6-action',{facts:{d6Stance:'gus'},relations:rel('gus',1)}),c('leave','我想离开，先把自己的事情交代清楚。','d6-action',{facts:{d6Stance:'exit'}})]);
node('d6-action',6,'self','可以付出的代价','今天的工作被核对记录打断。你只剩下一段不被打扰的时间：可以陪杰西准备共同说明，可以通知沃尔特古斯正在核查，也可以整理退出交接。你不能同时出现在每个人身边。你要留下的是一句好听的话，还是一项别人能够看见的行动？',[
 c('help','陪杰西整理一份共同说明。','d6-work',{facts:{jointStatement:true},relations:rel('jesse',2),knowledge:{jesse:['shared-statement']},note:'我与杰西共同整理了说明，愿意承担各自作过的决定。'}),c('warn','把核查情况通知沃尔特。','d6-work',{facts:{warnedWalter:true},relations:rel('walter',1),promises:{informWalter:'kept'},knowledge:{walter:['gus-audit']}}),c('exit','完成自己的退出交接准备。','d6-work',{facts:{exitPrepared:true},note:'退出所需的个人交接材料已准备好。'})]);
work('d6-work',6,'d6-end','关机前，把工作台上的器具归位。杰西把用了很久的那支笔留在桌角，没有带走。');
node('d6-end',6,'self','最后一个普通夜晚','你没有睡好。手机放在桌上，没有新消息。真正让人不安的不是谁已经威胁了你，而是每个人都在等你兑现某句话。你翻看自己的笔记：有些决定已经变成证据，有些承诺已经没有补救的时间。明天，你得带着这些东西回去。',[c('sleep','进入第七天。','d7-entry')]);
node('d7-entry',7,'scene','同一间实验室','第七天，实验室的灯全部亮着。轮班表放在中间，旁边是待签署的交接文件。古斯让你作出正式答复；沃尔特等着你说明谁拥有决定权；杰西只问你昨天说的话还算不算数。你没有突然获得新的筹码。能够用的，只有这一周真正做过的事。',[
 c('check','完成最后一次工作台检查。','d7-work')]);
work('d7-work',7,'d7-decision','你要亲手完成最后一批，把纯度和去向写进交接记录。签下哪份安排，还要由你决定。');
node('d7-decision',7,'self','兑现','你把记录板放回桌面。没有人催促，但三个人都在等。这一刻可说的话，取决于过去几天是否有人愿意相信你，以及你有没有给自己留下余地。灰色的选项说明尚未具备的条件；不会用最后一句话抹掉此前的一周。',[
 c('gus','接受古斯的独立安排，签下新的轮班表。','ending',{ending:'successor'},s=>s.facts.gusOffer==='accept'&&s.relations.gus>=2&&!s.facts.unfulfilledDelivery),
 c('walter','与沃尔特共同提出：所有安排必须公开确认。','ending',{ending:'alliance'},s=>s.relations.walter>=3&&(s.facts.toldOffer||s.facts.warnedWalter)&&s.facts.d4Answer!=='deny'),
 c('jesse','与杰西一起提交共同说明，不让他独自承担。','ending',{ending:'solidarity'},s=>s.relations.jesse>=3&&s.facts.jointStatement&&!s.facts.blamedJesse),
 c('exit','提交交接，明确要求结束自己的工作。','ending',{ending:'departure'},s=>s.facts.exitPrepared),
 c('stay','不签新安排，继续等待别人作决定。','ending',{ending:'limbo'})],{kind:'decision'});
const endingReasons={gus:'需要接受第五天安排、获得古斯信任，并兑现第三天的交付承诺。',walter:'需要沃尔特信任、告知安排或核查，并且没有否认第三天的决定。',jesse:'需要杰西信任、共同说明，且没有在核查中甩锅给他。',exit:'需要在第五或第六天准备个人退出交接。',stay:'始终可选。'};
const endings={
 successor:{title:'替代者',body:'古斯收下签署的轮班表，说你证明了自己的可靠。沃尔特没有再看你。第二天，你的名字排在第一位，工作量和责任一起增加。你获得了想要的位置，也终于明白：当一个人可以被替代，新的那个人同样可以。',cost:'你获得了独立权限，也进入了古斯更直接的控制。'},
 alliance:{title:'共同署名',body:'沃尔特站到你身边，把新的安排推回桌面。你们要求以后所有改变都写明责任，而不是分别打电话。古斯没有立刻答应，也没有立即拒绝。走出房间时，沃尔特第一次问你对明天的安排有什么意见。你们暂时成为同盟，而不是永远安全。',cost:'你守住了参与决定的权利，也与沃尔特承担同一场冲突。'},
 solidarity:{title:'我们各自负责',body:'你和杰西一起把说明放到桌上。你没有把他写成无辜的旁观者，也没有让他承担你的决定。谈话比想象中漫长，新的轮班表被暂时收起。离开房间时，杰西没有道谢，只问你要不要一起吃点东西。你保住的是一个愿意与你共同面对后果的人。',cost:'你放弃了更快上升的位置，换来一段经受过行动检验的信任。'},
 departure:{title:'门外的空气',body:'你交出准备好的个人工时和交接材料，明确说自己不会再接受新的轮班。古斯沉默片刻，让人收走工牌。电梯升上去时，你没有觉得自己战胜了任何人，只是第一次知道下一步往哪里走。这条退路不保证未来没有麻烦，但今天，你走出了那扇门。',cost:'你放下了这里的机会，没有把未知的未来说成绝对安全。'},
 limbo:{title:'未签字的明天',body:'你把文件推到一边，说还需要时间。古斯让你明天照常到岗；沃尔特收回自己的记录；杰西不再追问。没有人把你赶走，也没有人替你解决任何事情。那张没有姓名的工牌仍然在你手里，明天的决定会比今天更难。',cost:'你暂时保住了工作，却让别人继续决定你的处境。'}
};
const checklistLabels={2:'与杰西复查告警并复位',4:'核对并保留设备日志',5:'核对轮班交接表',6:'归还器具并确认关机'};
function epilogue(s){
 const last=s.tasks[7]?.quality;
 const record=s.tasks[3].quality;
 const followup={
  audit:s.facts.auditResponse==='open'?'抽查时交出的记录随报告留了下来。':'抽查报告上还留着一条未澄清的记录。',
  warning:'杰西站在门口。他记得自己曾赶在沃尔特开口前提醒你。',
  routine:'运行日志已经归档。那次操作最终由你亲自向沃尔特解释。'
 }[s.facts.followup];
 return '当初那批的结果是「'+record+'」。'+followup+(last?' 交接记录上的最后一批标为「'+last+'」。':'');
}
const api={names,days,nodes,endings,endingReasons,checklistLabels,epilogue,hiddenEndings:[]};
if(typeof module!=='undefined')module.exports=api;else root.GameStory=api;
})(globalThis);
