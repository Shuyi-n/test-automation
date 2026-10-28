package com.cn.mvc.shop_mvc.service.impl;

import com.cn.mvc.shop_mvc.dao.RealTimeDao;
import com.cn.mvc.shop_mvc.service.RealTimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 实时分析业务实现层
 * 企业规范：Service 层只做业务逻辑编排，不直接操作数据库
 */
@Service
public class RealTimeServiceImpl implements RealTimeService {

    @Autowired
    private RealTimeDao realTimeDao;

    @Override
    public List<Map<String, Object>> gender() {
        return realTimeDao.gender();
    }

    @Override
    public List<Map<String, Object>> age() {
        return realTimeDao.age();
    }

    @Override
    public List<Map<String, Object>> level() {
        return realTimeDao.level();
    }

    @Override
    public List<Map<String, Object>> city() {
        return realTimeDao.city();
    }

    @Override
    public List<Map<String, Object>> category() {
        return realTimeDao.category();
    }

    @Override
    public List<Map<String, Object>> brand() {
        return realTimeDao.brand();
    }

    @Override
    public List<Map<String, Object>> funnel() {
        return realTimeDao.funnel();
    }

    @Override
    public List<Map<String, Object>> platform() {
        return realTimeDao.platform();
    }
}
