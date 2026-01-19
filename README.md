# 微信小程序项目说明

## 项目名称
Intimacy Hub - 亲密关系记录小程序

## 功能特性
- 年度目标追踪
- GitHub风格活动热力图
- 记录管理 (添加、查看、导出)
- 数据导出 (CSV格式)
- 隐私优先 (本地存储)

## 技术栈
- 微信小程序原生框架
- 本地存储 (wx.storage)
- 深色主题设计

## 目录结构
```
cook/
├── app.js              # 应用主文件
├── app.json            # 应用配置
├── app.wxss            # 全局样式
├── sitemap.json        # 站点地图
├── pages/              # 页面目录
│   ├── index/          # 首页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── settings/       # 设置页
│       ├── settings.js
│       ├── settings.json
│       ├── settings.wxml
│       └── settings.wxss
├── utils/              # 工具模块
│   ├── storage.js      # 数据存储
│   └── heatmap.js      # 热力图处理
└── assets/             # 资源文件
    └── icons/          # 图标
        └── settings.svg
```

## 使用方法
1. 使用微信开发者工具打开项目
2. 编译并预览
3. 在模拟器或真机上测试

## 数据存储
所有数据存储在本地,包括:
- 记录数据 (logs)
- 应用配置 (appConfig)

## 版本
v1.0.2
