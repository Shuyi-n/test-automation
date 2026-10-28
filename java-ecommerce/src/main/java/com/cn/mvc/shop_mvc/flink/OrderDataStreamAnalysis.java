package com.cn.mvc.shop_mvc.flink;

import com.google.gson.Gson;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.java.tuple.Tuple4;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcExecutionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.windowing.AllWindowFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.util.Collector;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;
import java.util.Properties;

public class OrderDataStreamAnalysis {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(1);

        // 1. Kafka 配置
        Properties props = new Properties();
        // 【需要修改】换成你虚拟机的真实 IP
        props.setProperty("bootstrap.servers", "192.168.81.130:9092");
        props.setProperty("group.id", "flink_group_3");
        props.setProperty("auto.offset.reset", "latest");

        FlinkKafkaConsumer<String> consumer = new FlinkKafkaConsumer<>(
                "order_topic_2", new SimpleStringSchema(), props);

        DataStream<String> stream = env.addSource(consumer);


        // 2. 解析 JSON
        DataStream<Map<String, Object>> orderStream = stream.map(new MapFunction<String, Map<String, Object>>() {
            @Override
            public Map<String, Object> map(String value) throws Exception {
                value = value.replace("\uFEFF", "");
                Gson gson = new Gson();
                return gson.fromJson(value, Map.class);
            }
        });

        // 3. MySQL 连接信息
        String mysqlUrl = "jdbc:mysql://192.168.81.130:3306/realtime_dw?useSSL=false&serverTimezone=Asia/Shanghai";
        String mysqlUser = "root";
        // 【需要修改】改成你的 MariaDB 密码
        String mysqlPassword = "123456";

        // ================== 维度一：GMV ==================
        DataStream<Tuple4<String, String, Double, Integer>> gmvStream = orderStream
                .windowAll(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .apply(new AllWindowFunction<Map<String, Object>, Tuple4<String, String, Double, Integer>, TimeWindow>() {
                    @Override
                    public void apply(TimeWindow window, Iterable<Map<String, Object>> values, Collector<Tuple4<String, String, Double, Integer>> out) throws Exception {
                        double sum = 0; int count = 0;
                        for (Map<String, Object> map : values) {
                            sum += Double.parseDouble(map.get("total_amount").toString());
                            count++;
                        }
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                        out.collect(Tuple4.of(sdf.format(new Date(window.getStart())), sdf.format(new Date(window.getEnd())), sum, count));
                    }
                });

        gmvStream.addSink(JdbcSink.sink(
                "REPLACE INTO result_gmv (window_start, window_end, total_gmv, order_count) VALUES (?, ?, ?, ?)",
                (ps, t) -> { ps.setString(1, t.f0); ps.setString(2, t.f1); ps.setDouble(3, t.f2); ps.setInt(4, t.f3); },
                JdbcExecutionOptions.builder().withBatchSize(1).build(),
                new JdbcConnectionOptions.JdbcConnectionOptionsBuilder().withUrl(mysqlUrl).withDriverName("com.mysql.cj.jdbc.Driver").withUsername(mysqlUser).withPassword(mysqlPassword).build()
        )).name("sink_gmv");

        // ================== 维度二：状态漏斗 ==================
        orderStream.windowAll(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .apply(new AllWindowFunction<Map<String, Object>, Map<String, Object>, TimeWindow>() {
                    @Override
                    public void apply(TimeWindow window, Iterable<Map<String, Object>> values, Collector<Map<String, Object>> out) throws Exception {
                        java.util.HashMap<String, Integer> countMap = new java.util.HashMap<>();
                        for (Map<String, Object> map : values) {
                            String status = map.get("order_status").toString();
                            countMap.put(status, countMap.getOrDefault(status, 0) + 1);
                        }
                        for (Map.Entry<String, Integer> entry : countMap.entrySet()) {
                            java.util.HashMap<String, Object> result = new java.util.HashMap<>();
                            result.put("status", entry.getKey()); result.put("count", entry.getValue());
                            out.collect(result);
                        }
                    }
                })
                .addSink(JdbcSink.sink(
                        "REPLACE INTO result_order_status (order_status, status_count) VALUES (?, ?)",
                        (ps, map) -> { ps.setString(1, map.get("status").toString()); ps.setInt(2, (Integer) map.get("count")); },
                        JdbcExecutionOptions.builder().withBatchSize(1).build(),
                        new JdbcConnectionOptions.JdbcConnectionOptionsBuilder().withUrl(mysqlUrl).withDriverName("com.mysql.cj.jdbc.Driver").withUsername(mysqlUser).withPassword(mysqlPassword).build()
                )).name("sink_status");

        // ================== 维度三：支付与促销 ==================
        orderStream.windowAll(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .apply(new AllWindowFunction<Map<String, Object>, Map<String, Object>, TimeWindow>() {
                    @Override
                    public void apply(TimeWindow window, Iterable<Map<String, Object>> values, Collector<Map<String, Object>> out) throws Exception {
                        java.util.HashMap<String, Integer> countMap = new java.util.HashMap<>();
                        for (Map<String, Object> map : values) {
                            String key = map.get("payment_method") + "|" + map.get("promotion_id");
                            countMap.put(key, countMap.getOrDefault(key, 0) + 1);
                        }
                        for (Map.Entry<String, Integer> entry : countMap.entrySet()) {
                            String[] parts = entry.getKey().split("\\|");
                            java.util.HashMap<String, Object> result = new java.util.HashMap<>();
                            result.put("payment", parts[0]); result.put("promotion", parts[1]); result.put("count", entry.getValue());
                            out.collect(result);
                        }
                    }
                })
                .addSink(JdbcSink.sink(
                        "REPLACE INTO result_payment_promotion (payment_method, promotion_id, order_count) VALUES (?, ?, ?)",
                        (ps, map) -> { ps.setString(1, map.get("payment").toString()); ps.setString(2, map.get("promotion").toString()); ps.setInt(3, (Integer) map.get("count")); },
                        JdbcExecutionOptions.builder().withBatchSize(1).build(),
                        new JdbcConnectionOptions.JdbcConnectionOptionsBuilder().withUrl(mysqlUrl).withDriverName("com.mysql.cj.jdbc.Driver").withUsername(mysqlUser).withPassword(mysqlPassword).build()
                )).name("sink_payment");

        // ================== 维度四：城市 ==================
        orderStream.windowAll(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .apply(new AllWindowFunction<Map<String, Object>, Map<String, Object>, TimeWindow>() {
                    @Override
                    public void apply(TimeWindow window, Iterable<Map<String, Object>> values, Collector<Map<String, Object>> out) throws Exception {
                        java.util.HashMap<String, Integer> countMap = new java.util.HashMap<>();
                        for (Map<String, Object> map : values) {
                            String city = map.get("city").toString();
                            countMap.put(city, countMap.getOrDefault(city, 0) + 1);
                        }
                        for (Map.Entry<String, Integer> entry : countMap.entrySet()) {
                            java.util.HashMap<String, Object> result = new java.util.HashMap<>();
                            result.put("city", entry.getKey()); result.put("count", entry.getValue());
                            out.collect(result);
                        }
                    }
                })
                .addSink(JdbcSink.sink(
                        "REPLACE INTO result_city (city, order_count) VALUES (?, ?)",
                        (ps, map) -> { ps.setString(1, map.get("city").toString()); ps.setInt(2, (Integer) map.get("count")); },
                        JdbcExecutionOptions.builder().withBatchSize(1).build(),
                        new JdbcConnectionOptions.JdbcConnectionOptionsBuilder().withUrl(mysqlUrl).withDriverName("com.mysql.cj.jdbc.Driver").withUsername(mysqlUser).withPassword(mysqlPassword).build()
                )).name("sink_city");

        env.execute("Order DataStream Analysis");
    }
}