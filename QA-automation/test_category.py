import pymysql
import pytest

DB_CONFIG = {
    "host": "localhost", "port": 3306, "user": "root",
    "password": "123456", "database": "realtime_dw", "charset": "utf8mb4"
}

@pytest.fixture(scope="module")
def db_conn():
    conn = pymysql.connect(**DB_CONFIG)
    yield conn
    conn.close()

# 核心一：自动发现所有以 ads_ 开头的表
def get_all_ads_tables(conn):
    cursor = conn.cursor()
    # 查系统的元数据字典表，找出所有以 ads_ 开头的数据看板表
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name LIKE 'ads_%'
    """)
    tables = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return tables

# 核心二：遍历这些表，自动跑断言校验
def test_auto_discover_all_dimensions(db_conn):
    # 1. 自动获取要测的表名列表
    table_list = get_all_ads_tables(db_conn)
    
    assert len(table_list) > 0, "没找到任何 ads_ 开头的表！"
    print(f"\n[自动发现] 发现以下数据表：{table_list}")
    
    cursor = db_conn.cursor()
    
    # 2. 循环遍历每一张表进行业务校验
    for table_name in table_list:
        print(f"\n[开始测试] 正在校验表：{table_name}")
        
        # 假设所有这些表都有 order_cnt, gmv, avg_amount 这三个字段
        try:
            cursor.execute(f"SELECT order_cnt, gmv, avg_amount FROM {table_name}")
            results = cursor.fetchall()
        except Exception as e:
            print(f"[跳过] {table_name} 表结构不匹配: {e}")
            continue

        for row in results:
            order_cnt, gmv, avg_amount = row[0], row[1], row[2]
            
            # 断言1：GMV 不能是负数
            assert gmv >= 0, f"【发现Bug】{table_name} 中 GMV 为负数！"
            
            # 断言2：防范 Infinity（除数为0）
            if order_cnt == 0:
                assert avg_amount != float('inf'), f"【致命Bug】{table_name} 出现 Infinity！"
            
            # 断言3：容差校验（防精度丢失）
            else:
                expected_avg = round(gmv / order_cnt, 2)
                actual_avg = round(avg_amount, 2)
                assert abs(actual_avg - expected_avg) <= 0.01, f"【发现Bug】{table_name} 客单价算错！"
                
        print(f"[完成] {table_name} 校验通过！")
    cursor.close()