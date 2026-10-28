create table realtime_dw.ads_behavior_funnel
(
    stat_time      datetime      not null,
    behavior_stage varchar(20)   not null,
    user_cnt       int default 0 null,
    primary key (stat_time, behavior_stage)
);

create table realtime_dw.ads_platform_name_cmp
(
    stat_time     datetime         not null,
    platform_name varchar(50)      not null,
    order_cnt     int    default 0 null,
    gmv           double default 0 null,
    avg_amount    double default 0 null,
    primary key (stat_time, platform_name)
);

create table realtime_dw.ads_product_brand
(
    stat_time  datetime         not null,
    brand      varchar(100)     not null,
    order_cnt  int    default 0 null,
    gmv        double default 0 null,
    avg_amount double default 0 null,
    primary key (stat_time, brand)
);

create table realtime_dw.ads_product_category
(
    stat_time  datetime         not null,
    category   varchar(100)     not null,
    order_cnt  int    default 0 null,
    gmv        double default 0 null,
    avg_amount double default 0 null,
    primary key (stat_time, category)
);

create table realtime_dw.ads_user_age
(
    stat_time  datetime         not null,
    age_group  varchar(20)      not null,
    order_cnt  int    default 0 null,
    gmv        double default 0 null,
    avg_amount double default 0 null,
    primary key (stat_time, age_group)
);

create table realtime_dw.ads_user_city
(
    stat_time datetime         not null,
    city      varchar(50)      not null,
    order_cnt int    default 0 null,
    gmv       double default 0 null,
    primary key (stat_time, city)
);

create table realtime_dw.ads_user_gender
(
    stat_time  datetime         not null,
    gender     varchar(20)      not null,
    order_cnt  int    default 0 null,
    gmv        double default 0 null,
    avg_amount double default 0 null,
    primary key (stat_time, gender)
);

create table realtime_dw.ads_user_level
(
    stat_time  datetime         not null,
    user_level varchar(50)      not null,
    order_cnt  int    default 0 null,
    gmv        double default 0 null,
    avg_amount double default 0 null,
    primary key (stat_time, user_level)
);

