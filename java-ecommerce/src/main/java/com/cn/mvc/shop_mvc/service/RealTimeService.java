package com.cn.mvc.shop_mvc.service;

import java.util.List;
import java.util.Map;

/**
 * 实时分析业务接口
 */
public interface RealTimeService {

    /** 用户性别 */
    List<Map<String, Object>> gender();

    /** 用户年龄 */
    List<Map<String, Object>> age();

    /** 会员等级 */
    List<Map<String, Object>> level();

    /** 城市排行 */
    List<Map<String, Object>> city();

    /** 商品品类 */
    List<Map<String, Object>> category();

    /** 商品品牌 */
    List<Map<String, Object>> brand();

    /** 7 阶段行为漏斗 */
    List<Map<String, Object>> funnel();

    /** 平台对比 */
    List<Map<String, Object>> platform();
}
