import pymysql

# 数据库配置
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_password",
    "database": "dongguan_assistant",
    "charset": "utf8mb4"
}

def import_data():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # 建表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS poi_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content TEXT
        )
    """)

    # 读取文件并写入
    with open("dongguan_poi_data.txt", "r", encoding="utf-8") as f:
        lines = f.readlines()

    print(f"准备将 {len(lines)} 条数据写入数据库...")
    for line in lines:
        if line.strip():
            cursor.execute("INSERT INTO poi_data (content) VALUES (%s)", (line.strip(),))

    conn.commit()
    cursor.close()
    conn.close()
    print("数据导入完成！")

if __name__ == "__main__":
    import_data()