import requests
import time
import re

# 高德 API 配置 
AMAP_KEY = "your_amap_api_key_here"
CITY = "东莞"
OUTPUT_FILE = "dongguan_poi_data.txt"

# 搜索任务配置
SEARCH_TASKS = [
    {"kw": "美食", "tag": "美食"},
    {"kw": "烧鹅", "tag": "美食/烧鹅"},
    {"kw": "早茶", "tag": "美食/早茶"},
    {"kw": "奶茶", "tag": "美食/奶茶"},
    {"kw": "景点", "tag": "景点"},
    {"kw": "公园", "tag": "景点/公园"},
    {"kw": "政务服务中心", "tag": "办事点/政务大厅"},
    {"kw": "派出所", "tag": "办事点/派出所"},
    {"kw": "医院", "tag": "办事点/医院"},
    {"kw": "药店", "tag": "办事点/药店"},
    {"kw": "高铁站", "tag": "交通/高铁站"},
    {"kw": "地铁站", "tag": "交通/地铁站"},
    {"kw": "超市", "tag": "购物/超市"},
    {"kw": "美宜佳", "tag": "购物/便利店"},
    {"kw": "公共厕所", "tag": "便民/公共厕所"},
    {"kw": "停车场", "tag": "便民/停车场"},
    {"kw": "充电站", "tag": "便民/充电站"},
    {"kw": "加油站", "tag": "便民/加油站"},
    {"kw": "银行", "tag": "便民/银行"},
    {"kw": "电影院", "tag": "休闲/电影院"},
    {"kw": "酒店", "tag": "休闲/酒店"}
]

DISTRICTS = ["南城", "东城", "长安", "虎门", "松山湖", "厚街", "常平", "寮步", "万江", "大岭山", "莞城", "石碣", "高埗", "石龙", "麻涌"]

def crawl_all():
    TARGET_COUNT = 3000
    print(f"开始抓取数据，目标: {TARGET_COUNT} 条")
    
    final_texts = []
    seen_places = set()

    for district in DISTRICTS:
        for task in SEARCH_TASKS:
            kw = f"{district} {task['kw']}"
            tag = task["tag"]
            print(f"抓取: {tag} - 搜索词: {kw}")
            
            for page in range(1, 11):
                url = f"https://restapi.amap.com/v3/place/text?keywords={kw}&city={CITY}&offset=25&page={page}&extensions=all&key={AMAP_KEY}"
                try:
                    res = requests.get(url, timeout=10).json()
                    if res.get("status") == "1" and res.get("pois"):
                        for poi in res["pois"]:
                            name = poi.get("name", "")
                            address = poi.get("address", "")
                            if not isinstance(address, str): address = ""
                            tel = poi.get("tel", "")
                            if not isinstance(tel, str): tel = ""
                            
                            biz_ext = poi.get("biz_ext", {})
                            rating = biz_ext.get("rating", "")
                            cost = biz_ext.get("cost", "")
                            open_time = biz_ext.get("open_time", "") or biz_ext.get("opentime2", "")
                            
                            if "暂停营业" not in name:
                                unique_key = f"{name}_{address}"
                                if unique_key in seen_places: continue
                                seen_places.add(unique_key)
                                
                                text = f"【{tag}】{name}，位于东莞市{address}。"
                                if tel: text += f"联系电话：{tel}。"
                                if open_time: text += f"营业时间：{open_time}。"
                                if rating: text += f"评分：{rating}分。"
                                if cost: text += f"人均消费：{cost}元。"
                                text += f"特色：{tag}。"
                                
                                text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
                                final_texts.append(text + "\n")
                                
                        if len(res["pois"]) < 25:
                            break
                    else:
                        break 
                except Exception as e:
                    pass
                
                time.sleep(0.8) # 防止触发限流
            
            # 达到目标条数直接结束
            if len(final_texts) >= TARGET_COUNT:
                print(f"已达到 {TARGET_COUNT} 条目标，提前结束。")
                break
        
        if len(final_texts) >= TARGET_COUNT:
            break

    final_texts = final_texts[:TARGET_COUNT]

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.writelines(final_texts)
        
    print(f"抓取完成，共 {len(final_texts)} 条数据，已保存至 {OUTPUT_FILE}")

if __name__ == "__main__":
    crawl_all()