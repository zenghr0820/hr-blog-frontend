"use client";

import { memo, useMemo } from "react";
import { useIPLocation } from "@/hooks/use-ip-location";
import styles from "./CardWelcome.module.css";

interface WelcomeConfig {
  content: string;
  siteOwnerName: string;
  rectangle: string;
}

const REGION_GREETINGS: Record<string, string> = {
  "日本": "よろしく，一起去看樱花吗",
  "美国": "Let us live in peace!",
  "英国": "想同你一起夜乘伦敦眼",
  "俄罗斯": "干了这瓶伏特加！",
  "法国": "C'est La Vie",
  "德国": "Die Zeit verging im Fluge.",
  "澳大利亚": "一起去大堡礁吧！",
  "加拿大": "拾起一片枫叶赠予你",
  "中国": "中国",
};

const CHINA_PROVINCE_GREETINGS: Record<string, string | Record<string, string>> = {
  "北京市": "北——京——欢迎你~~~",
  "天津市": "讲段相声吧",
  "河北省": "山势巍巍成壁垒，天下雄关铁马金戈由此向，无限江山",
  "山西省": "展开坐具长三尺，已占山河五百余",
  "内蒙古自治区": "天苍苍，野茫茫，风吹草低见牛羊",
  "辽宁省": "我想吃烤鸡架！",
  "吉林省": "状元阁就是东北烧烤之王",
  "黑龙江省": "很喜欢哈尔滨大剧院",
  "上海市": "众所周知，中国只有两个城市",
  "江苏省": {
    "南京市": "这是我挺想去的城市啦",
    "苏州市": "上有天堂，下有苏杭",
    "default": "散装是必须要散装的",
  },
  "浙江省": {
    "杭州市": "东风渐绿西湖柳，雁已还人未南归",
    "default": "望海楼明照曙霞,护江堤白蹋晴沙",
  },
  "河南省": {
    "郑州市": "豫州之域，天地之中",
    "信阳市": "品信阳毛尖，悟人间芳华",
    "南阳市": "臣本布衣，躬耕于南阳此南阳非彼南阳！",
    "驻马店市": "峰峰有奇石，石石挟仙气嵖岈山的花很美哦！",
    "开封市": "刚正不阿包青天",
    "洛阳市": "洛阳牡丹甲天下",
    "default": "可否带我品尝河南烩面啦？",
  },
  "安徽省": "蚌埠住了，芜湖起飞",
  "福建省": "井邑白云间，岩城远带山",
  "江西省": "落霞与孤鹜齐飞，秋水共长天一色",
  "山东省": "遥望齐州九点烟，一泓海水杯中泻",
  "湖北省": {
    "黄冈市": "红安将军县！辈出将才！",
    "武汉市": "你想去长江游泳嘛？",
    "default": "来碗热干面~",
  },
  "湖南省": "74751，长沙斯塔克",
  "广东省": {
    "广州市": "看小蛮腰，喝早茶了嘛~",
    "深圳市": "今天你逛商场了嘛~",
    "阳江市": "阳春合水！博主家乡~ 欢迎来玩~",
    "default": "来两斤福建人~",
  },
  "广西壮族自治区": "桂林山水甲天下",
  "海南省": "朝观日出逐白浪，夕看云起收霞光",
  "四川省": "康康川妹子",
  "贵州省": "茅台，学生，再塞200",
  "云南省": "玉龙飞舞云缠绕，万仞冰川直耸天",
  "西藏自治区": "躺在茫茫草原上，仰望蓝天",
  "陕西省": "来份臊子面加馍",
  "甘肃省": "羌笛何须怨杨柳，春风不度玉门关",
  "青海省": "牛肉干和老酸奶都好好吃",
  "宁夏回族自治区": "大漠孤烟直，长河落日圆",
  "新疆维吾尔自治区": "驼铃古道丝绸路，胡马犹闻唐汉风",
  "台湾省": "我在这头，大陆在那头",
  "香港特别行政区": "永定贼有残留地鬼嚎，迎击光非岁玉",
  "澳门特别行政区": "性感荷官，在线发牌",
};

const PROVINCE_SUFFIXES = ["省", "市", "自治区", "特别行政区", "壮族", "回族", "维吾尔"];
const CITY_SUFFIXES = ["市", "地区", "州", "盟"];

function fuzzyMatch<T>(map: Record<string, T>, name: string, suffixes: string[]): T | undefined {
  if (!name) return undefined;
  if (map[name] !== undefined) return map[name];
  for (const suffix of suffixes) {
    const v = map[name + suffix];
    if (v !== undefined) return v;
  }
  for (const key of Object.keys(map)) {
    if (key.startsWith(name) || name.startsWith(key.replace(/(?:省|市|自治区|特别行政区|壮族|回族|维吾尔|地区|州|盟)$/, ""))) {
      return map[key];
    }
  }
  return undefined;
}

function isChina(country: string): boolean {
  return country === "中国" || country === "China" || country === "CN";
}

function getRegionGreeting(country: string, province: string, city: string): string {
  if (isChina(country)) {
    const provEntry = fuzzyMatch(CHINA_PROVINCE_GREETINGS, province, PROVINCE_SUFFIXES);
    if (!provEntry) return "带我去你的城市逛逛吧！";
    if (typeof provEntry === "string") return provEntry;
    const cityGreeting = fuzzyMatch(provEntry, city, CITY_SUFFIXES);
    return cityGreeting || provEntry["default"] || "带我去你的城市逛逛吧！";
  }
  return REGION_GREETINGS[country] || "带我去你的国家逛逛吧";
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "🌤️ 早上好，快趁机多睡点懒觉！";
  if (h >= 11 && h < 13) return "☀️ 中午好，记得午休喔~";
  if (h >= 13 && h < 17) return "🕞 下午好，饮茶先啦！";
  if (h >= 17 && h < 19) return "🚶‍♂️ 下班啦！主打一个不听老板话~";
  if (h >= 19 && h < 24) return "🌙 晚上好，来一起熬夜吧呜😭";
  return "夜深了，少点休息，要熬夜 ！";
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function parseRectangle(rect: string): { lat: number; lon: number } | null {
  const parts = rect.split(",").map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lon: parts[0], lat: parts[1] };
  }
  return null;
}

export const CardWelcome = memo(function CardWelcome({ config }: { config: WelcomeConfig }) {
  const { data: ipLocation, isLoading, error } = useIPLocation();

  const welcomeInfo = useMemo(() => {
    if (!ipLocation) return null;

    const { country, province, city, ip, latitude, longitude } = ipLocation;
    const pos = isChina(country) ? `${province} ${city}`.trim() : country;
    const greeting = getRegionGreeting(country, province, city);
    const timeGreeting = getTimeGreeting();

    let distance = "";
    const siteCoords = parseRectangle(config.rectangle);
    const visitorLat = parseFloat(latitude);
    const visitorLon = parseFloat(longitude);
    if (siteCoords && !isNaN(visitorLat) && !isNaN(visitorLon)) {
      distance = String(haversineDistance(siteCoords.lat, siteCoords.lon, visitorLat, visitorLon));
    }

    return { pos, greeting, timeGreeting, ip, distance };
  }, [ipLocation, config.rectangle]);

  return (
    <div className={styles.cardWelcome}>
      <div className={styles.itemHeadline}>
        <i className="fa fa-user" />
        <span>欢迎来访者</span>
      </div>
      {config.content && (
        <div className={styles.itemContent} dangerouslySetInnerHTML={{ __html: config.content }} />
      )}
      <div className={styles.welcomeInfo}>
        {isLoading ? (
          <div className={styles.loadingState}>定位中...</div>
        ) : error || !ipLocation ? (
          <div className={styles.errorState}>
            <span className={styles.errorEmoji}>😥</span>
            <span>由于网络问题</span>
            <span>位置API请求错误</span>
            <span>请刷新重试呀🤗~</span>
          </div>
        ) : welcomeInfo ? (
          <div className={styles.welcomeText}>
            <span>嗷嗷！热烈欢迎🤪！来自</span>
            <b className={styles.highlight}>{welcomeInfo.pos}</b>
            <span>的铁铁，你好呀！😝</span>
            <span>{welcomeInfo.greeting}🍂</span>
            {welcomeInfo.distance && (
              <>
                <span>你目前距博主约 
                <b className={styles.highlight}>{welcomeInfo.distance}</b>
                公里！
                </span>
              </>
            )}
            <span>
              你的网络IP为：<b className={styles.ipAddress}>{welcomeInfo.ip}</b>
            </span>
            <span>{welcomeInfo.timeGreeting}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

CardWelcome.displayName = "CardWelcome";

export default CardWelcome;
