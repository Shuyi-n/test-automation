package com.cn.mvc.shop_mvc.flink;

import org.apache.flink.configuration.Configuration;
import org.apache.flink.configuration.RestOptions;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.table.api.StatementSet;

// 实时订单链路分析任务 - by Shuyi
public class OrderRealTimeAnalysis {

    private static final String KAFKA_SERVERS = "localhost:9092";
    private static final String KAFKA_TOPIC   = "realtime_order";
    private static final String MYSQL_USER    = "root";
    private static final String MYSQL_PASS    = "123456";
    private static final String MYSQL_URL     =
            "jdbc:mysql://localhost:3306/realtime_dw?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8&allowPublicKeyRetrieval=true";

    private static String jdbc(String t) {
        return "  'connector' = 'jdbc',"
                + "  'url' = '" + MYSQL_URL + "',"
                + "  'username' = '" + MYSQL_USER + "',"
                + "  'password' = '" + MYSQL_PASS + "',"
                + "  'table-name' = '" + t + "',"
                + "  'sink.buffer-flush.max-rows' = '1',"
                + "  'sink.buffer-flush.interval' = '1s',"
                + "  'sink.max-retries' = '3'";
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        conf.setString(RestOptions.BIND_PORT, "8081");
        StreamExecutionEnvironment env = StreamExecutionEnvironment.createLocalEnvironmentWithWebUI(conf);
        env.setParallelism(1);

        StreamTableEnvironment tEnv = StreamTableEnvironment.create(env);
        tEnv.getConfig().set("table.optimizer.reuse-source.enabled", "false");
        tEnv.getConfig().set("table.optimizer.reuse-sub-plan.enabled", "false");

        // 定义 Kafka Source 表
        tEnv.executeSql(
                "CREATE TABLE kafka_order ("
                        + "  order_id STRING, global_user_id STRING, platform STRING, platform_name STRING,"
                        + "  order_time STRING, payment_time STRING, payment_method STRING,"
                        + "  shipping_address STRING, order_status STRING,"
                        + "  total_amount DOUBLE, discount_amount DOUBLE, shipping_fee DOUBLE, tax_amount DOUBLE,"
                        + "  promotion_id STRING, coupon_code STRING, shipping_method STRING,"
                        + "  user_name STRING, user_gender STRING, user_age STRING, user_age_group STRING,"
                        + "  user_city STRING, user_level STRING, user_email STRING,"
                        + "  product_category STRING, product_subcategory STRING, product_brand STRING, product_name STRING,"
                        + "  item_quantity INT,"
                        + "  view_count INT, cart_count INT, fav_count INT, order_count INT, pay_count INT, review_count INT, share_count INT,"
                        + "  proc_time AS PROCTIME()"
                        + ") WITH ("
                        + "  'connector' = 'kafka',"
                        + "  'topic' = '" + KAFKA_TOPIC + "',"
                        + "  'properties.bootstrap.servers' = '" + KAFKA_SERVERS + "',"
                        + "  'properties.group.id' = 'flink-realtime-final-v14',"
                        + "  'scan.startup.mode' = 'latest-offset',"
                        + "  'format' = 'json',"
                        + "  'json.fail-on-missing-field' = 'false',"
                        + "  'json.ignore-parse-errors' = 'false'"
                        + ")"
        );

        StatementSet stmt = tEnv.createStatementSet();

        // 定义 8 张 MySQL Sink 表
        tEnv.executeSql("CREATE TABLE ads_user_gender (stat_time TIMESTAMP(3), gender STRING, order_cnt INT, gmv DOUBLE, avg_amount DOUBLE, PRIMARY KEY (stat_time, gender) NOT ENFORCED) WITH (" + jdbc("ads_user_gender") + ")");
        tEnv.executeSql("CREATE TABLE ads_user_age (stat_time TIMESTAMP(3), age_group STRING, order_cnt INT, gmv DOUBLE, avg_amount DOUBLE, PRIMARY KEY (stat_time, age_group) NOT ENFORCED) WITH (" + jdbc("ads_user_age") + ")");
        tEnv.executeSql("CREATE TABLE ads_user_level (stat_time TIMESTAMP(3), user_level STRING, order_cnt INT, gmv DOUBLE, avg_amount DOUBLE, PRIMARY KEY (stat_time, user_level) NOT ENFORCED) WITH (" + jdbc("ads_user_level") + ")");
        tEnv.executeSql("CREATE TABLE ads_user_city (stat_time TIMESTAMP(3), city STRING, order_cnt INT, gmv DOUBLE, PRIMARY KEY (stat_time, city) NOT ENFORCED) WITH (" + jdbc("ads_user_city") + ")");
        tEnv.executeSql("CREATE TABLE ads_product_category (stat_time TIMESTAMP(3), category STRING, order_cnt INT, gmv DOUBLE, avg_amount DOUBLE, PRIMARY KEY (stat_time, category) NOT ENFORCED) WITH (" + jdbc("ads_product_category") + ")");
        tEnv.executeSql("CREATE TABLE ads_product_brand (stat_time TIMESTAMP(3), brand STRING, order_cnt INT, gmv DOUBLE, avg_amount DOUBLE, PRIMARY KEY (stat_time, brand) NOT ENFORCED) WITH (" + jdbc("ads_product_brand") + ")");
        tEnv.executeSql("CREATE TABLE ads_behavior_funnel (stat_time TIMESTAMP(3), behavior_stage STRING, user_cnt INT, PRIMARY KEY (stat_time, behavior_stage) NOT ENFORCED) WITH (" + jdbc("ads_behavior_funnel") + ")");
        tEnv.executeSql("CREATE TABLE ads_platform_name_cmp (stat_time TIMESTAMP(3), platform_name STRING, order_cnt INT, gmv DOUBLE, avg_amount DOUBLE, PRIMARY KEY (stat_time, platform_name) NOT ENFORCED) WITH (" + jdbc("ads_platform_name_cmp") + ")");

        // 指标计算逻辑
        String paid = "order_status IN ('已付款','已发货','已完成')";
        String gmv  = "SUM(CASE WHEN " + paid + " THEN total_amount ELSE 0 END)";
        String cnt  = "CAST(SUM(CASE WHEN " + paid + " THEN 1 ELSE 0 END) AS INT)";
        String avg  = "CASE WHEN " + cnt + " > 0 THEN " + gmv + " / " + cnt + " ELSE 0 END";
        String tw   = "TUMBLE_START(proc_time, INTERVAL '2' SECOND)";
        String win  = "TUMBLE(proc_time, INTERVAL '2' SECOND)";

        // 7路维度指标 Insert
        stmt.addInsertSql("INSERT INTO ads_user_gender SELECT " + tw + ", CASE WHEN user_gender IS NULL OR user_gender='' THEN '未知' ELSE user_gender END, " + cnt + ", " + gmv + ", " + avg + " FROM kafka_order GROUP BY CASE WHEN user_gender IS NULL OR user_gender='' THEN '未知' ELSE user_gender END, " + win);
        stmt.addInsertSql("INSERT INTO ads_user_age SELECT " + tw + ", CASE WHEN user_age_group IS NULL OR user_age_group='' THEN '未知' ELSE user_age_group END, " + cnt + ", " + gmv + ", " + avg + " FROM kafka_order GROUP BY CASE WHEN user_age_group IS NULL OR user_age_group='' THEN '未知' ELSE user_age_group END, " + win);
        stmt.addInsertSql("INSERT INTO ads_user_level SELECT " + tw + ", CASE WHEN user_level IS NULL OR user_level='' THEN '未知' ELSE user_level END, " + cnt + ", " + gmv + ", " + avg + " FROM kafka_order GROUP BY CASE WHEN user_level IS NULL OR user_level='' THEN '未知' ELSE user_level END, " + win);
        stmt.addInsertSql("INSERT INTO ads_user_city SELECT " + tw + ", CASE WHEN user_city IS NULL OR user_city='' THEN '未知' ELSE user_city END, " + cnt + ", " + gmv + " FROM kafka_order GROUP BY CASE WHEN user_city IS NULL OR user_city='' THEN '未知' ELSE user_city END, " + win);
        stmt.addInsertSql("INSERT INTO ads_product_category SELECT " + tw + ", CASE WHEN product_category IS NULL OR product_category='' THEN '未知' ELSE product_category END, " + cnt + ", " + gmv + ", " + avg + " FROM kafka_order GROUP BY CASE WHEN product_category IS NULL OR product_category='' THEN '未知' ELSE product_category END, " + win);
        stmt.addInsertSql("INSERT INTO ads_product_brand SELECT " + tw + ", CASE WHEN product_brand IS NULL OR product_brand='' THEN '未知' ELSE product_brand END, " + cnt + ", " + gmv + ", " + avg + " FROM kafka_order GROUP BY CASE WHEN product_brand IS NULL OR product_brand='' THEN '未知' ELSE product_brand END, " + win);
        stmt.addInsertSql("INSERT INTO ads_platform_name_cmp SELECT " + tw + ", CASE WHEN platform_name IS NULL OR platform_name='' THEN '未知' ELSE platform_name END, " + cnt + ", " + gmv + ", " + avg + " FROM kafka_order GROUP BY CASE WHEN platform_name IS NULL OR platform_name='' THEN '未知' ELSE platform_name END, " + win);

        // 漏斗行为 Insert
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '浏览', CAST(COUNT(DISTINCT CASE WHEN view_count   > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '加购', CAST(COUNT(DISTINCT CASE WHEN cart_count   > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '收藏', CAST(COUNT(DISTINCT CASE WHEN fav_count    > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '下单', CAST(COUNT(DISTINCT CASE WHEN order_count  > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '支付', CAST(COUNT(DISTINCT CASE WHEN pay_count    > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '评价', CAST(COUNT(DISTINCT CASE WHEN review_count > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);
        stmt.addInsertSql("INSERT INTO ads_behavior_funnel SELECT " + tw + ", '分享', CAST(COUNT(DISTINCT CASE WHEN share_count  > 0 THEN global_user_id END) AS INT) FROM kafka_order GROUP BY " + win);

        stmt.execute().await();
    }
}