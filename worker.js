// ==========================================================================
// Iris & Zhenzhen · Mexico & Latin America Trip — 旅行手册 Worker
// 单文件 Cloudflare Worker：GET / 返回整页 HTML；/api/todos 提供多端同步的
// 待办清单读写接口，数据存放在绑定的 KV 命名空间 TRIP_KV 里。
// ==========================================================================

const PAGE_HTML = `
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Iris & Zhenzhen · Mexico & Latin America Trip</title>
<meta name="color-scheme" content="light dark">
<style>
:root{
  --marigold:#e0932c; --marigold-soft:#f6d9a8;
  --clay:#c1440e; --clay-soft:#f0c3ac;
  --indigo:#35507a; --indigo-soft:#c3d2e6;
  --agave:#4f7942; --agave-soft:#cfe0c4;
  --transit:#8b7355; --transit-soft:#e3d6c2;
  --radius-s:10px; --radius-m:16px; --radius-l:22px;
  --shadow:0 1px 0 rgba(30,20,10,.06);
}
html[data-theme="day"]{
  --bg:#faf6ed; --surface:#ffffff; --surface-alt:#f2ead9;
  --ink:#2b2318; --ink-soft:#6e6153; --line:#e3d8c2;
  --hero-bg:linear-gradient(160deg,#2b2318 0%,#4a3a24 55%,#7a5a2e 100%);
  --hero-ink:#faf3e2; --hero-soft:#d8c6a4;
}
html[data-theme="night"]{
  --bg:#10141c; --surface:#1a2029; --surface-alt:#212838;
  --ink:#ede6d6; --ink-soft:#a79c89; --line:#313a4d;
  --hero-bg:linear-gradient(160deg,#05070c 0%,#131a2b 55%,#28334a 100%);
  --hero-ink:#f3ecd9; --hero-soft:#9fb0c9;
  --marigold-soft:#5a4526; --clay-soft:#5b3223; --indigo-soft:#334a68; --agave-soft:#34452f; --transit-soft:#4a4131;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif;
  line-height:1.55; -webkit-font-smoothing:antialiased;
  transition:background .6s ease,color .6s ease;
}
h1,h2,h3,.serif{font-family:"Iowan Old Style","Songti SC","STSong","Noto Serif SC",Georgia,serif}
.wrap{max-width:640px;margin:0 auto;padding:0 0 64px}
a{color:inherit}
.section{padding:34px 20px 6px}
.section h2{font-size:21px;margin:0 0 4px;font-weight:600;letter-spacing:.02em}
.section .section-sub{font-size:13px;color:var(--ink-soft);margin:0 0 18px}

/* ---------- HERO / 此刻关注 ---------- */
.hero{
  background:var(--hero-bg); color:var(--hero-ink);
  padding:30px 20px 26px; position:relative; overflow:hidden;
}
.hero::after{
  content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,.5) 0, transparent 60%),
    radial-gradient(1px 1px at 70% 15%, rgba(255,255,255,.4) 0, transparent 60%),
    radial-gradient(1.5px 1.5px at 85% 60%, rgba(255,255,255,.35) 0, transparent 60%),
    radial-gradient(1px 1px at 40% 75%, rgba(255,255,255,.3) 0, transparent 60%);
}
.hero-inner{max-width:640px;margin:0 auto;position:relative}
.hero-brand{font-size:14px;color:var(--hero-soft);margin:0 0 14px;font-weight:500;letter-spacing:.01em}
.hero-eyebrow{font-size:12px;color:var(--hero-soft);margin:0 0 10px;display:flex;align-items:center;gap:8px}
.hero-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--marigold);display:inline-block;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero-title{font-size:19px;margin:0 0 18px;font-weight:500}
.hero-title b{font-weight:600}
.countdown{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.countdown .unit{text-align:center;min-width:58px}
.countdown .num{font-family:"Iowan Old Style",Georgia,serif;font-size:34px;font-variant-numeric:tabular-nums;line-height:1}
.countdown .lbl{font-size:11px;color:var(--hero-soft);margin-top:4px}
.hero-todo{
  margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.18);
  font-size:14px;display:flex;gap:10px;align-items:baseline;
}
.hero-todo .k{color:var(--hero-soft);white-space:nowrap;font-size:12px}

/* ---------- ROUTE MAP ---------- */
.map-wrap{overflow-x:hidden}
#routeMap{width:100%;height:auto;display:block}
.map-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;font-size:12px;color:var(--ink-soft)}
.map-legend span{display:inline-flex;align-items:center;gap:6px}
.map-legend i{width:9px;height:9px;border-radius:50%;display:inline-block}

/* ---------- CARDS: flights / stays ---------- */
.tabs{display:flex;gap:6px;margin-bottom:16px}
.tabs button{
  border:1px solid var(--line);background:var(--surface);color:var(--ink-soft);
  padding:7px 16px;border-radius:99px;font-size:13px;cursor:pointer;font-family:inherit;
}
.tabs button.active{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.card-list{display:flex;flex-direction:column;gap:10px}
.info-card{
  background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-m);
  padding:14px 16px;
}
.info-card .row1{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.info-card .title{font-size:14.5px;font-weight:600}
.info-card .detail{font-size:12.5px;color:var(--ink-soft);margin-top:4px}
.tag{font-size:10.5px;padding:2px 8px;border-radius:99px;white-space:nowrap;flex-shrink:0}
.tag.confirmed{background:var(--agave-soft);color:var(--agave)}
.tag.pending{background:var(--clay-soft);color:var(--clay)}

/* ---------- DAYS ---------- */
.day-card{border-bottom:1px solid var(--line);padding:16px 0}
.day-card:first-child{border-top:1px solid var(--line)}
.day-head{display:flex;gap:14px;align-items:flex-start;cursor:pointer}
.day-num{
  font-family:"Iowan Old Style",Georgia,serif;font-size:13px;color:var(--ink-soft);
  width:30px;flex-shrink:0;padding-top:2px;
}
.day-badge{width:9px;height:9px;border-radius:50%;flex-shrink:0;margin-top:6px}
.day-headline{flex:1;min-width:0}
.day-date{font-size:11.5px;color:var(--ink-soft)}
.day-title{font-size:15.5px;font-weight:600;margin-top:2px}
.day-chev{color:var(--ink-soft);font-size:12px;transition:transform .25s ease;padding-top:4px}
.day-card.open .day-chev{transform:rotate(90deg)}
.day-body{display:none;padding:14px 0 0 44px}
.day-card.open .day-body{display:block}
.day-items{display:grid;grid-template-columns:52px 1fr;gap:7px 10px;margin-bottom:12px}
.day-time{font-size:12px;color:var(--ink-soft);padding-top:1px}
.day-text{font-size:13.5px}
.day-text .book-flag{color:var(--clay);font-size:11.5px;margin-left:4px}
.day-meta{font-size:12.5px;color:var(--ink-soft);margin-top:6px}
.day-meta b{color:var(--ink);font-weight:600}
.day-tip{
  margin-top:10px;font-size:12.5px;background:var(--surface-alt);border-radius:var(--radius-s);
  padding:10px 12px;color:var(--ink-soft);
}
.day-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.day-actions a{
  font-size:12px;border:1px solid var(--line);border-radius:99px;padding:6px 13px;
  text-decoration:none;color:var(--ink);display:inline-flex;align-items:center;gap:5px;
}
.place-link{text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:2px;cursor:pointer}

/* ---------- TODO ---------- */
.progress-wrap{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.progress-bar{flex:1;height:6px;border-radius:99px;background:var(--surface-alt);overflow:hidden}
.progress-fill{height:100%;background:var(--agave);width:0%;transition:width .4s ease}
.progress-label{font-size:12px;color:var(--ink-soft);white-space:nowrap}
.todo-item{
  display:flex;align-items:flex-start;gap:11px;padding:11px 0;border-bottom:1px solid var(--line);
  cursor:pointer; user-select:none;
}
.todo-item:last-child{border-bottom:none}
.todo-check{
  width:19px;height:19px;border-radius:6px;border:1.5px solid var(--ink-soft);flex-shrink:0;margin-top:1px;
  display:flex;align-items:center;justify-content:center;font-size:12px;transition:all .15s ease;
}
.todo-item.done .todo-check{background:var(--agave);border-color:var(--agave);color:#fff}
.todo-text{font-size:14px;flex:1}
.todo-item.done .todo-text{color:var(--ink-soft);text-decoration:line-through}
.todo-urgent{font-size:10.5px;color:var(--clay);border:1px solid var(--clay-soft);border-radius:99px;padding:1px 8px;flex-shrink:0;margin-top:1px}
.todo-sync-note{font-size:11.5px;color:var(--ink-soft);margin-top:14px}

/* ---------- TIPS ---------- */
.tip-grid{display:flex;flex-direction:column;gap:14px}
.tip-block{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-m);padding:15px 17px}
.tip-block h3{font-size:14.5px;margin:0 0 8px;font-weight:600}
.tip-block p, .tip-block ul{font-size:13px;color:var(--ink-soft);margin:0}
.tip-block ul{padding-left:18px}
.tip-block li{margin-bottom:4px}

.footer-note{padding:30px 20px 10px;font-size:11.5px;color:var(--ink-soft);text-align:center}
</style>
</head>
<body>
<div class="hero">
  <div class="hero-inner">
    <p class="hero-brand serif">Iris &amp; Zhenzhen · Mexico &amp; Latin America</p>
    <p class="hero-eyebrow"><span class="dot"></span><span id="heroCity">正在加载…</span></p>
    <p class="hero-title serif" id="heroTitle">正在计算下一个行程…</p>
    <div class="countdown" id="countdown">
      <div class="unit"><div class="num" id="cd-d">--</div><div class="lbl">天</div></div>
      <div class="unit"><div class="num" id="cd-h">--</div><div class="lbl">时</div></div>
      <div class="unit"><div class="num" id="cd-m">--</div><div class="lbl">分</div></div>
      <div class="unit"><div class="num" id="cd-s">--</div><div class="lbl">秒</div></div>
    </div>
    <div class="hero-todo"><span class="k">当前待办</span><span id="heroTodo">加载中…</span></div>
  </div>
</div>

<div class="wrap">

  <section class="section map-section">
    <h2>行程总览地图</h2>
    <p class="section-sub">按时间顺序的落脚点,颜色代表所在区域,数字是过夜晚数</p>
    <div class="map-wrap"><svg id="routeMap" viewBox="0 0 320 100"></svg></div>
    <div class="map-legend" id="mapLegend"></div>
  </section>

  <section class="section bookings-section">
    <h2>已确认的行程</h2>
    <p class="section-sub">机票已出票、住宿已确认的部分;标黄的是还在补充中的项目</p>
    <div class="tabs">
      <button data-tab="flights" class="active">机票</button>
      <button data-tab="stays">住宿</button>
    </div>
    <div id="flightsList" class="card-list"></div>
    <div id="staysList" class="card-list" hidden></div>
  </section>

  <section class="section days-section">
    <h2>逐日行程</h2>
    <p class="section-sub">点开每天可以看今日路线和一键导航,标 ⚠️ 的是需要提前订的</p>
    <div id="daysList"></div>
  </section>

  <section class="section todo-section">
    <h2>待办清单</h2>
    <p class="section-sub">两人共用,谁划掉都会同步</p>
    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      <div class="progress-label" id="progressLabel">0 / 0</div>
    </div>
    <div id="todoList"></div>
    <p class="todo-sync-note" id="todoSyncNote"></p>
  </section>

  <section class="section tips-section">
    <h2>实用贴士</h2>
    <div class="tip-grid">
      <div class="tip-block">
        <h3>货币与花费</h3>
        <p>沿途经过墨西哥比索(MXN)、秘鲁索尔(PEN)、智利比索(CLP)、阿根廷比索(ARS)四种货币,阿根廷现金汇率通常比刷卡划算,建议入境后在正规渠道换一些现金零用。大额消费优先用 Wise / 信用卡。</p>
      </div>
      <div class="tip-block">
        <h3>海拔与身体</h3>
        <p>库斯科(3400m)、马丘比丘徒步、惠曼塔湖(4200m)都在高海拔区域,抵达当天尽量放慢节奏、多喝水,提前备好高反药和肠胃炎药。百内 & 菲茨罗伊徒步日强度都在8-11小时,注意补给和防晒防风。</p>
      </div>
      <div class="tip-block">
        <h3>提前预订清单</h3>
        <ul>
          <li>马丘比丘门票 + 火车票(最容易被忽略,建议最先订)</li>
          <li>弗里达故居门票(周一闭馆,每日限量)</li>
          <li>墨西哥城⇄瓦哈卡的 ADO 夜巴(亡灵节前后旺季)</li>
          <li>百内国家公园 BusSur 接驳车、冰川团/门票</li>
          <li>Don Julio 牛排馆订位、快艇冲瀑布 Gran Aventura</li>
        </ul>
      </div>
      <div class="tip-block">
        <h3>关于最后一程</h3>
        <p>回程机票是圣地亚哥经停后到悉尼,计划在经停点墨尔本直接下机、不再飞悉尼那一段。这属于「隐藏城市票」操作:托运行李默认会挂到悉尼,建议尽量只带手提行李登机,并留意值机与登机口是否有异常提示。</p>
      </div>
    </div>
  </section>

  <p class="footer-note">中南美 40 天 · 2026.10.21 – 11.29 · 本页面信息以实际出票 / 订单为准</p>
</div>

<script>
const DATA = {"flights": [{"id": "f1", "date": "2026-10-21", "route": "墨尔本 MEL → 洛杉矶 LAX → 墨西哥城 MEX", "detail": "Delta/Aeromexico DL12+DL7951 · 11:00 起飞 → 17:00 到达(当地时间,含LAX转机4h40m)", "status": "confirmed", "dep": "2026-10-21T11:00:00+11:00", "depCity": "墨尔本"}, {"id": "f2", "date": "2026-11-04", "route": "墨西哥城 MEX → 利马 LIM", "detail": "Volaris Y43918 · 22:00 起飞 → 次日04:55到达 · 红眼航班", "status": "confirmed", "dep": "2026-11-04T22:00:00-06:00", "depCity": "墨西哥城"}, {"id": "f3", "date": "2026-11-05", "route": "利马 LIM → 库斯科 CUZ", "detail": "Sky Airline H25721 · 08:00 - 09:25", "status": "confirmed", "dep": "2026-11-05T08:00:00-05:00", "depCity": "利马"}, {"id": "f4", "date": "2026-11-12", "route": "库斯科 CUZ → 马尔多纳多港 PEM", "detail": "Sky Airline H25721 · 10:05 - 11:10", "status": "confirmed", "dep": "2026-11-12T10:05:00-05:00", "depCity": "库斯科"}, {"id": "f5", "date": "2026-11-14", "route": "马尔多纳多港 PEM → 纳塔莱斯港 PNT", "detail": "LATAM · 2次经停(利马/圣地亚哥)· 14:35起飞 → 次日09:08到达 · 全程16.5小时", "status": "confirmed", "dep": "2026-11-14T14:35:00-05:00", "depCity": "马尔多纳多港"}, {"id": "f6", "date": "2026-11-23", "route": "埃尔卡拉法特 FTE → 布宜诺斯艾利斯 AEP", "detail": "Aerolíneas Argentinas · 20:45 - 23:45 · Amex已预付,尚待补充电子票", "status": "pending", "dep": "2026-11-23T20:45:00-03:00", "depCity": "埃尔卡拉法特"}, {"id": "f7", "date": "2026-11-26", "route": "布宜诺斯艾利斯 AEP → 伊瓜苏 IGR", "detail": "JetSmart Airlines JA3140 · 06:10 - 08:03(1h53m)", "status": "confirmed", "dep": "2026-11-26T06:10:00-03:00", "depCity": "布宜诺斯艾利斯"}, {"id": "f8", "date": "2026-11-27", "route": "伊瓜苏 IGR → 布宜诺斯艾利斯 AEP", "detail": "JetSmart Airlines JA3151 · 22:18 - 次日00:19(2h1m)", "status": "confirmed", "dep": "2026-11-27T22:18:00-03:00", "depCity": "伊瓜苏"}, {"id": "f9", "date": "2026-11-28", "route": "布宜诺斯艾利斯 AEP → 圣地亚哥 SCL", "detail": "LATAM LA454 · 15:50 - 18:06 · 提前到机场,AEP海关窗口少速度慢", "status": "confirmed", "dep": "2026-11-28T15:50:00-03:00", "depCity": "布宜诺斯艾利斯"}, {"id": "f10", "date": "2026-11-29", "route": "圣地亚哥 SCL → 墨尔本 MEL(经停,弃乘后段悉尼)", "detail": "LATAM/Qantas · 01:30起飞 · 预计当地时间下午抵达墨尔本(以航司确认为准,状态:待航司确认)", "status": "pending", "dep": "2026-11-29T01:30:00-03:00", "depCity": "圣地亚哥"}], "stays": [{"city": "墨西哥城", "name": "Nuevo León 公寓(Jim)", "checkin": "2026-10-21", "checkout": "2026-10-23", "addr": "Avenida Nuevo León, Mexico City", "status": "confirmed", "region": "mx"}, {"city": "瓜纳华托", "name": "Casa Saucillo66", "checkin": "2026-10-23", "checkout": "2026-10-25", "addr": "Saucillo 66, Guanajuato", "status": "confirmed", "region": "mx"}, {"city": "圣米格尔德阿连德", "name": "Nuño", "checkin": "2026-10-25", "checkout": "2026-10-26", "addr": "Jaime Nuno, San Miguel de Allende", "status": "confirmed", "region": "mx"}, {"city": "墨西哥城", "name": "Nuevo León 公寓(Jim)", "checkin": "2026-10-26", "checkout": "2026-10-28", "addr": "Avenida Nuevo León, Mexico City", "status": "confirmed", "region": "mx"}, {"city": "瓦哈卡", "name": "Casa Rosa", "checkin": "2026-10-29", "checkout": "2026-10-31", "addr": "Manuel Sabino Crespo 300, Centro, Oaxaca", "status": "confirmed", "region": "mx"}, {"city": "瓦哈卡", "name": "Casa Ivonne", "checkin": "2026-10-31", "checkout": "2026-11-02", "addr": "Venustiano Carranza 806, Oaxaca", "status": "confirmed", "region": "mx"}, {"city": "墨西哥城", "name": "Nuevo León 公寓(Jim)", "checkin": "2026-11-03", "checkout": "2026-11-04", "addr": "Avenida Nuevo León, Mexico City", "status": "confirmed", "region": "mx"}, {"city": "库斯科", "name": "Lucrepata 公寓(景观studio)", "checkin": "2026-11-05", "checkout": "2026-11-09", "addr": "Urbanización Lucrepata F15, Cusco", "status": "confirmed", "region": "pe"}, {"city": "马丘比丘 / 热水镇", "name": "待预订", "checkin": "2026-11-08", "checkout": "2026-11-10", "addr": "Aguas Calientes", "status": "pending", "region": "pe"}, {"city": "库斯科", "name": "Casita Azul(San Blas)", "checkin": "2026-11-10", "checkout": "2026-11-12", "addr": "Atoqsaycuchi 605, San Blas, Cusco", "status": "confirmed", "region": "pe"}, {"city": "马尔多纳多港", "name": "Finca Sachavacayoc Lodge(Jungle Pro)", "checkin": "2026-11-12", "checkout": "2026-11-14", "addr": "Tambopata National Reserve, Madre de Dios", "status": "confirmed", "region": "pe"}, {"city": "纳塔莱斯港", "name": "Cosy Room 3", "checkin": "2026-11-15", "checkout": "2026-11-18", "addr": "Esmeralda 1435, Puerto Natales", "status": "confirmed", "region": "pt"}, {"city": "埃尔卡拉法特", "name": "Patagonia Wumul", "checkin": "2026-11-18", "checkout": "2026-11-20", "addr": "Cambaceres 246, El Calafate", "status": "confirmed", "region": "pt"}, {"city": "埃尔查尔滕", "name": "Terra Loft", "checkin": "2026-11-20", "checkout": "2026-11-23", "addr": "Avda costanera sur, El Chaltén", "status": "confirmed", "region": "pt"}, {"city": "布宜诺斯艾利斯", "name": "Palermo Soho Studio", "checkin": "2026-11-23", "checkout": "2026-11-26", "addr": "Paraguay 4818, Palermo, Buenos Aires", "status": "confirmed", "region": "ar"}, {"city": "伊瓜苏", "name": "Casa 24 Puerto Iguazú", "checkin": "2026-11-26", "checkout": "2026-11-27", "addr": "Misiones 24, Puerto Iguazú", "status": "confirmed", "region": "ar"}, {"city": "布宜诺斯艾利斯", "name": "Güemes 公寓(近La Rural)", "checkin": "2026-11-27", "checkout": "2026-11-28", "addr": "Güemes 4527, Buenos Aires", "status": "confirmed", "region": "ar"}], "days": [{"n": 1, "date": "2026-10-21", "city": "墨西哥城", "region": "mx", "title": "出发日 · 抵达墨西哥城", "items": [["11:00", "墨尔本起飞(MEL→LAX→MEX,经洛杉矶转机)", false], ["17:00", "抵达墨西哥城,出境", false], ["17:50", "机场换汇/取现", false], ["18:30", "打车到住处,放行李休息", false]], "transport": "国际航班 MEL–LAX–MEX(Delta/Aeromexico)", "stayRef": 0, "mapQuery": "Avenida Nuevo León, Mexico City", "tip": "出关后在机场先用Wise/现金换一点比索应急,再打车去住处。"}, {"n": 2, "date": "2026-10-22", "city": "墨西哥城", "region": "mx", "title": "老城地标 & 市场", "items": [["上午", "本地市场 city walk", false], ["下午", "宪法广场周边:国家宫、大神庙 Templo Mayor、主座教堂、艺术宫、国家美术馆", false], ["晚上", "Lucha Libre 摔跤表演(可选)", true]], "transport": null, "stayRef": 0, "mapQuery": "Zócalo, Mexico City", "stops": ["Palacio Nacional, Mexico City", "Templo Mayor Museum", "Catedral Metropolitana, Mexico City", "Palacio de Bellas Artes"], "tip": "摔跤表演门票建议当天上午在网上订。"}, {"n": 3, "date": "2026-10-23", "city": "瓜纳华托", "region": "mx", "title": "大巴前往瓜纳华托", "items": [["06:20", "墨西哥城北站 Terminal Norte 出发(Primera Plus / ETN)", true], ["11:05", "抵达瓜纳华托,入住 Casa Saucillo66", false], ["下午/晚上", "自由活动", false]], "transport": "长途大巴 墨西哥城Norte → 瓜纳华托(约4h45m)", "stayRef": 1, "mapQuery": "Guanajuato, Mexico", "tip": "大巴票官网提前买有折扣,亡灵节前后是旺季建议提前锁票。"}, {"n": 4, "date": "2026-10-24", "city": "瓜纳华托", "region": "mx", "title": "彩色小镇自由日", "items": [["全天", "瓜纳华托大教堂、瓜纳华托大学、接吻巷、剧院", false], ["傍晚", "皮皮拉山顶观景台看日夜全景", false]], "transport": null, "stayRef": 1, "mapQuery": "Monumento al Pípila, Guanajuato", "tip": "《寻梦环游记》取景地,巷子多台阶,建议穿好走的鞋。"}, {"n": 5, "date": "2026-10-25", "city": "圣米格尔德阿连德", "region": "mx", "title": "大巴前往圣米格尔", "items": [["07:10", "瓜纳华托出发(约1.5h车程)", true], ["08:30", "抵达圣米格尔,入住 Nuño", false], ["全天", "小镇漫步,粉色教堂 Parroquia de San Miguel Arcángel", false]], "transport": "长途大巴 瓜纳华托 → 圣米格尔", "stayRef": 2, "mapQuery": "Parroquia de San Miguel Arcángel", "tip": "半天可逛完,粉色教堂是打卡重点。"}, {"n": 6, "date": "2026-10-26", "city": "墨西哥城", "region": "mx", "title": "返回墨西哥城", "items": [["上午", "圣米格尔自由活动", false], ["16:30", "大巴返回墨西哥城北站", true], ["20:20", "抵达墨西哥城,入住老地方", false]], "transport": "长途大巴 圣米格尔 → 墨西哥城Norte", "stayRef": 3, "mapQuery": "Avenida Nuevo León, Mexico City", "tip": null}, {"n": 7, "date": "2026-10-27", "city": "墨西哥城", "region": "mx", "title": "特奥蒂瓦坎金字塔", "items": [["上午", "大巴前往特奥蒂瓦坎金字塔(建议10点前到,人少)", false], ["下午", "金字塔2号门出来坐大巴到Indios Verdes,转 Cablebús 缆车看彩色社区", false]], "transport": "大巴 Autobuses del Norte → 金字塔(约1h,每10分钟一班)", "stayRef": 3, "mapQuery": "Teotihuacan", "tip": "世界第三大金字塔,两千年古文明遗址,建议做好防晒。"}, {"n": 8, "date": "2026-10-28", "city": "墨西哥城", "region": "mx", "title": "CDMX 南区 & 夜巴去瓦哈卡", "items": [["清晨", "霍奇米尔科 Xochimilco 日出皮划艇", false], ["上午", "弗里达故居 Frida Kahlo 博物馆(蓝房子)", true], ["下午", "科约阿坎 Coyoacán 老城", false], ["23:59", "TAPO 汽车站坐夜巴前往瓦哈卡(ADO Platino)", true]], "transport": "夜巴 墨西哥城TAPO → 瓦哈卡(23:59–次日07:00)", "stayRef": null, "mapQuery": "Frida Kahlo Museum", "stops": ["Xochimilco, Mexico City", "Frida Kahlo Museum", "Coyoacán, Mexico City"], "tip": "⚠️ 弗里达故居周一闭馆(本次周三去没问题),票每天限量务必提前官网订;夜巴也建议提前订好座位。"}, {"n": 9, "date": "2026-10-29", "city": "瓦哈卡", "region": "mx", "title": "抵达瓦哈卡 · 亡灵节前奏", "items": [["07:00", "抵达瓦哈卡,入住 Casa Rosa", false], ["白天", "老城自由活动,感受亡灵节氛围", false]], "transport": null, "stayRef": 4, "mapQuery": "Centro, Oaxaca", "tip": "亡灵节(10.31–11.2)是瓦哈卡最热闹的时间,万寿菊会铺满全城。"}, {"n": 10, "date": "2026-10-30", "city": "瓦哈卡", "region": "mx", "title": "瓦哈卡自由日", "items": [["全天", "自由活动,老城闲逛", false]], "transport": null, "stayRef": 4, "mapQuery": "Centro, Oaxaca", "tip": null}, {"n": 11, "date": "2026-10-31", "city": "瓦哈卡", "region": "mx", "title": "亡灵节游行 D1", "items": [["早上", "退房,搬去 Casa Ivonne", false], ["上午/下午", "亡灵节游行(Comparsas)", false]], "transport": null, "stayRef": 5, "mapQuery": "Venustiano Carranza 806, Oaxaca", "tip": "⚠️ 亡灵节期间人潮拥挤,贵重物品注意保管。"}, {"n": 12, "date": "2026-11-01", "city": "瓦哈卡", "region": "mx", "title": "亡灵节 D2 · 墓园守夜", "items": [["白天", "亡灵节游行继续", false], ["晚上", "Xoxocotlán 墓园守夜(需要打车前往)", true]], "transport": null, "stayRef": 5, "mapQuery": "Panteón de Xoxocotlán", "tip": "⚠️ 墓园守夜人车都非常多,建议提前约好往返车辆,不要临时打车。"}, {"n": 13, "date": "2026-11-02", "city": "瓦哈卡", "region": "mx", "title": "夜巴返回墨西哥城", "items": [["白天", "退房,瓦哈卡自由活动", false], ["23:59", "ADO Platino 夜巴返回墨西哥城TAPO", true]], "transport": "夜巴 瓦哈卡 → 墨西哥城TAPO(23:59–次日07:00)", "stayRef": null, "mapQuery": "Oaxaca ADO bus station", "tip": "⚠️ 亡灵节假期结束返程票紧张,建议尽早锁票。"}, {"n": 14, "date": "2026-11-03", "city": "墨西哥城", "region": "mx", "title": "人类学博物馆", "items": [["07:00", "抵达墨西哥城,入住老地方放行李", false], ["09:00–17:00", "国立人类学博物馆(至少安排半天)", true], ["下午", "Roma Norte 城区漫步", false]], "transport": null, "stayRef": 6, "mapQuery": "Museo Nacional de Antropología", "tip": "周一闭馆,本次周二去没问题;馆藏丰富建议预留至少3小时。"}, {"n": 15, "date": "2026-11-04", "city": "墨西哥城", "region": "mx", "title": "飞往利马", "items": [["白天", "墨西哥城自由活动,收拾行李", false], ["19:00", "前往机场", false], ["22:00", "红眼航班飞利马(MEX→LIM)", false]], "transport": "国际航班 MEX→LIM(Volaris)· 22:00–次日04:55", "stayRef": null, "mapQuery": "Mexico City International Airport", "tip": null}, {"n": 16, "date": "2026-11-05", "city": "库斯科", "region": "pe", "title": "抵达库斯科", "items": [["04:55", "抵达利马", false], ["08:00", "转机飞库斯科(LIM→CUZ)", false], ["09:25", "抵达库斯科,入住", false], ["当天", "库斯科 city walk,顺路预订马丘比丘团", true]], "transport": "国内航班 LIM→CUZ(Sky Airline)", "stayRef": 7, "mapQuery": "Plaza de Armas, Cusco", "tip": "⚠️ 抵达高海拔城市(3400m),当天尽量慢走少剧烈活动,防高反。"}, {"n": 17, "date": "2026-11-06", "city": "库斯科", "region": "pe", "title": "萨克塞瓦曼 & 皮萨克", "items": [["上午", "城内 Sacsayhuamán 石头城遗迹(可选)", false], ["下午", "城外皮萨克 Pisac 小镇,灵修市集淘货", false]], "transport": null, "stayRef": 7, "mapQuery": "Pisac, Peru", "tip": null}, {"n": 18, "date": "2026-11-07", "city": "库斯科", "region": "pe", "title": "惠曼塔湖徒步", "items": [["全天", "Laguna Humantay 徒步(单程40min–1h,海拔约4200m)", false]], "transport": null, "stayRef": 7, "mapQuery": "Laguna Humantay", "tip": "⚠️ 高海拔徒步,提前吃高反药、带足水和防晒。"}, {"n": 19, "date": "2026-11-08", "city": "热水镇", "region": "pe", "title": "火车前往马丘比丘镇", "items": [["当天", "库斯科坐火车前往 Aguas Calientes(热水镇),入住", true]], "transport": "火车 库斯科 → 热水镇", "stayRef": 8, "mapQuery": "Aguas Calientes, Peru", "tip": "⚠️ 火车票 + 马丘比丘门票均需提前预订,建议现在就订。"}, {"n": 20, "date": "2026-11-09", "city": "马丘比丘", "region": "pe", "title": "马丘比丘 D1", "items": [["全天", "马丘比丘遗迹游览(local tour)", true]], "transport": null, "stayRef": 8, "mapQuery": "Machu Picchu", "tip": "⚠️ 门票+入园时段均限流,11月虽非最旺季但仍建议提前1-2个月订。"}, {"n": 21, "date": "2026-11-10", "city": "库斯科", "region": "pe", "title": "马丘比丘 D2 · 返回库斯科", "items": [["上午", "马丘比丘第二天游览/晨间日出", true], ["下午", "火车返回库斯科,入住 San Blas 公寓", false]], "transport": "火车 热水镇 → 库斯科", "stayRef": 9, "mapQuery": "San Blas, Cusco", "tip": null}, {"n": 22, "date": "2026-11-11", "city": "库斯科", "region": "pe", "title": "库斯科自由日", "items": [["全天", "City walk,收拾行李准备去雨林", false]], "transport": null, "stayRef": 9, "mapQuery": "San Blas, Cusco", "tip": null}, {"n": 23, "date": "2026-11-12", "city": "马尔多纳多港", "region": "pe", "title": "飞往亚马逊雨林", "items": [["10:05", "库斯科飞马尔多纳多港(CUZ→PEM)", false], ["11:10", "机场有JunglePro举牌接机,行李寄存办公室(只带雨林所需物品,避免拉杆箱)", false], ["下午/晚上", "Finca Sachavacayoc Lodge · 雨林徒步", false]], "transport": "国内航班 CUZ→PEM(Sky Airline)", "stayRef": 10, "mapQuery": "Puerto Maldonado, Peru", "tip": "Tambopata国家保护区,全程含餐+向导+船运,已确认预订。"}, {"n": 24, "date": "2026-11-13", "city": "马尔多纳多港", "region": "pe", "title": "雨林 D2", "items": [["04:00", "Clay Lick 看金刚鹦鹉", false], ["午餐", "雨林 lodge 用餐", false], ["下午", "Tres Chimbadas 湖(可选钓食人鱼)", false], ["晚上", "夜间丛林徒步", false]], "transport": null, "stayRef": 10, "mapQuery": "Puerto Maldonado, Peru", "tip": null}, {"n": 25, "date": "2026-11-14", "city": "纳塔莱斯港", "region": "pt", "title": "雨林 D3 · 飞往巴塔哥尼亚", "items": [["早上", "Canopy Walk 树冠walk,退还lodge装备", false], ["08:30", "离开lodge前往机场", false], ["14:35", "飞往纳塔莱斯港(经利马、圣地亚哥转机,全程16.5小时)", false]], "transport": "国际航班 PEM→LIM→SCL→PNT(LATAM)", "stayRef": null, "mapQuery": "Puerto Maldonado Airport", "tip": "⚠️ 全程16.5小时、跨3个国家两次转机,建议提前准备好转机文件和防寒衣物(南边天气骤降)。"}, {"n": 26, "date": "2026-11-15", "city": "纳塔莱斯港", "region": "pt", "title": "抵达纳塔莱斯港", "items": [["09:08", "抵达纳塔莱斯港,入住 Cosy Room 3", false], ["白天", "City walk,采购纪念品(Torres del Paine mágico 附近几家店值得逛)", false]], "transport": null, "stayRef": 11, "mapQuery": "Puerto Natales, Chile", "tip": null}, {"n": 27, "date": "2026-11-16", "city": "纳塔莱斯港", "region": "pt", "title": "牛角峰轻徒步", "items": [["07:00", "BusSur大巴前往百内公园Pudeto", true], ["全天", "牛角峰(Cuernos del Paine)+ Salto Grande瀑布轻徒步(往返8km,爬升150m,约3h)", false], ["14:30/19:30", "大巴返回纳塔莱斯港", false]], "transport": "BusSur 往返", "stayRef": 11, "mapQuery": "Salto Grande, Torres del Paine", "tip": "百内公园门票有效期3天,可以覆盖这两天徒步。⚠️ 旺季大巴建议提前订座。"}, {"n": 28, "date": "2026-11-17", "city": "纳塔莱斯港", "region": "pt", "title": "三塔峰大徒步", "items": [["07:00", "BusSur大巴前往 Laguna Amarga", true], ["全天", "Base Torres 三塔峰徒步(往返26km,爬升900m,全程约10小时)", false], ["20:00", "大巴返回纳塔莱斯港", false]], "transport": "BusSur 往返", "stayRef": 11, "mapQuery": "Mirador Las Torres", "tip": "⚠️ 全程10小时高强度徒步,务必早起、带足食水和保暖衣物。"}, {"n": 29, "date": "2026-11-18", "city": "埃尔卡拉法特", "region": "pt", "title": "跨境大巴前往卡拉法特", "items": [["07:00", "跨境大巴 纳塔莱斯港 → 埃尔卡拉法特(约6小时,含边境检查)", true], ["下午", "入住 Patagonia Wumul,Laguna Nimez 湿地看火烈鸟", false]], "transport": "跨境大巴(智利→阿根廷)", "stayRef": 12, "mapQuery": "Reserva Laguna Nimez", "tip": null}, {"n": 30, "date": "2026-11-19", "city": "埃尔卡拉法特", "region": "pt", "title": "莫雷诺冰川", "items": [["全天", "莫雷诺冰川:冰上徒步团 / 徒步+游船团 / 自驾三选一", true]], "transport": null, "stayRef": 12, "mapQuery": "Perito Moreno Glacier", "tip": "⚠️ 冰川国家公园门票 + 冰川团建议提前网上订,旺季名额有限。"}, {"n": 31, "date": "2026-11-20", "city": "埃尔查尔滕", "region": "pt", "title": "前往埃尔查尔滕", "items": [["08:00", "大巴前往埃尔查尔滕(约2.5h)", false], ["中午", "镇上吃饭,游客中心拿地图", false], ["下午", "短线徒步三选一:Mirador de los Cóndores / Cerro Paredón / Glaciar Huemul", false]], "transport": "大巴 埃尔卡拉法特 → 埃尔查尔滕", "stayRef": 13, "mapQuery": "El Chaltén, Argentina", "tip": null}, {"n": 32, "date": "2026-11-21", "city": "埃尔查尔滕", "region": "pt", "title": "菲茨罗伊三尖峰徒步", "items": [["全天", "Laguna de los Tres 徒步(往返25km,爬升1100m,用时9–11h)", false]], "transport": null, "stayRef": 13, "mapQuery": "Laguna de los Tres", "tip": "⚠️ 全程最重装徒步日,建议凌晨出发看日照金山。"}, {"n": 33, "date": "2026-11-22", "city": "埃尔查尔滕", "region": "pt", "title": "托雷峰徒步 或 漂流", "items": [["全天", "二选一:Laguna Torre 徒步(20km,8h)/ Las Vueltas 河漂流(3h,当地约更便宜)", false]], "transport": null, "stayRef": 13, "mapQuery": "Laguna Torre", "tip": null}, {"n": 34, "date": "2026-11-23", "city": "布宜诺斯艾利斯", "region": "ar", "title": "皮划艇 & 飞往BA", "items": [["清晨", "菲茨罗伊观景台日照金山", false], ["上午", "Laguna Condor 皮划艇(约20km)", false], ["17:00", "大巴返回埃尔卡拉法特机场", false], ["20:45", "飞往布宜诺斯艾利斯(FTE→AEP)", true]], "transport": "国内航班 FTE→AEP(待补充电子票)", "stayRef": 14, "mapQuery": "Palermo, Buenos Aires", "tip": "⚠️ 这段机票还没收到电子票,建议尽快补发确认信息。行李可提前存Paraguay 4591的We Luggage 或 Bounce。"}, {"n": 35, "date": "2026-11-24", "city": "布宜诺斯艾利斯", "region": "ar", "title": "经典地标 City Walk", "items": [["上午", "太平洋拱廊、五月广场、玫瑰宫总统府、科隆剧院(整点导览)", false], ["下午", "方尖碑、女人桥", false], ["晚饭", "Don Julio 牛排馆(帕勒莫,世界第一牛排馆)", true]], "transport": null, "stayRef": 14, "mapQuery": "Plaza de Mayo, Buenos Aires", "tip": "⚠️ Don Julio 一般要提前2周订位,建议尽快在App上蹲位。"}, {"n": 36, "date": "2026-11-25", "city": "布宜诺斯艾利斯", "region": "ar", "title": "帕勒莫 & 探戈之夜", "items": [["上午", "帕勒莫 Palermo 区漫步", false], ["下午", "San Telmo 市集", false], ["晚上", "探戈表演(推荐本地人常去的 Salón Marabú)", true]], "transport": null, "stayRef": 14, "mapQuery": "San Telmo, Buenos Aires", "tip": "BarSur需要提前预约且人均约120美金,Salón Marabú更本地、更便宜。"}, {"n": 37, "date": "2026-11-26", "city": "伊瓜苏", "region": "ar", "title": "伊瓜苏瀑布 · 巴西侧", "items": [["06:10", "飞往伊瓜苏(AEP→IGR,JetSmart JA3140)", false], ["09:00", "酒店寄存行李", false], ["09:30", "跨境大巴前往巴西侧国家公园(带护照)", true], ["10:45–14:15", "巴西侧栈道 + 魔鬼咽喉全景", false], ["14:30–17:30", "鸟园 Parque das Aves", false]], "transport": "跨境大巴(阿根廷→巴西)", "stayRef": 15, "mapQuery": "Parque Nacional do Iguaçu", "stops": ["Puerto Iguazú bus terminal", "Parque Nacional do Iguaçu", "Parque das Aves Foz do Iguaçu"], "tip": "⚠️ 过境记得带护照,上车前主动告知司机要过海关。"}, {"n": 38, "date": "2026-11-27", "city": "伊瓜苏", "region": "ar", "title": "伊瓜苏瀑布 · 阿根廷侧", "items": [["08:10", "国家公园开门,先坐生态小火车去魔鬼咽喉", false], ["10:15–11:30", "上层步道 Circuito Superior", false], ["12:45–15:00", "下层步道 Circuito Inferior", false], ["15:00", "快艇冲瀑布 Gran Aventura(可选)", true], ["17:30", "三国交界点 Hito Tres Fronteras", false], ["22:18", "飞回布宜诺斯艾利斯(IGR→AEP,JetSmart JA3151)", false]], "transport": "国内航班 IGR→AEP(JetSmart)", "stayRef": 16, "mapQuery": "Hito Tres Fronteras, Puerto Iguazú", "stops": ["Parque Nacional Iguazú Argentina", "Garganta del Diablo Iguazú", "Hito Tres Fronteras, Puerto Iguazú"], "tip": "快艇团建议当地官网 iguazujungle.com 提前订(9:00/10:15/11:30三个场次)。"}, {"n": 39, "date": "2026-11-28", "city": "布宜诺斯艾利斯", "region": "ar", "title": "雷科莱塔 & 飞往圣地亚哥", "items": [["上午", "雅典人书店、雷科莱塔墓地、周末手工市集", false], ["15:50", "飞往圣地亚哥(AEP→SCL)", false]], "transport": "国际航班 AEP→SCL(LATAM)", "stayRef": null, "mapQuery": "Recoleta Cemetery", "tip": "⚠️ AEP机场海关窗口少,建议提前2.5小时到机场。"}, {"n": 40, "date": "2026-11-29", "city": "回程", "region": "tr", "title": "飞回墨尔本", "items": [["01:30", "圣地亚哥起飞,经停后在墨尔本下机结束行程", false]], "transport": "国际航班 SCL→MEL(LATAM/Qantas,经停,弃乘后段悉尼)", "stayRef": null, "mapQuery": "Melbourne Airport", "tip": "⚠️ 计划在经停点墨尔本下机、放弃后段悉尼航段——这是隐藏城市票操作,托运行李默认挂到悉尼,建议尽量只带手提行李,并留意登机口是否有异常提示。"}], "events": [{"iso": "2026-10-21T11:00:00+11:00", "label": "✈️ 墨尔本 MEL → 洛杉矶 LAX → 墨西哥城 MEX", "city": "墨尔本", "mapQuery": null, "kind": "flight"}, {"iso": "2026-10-22T08:00:00-06:00", "label": "Day 2 · 老城地标 & 市场", "city": "墨西哥城", "mapQuery": "Zócalo, Mexico City", "kind": "day"}, {"iso": "2026-10-23T06:20:00-06:00", "label": "Day 3 · 大巴前往瓜纳华托", "city": "瓜纳华托", "mapQuery": "Guanajuato, Mexico", "kind": "day"}, {"iso": "2026-10-24T08:00:00-06:00", "label": "Day 4 · 彩色小镇自由日", "city": "瓜纳华托", "mapQuery": "Monumento al Pípila, Guanajuato", "kind": "day"}, {"iso": "2026-10-25T07:10:00-06:00", "label": "Day 5 · 大巴前往圣米格尔", "city": "圣米格尔德阿连德", "mapQuery": "Parroquia de San Miguel Arcángel", "kind": "day"}, {"iso": "2026-10-26T08:00:00-06:00", "label": "Day 6 · 返回墨西哥城", "city": "墨西哥城", "mapQuery": "Avenida Nuevo León, Mexico City", "kind": "day"}, {"iso": "2026-10-27T08:00:00-06:00", "label": "Day 7 · 特奥蒂瓦坎金字塔", "city": "墨西哥城", "mapQuery": "Teotihuacan", "kind": "day"}, {"iso": "2026-10-28T08:00:00-06:00", "label": "Day 8 · CDMX 南区 & 夜巴去瓦哈卡", "city": "墨西哥城", "mapQuery": "Frida Kahlo Museum", "kind": "day"}, {"iso": "2026-10-29T07:00:00-06:00", "label": "Day 9 · 抵达瓦哈卡 · 亡灵节前奏", "city": "瓦哈卡", "mapQuery": "Centro, Oaxaca", "kind": "day"}, {"iso": "2026-10-30T08:00:00-06:00", "label": "Day 10 · 瓦哈卡自由日", "city": "瓦哈卡", "mapQuery": "Centro, Oaxaca", "kind": "day"}, {"iso": "2026-10-31T08:00:00-06:00", "label": "Day 11 · 亡灵节游行 D1", "city": "瓦哈卡", "mapQuery": "Venustiano Carranza 806, Oaxaca", "kind": "day"}, {"iso": "2026-11-01T08:00:00-06:00", "label": "Day 12 · 亡灵节 D2 · 墓园守夜", "city": "瓦哈卡", "mapQuery": "Panteón de Xoxocotlán", "kind": "day"}, {"iso": "2026-11-02T08:00:00-06:00", "label": "Day 13 · 夜巴返回墨西哥城", "city": "瓦哈卡", "mapQuery": "Oaxaca ADO bus station", "kind": "day"}, {"iso": "2026-11-03T07:00:00-06:00", "label": "Day 14 · 人类学博物馆", "city": "墨西哥城", "mapQuery": "Museo Nacional de Antropología", "kind": "day"}, {"iso": "2026-11-04T08:00:00-06:00", "label": "Day 15 · 飞往利马", "city": "墨西哥城", "mapQuery": "Mexico City International Airport", "kind": "day"}, {"iso": "2026-11-04T22:00:00-06:00", "label": "✈️ 墨西哥城 MEX → 利马 LIM", "city": "墨西哥城", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-05T04:55:00-05:00", "label": "Day 16 · 抵达库斯科", "city": "库斯科", "mapQuery": "Plaza de Armas, Cusco", "kind": "day"}, {"iso": "2026-11-05T08:00:00-05:00", "label": "✈️ 利马 LIM → 库斯科 CUZ", "city": "利马", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-06T08:00:00-05:00", "label": "Day 17 · 萨克塞瓦曼 & 皮萨克", "city": "库斯科", "mapQuery": "Pisac, Peru", "kind": "day"}, {"iso": "2026-11-07T08:00:00-05:00", "label": "Day 18 · 惠曼塔湖徒步", "city": "库斯科", "mapQuery": "Laguna Humantay", "kind": "day"}, {"iso": "2026-11-08T08:00:00-05:00", "label": "Day 19 · 火车前往马丘比丘镇", "city": "热水镇", "mapQuery": "Aguas Calientes, Peru", "kind": "day"}, {"iso": "2026-11-09T08:00:00-05:00", "label": "Day 20 · 马丘比丘 D1", "city": "马丘比丘", "mapQuery": "Machu Picchu", "kind": "day"}, {"iso": "2026-11-10T08:00:00-05:00", "label": "Day 21 · 马丘比丘 D2 · 返回库斯科", "city": "库斯科", "mapQuery": "San Blas, Cusco", "kind": "day"}, {"iso": "2026-11-11T08:00:00-05:00", "label": "Day 22 · 库斯科自由日", "city": "库斯科", "mapQuery": "San Blas, Cusco", "kind": "day"}, {"iso": "2026-11-12T10:05:00-05:00", "label": "✈️ 库斯科 CUZ → 马尔多纳多港 PEM", "city": "库斯科", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-13T04:00:00-05:00", "label": "Day 24 · 雨林 D2", "city": "马尔多纳多港", "mapQuery": "Puerto Maldonado, Peru", "kind": "day"}, {"iso": "2026-11-14T08:00:00-03:00", "label": "Day 25 · 雨林 D3 · 飞往巴塔哥尼亚", "city": "纳塔莱斯港", "mapQuery": "Puerto Maldonado Airport", "kind": "day"}, {"iso": "2026-11-14T14:35:00-05:00", "label": "✈️ 马尔多纳多港 PEM → 纳塔莱斯港 PNT", "city": "马尔多纳多港", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-15T09:08:00-03:00", "label": "Day 26 · 抵达纳塔莱斯港", "city": "纳塔莱斯港", "mapQuery": "Puerto Natales, Chile", "kind": "day"}, {"iso": "2026-11-16T07:00:00-03:00", "label": "Day 27 · 牛角峰轻徒步", "city": "纳塔莱斯港", "mapQuery": "Salto Grande, Torres del Paine", "kind": "day"}, {"iso": "2026-11-17T07:00:00-03:00", "label": "Day 28 · 三塔峰大徒步", "city": "纳塔莱斯港", "mapQuery": "Mirador Las Torres", "kind": "day"}, {"iso": "2026-11-18T07:00:00-03:00", "label": "Day 29 · 跨境大巴前往卡拉法特", "city": "埃尔卡拉法特", "mapQuery": "Reserva Laguna Nimez", "kind": "day"}, {"iso": "2026-11-19T08:00:00-03:00", "label": "Day 30 · 莫雷诺冰川", "city": "埃尔卡拉法特", "mapQuery": "Perito Moreno Glacier", "kind": "day"}, {"iso": "2026-11-20T08:00:00-03:00", "label": "Day 31 · 前往埃尔查尔滕", "city": "埃尔查尔滕", "mapQuery": "El Chaltén, Argentina", "kind": "day"}, {"iso": "2026-11-21T08:00:00-03:00", "label": "Day 32 · 菲茨罗伊三尖峰徒步", "city": "埃尔查尔滕", "mapQuery": "Laguna de los Tres", "kind": "day"}, {"iso": "2026-11-22T08:00:00-03:00", "label": "Day 33 · 托雷峰徒步 或 漂流", "city": "埃尔查尔滕", "mapQuery": "Laguna Torre", "kind": "day"}, {"iso": "2026-11-23T08:00:00-03:00", "label": "Day 34 · 皮划艇 & 飞往BA", "city": "布宜诺斯艾利斯", "mapQuery": "Palermo, Buenos Aires", "kind": "day"}, {"iso": "2026-11-23T20:45:00-03:00", "label": "✈️ 埃尔卡拉法特 FTE → 布宜诺斯艾利斯 AEP", "city": "埃尔卡拉法特", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-24T08:00:00-03:00", "label": "Day 35 · 经典地标 City Walk", "city": "布宜诺斯艾利斯", "mapQuery": "Plaza de Mayo, Buenos Aires", "kind": "day"}, {"iso": "2026-11-25T08:00:00-03:00", "label": "Day 36 · 帕勒莫 & 探戈之夜", "city": "布宜诺斯艾利斯", "mapQuery": "San Telmo, Buenos Aires", "kind": "day"}, {"iso": "2026-11-26T06:10:00-03:00", "label": "✈️ 布宜诺斯艾利斯 AEP → 伊瓜苏 IGR", "city": "布宜诺斯艾利斯", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-27T08:10:00-03:00", "label": "Day 38 · 伊瓜苏瀑布 · 阿根廷侧", "city": "伊瓜苏", "mapQuery": "Hito Tres Fronteras, Puerto Iguazú", "kind": "day"}, {"iso": "2026-11-27T22:18:00-03:00", "label": "✈️ 伊瓜苏 IGR → 布宜诺斯艾利斯 AEP", "city": "伊瓜苏", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-28T08:00:00-03:00", "label": "Day 39 · 雷科莱塔 & 飞往圣地亚哥", "city": "布宜诺斯艾利斯", "mapQuery": "Recoleta Cemetery", "kind": "day"}, {"iso": "2026-11-28T15:50:00-03:00", "label": "✈️ 布宜诺斯艾利斯 AEP → 圣地亚哥 SCL", "city": "布宜诺斯艾利斯", "mapQuery": null, "kind": "flight"}, {"iso": "2026-11-29T01:30:00-03:00", "label": "✈️ 圣地亚哥 SCL → 墨尔本 MEL(经停,弃乘后段悉尼)", "city": "圣地亚哥", "mapQuery": null, "kind": "flight"}], "todos": [{"id": "t1", "text": "预订马丘比丘门票 + 进山小火车(11.8-9)", "urgent": true, "done": false}, {"id": "t2", "text": "预订/确认热水镇(Aguas Calientes)11.8-9住宿", "urgent": true, "done": false}, {"id": "t4", "text": "补充埃尔卡拉法特→BA机票电子票(11.23)", "urgent": true, "done": false}, {"id": "t6", "text": "预订瓦哈卡往返夜巴车票(10.28 & 11.2,ADO Platino)", "urgent": false, "done": false}, {"id": "t7", "text": "预订弗里达故居门票(10.28)", "urgent": false, "done": false}, {"id": "t8", "text": "预订百内国家公园 BusSur 车票(11.16 / 11.17)", "urgent": false, "done": false}, {"id": "t9", "text": "预订莫雷诺冰川团 或 租车(11.19)", "urgent": false, "done": false}, {"id": "t10", "text": "Don Julio 牛排馆订位(11.24,尽早蹲位)", "urgent": false, "done": false}, {"id": "t11", "text": "EVUS 更新(Iris)", "urgent": false, "done": false}, {"id": "t12", "text": "办好当地手机卡/eSIM", "urgent": false, "done": false}, {"id": "t13", "text": "备好高反药、肠胃炎药、Hydralyte", "urgent": false, "done": false}, {"id": "t14", "text": "准备当地现金(MXN / PEN / CLP / ARS)", "urgent": false, "done": false}, {"id": "t15", "text": "打印护照照片备份", "urgent": false, "done": false}, {"id": "t16", "text": "租车用的驾照国际翻译件(如需在埃尔卡拉法特自驾)", "urgent": false, "done": false}, {"id": "t17", "text": "快艇冲瀑布 Gran Aventura 提前订(iguazujungle.com)", "urgent": false, "done": false}]};
const REGION_COLOR = {
  mx:  {c:'var(--marigold)', hex:'#e0932c', name:'墨西哥'},
  pe:  {c:'var(--clay)',     hex:'#c1440e', name:'秘鲁'},
  pt:  {c:'var(--indigo)',   hex:'#35507a', name:'巴塔哥尼亚'},
  ar:  {c:'var(--agave)',    hex:'#4f7942', name:'阿根廷东部'},
  tr:  {c:'var(--transit)',  hex:'#8b7355', name:'转场/回程'}
};

/* ---------------- theme: 白天/黑夜自动切换（按设备当前时间） ---------------- */
function applyTheme(){
  const h = new Date().getHours();
  const night = (h < 7 || h >= 19);
  document.documentElement.setAttribute('data-theme', night ? 'night' : 'day');
}
applyTheme();
setInterval(applyTheme, 60000);

/* ---------------- 此刻关注：倒计时 ---------------- */
function pad(n){ return String(n).padStart(2,'0'); }
function renderCountdown(){
  const now = new Date();
  const next = DATA.events.find(e => new Date(e.iso) > now);
  if(!next){
    document.getElementById('heroCity').textContent = '旅程已结束';
    document.getElementById('heroTitle').textContent = '欢迎回家 👋';
    document.getElementById('countdown').style.display = 'none';
    return;
  }
  document.getElementById('heroCity').textContent = next.city + ' · 下一个行程';
  document.getElementById('heroTitle').innerHTML = '<b>' + next.label + '</b>';
  const diff = new Date(next.iso) - now;
  const d = Math.floor(diff/86400000);
  const h = Math.floor(diff%86400000/3600000);
  const m = Math.floor(diff%3600000/60000);
  const s = Math.floor(diff%60000/1000);
  document.getElementById('cd-d').textContent = d;
  document.getElementById('cd-h').textContent = pad(h);
  document.getElementById('cd-m').textContent = pad(m);
  document.getElementById('cd-s').textContent = pad(s);
}
renderCountdown();
setInterval(renderCountdown, 1000);

/* ---------------- 行程总览地图（手绘风 SVG，垂直路线） ---------------- */
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
function drawMap(){
  const nodes = [{label:'墨尔本', sub:'出发', region:'tr', nights:null, status:'confirmed'}]
    .concat(DATA.stays.map(s => ({label:s.city, sub:s.name, nights:daysBetween(s.checkin,s.checkout), region:s.region, status:s.status})))
    .concat([{label:'圣地亚哥 → 墨尔本', sub:'回程经停', region:'tr', nights:null, status:'pending'}]);

  const W = 320, rowH = 44, topPad = 20;
  const H = topPad*2 + rowH*(nodes.length-1);
  const cx = W/2, amp = 62;
  const pts = nodes.map((n,i) => ({
    x: cx + Math.sin(i*1.15)*amp,
    y: topPad + i*rowH,
    ...n
  }));

  let path = 'M ' + pts[0].x + ' ' + pts[0].y;
  let segHTML = '';
  for(let i=1;i<pts.length;i++){
    const p0=pts[i-1], p1=pts[i];
    const midY = (p0.y+p1.y)/2;
    const d = 'M '+p0.x+' '+p0.y+' C '+p0.x+' '+midY+' '+p1.x+' '+midY+' '+p1.x+' '+p1.y;
    segHTML += '<path d="'+d+'" fill="none" stroke="'+REGION_COLOR[p1.region].hex+'" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>';
  }

  let nodeHTML = '';
  pts.forEach((p,i) => {
    const side = Math.sin(i*1.15) >= 0 ? 1 : -1;
    const anchor = side>0 ? 'start' : 'end';
    const tx = p.x + side*10;
    const color = REGION_COLOR[p.region].hex;
    nodeHTML += '<circle cx="'+p.x+'" cy="'+p.y+'" r="4.2" fill="'+color+'" stroke="var(--bg)" stroke-width="1.6"/>';
    nodeHTML += '<text x="'+tx+'" y="'+(p.y-4)+'" text-anchor="'+anchor+'" font-size="6.4" fill="var(--ink)" font-weight="600" style="font-family:inherit">'+p.label+'</text>';
    if(p.sub){
      nodeHTML += '<text x="'+tx+'" y="'+(p.y+5.5)+'" text-anchor="'+anchor+'" font-size="4.8" fill="var(--ink-soft)">'+p.sub+(p.nights? '  · '+p.nights+'晚':'')+(p.status==='pending' ? '  ⚠待确认':'')+'</text>';
    }
  });

  const svg = document.getElementById('routeMap');
  svg.setAttribute('viewBox', '0 0 '+W+' '+H);
  svg.innerHTML = segHTML + nodeHTML;

  const legend = document.getElementById('mapLegend');
  legend.innerHTML = Object.entries(REGION_COLOR).map(([k,v]) =>
    '<span><i style="background:'+v.hex+'"></i>'+v.name+'</span>').join('');
}
drawMap();

/* ---------------- 已确认机票 / 住宿 ---------------- */
function renderFlights(){
  const el = document.getElementById('flightsList');
  el.innerHTML = DATA.flights.map(f => (
    '<div class="info-card"><div class="row1">'+
      '<div><div class="title">'+f.route+'</div><div class="detail">'+f.detail+'</div></div>'+
      '<span class="tag '+f.status+'">'+(f.status==='confirmed'?'已确认':'待补充')+'</span>'+
    '</div></div>'
  )).join('');
}
function renderStays(){
  const el = document.getElementById('staysList');
  el.innerHTML = DATA.stays.map(s => (
    '<div class="info-card"><div class="row1">'+
      '<div><div class="title">'+s.city+' · '+s.name+'</div>'+
      '<div class="detail">'+s.checkin+' → '+s.checkout+'  ·  <span class="place-link" data-q="'+encodeURIComponent(s.addr)+'">'+s.addr+'</span></div></div>'+
      '<span class="tag '+s.status+'">'+(s.status==='confirmed'?'已确认':'待补充')+'</span>'+
    '</div></div>'
  )).join('');
}
renderFlights(); renderStays();
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('flightsList').hidden = tab!=='flights';
    document.getElementById('staysList').hidden = tab!=='stays';
  });
});

/* ---------------- 逐日行程 ---------------- */
function mapsSearchUrl(q){ return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q); }
function mapsDirUrl(stops){
  if(!stops || !stops.length) return null;
  const dest = stops[stops.length-1];
  const waypoints = stops.slice(0,-1);
  let url = 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(dest)+'&travelmode=transit';
  if(waypoints.length) url += '&waypoints='+waypoints.map(encodeURIComponent).join('|');
  return url;
}
function findStay(ref){
  return (ref===null || ref===undefined) ? null : DATA.stays[ref];
}
function renderDays(){
  const el = document.getElementById('daysList');
  el.innerHTML = DATA.days.map((d,idx) => {
    const stay = findStay(d.stayRef);
    const itemsHTML = d.items.map(it => (
      '<div class="day-time">'+it[0]+'</div><div class="day-text">'+it[1]+(it[2]?'<span class="book-flag">⚠️ 提前订</span>':'')+'</div>'
    )).join('');
    const stops = d.stops && d.stops.length ? d.stops : [d.mapQuery];
    const dirUrl = mapsDirUrl(stops);
    const stayLine = stay ? ('<div class="day-meta"><b>住宿</b> '+stay.city+' · '+stay.name+'</div>') : '';
    const transLine = d.transport ? ('<div class="day-meta"><b>交通</b> '+d.transport+'</div>') : '';
    const tipHTML = d.tip ? ('<div class="day-tip">'+d.tip+'</div>') : '';
    const region = REGION_COLOR[d.region];
    return (
      '<div class="day-card" data-idx="'+idx+'">'+
        '<div class="day-head">'+
          '<div class="day-num">D'+d.n+'</div>'+
          '<div class="day-badge" style="background:'+region.hex+'"></div>'+
          '<div class="day-headline">'+
            '<div class="day-date">'+d.date+' · '+d.city+'</div>'+
            '<div class="day-title">'+d.title+'</div>'+
          '</div>'+
          '<div class="day-chev">›</div>'+
        '</div>'+
        '<div class="day-body">'+
          '<div class="day-items">'+itemsHTML+'</div>'+
          transLine + stayLine + tipHTML +
          '<div class="day-actions">'+
            '<a href="'+mapsSearchUrl(d.mapQuery)+'" target="_blank" rel="noopener">📍 查看地图</a>'+
            (dirUrl ? '<a href="'+dirUrl+'" target="_blank" rel="noopener">🧭 打开今日导航</a>' : '')+
          '</div>'+
        '</div>'+
      '</div>'
    );
  }).join('');

  el.querySelectorAll('.day-head').forEach(head => {
    head.addEventListener('click', () => head.closest('.day-card').classList.toggle('open'));
  });
}
renderDays();

/* ---------------- 待办清单（多端同步） ---------------- */
let todosState = DATA.todos;
async function loadTodos(){
  try{
    const res = await fetch('/api/todos');
    if(res.ok){ todosState = await res.json(); }
  }catch(e){ /* 离线时用内置初始数据 */ }
  renderTodos();
  renderHeroTodo();
}
async function toggleTodo(id){
  const t = todosState.find(x=>x.id===id);
  t.done = !t.done;
  renderTodos(); renderHeroTodo();
  try{
    const res = await fetch('/api/todos', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({id, done: t.done})
    });
    if(res.ok){ todosState = await res.json(); renderTodos(); renderHeroTodo(); }
  }catch(e){ document.getElementById('todoSyncNote').textContent = '⚠️ 当前离线，勾选暂未同步给对方'; }
}
function renderHeroTodo(){
  const next = todosState.find(t=>!t.done);
  document.getElementById('heroTodo').textContent = next ? next.text : '全部完成 🎉';
}
function renderTodos(){
  const el = document.getElementById('todoList');
  const sorted = [...todosState].sort((a,b) => (a.done - b.done) || (b.urgent - a.urgent));
  el.innerHTML = sorted.map(t => (
    '<div class="todo-item '+(t.done?'done':'')+'" data-id="'+t.id+'">'+
      '<div class="todo-check">'+(t.done?'✓':'')+'</div>'+
      '<div class="todo-text">'+t.text+'</div>'+
      (!t.done && t.urgent ? '<div class="todo-urgent">尽快</div>' : '')+
    '</div>'
  )).join('');
  el.querySelectorAll('.todo-item').forEach(item => {
    item.addEventListener('click', () => toggleTodo(item.dataset.id));
  });
  const done = todosState.filter(t=>t.done).length;
  document.getElementById('progressFill').style.width = (todosState.length? done/todosState.length*100 : 0)+'%';
  document.getElementById('progressLabel').textContent = done+' / '+todosState.length;
}
loadTodos();
setInterval(loadTodos, 20000);

/* ---------------- 地址点击唤起地图 ---------------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('.place-link');
  if(t){ window.open(mapsSearchUrl(decodeURIComponent(t.dataset.q)), '_blank'); }
});
</script>
</body>
</html>

`;

const DEFAULT_TODOS = [
 {
  "id": "t1",
  "text": "预订马丘比丘门票 + 进山小火车(11.8-9)",
  "urgent": true,
  "done": false
 },
 {
  "id": "t2",
  "text": "预订/确认热水镇(Aguas Calientes)11.8-9住宿",
  "urgent": true,
  "done": false
 },
 {
  "id": "t4",
  "text": "补充埃尔卡拉法特→BA机票电子票(11.23)",
  "urgent": true,
  "done": false
 },
 {
  "id": "t6",
  "text": "预订瓦哈卡往返夜巴车票(10.28 & 11.2,ADO Platino)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t7",
  "text": "预订弗里达故居门票(10.28)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t8",
  "text": "预订百内国家公园 BusSur 车票(11.16 / 11.17)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t9",
  "text": "预订莫雷诺冰川团 或 租车(11.19)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t10",
  "text": "Don Julio 牛排馆订位(11.24,尽早蹲位)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t11",
  "text": "EVUS 更新(Iris)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t12",
  "text": "办好当地手机卡/eSIM",
  "urgent": false,
  "done": false
 },
 {
  "id": "t13",
  "text": "备好高反药、肠胃炎药、Hydralyte",
  "urgent": false,
  "done": false
 },
 {
  "id": "t14",
  "text": "准备当地现金(MXN / PEN / CLP / ARS)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t15",
  "text": "打印护照照片备份",
  "urgent": false,
  "done": false
 },
 {
  "id": "t16",
  "text": "租车用的驾照国际翻译件(如需在埃尔卡拉法特自驾)",
  "urgent": false,
  "done": false
 },
 {
  "id": "t17",
  "text": "快艇冲瀑布 Gran Aventura 提前订(iguazujungle.com)",
  "urgent": false,
  "done": false
 }
];

function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init && init.headers) }
  });
}

async function readTodos(env) {
  if (!env.TRIP_KV) return DEFAULT_TODOS;
  const stored = await env.TRIP_KV.get('todos', 'json');
  if (stored) return stored;
  await env.TRIP_KV.put('todos', JSON.stringify(DEFAULT_TODOS));
  return DEFAULT_TODOS;
}

async function writeTodoUpdate(env, id, done) {
  const list = await readTodos(env);
  const next = list.map(t => (t.id === id ? { ...t, done: !!done } : t));
  if (env.TRIP_KV) await env.TRIP_KV.put('todos', JSON.stringify(next));
  return next;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/todos' && request.method === 'GET') {
      return json(await readTodos(env));
    }

    if (url.pathname === '/api/todos' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, { status: 400 }); }
      if (!body || typeof body.id !== 'string') return json({ error: 'missing id' }, { status: 400 });
      const updated = await writeTodoUpdate(env, body.id, body.done);
      return json(updated);
    }

    if (url.pathname === '/api/todos/reset' && request.method === 'POST') {
      if (env.TRIP_KV) await env.TRIP_KV.put('todos', JSON.stringify(DEFAULT_TODOS));
      return json(DEFAULT_TODOS);
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(PAGE_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    return new Response('Not found', { status: 404 });
  }
};
