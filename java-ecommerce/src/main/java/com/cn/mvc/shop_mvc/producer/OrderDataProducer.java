package com.cn.mvc.shop_mvc.producer;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.*;

// 模拟订单数据生产者，用于生成测试数据并推入Kafka - by Shuyi
public class OrderDataProducer {

    // 数据源路径（本地运行时请替换为实际路径）
    private static final String BASE_PATH = "data/";

    private static final Map<String, String[]> USER      = new HashMap<>();
    private static final Map<String, String[]> PRODUCT   = new HashMap<>();
    private static final Map<String, List<String[]>> ORDER_ITEM = new HashMap<>();
    private static final Map<String, String> PLATFORM_DICT = new HashMap<>();
    private static final Map<String, int[]> BEHAVIOR = new HashMap<>();

    public static void main(String[] args) throws Exception {
        System.out.println("=== 开始加载源数据表 ===");
        loadSimple(BASE_PATH + "user.csv",     USER,    0);
        loadSimple(BASE_PATH + "product.csv",  PRODUCT, 0);
        loadDict  (BASE_PATH + "platform.csv", PLATFORM_DICT);
        loadOrderItem(BASE_PATH + "order_item.csv");
        aggregateBehavior(BASE_PATH + "user_behavior.csv");

        System.out.printf("加载完成 - user:%d product:%d order_item:%d platform:%d behavior:%d%n",
                USER.size(), PRODUCT.size(), ORDER_ITEM.size(),
                PLATFORM_DICT.size(), BEHAVIOR.size());
        System.out.println("platform 字典: " + PLATFORM_DICT);

        Properties props = new Properties();
        // 本地测试用 localhost，实际环境替换为真实地址
        props.put("bootstrap.servers", "localhost:9092"); 
        props.put("key.serializer",   "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("acks", "1");
        props.put("retries", 3);

        KafkaProducer<String, String> producer = new KafkaProducer<>(props);
        String orderFile = BASE_PATH + "order.csv";
        String topic = "realtime_order";

        System.out.println("=== Producer 启动，循环发送测试数据 ===");

        while (true) {
            try {
                List<String> allLines = new ArrayList<>();
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(new FileInputStream(orderFile), "UTF-8"))) {
                    br.readLine();
                    String line;
                    while ((line = br.readLine()) != null) {
                        if (!line.trim().isEmpty()) allLines.add(line);
                    }
                }

                // 打乱数据顺序，模拟多平台并发
                Collections.shuffle(allLines);
                System.out.println("=== 本轮读取 " + allLines.size() + " 条数据 ===");

                for (String line : allLines) {
                    String[] f = parseCsvLine(line);
                    if (f.length < 15) { System.out.println("列数不足，跳过"); continue; }

                    String orderId       = f[0].trim();
                    String globalUserId  = f[1].trim();
                    String platformCode  = f[2].trim();
                    String orderTime     = f[3].trim();
                    String paymentTime   = f[4].trim();
                    String paymentMethod = f[5].trim();
                    String shipAddress   = f[6].trim();
                    String orderStatus   = f[7].trim();
                    String totalAmount   = safeNum(f[8]);
                    String discountAmt   = safeNum(f[9]);
                    String shippingFee   = safeNum(f[10]);
                    String taxAmount     = safeNum(f[11]);
                    String promotionId   = f[12].trim();
                    String couponCode    = f[13].trim();
                    String shippingMeth  = f[14].trim();

                    String platformName = PLATFORM_DICT.getOrDefault(platformCode, platformCode);

                    String[] u = USER.get(globalUserId);
                    String userName   = u != null && u.length > 3  ? u[3].trim()  : "";
                    String userGender = translateGender(u != null && u.length > 4 ? u[4].trim() : "");
                    String userAge    = u != null && u.length > 5  ? u[5].trim()  : "";
                    String userCity   = u != null && u.length > 6  ? u[6].trim()  : "";
                    String userEmail  = u != null && u.length > 9  ? u[9].trim()  : "";
                    String userLevel  = u != null && u.length > 10 ? u[10].trim() : "";
                    String ageGroup   = calcAgeGroup(userAge);

                    String productCategory = "", productSubcat = "", productBrand = "", productName = "";
                    int itemQuantity = 1;
                    List<String[]> items = ORDER_ITEM.get(orderId);
                    if (items != null && !items.isEmpty()) {
                        String[] main = items.get(0);
                        double max = -1;
                        for (String[] it : items) {
                            try {
                                double t = Double.parseDouble(it[5].trim());
                                if (t > max) { max = t; main = it; }
                            } catch (Exception ignored) {}
                        }
                        try { itemQuantity = (int) Double.parseDouble(main[3].trim()); } catch (Exception ignored) {}
                        String pid = main.length > 2 ? main[2].trim() : "";
                        String[] p = PRODUCT.get(pid);
                        if (p != null) {
                            productName     = p.length > 3 ? p[3].trim() : "";
                            productCategory = p.length > 4 ? p[4].trim() : "";
                            productSubcat   = p.length > 5 ? p[5].trim() : "";
                            productBrand    = p.length > 7 ? p[7].trim() : "";
                        }
                    }

                    int[] b = BEHAVIOR.getOrDefault(globalUserId, new int[9]);
                    int viewCnt = b[0], cartCnt = b[1], favCnt = b[2];
                    int orderCnt = b[3], payCnt = b[4], reviewCnt = b[5], shareCnt = b[6];

                    String json = "{"
                            + "\"order_id\":"           + q(orderId)         + ","
                            + "\"global_user_id\":"     + q(globalUserId)    + ","
                            + "\"platform\":"           + q(platformCode)    + ","
                            + "\"platform_name\":"      + q(platformName)    + ","
                            + "\"order_time\":"         + q(orderTime)       + ","
                            + "\"payment_time\":"       + q(paymentTime)     + ","
                            + "\"payment_method\":"     + q(paymentMethod)   + ","
                            + "\"shipping_address\":"   + q(shipAddress)     + ","
                            + "\"order_status\":"       + q(orderStatus)     + ","
                            + "\"total_amount\":"       + totalAmount        + ","
                            + "\"discount_amount\":"    + discountAmt        + ","
                            + "\"shipping_fee\":"       + shippingFee        + ","
                            + "\"tax_amount\":"         + taxAmount          + ","
                            + "\"promotion_id\":"       + q(promotionId)     + ","
                            + "\"coupon_code\":"        + q(couponCode)      + ","
                            + "\"shipping_method\":"    + q(shippingMeth)    + ","
                            + "\"user_name\":"          + q(userName)        + ","
                            + "\"user_gender\":"        + q(userGender)      + ","
                            + "\"user_age\":"           + q(userAge)         + ","
                            + "\"user_age_group\":"     + q(ageGroup)        + ","
                            + "\"user_city\":"          + q(userCity)        + ","
                            + "\"user_level\":"         + q(userLevel)       + ","
                            + "\"user_email\":"         + q(userEmail)       + ","
                            + "\"product_category\":"   + q(productCategory) + ","
                            + "\"product_subcategory\":"+ q(productSubcat)   + ","
                            + "\"product_brand\":"      + q(productBrand)    + ","
                            + "\"product_name\":"       + q(productName)     + ","
                            + "\"item_quantity\":"      + itemQuantity       + ","
                            + "\"view_count\":"         + viewCnt            + ","
                            + "\"cart_count\":"         + cartCnt            + ","
                            + "\"fav_count\":"          + favCnt             + ","
                            + "\"order_count\":"        + orderCnt           + ","
                            + "\"pay_count\":"          + payCnt             + ","
                            + "\"review_count\":"       + reviewCnt          + ","
                            + "\"share_count\":"        + shareCnt
                            + "}";

                    producer.send(new ProducerRecord<>(topic, json));
                    System.out.println("发送 " + orderId
                            + " | 平台=" + platformName + " 状态=" + orderStatus
                            + " | 用户=" + userName + "(" + userGender + ") " + userCity
                            + " | 品类=" + productCategory + " 品牌=" + productBrand
                            + " | 行为[浏览" + viewCnt + " 加购" + cartCnt + " 下单" + orderCnt
                            + " 支付" + payCnt + " 评价" + reviewCnt + "]");

                    Thread.sleep(100);
                }
                System.out.println("=== 一轮发完 ===");
            } catch (Exception e) {
                System.err.println("异常: " + e.getMessage());
                try { Thread.sleep(5000); } catch (InterruptedException ex) { Thread.currentThread().interrupt(); }
            }
        }
    }

    // 加载用户和商品数据
    private static void loadSimple(String path, Map<String, String[]> map, int keyIdx) throws Exception {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(path), "UTF-8"))) {
            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] f = parseCsvLine(line);
                if (f.length > keyIdx) {
                    String key = f[keyIdx].trim();
                    if (!key.isEmpty()) map.put(key, f);
                }
            }
        }
    }

    // 加载平台字典
    private static void loadDict(String path, Map<String, String> dict) throws Exception {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(path), "UTF-8"))) {
            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] f = parseCsvLine(line);
                if (f.length >= 2) dict.put(f[0].trim(), f[1].trim());
            }
        }
    }

    // 加载订单明细
    private static void loadOrderItem(String path) throws Exception {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(path), "UTF-8"))) {
            br.readLine();
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] f = parseCsvLine(line);
                if (f.length < 6) continue;
                ORDER_ITEM.computeIfAbsent(f[1].trim(), k -> new ArrayList<>()).add(f);
            }
        }
    }

    // 聚合用户行为
    private static void aggregateBehavior(String path) throws Exception {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(path), "UTF-8"))) {
            String header = br.readLine();
            String[] hs = parseCsvLine(header);
            int iUid  = idxOf(hs, "global_user_id", 1);
            int iType = idxOf(hs, "behavior_type", 5);
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] f = parseCsvLine(line);
                if (f.length <= Math.max(iUid, iType)) continue;
                String uid = f[iUid].trim();
                if (uid.isEmpty()) continue;
                String type = f[iType].trim();
                int[] agg = BEHAVIOR.computeIfAbsent(uid, k -> new int[9]);
                if (type.equals("浏览"))      agg[0]++;
                else if (type.equals("加购")) agg[1]++;
                else if (type.equals("收藏")) agg[2]++;
                else if (type.equals("下单")) agg[3]++;
                else if (type.equals("支付")) agg[4]++;
                else if (type.equals("评价")) agg[5]++;
                else if (type.equals("分享")) agg[6]++;
            }
        }
    }

    private static int idxOf(String[] headers, String name, int def) {
        for (int i = 0; i < headers.length; i++) if (headers[i].trim().equals(name)) return i;
        return def;
    }

    // 转换性别
    private static String translateGender(String g) {
        if (g == null) return "未知";
        g = g.trim().toLowerCase();
        if (g.equals("f") || g.equals("female") || g.equals("女")) return "女";
        if (g.equals("m") || g.equals("male")   || g.equals("男")) return "男";
        return "未知";
    }

    // 计算年龄段
    private static String calcAgeGroup(String s) {
        if (s == null || s.trim().isEmpty()) return "未知";
        try {
            int age = (int) Double.parseDouble(s.trim());
            if (age < 18) return "18岁以下";
            if (age < 25) return "18-24";
            if (age < 35) return "25-34";
            if (age < 45) return "35-44";
            return "45岁以上";
        } catch (Exception e) { return "未知"; }
    }

    private static String q(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String safeNum(String s) {
        if (s == null) return "0";
        String t = s.trim();
        if (t.isEmpty()) return "0";
        try { Double.parseDouble(t); return t; } catch (Exception e) { return "0"; }
    }

    private static String[] parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') { cur.append('"'); i++; }
                    else inQuotes = false;
                } else cur.append(c);
            } else {
                if (c == '"') inQuotes = true;
                else if (c == ',') { out.add(cur.toString()); cur.setLength(0); }
                else cur.append(c);
            }
        }
        out.add(cur.toString());
        return out.toArray(new String[0]);
    }
}