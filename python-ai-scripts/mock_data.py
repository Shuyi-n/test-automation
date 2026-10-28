import pymysql
import random
from datetime import datetime, timedelta
import string

DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_password",
    "database": "dongguan_assistant",
    "charset": "utf8mb4",
    "connect_timeout": 5
}

print("连接数据库...")
try:
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("数据库连接成功，开始生成数据...")
except Exception as e:
    print(f"数据库连接失败: {e}")
    exit()

# 生成 Mock 微信 openid
open_ids = ["o" + "".join(random.choices(string.ascii_letters + string.digits + "-_", k=27)) for _ in range(100)]

districts = ["南城", "东城", "长安", "虎门", "松山湖", "大岭山", "厚街", "常平", "寮步", "万江"]
foods = ["烧鹅", "早茶", "奶茶", "火锅", "烧烤", "咖啡", "快餐"]
scenics = ["公园", "景点", "商场", "图书馆", "电影院"]

real_restaurants = ["国贸城的海底捞", "汇一城的探鱼", "东城万达的木屋烧烤", "厚街的点都德", "南城的第一国际星巴克", "常平的农家烧鹅店"]
real_parks = ["旗峰公园", "水濂山森林公园", "同沙生态公园", "大岭山森林公园", "松山湖风景区", "观音山"]
real_malls = ["民盈·国贸城", "东城万达广场", "南城汇一城", "长安万科广场", "虎门地标广场"]

def generate_single_record():
    district = random.choice(districts)
    choice_type = random.randint(1, 10)
    
    if choice_type <= 4:
        food = random.choice(foods)
        query = random.choice([f"{district}有什么好吃的{food}？", f"推荐一下{district}的{food}店", f"想吃{food}，{district}哪里好？"])
        sentiment = random.randint(1, 3)
        if sentiment == 1: 
            reply = f"强烈推荐{district}的{random.choice(real_restaurants)}，味道很正，周末去记得提前排号！"
        elif sentiment == 2: 
            reply = f"{district}那家新开的{food}店感觉一般，性价比不高，不如去吃老字号。"
        else: 
            reply = f"千万别去{district}商场里那家网红{food}店，排队两小时，味道很一般，避雷！"
        intent = "美食"

    elif choice_type <= 6:
        scenic = random.choice(scenics)
        query = random.choice([f"{district}的{scenic}怎么走？", f"{district}哪里好玩？求推荐", f"{scenic}要门票吗？"])
        if scenic == "公园":
            reply = f"可以去{district}附近的{random.choice(real_parks)}，环境优美，适合周末带孩子去露营。"
        elif scenic == "商场":
            reply = f"推荐去{random.choice(real_malls)}，吃喝玩乐都有，地铁也能直达。"
        else:
            reply = f"{district}的{scenic}周末人比较多，建议您错峰出行。"
        intent = "景点"

    elif choice_type <= 8:
        query = random.choice([f"{district}政务中心几点下班？", f"办身份证要带什么材料？", f"社保卡丢了怎么补办？", f"办居住证需要什么条件？"])
        reply = f"您可以去{district}镇政务服务中心办理，记得带上身份证原件，建议提前在公众号预约。"
        intent = "办事点"

    else:
        query = random.choice(["你好呀", "你是谁？", "今天天气怎么样？", "谢谢你的帮助", "这系统不好用啊", "大岭山有什么奶茶"])
        if "天气" in query:
            reply = "抱歉，目前暂不支持实时天气查询哦，出门记得带伞~"
        elif "谢谢" in query:
            reply = "不客气！我是东莞便民小助手，有问题随时找我。"
        elif "不好用" in query:
            reply = "非常抱歉给您带来不好的体验，我们会继续优化系统。"
        else:
            reply = "您好！我是东莞便民小助手，请问有什么可以帮您？"
        intent = "闲聊"

    return query, intent, reply


print("正在生成 5000 条 Mock 数据并写入...")
total_rows = 5000
for i in range(total_rows):
    open_id = random.choice(open_ids)
    user_query, intent, bot_response = generate_single_record()
    
    chat_time = datetime.now() - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23), minutes=random.randint(0, 59))
    sql = "INSERT INTO chat_logs (open_id, user_query, intent, bot_response, create_time) VALUES (%s, %s, %s, %s, %s)"
    cursor.execute(sql, (open_id, user_query, intent, bot_response, chat_time))

try:
    conn.commit()
    print(f"成功插入 {total_rows} 条数据。")
except Exception as e:
    print(f"数据写入失败: {e}")

cursor.close()
conn.close()