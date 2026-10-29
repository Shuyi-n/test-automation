# Test Automation Workspace

包含电商实时数据平台开发与 Python 自动化测试脚本。

# java-ecommerce
基于 SpringBoot + Kafka + Flink 的实时数据链路。
包含接口 Controller、Flink 实时计算逻辑、Kafka 数据生产以及前端 Echarts 看板。

# python-ai-scripts
基于 FastAPI + Dify 的微信智能客服与自动化脚本。
包含高德数据爬虫、PyMySQL 自动造数脚本，以及带超时熔断机制的微信回调接口。

# qa-automation
基于 Pytest + PyMySQL 的自动化测试工程。
接口与数据校验：针对电商实时数据看板进行数据一致性校验。
动态发现机制：自动扫描数据库中的 ads_前缀表，无需硬编码即可批量遍历断言。
核心防御与容错：成功排查并防御了除数为0导致的 Infinity 异常，并针对底层浮点数精度丢失问题采用了容差断言。
