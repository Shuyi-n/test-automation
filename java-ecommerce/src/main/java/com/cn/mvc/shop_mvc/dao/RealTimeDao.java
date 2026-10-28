package com.cn.mvc.shop_mvc.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * 实时分析数据访问层（DAO）
 * 企业规范：SQL 只允许出现在 DAO/Mapper 层，禁止写在 Controller / Service 中
 */
@Repository
public class RealTimeDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 通用查询：按维度统计订单数与 GMV
     *
     * @param table    ads 层表名
     * @param dimCol   维度列名
     */
    private List<Map<String, Object>> queryGmvByDim(String table, String dimCol) {
        String sql = "SELECT " + dimCol + ", SUM(order_cnt) AS order_cnt, SUM(gmv) AS gmv"
                + " FROM " + table + " GROUP BY " + dimCol;
        return jdbcTemplate.queryForList(sql);
    }

    /** 用户性别 */
    public List<Map<String, Object>> gender() {
        return queryGmvByDim("ads_user_gender", "gender");
    }

    /** 用户年龄 */
    public List<Map<String, Object>> age() {
        return queryGmvByDim("ads_user_age", "age_group");
    }

    /** 会员等级 */
    public List<Map<String, Object>> level() {
        return queryGmvByDim("ads_user_level", "user_level");
    }

    /** 城市排行 */
    public List<Map<String, Object>> city() {
        return queryGmvByDim("ads_user_city", "city");
    }

    /** 商品品类 */
    public List<Map<String, Object>> category() {
        return queryGmvByDim("ads_product_category", "category");
    }

    /** 商品品牌 */
    public List<Map<String, Object>> brand() {
        return queryGmvByDim("ads_product_brand", "brand");
    }

    /** 7 阶段行为漏斗 */
    public List<Map<String, Object>> funnel() {
        String sql = "SELECT behavior_stage, SUM(user_cnt) AS user_cnt"
                + " FROM ads_behavior_funnel GROUP BY behavior_stage";
        return jdbcTemplate.queryForList(sql);
    }

    /** 平台对比 */
    public List<Map<String, Object>> platform() {
        return queryGmvByDim("ads_platform_name_cmp", "platform_name");
    }
}
