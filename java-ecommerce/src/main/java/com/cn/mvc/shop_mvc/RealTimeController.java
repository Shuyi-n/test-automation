package com.cn.mvc.shop_mvc;

import com.cn.mvc.shop_mvc.common.Result;
import com.cn.mvc.shop_mvc.service.RealTimeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;


 * Controller 接收请求、调用 Service、封装响应
@RestController
@RequestMapping("/api/realtime")
public class RealTimeController {

    private static final Logger log = LoggerFactory.getLogger(RealTimeController.class);

    @Autowired
    private RealTimeService realTimeService;

    /* 用户性别 */
    @GetMapping("/gender")
    public Result<List<Map<String, Object>>> gender() {
        log.info("查询性别维度数据");
        return Result.success(realTimeService.gender());
    }

    /* 用户年龄 */
    @GetMapping("/age")
    public Result<List<Map<String, Object>>> age() {
        log.info("查询年龄维度数据");
        return Result.success(realTimeService.age());
    }

    /* 会员等级 */
    @GetMapping("/level")
    public Result<List<Map<String, Object>>> level() {
        log.info("查询会员等级维度数据");
        return Result.success(realTimeService.level());
    }

    /* 城市排行 */
    @GetMapping("/city")
    public Result<List<Map<String, Object>>> city() {
        log.info("查询城市维度数据");
        return Result.success(realTimeService.city());
    }

    /* 商品品类 */
    @GetMapping("/category")
    public Result<List<Map<String, Object>>> category() {
        log.info("查询商品品类维度数据");
        return Result.success(realTimeService.category());
    }

    /* 商品品牌 */
    @GetMapping("/brand")
    public Result<List<Map<String, Object>>> brand() {
        log.info("查询商品品牌维度数据");
        return Result.success(realTimeService.brand());
    }

    /* 7 阶段行为漏斗 */
    @GetMapping("/funnel")
    public Result<List<Map<String, Object>>> funnel() {
        log.info("查询行为漏斗数据");
        return Result.success(realTimeService.funnel());
    }

    /* 平台对比 */
    @GetMapping("/platform")
    public Result<List<Map<String, Object>>> platform() {
        log.info("查询平台对比数据");
        return Result.success(realTimeService.platform());
    }
}