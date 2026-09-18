// Pages Functions：待办清单的多端同步接口
// 路径 functions/api/todos.js 会自动对应到网址 /api/todos
// 数据存在 KV 命名空间里，绑定变量名必须是 TRIP_KV

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
  "id": "t18",
  "text": "FTE→BA航班(11.23)按需加购托运行李额",
  "urgent": false,
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

export async function onRequestGet(context) {
  return json(await readTodos(context.env));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, { status: 400 }); }
  if (!body || typeof body.id !== 'string') return json({ error: 'missing id' }, { status: 400 });
  const list = await readTodos(env);
  const next = list.map(t => (t.id === body.id ? { ...t, done: !!body.done } : t));
  if (env.TRIP_KV) await env.TRIP_KV.put('todos', JSON.stringify(next));
  return json(next);
}
