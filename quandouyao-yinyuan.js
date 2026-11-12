// 全豆要[聚合音源] -> Rex / Forward music source
// Upstream: https://77f77.48364836.xyz/lx/?1#全豆要
// Upstream version: v4.1
//
// The original LX source only resolves music URLs for tracks already supplied
// by LX. This Rex port adds search, curated Netease charts, platform search,
// and automatic playback fallback while retaining the original APIs.

var QDY_UPSTREAM_URL = "https://77f77.48364836.xyz/lx/?1";
var QDY_NETEASE_API =
  "https://music-api.gdstudio.xyz/api.php" +
  "?use_xbridge3=true&loader_name=forest&need_sec_link=1" +
  "&sec_link_scene=im&theme=light";
var QDY_NETEASE_WEB = "https://music.163.com/api";
var QDY_QQ_SEARCH = "https://c.y.qq.com/soso/fcgi-bin/client_search_cp";
var QDY_QQ_VKEY = "https://u.y.qq.com/cgi-bin/musicu.fcg";
var QDY_KUWO_SEARCH = "https://search.kuwo.cn/r.s";
var QDY_KUWO_PLAY =
  "https://musicapi.haitangw.net/music/kw.php?type=mp3";
var QDY_KUGOU_SEARCH = "https://songsearch.kugou.com/song_search_v2";
var QDY_KUGOU_PLAY = "https://m.kugou.com/app/i/getSongInfo.php";
var QDY_MIGU_SEARCH =
  "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/search_all.do";
var QDY_MIGU_PLAY =
  "https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do";
var QDY_QISHUI_API = "https://api.vsaa.cn/api/music.qishui.vip";
var QDY_QISHUI_PROXY = "https://proxy.qishui.vsaa.cn/qishui/proxy";
var QDY_CNET_SUBTITLE = "https://paste.c-net.org/";
var QDY_UGUU_SUBTITLE = "https://uguu.se/upload?output=text";
var QDY_TIMEOUT = 12000;
var QDY_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/142.0.0.0 Safari/537.36";

var QDY_ICON =
  "data:image/svg+xml;base64," +
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iNTIiIHkxPSIzNCIgeDI9IjQ2MCIgeTI9IjQ3OCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMjAyNzJDIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzBEMTAxMyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYmVhbiIgeDE9IjE3MSIgeTE9IjEzNCIgeDI9IjM1MSIgeTI9IjM3MiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRTRGRjcyIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzc3RTM5QiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0id2FybSIgeDE9IjEwOCIgeTE9IjQwMSIgeDI9IjQxMyIgeTI9IjEwNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjRkY4QjVDIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGRDM2QSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii00MCUiIHk9Ii00MCUiIHdpZHRoPSIxODAlIiBoZWlnaHQ9IjE4MCUiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxMCIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiByeD0iMTE2IiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTc4IiBmaWxsPSIjMTIxNzFCIiBzdHJva2U9IiMzMTNBNDAiIHN0cm9rZS13aWR0aD0iMTIiLz4KICA8Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjE0MCIgZmlsbD0iIzE3MUQyMSIgc3Ryb2tlPSIjMjMyQjMxIiBzdHJva2Utd2lkdGg9IjQiLz4KICA8Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjEyMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzk0MTQ4IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1kYXNoYXJyYXk9IjUgMTMiLz4KICA8cGF0aCBkPSJNMTgwIDEyMmM2MS0yNiAxNDcgMyAxNzEgNjggMTkgNTEtNiAxMDQtNDggMTMzLTQwIDI4LTUyIDY1LTI1IDkxIDIwIDE5IDUzIDE3IDc4LTQgNi01IDE0IDQgOCAxMC0zMyAzMi04NSAzMS0xMTItMS0zNS00Mi01LTg4IDQxLTExOSAzOS0yNiA1Ni03MiAzOS0xMTAtMjMtNTItOTAtNzMtMTQwLTU0LTE1IDYtMjctOC0xMi0xNFoiIGZpbGw9InVybCgjd2FybSkiIG9wYWNpdHk9Ii4yMiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CiAgPHBhdGggZD0iTTE4NiAxMzJjLTU0IDI0LTgyIDg5LTYxIDE0NSAxOCA0OCA2NiA3MyAxMTIgNjEgMzUtOSA2Mi0zNCA3Ni02NiA3LTE2IDE5LTIyIDMxLTEzIDExIDggMTIgMjMgMiAzNy0yMiAyOS02MCA0Ni0xMDYgNDQtNjktMy0xMjUtNjAtMTI2LTEyOC0xLTI4IDgtNTYgMjUtNzggMTMtMTcgMzQtMjAgNDctOSA1IDQgNiA1IDAgN1oiIGZpbGw9InVybCgjYmVhbikiLz4KICA8Y2lyY2xlIGN4PSIyNTMiIGN5PSIyNTYiIHI9IjY4IiBmaWxsPSIjMTExNTE4IiBzdHJva2U9IiNFNEZGNzIiIHN0cm9rZS13aWR0aD0iNyIvPgogIDxjaXJjbGUgY3g9IjI1MyIgY3k9IjI1NiIgcj0iMjAiIGZpbGw9InVybCgjd2FybSkiLz4KICA8cGF0aCBkPSJNMjUzIDE4OHYtMTlNMjUzIDMyNHYxOU0xODUgMjU2aC0xOU0zMjEgMjU2aDE5IiBzdHJva2U9IiNFNEZGNzIiIHN0cm9rZS13aWR0aD0iNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0ibTI0MSAyMzUgNDAgMjEtNDAgMjF2LTQyWiIgZmlsbD0iI0Y1RjhFQiIvPgogIDxwYXRoIGQ9Ik04MyAzNzBjMzAgMTUgNTAgMTUgODAgMHM1MC0xNSA4MCAwIDUwIDE1IDgwIDAgNTAtMTUgODAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkY4QjVDIiBzdHJva2Utd2lkdGg9IjgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iLjgiLz4KICA8Y2lyY2xlIGN4PSI0MDMiIGN5PSIxMjIiIHI9IjkiIGZpbGw9IiNGRkQzNkEiLz4KICA8Y2lyY2xlIGN4PSI0MjEiIGN5PSIxNTQiIHI9IjUiIGZpbGw9IiNFNEZGNzIiLz4KPC9zdmc+Cg==";

var WidgetMetadata = {
  id: "forward.quandouya.full",
  title: "全豆要音源",
  description:
    "聚合网易云、QQ、酷我、酷狗、咪咕与汽水接口；分类歌单可直接播放和下载，播放画面同步显示动态歌词。",
  author: "Walkman",
  site: QDY_UPSTREAM_URL,
  iconurl: QDY_ICON,
  version: "2.7.11",
  requiredVersion: "0.0.1",
  detailCacheDuration: 0,
  globalParams: [
    {
      name: "quality",
      title: "默认音质",
      type: "enumeration",
      value: "320k",
      enumOptions: [
        { title: "128K", value: "128k" },
        { title: "320K", value: "320k" },
        { title: "无损 FLAC", value: "flac" },
        { title: "24bit / Hi-Res", value: "24bit" }
      ],
      description: "优先请求所选音质；资源不支持时由线路返回可用版本。"
    },
    {
      name: "fallback_enabled",
      title: "多线路回退",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "关闭", value: "disabled" }
      ],
      description: "当前平台受版权限制时，自动尝试酷我和网易云备用线路。"
    },
    {
      name: "lyrics_enabled",
      title: "动态歌词",
      type: "enumeration",
      value: "enabled",
      enumOptions: [
        { title: "启用", value: "enabled" },
        { title: "关闭", value: "disabled" }
      ],
      description: "自动读取当前歌曲歌词并生成时间轴字幕，在播放画面中随进度显示。"
    },
    {
      name: "lyrics_layout",
      title: "歌词显示方式",
      type: "enumeration",
      value: "scroll",
      enumOptions: [
        { title: "五行滚动", value: "scroll" },
        { title: "单行显示", value: "single" }
      ],
      description: "五行滚动会同时显示前两句、当前句和后两句。"
    },
    {
      name: "lyrics_height",
      title: "歌词位置",
      type: "enumeration",
      value: "42",
      enumOptions: [
        { title: "更高", value: "34" },
        { title: "中上（推荐）", value: "42" },
        { title: "居中", value: "50" },
        { title: "中部偏下", value: "60" }
      ],
      description: "控制动态歌词在播放画面中的垂直位置，默认移到画面中上部。"
    },
    {
      name: "subtitle_service_url",
      title: "自建歌词字幕服务",
      type: "input",
      value: "",
      description: "可选。c-net 与 Uguu 均失败后，再尝试此兼容字幕服务的上传地址。"
    },
    {
      name: "subtitle_service_token",
      title: "字幕服务密钥",
      type: "input",
      value: "",
      description: "可选自建字幕服务的上传密钥。只保存在本机模块配置中。"
    },
    {
      name: "player_engine",
      title: "播放器内核",
      type: "enumeration",
      value: "system",
      enumOptions: [
        { title: "系统播放器（推荐）", value: "system" },
        { title: "应用播放器（兼容模式）", value: "app" }
      ],
      description: "系统播放器支持 iOS 锁屏后的后台连续播放；遇到兼容问题可切换应用播放器。"
    },
    {
      name: "result_limit",
      title: "每页数量",
      type: "input",
      value: "30",
      description: "分类和搜索每页返回 6-50 首，默认 30 首。"
    },
    {
      name: "category_queue_limit",
      title: "分类播放队列",
      type: "input",
      value: "0",
      description: "默认 0 表示加载分类全部歌曲；也可填写 20-1000 限制数量。"
    }
  ],
  modules: [
    {
      id: "latestAllV2",
      title: "网易云热歌榜",
      functionName: "latestAllV2",
      type: "video",
      cacheDuration: 0,
      params: []
    },
    {
      id: "categoryMandarinV2",
      title: "华语私人雷达",
      functionName: "categoryMandarinV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryWesternV2",
      title: "欧美私人雷达",
      functionName: "categoryWesternV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryCantoneseV2",
      title: "粤语经典",
      functionName: "categoryCantoneseV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryInstrumentalV2",
      title: "纯音乐",
      functionName: "categoryInstrumentalV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryElectronicV2",
      title: "电子舞曲",
      functionName: "categoryElectronicV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryRockV2",
      title: "摇滚",
      functionName: "categoryRockV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "categoryFolkV2",
      title: "民谣",
      functionName: "categoryFolkV2",
      type: "video",
      cacheDuration: 0,
      params: [{ name: "page", title: "页码", type: "page" }]
    },
    {
      id: "loadResource",
      title: "全豆要播放与下载",
      description: "解析当前歌曲的多平台音频地址，支持播放器直接下载",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],
  search: {
    title: "搜索全豆要音源",
    functionName: "searchQdy",
    type: "video",
    params: [
      {
        name: "keyword",
        title: "歌曲、歌手或专辑",
        type: "input",
        value: "",
        placeholders: [
          { title: "周杰伦", value: "周杰伦" },
          { title: "晴天", value: "晴天" },
          { title: "华语经典", value: "华语经典" }
        ]
      },
      {
        name: "source",
        title: "搜索平台",
        type: "enumeration",
        value: "all",
        enumOptions: [
          { title: "全部平台", value: "all" },
          { title: "网易云音乐", value: "netease" },
          { title: "QQ 音乐", value: "qq" },
          { title: "酷我音乐", value: "kuwo" },
          { title: "酷狗音乐", value: "kugou" },
          { title: "咪咕音乐", value: "migu" },
          { title: "汽水音乐", value: "qishui" }
        ]
      },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

var qdySourceMeta = {
  netease: { name: "网易云音乐", short: "网易云" },
  qq: { name: "QQ 音乐", short: "QQ" },
  kuwo: { name: "酷我音乐", short: "酷我" },
  kugou: { name: "酷狗音乐", short: "酷狗" },
  migu: { name: "咪咕音乐", short: "咪咕" },
  qishui: { name: "汽水音乐", short: "汽水" }
};

var qdyPlaylists = {
  latestAll: {
    id: "3778678",
    title: "网易云热歌榜",
    keyword: "热歌",
    count: 200,
    cover: "https://p1.music.126.net/0SUEG8yDACfx0Bw2MYFv4Q==/109951170048519512.jpg"
  },
  categoryMandarin: {
    id: "2829883282",
    title: "华语私人雷达",
    keyword: "华语流行",
    count: 35,
    cover: "https://p1.music.126.net/NaSOolKiCwxsljTiMWImTg==/109951169058725193.jpg"
  },
  categoryWestern: {
    id: "2829816518",
    title: "欧美私人雷达",
    keyword: "欧美流行",
    count: 35,
    cover: "https://p1.music.126.net/kBUPrLfB9-OZXHrf8aVbSw==/109951168609048221.jpg"
  },
  categoryCantonese: {
    id: "2237551001",
    title: "粤语经典",
    keyword: "粤语经典",
    count: 211,
    cover: "https://p1.music.126.net/PsONIoIzCJ-9gPCAeq9ahw==/19115009649498152.jpg"
  },
  categoryInstrumental: {
    id: "316192152",
    title: "纯音乐",
    keyword: "纯音乐",
    count: 561,
    cover: "https://p1.music.126.net/jB3KG-a0Nq39sT2Xp4IZpQ==/109951163138588916.jpg"
  },
  categoryElectronic: {
    id: "2802306619",
    title: "电子舞曲",
    keyword: "欧美电子",
    count: 420,
    cover: "https://p1.music.126.net/AzIJtO5u93rm4-DLmMiBjQ==/109951164116093402.jpg"
  },
  categoryRock: {
    id: "3088403692",
    title: "中国摇滚",
    keyword: "中国摇滚",
    count: 168,
    cover: "https://p1.music.126.net/7TPPvYN62ki-6U8CE7B8bQ==/109951164513274541.jpg"
  },
  categoryFolk: {
    id: "2770902965",
    title: "民谣",
    keyword: "民谣",
    count: 295,
    cover: "https://p1.music.126.net/wldFtES1Cjnbqr5bjlqQbg==/18876415625841069.jpg"
  }
};

var qdyRuntime = {
  quality: "320k",
  fallback: true,
  lyrics: true,
  lyricStyle: "scroll",
  lyricLine: 42,
  subtitleService: "",
  subtitleToken: "",
  playerType: "system",
  limit: 30,
  queueLimit: 0
};

var qdyLyricCache = {};
var qdyCollectionCache = {};
var qdySubtitleHostCache = {};
var qdySubtitleProviderBlockedUntil = {};
var qdySubtitleProviderBlocksLoaded = false;

function qdyText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function qdyFirstText() {
  for (var index = 0; index < arguments.length; index += 1) {
    var value = qdyText(arguments[index]);
    if (value) return value;
  }
  return "";
}

function qdyClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function qdyPage(value) {
  var page = parseInt(qdyText(value || "1"), 10);
  if (!isFinite(page) || page < 1) page = 1;
  return Math.min(page, 5000);
}

function qdyQuality(value) {
  var quality = qdyText(value || "320k").toLowerCase();
  if (quality === "128" || quality === "128kbps") quality = "128k";
  if (quality === "320" || quality === "320kbps") quality = "320k";
  if (quality === "flac" || quality === "lossless" || quality === "sq") quality = "flac";
  if (quality === "24bit" || quality === "hires" || quality === "hi-res") quality = "24bit";
  if (["128k", "320k", "flac", "24bit"].indexOf(quality) < 0) quality = "320k";
  return quality;
}

function qdyLimit(params) {
  var value = parseInt(
    qdyText(
      params && (params.result_limit || params.limit || params.pageSize)
    ) || String(qdyRuntime.limit || 30),
    10
  );
  if (!isFinite(value)) value = 30;
  return qdyClamp(value, 6, 50);
}

function qdyQueueLimit(params) {
  var raw = qdyText(
    qdyFirstText(
      params && (params.category_queue_limit || params.queue_limit),
      qdyRuntime.queueLimit
    )
  ).toLowerCase();
  if (!raw || raw === "0" || raw === "all" || raw === "全部") return 0;
  var value = parseInt(raw, 10);
  if (!isFinite(value) || value <= 0) return 0;
  return qdyClamp(value, 20, 1000);
}

function qdyApplySettings(params) {
  params = params || {};
  if (params.quality) qdyRuntime.quality = qdyQuality(params.quality);
  if (params.result_limit) {
    qdyRuntime.limit = qdyLimit(params);
  }
  if (params.category_queue_limit !== undefined) {
    var queueRaw = qdyText(params.category_queue_limit).toLowerCase();
    var queueLimit = parseInt(queueRaw, 10);
    qdyRuntime.queueLimit =
      queueRaw === "all" ||
      queueRaw === "全部" ||
      (isFinite(queueLimit) && queueLimit <= 0)
        ? 0
        : isFinite(queueLimit)
          ? qdyClamp(queueLimit, 20, 1000)
          : qdyRuntime.queueLimit;
  }
  if (params.fallback_enabled !== undefined) {
    qdyRuntime.fallback =
      String(params.fallback_enabled).toLowerCase() !== "disabled" &&
      params.fallback_enabled !== false;
  }
  if (params.lyrics_enabled !== undefined) {
    qdyRuntime.lyrics =
      String(params.lyrics_enabled).toLowerCase() !== "disabled" &&
      params.lyrics_enabled !== false;
  }
  if (params.lyrics_layout !== undefined) {
    var lyricStyle =
      String(params.lyrics_layout).toLowerCase() === "single"
        ? "single"
        : "scroll";
    if (lyricStyle !== qdyRuntime.lyricStyle) {
      qdyRuntime.lyricStyle = lyricStyle;
      qdyLyricCache = {};
      qdySubtitleHostCache = {};
    }
  }
  if (params.lyrics_height !== undefined) {
    var lyricLine = parseInt(params.lyrics_height, 10);
    if (isFinite(lyricLine)) {
      var nextLyricLine = Math.max(30, Math.min(72, lyricLine));
      if (nextLyricLine !== qdyRuntime.lyricLine) {
        qdyRuntime.lyricLine = nextLyricLine;
        qdyLyricCache = {};
        qdySubtitleHostCache = {};
      }
    }
  }
  if (params.subtitle_service_url !== undefined) {
    var subtitleService = qdyText(params.subtitle_service_url).replace(
      /\/+$/,
      ""
    );
    if (subtitleService !== qdyRuntime.subtitleService) {
      qdyRuntime.subtitleService = subtitleService;
      qdySubtitleHostCache = {};
    }
  }
  if (params.subtitle_service_token !== undefined) {
    var subtitleToken = qdyText(params.subtitle_service_token);
    if (subtitleToken !== qdyRuntime.subtitleToken) {
      qdyRuntime.subtitleToken = subtitleToken;
      qdySubtitleHostCache = {};
    }
  }
  if (params.player_engine !== undefined) {
    qdyRuntime.playerType =
      String(params.player_engine).toLowerCase() === "app"
        ? "app"
        : "system";
  }
  return params;
}

function qdySource(value, fallback) {
  var source = qdyText(value || fallback || "").toLowerCase();
  if (source === "neteasecloudmusic" || source === "163" || source === "wy") {
    return "netease";
  }
  if (source === "tencent" || source === "qqmusic" || source === "tx") {
    return "qq";
  }
  if (source === "kugoumusic" || source === "kg") return "kugou";
  if (source === "kuwomusic" || source === "kw") return "kuwo";
  if (source === "migu music" || source === "mg") return "migu";
  if (source === "qishui music" || source === "qsvip") return "qishui";
  if (source === "all" || qdySourceMeta[source]) return source;
  return "";
}

function qdySourceName(source) {
  return qdySourceMeta[source] ? qdySourceMeta[source].name : "全豆要音源";
}

function qdyDecodeEntities(value) {
  return qdyText(value)
    .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/&#(\d+);/g, function (_, number) {
      return String.fromCharCode(parseInt(number, 10));
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&ensp;/gi, " ")
    .replace(/&emsp;/gi, " ")
    .replace(/&middot;/gi, "·")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function qdyStripTags(value) {
  return qdyDecodeEntities(
    qdyText(value)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function qdyQuery(params) {
  return Object.keys(params || {})
    .filter(function (key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== "";
    })
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]));
    })
    .join("&");
}

function qdyAbsolute(value) {
  var url = qdyText(value);
  if (!url) return "";
  if (url.indexOf("//") === 0) return "https:" + url;
  if (/^https?:\/\//i.test(url)) return url;
  return "";
}

function qdyHttps(value) {
  var url = qdyAbsolute(value);
  if (/^http:\/\//i.test(url)) return "https://" + url.slice(7);
  return url;
}

function qdyImage(value, size) {
  var url = qdyHttps(value);
  if (!url) return QDY_ICON;
  if (/music\.126\.net/i.test(url) && !/[?&]param=/i.test(url)) {
    url += (url.indexOf("?") >= 0 ? "&" : "?") + "param=" + (size || 500) + "y" + (size || 500);
  }
  return url;
}

function qdyParseJSON(value) {
  if (value && typeof value === "object") return value;
  var raw = qdyText(value).replace(/^\uFEFF/, "");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("接口返回了非 JSON 内容");
  }
}

function qdyLooseJSON(value) {
  var raw = qdyText(value).replace(/^\uFEFF/, "");
  try {
    return JSON.parse(raw);
  } catch (error) {
    var output = "";
    var inSingle = false;
    var escaped = false;
    for (var index = 0; index < raw.length; index += 1) {
      var character = raw.charAt(index);
      if (!inSingle) {
        if (character === "'") {
          output += '"';
          inSingle = true;
          escaped = false;
        } else {
          output += character;
        }
        continue;
      }
      if (escaped) {
        if (character === "'") output += "'";
        else if (character === '"') output += '\\"';
        else output += "\\" + character;
        escaped = false;
        continue;
      }
      if (character === "\\") {
        escaped = true;
      } else if (character === "'") {
        output += '"';
        inSingle = false;
      } else if (character === '"') {
        output += '\\"';
      } else {
        output += character;
      }
    }
    return JSON.parse(output);
  }
}

function qdyResponseStatus(response) {
  return Number(
    (response && (response.statusCode || response.status || response.code)) || 200
  );
}

function qdyResponseData(response) {
  if (response && response.data !== undefined) return response.data;
  return response;
}

async function qdyRequest(method, url, data, headers) {
  var options = {
    headers: Object.assign(
      {
        "User-Agent": QDY_USER_AGENT,
        Accept: "application/json,text/plain,*/*"
      },
      headers || {}
    ),
    timeout: QDY_TIMEOUT
  };
  var response =
    String(method).toUpperCase() === "POST"
      ? await Widget.http.post(url, data || {}, options)
      : await Widget.http.get(url, options);
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error("HTTP " + status + ": " + url);
  }
  return qdyResponseData(response);
}

async function qdyGetJSON(url, headers) {
  return qdyParseJSON(await qdyRequest("GET", url, null, headers));
}

async function qdyPostJSON(url, data, headers) {
  return qdyParseJSON(await qdyRequest("POST", url, data || {}, headers));
}

function qdySafeError(error) {
  return error && error.message ? error.message : String(error || "未知错误");
}

function qdyWithTimeout(promise) {
  return Promise.resolve(promise).catch(function () {
    return null;
  });
}

function qdySearchText(params) {
  params = params || {};
  return qdyFirstText(
    params.keyword,
    params.query,
    params.title,
    params.name,
    params.search
  );
}

function qdyQualityLabel(quality) {
  if (quality === "24bit") return "24bit / Hi-Res";
  if (quality === "flac") return "无损 FLAC";
  if (quality === "128k") return "128K MP3";
  return "320K MP3";
}

function qdyDurationText(value) {
  var total = Math.max(0, Math.floor(Number(value || 0)));
  var hours = Math.floor(total / 3600);
  var minutes = Math.floor((total % 3600) / 60);
  var seconds = total % 60;
  return hours
    ? [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
      ].join(":")
    : [
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0")
      ].join(":");
}

function qdyFormatFromURL(value) {
  var match = qdyText(value).match(/\.(flac|mp3|m4a|aac|ogg|wav)(?:[?#]|$)/i);
  if (!match) {
    if (/\/kw\.php\?/i.test(value)) {
      if (/lossless/i.test(value)) return "flac";
    }
    return "";
  }
  return match[1].toUpperCase();
}

function qdyNormalizeSong(value) {
  return qdyStripTags(value)
    .replace(/\(\s*live\s*\)/gi, "")
    .replace(/（\s*live\s*）/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/[^\w\u3400-\u9fff]+/g, "")
    .toLowerCase();
}

function qdySongMatch(left, right) {
  var a = qdyNormalizeSong(left);
  var b = qdyNormalizeSong(right);
  if (!a || !b) return true;
  return a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
}

function qdyArtistText(value) {
  if (Array.isArray(value)) {
    return value
      .map(function (artist) {
        if (artist && typeof artist === "object") {
          return qdyText(artist.name || artist.singerName || artist.artistName);
        }
        return qdyText(artist);
      })
      .filter(Boolean)
      .join(" / ");
  }
  if (value && typeof value === "object") {
    return qdyText(value.name || value.singerName || value.artistName);
  }
  return qdyStripTags(value);
}

function qdyAvailableQuality(value) {
  var text = qdyText(value).toUpperCase();
  var result = [];
  if (/MP3|320|HIGH/.test(text)) result.push("320K");
  if (/FLAC|LOSSLESS|SQ|无损/.test(text)) result.push("FLAC");
  if (/24BIT|HI-?RES|HR|MASTER/.test(text)) result.push("Hi-Res");
  if (!result.length) result.push("可用音质由平台决定");
  return result;
}

function qdyTrackLink(track, collectionKey, episodeNumber) {
  return (
    "quandouya:track?" +
    qdyQuery({
      src: track.source,
      id: track.id,
      t: track.title,
      a: track.artist,
      al: track.album,
      mid: track.qqMid,
      media: track.qqMediaMid,
      hash: track.kugouHash,
      hash320: track.kugou320Hash,
      hashsq: track.kugouSqHash,
      cid: track.copyrightId,
      duration: track.duration,
      lyric: track.lyricUrl,
      key: collectionKey,
      ep: episodeNumber
    })
  );
}

function qdyPublicTrack(track, categoryTitle, collectionKey, episodeNumber) {
  var cover = qdyImage(track.cover, 500);
  var link = qdyTrackLink(track, collectionKey, episodeNumber);
  var sourceName = track.sourceName || qdySourceName(track.source);
  var description = [
    track.artist || "未知歌手",
    track.album || "",
    sourceName,
    track.quality || ""
  ]
    .filter(Boolean)
    .join(" · ");

  var item = {
    id: link,
    type: "url",
    title: track.title || "未知歌曲",
    originalTitle: track.title || "未知歌曲",
    description: description,
    posterPath: cover,
    detailPoster: cover,
    backdropPath: cover,
    backdropPaths: [cover],
    coverUrl: cover,
    rating: Number(track.rating || 0),
    mediaType: collectionKey ? "tv" : "movie",
    genreTitle: qdyText(categoryTitle) || sourceName,
    genreItems: [sourceName, categoryTitle || ""]
      .filter(Boolean)
      .map(function (title, index) {
        return {
          id: "quandouya-genre-" + index + "-" + qdyNormalizeSong(title),
          title: title
        };
      }),
    peoples: track.artist
      ? [{
          id:
            "quandouya-artist-" +
            qdyFirstText(
              track.id,
              track.qqMid,
              track.kugouHash,
              qdyNormalizeSong(track.artist),
              "artist"
            ),
          title: track.artist,
          name: track.artist,
          role: "歌手"
        }]
      : [],
    year: track.year || "",
    country: "",
    language: track.language || "",
    duration: Number(track.duration || 0),
    durationText: qdyDurationText(track.duration),
    season: 1,
    episode: Number(episodeNumber || 1),
    link: link,
    externalUrl: qdyText(track.externalUrl),
    playerType: qdyRuntime.playerType,
    source: "全豆要音源",
    musicSource: track.source,
    musicSourceName: sourceName,
    trackId: qdyText(track.id),
    songmid: qdyText(track.qqMid),
    mediaMid: qdyText(track.qqMediaMid),
    hash: qdyText(track.kugouHash),
    albumName: qdyText(track.album),
    copyrightId: qdyText(track.copyrightId),
    lyricUrl: qdyText(track.lyricUrl),
    hasLyrics: true,
    subtitleLabel: "动态歌词",
    availableQuality: track.availableQuality || []
  };
  if (!collectionKey) {
    delete item.season;
    delete item.episode;
  }
  return item;
}

function qdyNormalizeNetease(raw) {
  raw = raw || {};
  var albumObject = raw.al || raw.album || {};
  var artists = raw.ar || raw.artists || raw.artist || [];
  var album = qdyText(albumObject.name || raw.albumName || raw.album);
  var duration = Number(raw.dt || raw.duration || 0);
  if (duration > 10000) duration = Math.round(duration / 1000);
  var pic =
    albumObject.picUrl ||
    albumObject.blurPicUrl ||
    raw.pic ||
    raw.cover ||
    "";
  var qualityFlags = [
    raw.h || raw.l ? "320K" : "",
    raw.sq ? "FLAC" : "",
    raw.hr ? "Hi-Res" : ""
  ].filter(Boolean);

  return {
    source: "netease",
    sourceName: "网易云音乐",
    id: qdyText(raw.id || raw.url_id),
    title: qdyStripTags(raw.name || raw.title || "未知歌曲"),
    artist: qdyArtistText(artists),
    album: album,
    cover: qdyImage(pic, 500),
    duration: duration,
    rating: Number(raw.pop || 0) / 10,
    quality: qualityFlags.join(" / "),
    availableQuality: qualityFlags,
    externalUrl:
      "https://music.163.com/#/song?id=" +
      encodeURIComponent(qdyText(raw.id || raw.url_id))
  };
}

async function qdySearchNetease(keyword, page, limit) {
  var url =
    QDY_NETEASE_WEB +
    "/cloudsearch/pc?" +
    qdyQuery({
      s: keyword,
      type: 1,
      limit: limit,
      offset: (page - 1) * limit
    });
  try {
    var data = await qdyGetJSON(url, {
      Referer: "https://music.163.com/"
    });
    var songs = (data.result && data.result.songs) || [];
    if (songs.length) {
      return songs.map(qdyNormalizeNetease).filter(function (track) {
        return track.id;
      });
    }
  } catch (error) {
    console.log("[forward.quandouya] 网易云网页搜索失败，切换星海接口:", qdySafeError(error));
  }

  var fallbackURL =
    QDY_NETEASE_API.replace("api.php?", "api.php?") +
    "&" +
    qdyQuery({
      types: "search",
      source: "netease",
      name: keyword,
      count: limit,
      pages: page
    });
  var fallbackData = await qdyGetJSON(fallbackURL, {
    Referer: "https://music.gdstudio.xyz/"
  });
  var fallbackSongs = Array.isArray(fallbackData)
    ? fallbackData
    : (fallbackData.data || []);
  return fallbackSongs.map(qdyNormalizeNetease).filter(function (track) {
    return track.id;
  });
}

function qdyNormalizeQQ(raw) {
  raw = raw || {};
  var singers = raw.singer || raw.singers || [];
  var album = raw.albumname || raw.albumName || "";
  var albumMid = raw.albummid || raw.albumMid || "";
  var cover =
    raw.albumPic ||
    (albumMid
      ? "https://y.gtimg.cn/music/photo_new/T002R500x500M000" + albumMid + ".jpg"
      : "");
  var quality = [];
  if (raw.size320) quality.push("320K");
  if (raw.sizeflac || raw.sizeape) quality.push("FLAC");

  return {
    source: "qq",
    sourceName: "QQ 音乐",
    id: qdyText(raw.songmid || raw.mid),
    qqMid: qdyText(raw.songmid || raw.mid),
    qqMediaMid: qdyText(raw.media_mid || raw.mediaMid || raw.songmid || raw.mid),
    title: qdyStripTags(raw.songname || raw.title || raw.name || "未知歌曲"),
    artist: qdyArtistText(singers),
    album: qdyStripTags(album),
    cover: qdyImage(cover, 500),
    duration: Number(raw.interval || raw.duration || 0),
    rating: Number(raw.popularity || raw.listenCount || 0) / 100000,
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://y.qq.com/n/ryqq/songDetail/" +
      encodeURIComponent(qdyText(raw.songmid || raw.mid))
  };
}

async function qdySearchQQ(keyword, page, limit) {
  var url =
    QDY_QQ_SEARCH +
    "?" +
    qdyQuery({
      format: "json",
      inCharset: "utf8",
      outCharset: "utf-8",
      notice: 0,
      platform: "yqq.json",
      needNewCode: 0,
      w: keyword,
      p: page,
      n: limit
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://y.qq.com/"
  });
  var songs = (data.data && data.data.song && data.data.song.list) || [];
  return songs.map(qdyNormalizeQQ).filter(function (track) {
    return track.id;
  });
}

function qdyKuwoID(value) {
  var match = qdyText(value).match(/(\d+)/);
  return match ? match[1] : "";
}

function qdyNormalizeKuwo(raw) {
  raw = raw || {};
  var id = qdyKuwoID(raw.MUSICRID || raw.DC_TARGETID || raw.id || raw.rid);
  var title = qdyStripTags(raw.SONGNAME || raw.NAME || raw.song || "未知歌曲");
  var artist = qdyStripTags(raw.ARTIST || raw.singer || "");
  var album = qdyStripTags(raw.ALBUM || raw.album || "");
  var cover = qdyImage(raw.picture || raw.PICPATH || "", 500);
  var quality = qdyAvailableQuality(raw.N_MINFO || raw.MINFO || raw.FORMATS);

  return {
    source: "kuwo",
    sourceName: "酷我音乐",
    id: id,
    title: title,
    artist: artist,
    album: album,
    cover: cover,
    duration: Number(raw.DURATION || raw.time || 0),
    rating: Number(raw.SCORE100 || raw.PLAYCNT || 0) / 10,
    language: qdyStripTags(raw.language || ""),
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://www.kuwo.cn/play_detail/" + encodeURIComponent(id)
  };
}

async function qdySearchKuwo(keyword, page, limit) {
  var url =
    QDY_KUWO_SEARCH +
    "?" +
    qdyQuery({
      all: keyword,
      ft: "music",
      itemset: "web_2013",
      client: "kt",
      pn: page - 1,
      rn: limit,
      rformat: "json",
      encoding: "utf8"
    });
  var raw = await qdyRequest("GET", url, null, {
    Referer: "https://www.kuwo.cn/"
  });
  var data = qdyLooseJSON(raw);
  var songs = data.abslist || data.data || [];
  return songs.map(qdyNormalizeKuwo).filter(function (track) {
    return track.id && track.title;
  });
}

function qdyNormalizeKugou(raw) {
  raw = raw || {};
  var quality = [];
  if (raw.HQFileHash || raw.FileHash) quality.push("320K");
  if (raw.SQFileHash) quality.push("FLAC");
  if (raw.SuperFileHash) quality.push("Hi-Res");
  var cover =
    raw.Image ||
    (raw.trans_param && raw.trans_param.union_cover) ||
    raw.AlbumImage ||
    "";
  cover = qdyText(cover).replace(/\{size\}/g, "480");

  return {
    source: "kugou",
    sourceName: "酷狗音乐",
    id: qdyText(raw.FileHash || raw.HQFileHash || raw.SQFileHash),
    title: qdyStripTags(raw.SongName || raw.SongNameOriginal || "未知歌曲"),
    artist: qdyStripTags(raw.SingerName || qdyArtistText(raw.Singers)),
    album: qdyStripTags(raw.AlbumName || ""),
    cover: qdyImage(cover, 500),
    duration: Number(raw.Duration || raw.HQDuration || raw.SQDuration || 0),
    rating: Number(raw.HeatLevel || 0),
    language:
      raw.trans_param && raw.trans_param.language
        ? qdyStripTags(raw.trans_param.language)
        : "",
    kugouHash: qdyText(raw.FileHash),
    kugou320Hash: qdyText(raw.HQFileHash),
    kugouSqHash: qdyText(raw.SQFileHash),
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://www.kugou.com/song/#hash=" +
      encodeURIComponent(qdyText(raw.FileHash))
  };
}

async function qdySearchKugou(keyword, page, limit) {
  var url =
    QDY_KUGOU_SEARCH +
    "?" +
    qdyQuery({
      keyword: keyword,
      page: page,
      pagesize: limit,
      platform: "WebFilter",
      userid: 0,
      clientver: 2000,
      iscorrection: 1,
      privilege_filter: 0,
      filter: 10
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://www.kugou.com/"
  });
  var songs = (data.data && data.data.lists) || [];
  return songs.map(qdyNormalizeKugou).filter(function (track) {
    return track.id && track.title;
  });
}

function qdyMiguCover(raw) {
  var pictures = raw.imgItems || [];
  if (!pictures.length) return "";
  var picture = pictures[pictures.length - 1] || pictures[0] || {};
  return qdyText(picture.img || picture.image || picture.url);
}

function qdyNormalizeMigu(raw) {
  raw = raw || {};
  var rateFormats = raw.rateFormats || [];
  var quality = rateFormats
    .map(function (item) {
      return qdyText(item.formatType || item.format);
    })
    .filter(Boolean);
  if (!quality.length) quality = ["平台可播"];

  return {
    source: "migu",
    sourceName: "咪咕音乐",
    id: qdyText(raw.contentId || raw.id),
    title: qdyStripTags(raw.name || raw.songName || "未知歌曲"),
    artist: qdyArtistText(raw.singers || raw.singer || ""),
    album: qdyText(
      raw.albums && raw.albums[0] && raw.albums[0].name
        ? raw.albums[0].name
        : ""
    ),
    cover: qdyImage(qdyMiguCover(raw), 500),
    duration: 0,
    rating: 0,
    language: Array.isArray(raw.tags) ? qdyText(raw.tags[0]) : "",
    copyrightId: qdyText(raw.copyrightId),
    lyricUrl: qdyText(raw.lyricUrl),
    quality: quality.join(" / "),
    availableQuality: quality,
    externalUrl:
      "https://music.migu.cn/v3/music/song/" +
      encodeURIComponent(qdyText(raw.contentId || raw.id))
  };
}

async function qdySearchMigu(keyword, page, limit) {
  var searchSwitch = JSON.stringify({
    song: 1,
    album: 0,
    singer: 0,
    tag: 0,
    mv: 0,
    playlist: 0
  });
  var url =
    QDY_MIGU_SEARCH +
    "?" +
    qdyQuery({
      text: keyword,
      pageNo: page,
      pageSize: limit,
      searchSwitch: searchSwitch
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.migu.cn/"
  });
  var songs =
    (data.songResultData && data.songResultData.result) ||
    (data.data && data.data.result) ||
    [];
  return songs.map(qdyNormalizeMigu).filter(function (track) {
    return track.id && track.title;
  });
}

function qdyQishuiQuality(value) {
  var quality = qdyQuality(value);
  if (quality === "128k") return "low";
  if (quality === "320k") return "standard";
  if (quality === "flac") return "lossless";
  return "flac24bit";
}

function qdyNormalizeQishui(raw) {
  raw = raw || {};
  return {
    source: "qishui",
    sourceName: "汽水音乐",
    id: qdyText(raw.id || raw.songId || raw.trackId),
    title: qdyStripTags(raw.name || raw.title || "未知歌曲"),
    artist: qdyArtistText(raw.artists || raw.singer || raw.artist),
    album: qdyText(raw.album || raw.albumName),
    cover: qdyImage(raw.cover || raw.pic || raw.coverUrl, 500),
    duration: Number(raw.duration || 0),
    rating: 0,
    language: "",
    quality: "汽水接口音质",
    availableQuality: ["汽水接口音质"],
    externalUrl: ""
  };
}

async function qdySearchQishui(keyword, page, limit) {
  var url =
    QDY_QISHUI_API +
    "?" +
    qdyQuery({
      act: "search",
      keywords: keyword,
      page: page,
      pagesize: limit,
      type: "music"
    });
  var data = await qdyGetJSON(url);
  var songs =
    (data.data && data.data.lists) ||
    (data.data && data.data.list) ||
    [];
  return songs.map(qdyNormalizeQishui).filter(function (track) {
    return track.id && track.title;
  });
}

async function qdySearchSource(source, keyword, page, limit) {
  var tracks = [];
  if (source === "netease") tracks = await qdySearchNetease(keyword, page, limit);
  else if (source === "qq") tracks = await qdySearchQQ(keyword, page, limit);
  else if (source === "kuwo") tracks = await qdySearchKuwo(keyword, page, limit);
  else if (source === "kugou") tracks = await qdySearchKugou(keyword, page, limit);
  else if (source === "migu") tracks = await qdySearchMigu(keyword, page, limit);
  else if (source === "qishui") tracks = await qdySearchQishui(keyword, page, limit);
  return tracks.slice(0, limit);
}

function qdyDedupe(items, limit) {
  var seen = {};
  var result = [];
  for (var index = 0; index < items.length; index += 1) {
    var item = items[index];
    var key = [
      qdyNormalizeSong(item.title),
      qdyNormalizeSong(item.artist)
    ].join("|");
    if (seen[key]) continue;
    seen[key] = true;
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

async function searchQdy(params) {
  params = qdyApplySettings(params || {});
  var keyword = qdySearchText(params);
  if (!keyword) return [];
  var page = qdyPage(params.page);
  var limit = qdyLimit(params);
  var source = qdySource(params.source, "all") || "all";
  if (source !== "all") {
    var sourceTracks = await qdySearchSource(source, keyword, page, limit);
    return sourceTracks.map(function (track) {
      return qdyPublicTrack(track, "搜索 · " + qdySourceName(source));
    });
  }

  var providers = ["netease", "qq", "kuwo", "kugou", "migu"];
  var perProvider = Math.max(6, Math.ceil(limit / providers.length));
  var errors = [];
  var settled = await Promise.all(
    providers.map(function (provider) {
      return qdySearchSource(provider, keyword, page, perProvider).catch(function (error) {
        errors.push(qdySourceName(provider) + ": " + qdySafeError(error));
        return [];
      });
    })
  );
  var merged = [];
  var maxLength = settled.reduce(function (maximum, group) {
    return Math.max(maximum, group.length);
  }, 0);
  for (var index = 0; index < maxLength; index += 1) {
    settled.forEach(function (group) {
      if (group[index]) merged.push(group[index]);
    });
  }
  merged = qdyDedupe(merged, limit);
  if (!merged.length && errors.length) {
    throw new Error("所有平台搜索均失败: " + errors.join("; "));
  }
  return merged.map(function (track) {
    return qdyPublicTrack(track, "全平台搜索");
  });
}

async function qdyNeteasePlaylist(playlist, page, limit) {
  var url =
    QDY_NETEASE_WEB +
    "/v6/playlist/detail?" +
    qdyQuery({ id: playlist.id });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.163.com/"
  });
  var tracks =
    (data.playlist && data.playlist.tracks) ||
    (data.result && data.result.tracks) ||
    [];
  var trackIds =
    (data.playlist && data.playlist.trackIds) ||
    (data.result && data.result.trackIds) ||
    [];
  trackIds = trackIds
    .map(function (entry) {
      return Number(entry && entry.id ? entry.id : entry);
    })
    .filter(function (id) {
      return isFinite(id) && id > 0;
    });
  var trackCount = Number(
    (data.playlist && data.playlist.trackCount) ||
      (data.result && data.result.trackCount) ||
      tracks.length
  );
  if (limit > tracks.length && trackIds.length > tracks.length) {
    var hydratedTracks = [];
    try {
      var wantedIds = trackIds.slice(0, limit);
      for (var idStart = 0; idStart < wantedIds.length; idStart += 400) {
        var idChunk = wantedIds.slice(idStart, idStart + 400);
        var detailURL =
          QDY_NETEASE_WEB +
          "/v3/song/detail?" +
          qdyQuery({
            c: JSON.stringify(
              idChunk.map(function (id) {
                return { id: id };
              })
            )
          });
        var detailData = await qdyGetJSON(detailURL, {
          Referer: "https://music.163.com/"
        });
        hydratedTracks = hydratedTracks.concat(
          (detailData && detailData.songs) || []
        );
      }
      if (hydratedTracks.length) {
        var hydratedById = {};
        hydratedTracks.forEach(function (song) {
          if (song && song.id) hydratedById[String(song.id)] = song;
        });
        var orderedTracks = wantedIds
          .map(function (id) {
            return hydratedById[String(id)];
          })
          .filter(Boolean);
        if (orderedTracks.length > tracks.length) tracks = orderedTracks;
      }
    } catch (error) {
      console.log(
        "[forward.quandouya] 歌单完整歌曲补全失败，继续尝试备用接口:",
        qdySafeError(error)
      );
    }
  }
  if (limit > tracks.length && trackCount > tracks.length) {
    try {
      var fullURL =
        QDY_NETEASE_API +
        "&" +
        qdyQuery({
          types: "playlist",
          source: "netease",
          id: playlist.id
        });
      var fullData = await qdyGetJSON(fullURL, {
        Referer: "https://music.gdstudio.xyz/"
      });
      var fullTracks =
        (fullData.playlist && fullData.playlist.tracks) ||
        (fullData.result && fullData.result.tracks) ||
        [];
      if (fullTracks.length > tracks.length) tracks = fullTracks;
    } catch (error) {
      console.log(
        "[forward.quandouya] 完整歌单读取失败，使用首屏结果:",
        qdySafeError(error)
      );
    }
  }
  var start = (page - 1) * limit;
  return tracks
    .slice(start, start + limit)
    .map(qdyNormalizeNetease)
    .filter(function (track) {
      return track.id;
    });
}

function qdyCollectionLink(key) {
  return (
    "quandouya:collection?" +
    qdyQuery({
      key: key
    })
  );
}

async function qdyCategoryTracks(params, key) {
  params = qdyApplySettings(params || {});
  var playlist = qdyPlaylists[key];
  if (!playlist) throw new Error("无法识别音乐分类");
  var configuredLimit = qdyQueueLimit(params);
  var fetchLimit = configuredLimit || 1000;
  var cacheKey = key + "|" + (configuredLimit || "all");
  var cached = qdyCollectionCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < 600000) {
    return cached.tracks;
  }
  var tracks = [];
  try {
    tracks = await qdyNeteasePlaylist(playlist, 1, fetchLimit);
    if (tracks.length) {
      qdyCollectionCache[cacheKey] = {
        tracks: tracks,
        timestamp: Date.now()
      };
      return tracks;
    }
  } catch (error) {
    console.log(
      "[forward.quandouya] 分类歌单读取失败，改按关键词搜索:",
      playlist.title,
      qdySafeError(error)
    );
  }
  tracks = await qdySearchNetease(
    playlist.keyword,
    1,
    fetchLimit
  );
  if (!tracks.length) throw new Error("当前分类没有可播放歌曲");
  qdyCollectionCache[cacheKey] = {
    tracks: tracks,
    timestamp: Date.now()
  };
  return tracks;
}

function qdyCategoryCollectionItem(key, tracks) {
  var playlist = qdyPlaylists[key];
  var first = tracks[0] || {};
  var cover = qdyImage(first.cover || playlist.cover, 500);
  var link = qdyCollectionLink(key);
  var totalCount = tracks.length || Number(playlist.count || 0);
  return {
    id: link,
    type: "url",
    title: playlist.title,
    originalTitle: playlist.title,
    description:
      totalCount +
      " 首歌曲 · 支持任意切换与自动续播 · 全豆要音源",
    posterPath: cover,
    detailPoster: cover,
    backdropPath: cover,
    backdropPaths: cover ? [cover] : [],
    coverUrl: cover,
    rating: 0,
    mediaType: "other",
    genreTitle: playlist.title,
    genreItems: [],
    peoples: [],
    link: link,
    externalUrl: link,
    source: "全豆要音源"
  };
}

function qdyCollectionEpisodes(tracks, categoryTitle, collectionKey) {
  return tracks.map(function (track, index) {
    var item = qdyPublicTrack(track, categoryTitle, collectionKey, index + 1);
    item.season = 1;
    item.episode = index + 1;
    item.episodeNumber = index + 1;
    item.number = index + 1;
    item.mediaType = "tv";
    item.playerType = qdyRuntime.playerType;
    return item;
  });
}

function qdyCompleteCollection(key, tracks) {
  var playlist = qdyPlaylists[key];
  var collection = qdyCategoryCollectionItem(key, tracks);
  var children = qdyCollectionEpisodes(tracks, playlist.title, key);
  collection.mediaType = "tv";
  collection.season = 1;
  collection.episodeCount = children.length;
  collection.episodeItems = children;
  collection.description =
    children.length +
    " 首歌曲 · 手动切换 / 自动续播 · 播放画面同步歌词 · 全豆要音源";
  return collection;
}

async function qdyCategory(params, key) {
  params = qdyApplySettings(params || {});
  var tracks = await qdyCategoryTracks(params, key);
  var playlist = qdyPlaylists[key];
  return tracks.map(function (track, index) {
    return qdyPublicTrack(
      track,
      playlist.title,
      key,
      index + 1
    );
  });
}

async function loadDetail(link, params) {
  params = qdyApplySettings(params || {});
  var raw =
    link && typeof link === "object"
      ? qdyFirstText(link.link, link.externalUrl, link.id)
      : qdyText(link);
  var parsed = qdyParseLink(raw);
  if (parsed.src) {
    if (parsed.key && qdyPlaylists[parsed.key]) {
      var queueTracks = await qdyCategoryTracks(params, parsed.key);
      var collection = qdyCompleteCollection(parsed.key, queueTracks);
      var selectedEpisode = parseInt(parsed.ep, 10);
      if (isFinite(selectedEpisode) && selectedEpisode > 0) {
        collection.episode = selectedEpisode;
      }
      return collection;
    }
    var trackItem = qdyTrackFromParams({ link: raw });
    return qdyPublicTrack(trackItem, "全豆要音源");
  }
  var key = qdyText(parsed.key);
  if (!key || !qdyPlaylists[key]) {
    throw new Error("无法识别音乐分类详情");
  }
  var tracks = await qdyCategoryTracks(params, key);
  return qdyCompleteCollection(key, tracks);
}

async function latestAllV2(params) {
  return qdyCategory(params, "latestAll");
}

async function categoryMandarinV2(params) {
  return qdyCategory(params, "categoryMandarin");
}

async function categoryWesternV2(params) {
  return qdyCategory(params, "categoryWestern");
}

async function categoryCantoneseV2(params) {
  return qdyCategory(params, "categoryCantonese");
}

async function categoryInstrumentalV2(params) {
  return qdyCategory(params, "categoryInstrumental");
}

async function categoryElectronicV2(params) {
  return qdyCategory(params, "categoryElectronic");
}

async function categoryRockV2(params) {
  return qdyCategory(params, "categoryRock");
}

async function categoryFolkV2(params) {
  return qdyCategory(params, "categoryFolk");
}

function qdyParseLink(value) {
  var raw = qdyText(value);
  var question = raw.indexOf("?");
  if (raw.indexOf("quandouya:") < 0 || question < 0) return {};
  var result = {};
  raw
    .slice(question + 1)
    .split("&")
    .forEach(function (part) {
      if (!part) return;
      var separator = part.indexOf("=");
      var key = separator >= 0 ? part.slice(0, separator) : part;
      var value = separator >= 0 ? part.slice(separator + 1) : "";
      try {
        result[decodeURIComponent(key)] = decodeURIComponent(value);
      } catch (error) {
        result[key] = value;
      }
    });
  return result;
}

function qdyTrackFromParams(params) {
  params = params || {};
  var objects = [
    params.link,
    params.item,
    params.resource,
    params.episode,
    params.media,
    params.track,
    params.externalUrl,
    params.id
  ];
  var record = params;
  for (var index = 0; index < objects.length; index += 1) {
    if (objects[index] && typeof objects[index] === "object") {
      record = objects[index];
      break;
    }
    if (
      typeof objects[index] === "string" &&
      /^\s*\{/.test(objects[index])
    ) {
      try {
        record = JSON.parse(objects[index]);
        break;
      } catch (error) {}
    }
  }
  var linkValue = qdyFirstText(
    typeof params.link === "string" ? params.link : "",
    typeof params.url === "string" && params.url.indexOf("quandouya:") === 0
      ? params.url
      : "",
    typeof record.link === "string" ? record.link : "",
    typeof record.externalUrl === "string" ? record.externalUrl : "",
    typeof record.id === "string" ? record.id : "",
    typeof params.id === "string" ? params.id : "",
    typeof params.externalUrl === "string" ? params.externalUrl : ""
  );
  var parsed = qdyParseLink(linkValue);
  var source = qdySource(
    parsed.src ||
      record.musicSource ||
      record.trackSource ||
      record.source ||
      params.musicSource ||
      params.trackSource ||
      params.source,
    ""
  );
  return {
    link: linkValue,
    source: source,
    id: qdyFirstText(
      parsed.id,
      record.trackId,
      record.musicId,
      record.songId,
      params.trackId,
      params.musicId,
      params.songId,
      parsed.id
    ),
    title: qdyFirstText(
      parsed.t,
      record.title,
      record.name,
      record.songName,
      params.title,
      params.name,
      params.songName
    ),
    artist: qdyFirstText(
      parsed.a,
      record.artist,
      record.singer,
      record.artists,
      params.artist,
      params.singer,
      params.artists
    ),
    album: qdyFirstText(
      parsed.al,
      record.album,
      record.albumName,
      params.album,
      params.albumName
    ),
    qqMid: qdyFirstText(
      parsed.mid,
      record.songmid,
      record.qqMid,
      params.songmid,
      params.qqMid
    ),
    qqMediaMid: qdyFirstText(
      parsed.media,
      record.mediaMid,
      params.mediaMid
    ),
    kugouHash: qdyFirstText(parsed.hash, record.hash, params.hash),
    kugou320Hash: qdyFirstText(record.hash320, params.hash320),
    kugouSqHash: qdyFirstText(record.hashsq, params.hashsq),
    copyrightId: qdyFirstText(
      parsed.cid,
      record.copyrightId,
      params.copyrightId
    ),
    lyricUrl: qdyFirstText(parsed.lyric, record.lyricUrl, params.lyricUrl),
    duration: Number(
      qdyFirstText(parsed.duration, record.duration, params.duration) || 0
    ),
    cover: qdyFirstText(
      record.coverUrl,
      record.cover,
      record.posterPath,
      params.coverUrl,
      params.cover,
      params.posterPath
    )
  };
}

function qdyValidateAudioURL(url) {
  var value = qdyText(url);
  if (!/^https?:\/\//i.test(value)) {
    throw new Error("线路没有返回有效的 HTTP 音频地址");
  }
  return value;
}

async function qdyResolveNetease(track, quality) {
  if (!track.id) throw new Error("网易云歌曲缺少 ID");
  var br = quality === "128k" ? "128" : quality === "flac" || quality === "24bit" ? "740" : "320";
  if (quality === "24bit") br = "999";
  var url =
    QDY_NETEASE_API +
    "&" +
    qdyQuery({
      types: "url",
      source: "netease",
      id: track.id,
      br: br
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.gdstudio.xyz/"
  });
  if (!data || !data.url) {
    throw new Error((data && (data.message || data.detail)) || "网易云未返回音频地址");
  }
  var extension = qdyFormatFromURL(data.url);
  var bitrate = Number(data.br || 0);
  var resolvedQuality =
    extension === "FLAC"
      ? "无损 FLAC"
      : extension
        ? (bitrate ? bitrate + "K " : "") + extension
        : bitrate >= 740
          ? "无损 FLAC"
          : bitrate
            ? bitrate + "K MP3"
            : qdyQualityLabel(quality);
  return {
    url: qdyValidateAudioURL(data.url),
    provider: "网易云音乐",
    source: "netease",
    line: "星海主线路",
    quality: resolvedQuality
  };
}

function qdyQQFileCandidates(track, quality) {
  var mediaMid = qdyText(track.qqMediaMid || track.qqMid);
  if (!mediaMid) return [];
  var files = [];
  if (quality === "flac" || quality === "24bit") {
    files.push("F000" + mediaMid + ".flac");
  }
  if (quality === "320k" || quality === "flac" || quality === "24bit") {
    files.push("M800" + mediaMid + ".mp3");
  }
  files.push("M500" + mediaMid + ".mp3");
  files.push("C400" + mediaMid + ".m4a");
  return files.filter(function (file, index, list) {
    return list.indexOf(file) === index;
  });
}

async function qdyQQURLForFile(mid, filename) {
  var payload = {
    req_0: {
      module: "vkey.GetVkeyServer",
      method: "CgiGetVkey",
      param: {
        guid: "10000",
        songmid: [mid],
        filename: [filename],
        songtype: [0],
        uin: "0",
        loginflag: 1,
        platform: "20"
      }
    },
    comm: {
      uin: 0,
      format: "json",
      ct: 24,
      cv: 0
    }
  };
  var url =
    QDY_QQ_VKEY +
    "?" +
    qdyQuery({
      format: "json",
      data: JSON.stringify(payload)
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://y.qq.com/"
  });
  var info =
    data.req_0 &&
    data.req_0.data &&
    data.req_0.data.midurlinfo &&
    data.req_0.data.midurlinfo[0];
  if (!info || !info.purl) return "";
  var servers =
    (data.req_0.data && data.req_0.data.sip) || [
      "https://aqqmusic.tc.qq.com/"
    ];
  var base =
    servers.find(function (server) {
      return /^https:\/\//i.test(server);
    }) || qdyHttps(servers[0] || "https://aqqmusic.tc.qq.com/");
  return base.replace(/\/+$/, "") + "/" + info.purl.replace(/^\/+/, "");
}

async function qdyResolveQQ(track, quality) {
  var mid = qdyText(track.qqMid || track.id);
  if (!mid) throw new Error("QQ 音乐歌曲缺少 songmid");
  var files = qdyQQFileCandidates(track, quality);
  var lastError = null;
  for (var index = 0; index < files.length; index += 1) {
    try {
      var url = await qdyQQURLForFile(mid, files[index]);
      if (url) {
        var fileQuality =
          /^F000/i.test(files[index])
            ? "无损 FLAC"
            : /^M800/i.test(files[index])
              ? "320K MP3"
              : /^M500/i.test(files[index])
                ? "128K MP3"
                : qdyFormatFromURL(url) || qdyQualityLabel(quality);
        return {
          url: qdyValidateAudioURL(url),
          provider: "QQ 音乐",
          source: "qq",
          line: "QQ 音乐直链",
          quality: fileQuality
        };
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    "QQ 音乐未返回可播放地址" +
      (lastError ? "（" + qdySafeError(lastError) + "）" : "，歌曲可能受会员版权限制")
  );
}

function qdyKuwoLevel(quality) {
  if (quality === "128k") return "standard";
  if (quality === "320k") return "exhigh";
  return "lossless";
}

async function qdyResolveKuwo(track, quality) {
  var id = qdyKuwoID(track.id);
  if (!id) {
    var candidates = await qdySearchKuwo(
      [track.title, track.artist].filter(Boolean).join(" "),
      1,
      8
    );
    var matched = candidates.find(function (item) {
      return qdySongMatch(item.title, track.title);
    });
    if (!matched) throw new Error("酷我没有找到匹配歌曲");
    id = qdyKuwoID(matched.id);
  }
  if (!id) throw new Error("酷我歌曲缺少 rid");
  var url =
    QDY_KUWO_PLAY +
    "&" +
    qdyQuery({
      id: id,
      level: qdyKuwoLevel(quality)
    });
  return {
    url: qdyValidateAudioURL(url),
    provider: "酷我音乐",
    source: "kuwo",
    line: "长青 SVIP 线路",
    quality: qdyQualityLabel(quality)
  };
}

function qdyKugouHash(track, quality) {
  if ((quality === "flac" || quality === "24bit") && track.kugouSqHash) {
    return track.kugouSqHash;
  }
  if ((quality === "320k" || quality === "flac" || quality === "24bit") && track.kugou320Hash) {
    return track.kugou320Hash;
  }
  return qdyText(track.kugouHash || track.id);
}

async function qdyResolveKugou(track, quality) {
  var hash = qdyKugouHash(track, quality);
  if (!hash) throw new Error("酷狗歌曲缺少 hash");
  var url =
    QDY_KUGOU_PLAY +
    "?" +
    qdyQuery({
      cmd: "playInfo",
      hash: hash
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://www.kugou.com/"
  });
  if (!data.url) {
    throw new Error(data.error || "酷狗未返回音频地址，歌曲可能受会员版权限制");
  }
  return {
    url: qdyValidateAudioURL(data.url),
    provider: "酷狗音乐",
    source: "kugou",
    line: "酷狗移动线路",
    quality: qdyFormatFromURL(data.url) || qdyQualityLabel(quality)
  };
}

function qdyFirstURL(value, depth) {
  if (depth > 5 || value === null || value === undefined) return "";
  if (typeof value === "string") {
    return /^https?:\/\//i.test(value) ? value : "";
  }
  if (Array.isArray(value)) {
    for (var index = 0; index < value.length; index += 1) {
      var arrayURL = qdyFirstURL(value[index], depth + 1);
      if (arrayURL) return arrayURL;
    }
    return "";
  }
  if (typeof value === "object") {
    var keys = [
      "url",
      "playUrl",
      "listenUrl",
      "auditionUrl",
      "audioUrl",
      "src"
    ];
    for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      var direct = qdyFirstURL(value[keys[keyIndex]], depth + 1);
      if (direct) return direct;
    }
    var objectKeys = Object.keys(value);
    for (var objectIndex = 0; objectIndex < objectKeys.length; objectIndex += 1) {
      var nested = qdyFirstURL(value[objectKeys[objectIndex]], depth + 1);
      if (nested) return nested;
    }
  }
  return "";
}

async function qdyResolveMigu(track, quality) {
  if (!track.id) throw new Error("咪咕歌曲缺少 contentId");
  var toneFlag =
    quality === "flac" || quality === "24bit"
      ? "SQ"
      : quality === "320k"
        ? "HQ"
        : "PQ";
  var url =
    QDY_MIGU_PLAY +
    "?" +
    qdyQuery({
      toneFlag: toneFlag,
      netType: "00",
      userId: "1554861458870011",
      ua: "Android_migu",
      version: "5.0.1",
      copyrightId: track.copyrightId,
      contentId: track.id,
      resourceType: 2,
      channel: "0146921"
    });
  var raw = await qdyRequest("GET", url, null, {
    Referer: "https://music.migu.cn/"
  });
  var data = qdyParseJSON(raw);
  var audioURL = qdyFirstURL(data, 0);
  if (!audioURL) {
    throw new Error(
      data.info ||
        data.message ||
        "咪咕暂不提供试听地址，歌曲可能受版权限制"
    );
  }
  return {
    url: qdyValidateAudioURL(audioURL),
    provider: "咪咕音乐",
    source: "migu",
    line: "咪咕试听线路",
    quality: qdyFormatFromURL(audioURL) || qdyQualityLabel(quality)
  };
}

async function qdyResolveQishui(track, quality) {
  if (!track.id) throw new Error("汽水歌曲缺少 ID");
  var url =
    QDY_QISHUI_API +
    "?" +
    qdyQuery({
      act: "song",
      id: track.id,
      quality: qdyQishuiQuality(quality)
    });
  var data = await qdyGetJSON(url);
  var item =
    (Array.isArray(data.data) && data.data[0]) ||
    (data.data && data.data.data) ||
    data.data ||
    {};
  if (!item.url) {
    throw new Error("汽水接口未返回音频地址");
  }
  var audioURL = item.url;
  if (item.ekey) {
    var proxy = await qdyPostJSON(QDY_QISHUI_PROXY, {
      url: item.url,
      key: item.ekey,
      filename: item.filename || "KMusic",
      ext: item.fileExtension || "aac"
    });
    if (Number(proxy.code) !== 200 || !proxy.url) {
      throw new Error("汽水代理解密失败");
    }
    audioURL = proxy.url;
  }
  return {
    url: qdyValidateAudioURL(audioURL),
    provider: "汽水音乐",
    source: "qishui",
    line: "汽水 VIP 线路",
    quality: qdyFormatFromURL(audioURL) || qdyQualityLabel(quality)
  };
}

function qdyLyricCacheKey(track) {
  return [
    qdyText(track.source),
    qdyText(track.id),
    qdyNormalizeSong(track.title),
    qdyNormalizeSong(track.artist)
  ].join("|");
}

function qdyLRCTime(seconds) {
  var value = Math.max(0, Number(seconds || 0));
  var minutes = Math.floor(value / 60);
  var remain = value - minutes * 60;
  return (
    String(minutes).padStart(2, "0") +
    ":" +
    remain.toFixed(3).padStart(6, "0")
  );
}

function qdyParseLRC(value) {
  var raw = qdyText(value)
    .replace(/\r/g, "")
    .replace(/\uFEFF/g, "");
  if (!raw) return [];

  var offset = 0;
  var offsetMatch = raw.match(/\[offset\s*:\s*(-?\d+)\]/i);
  if (offsetMatch) offset = Number(offsetMatch[1]) / 1000;

  var grouped = {};
  raw.split("\n").forEach(function (line) {
    if (!line || /^\s*\[(ti|ar|al|by|re|ve|offset|length|kana|language)\s*:/i.test(line)) {
      return;
    }
    var timestamps = [];
    var stampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    var stamp;
    while ((stamp = stampPattern.exec(line))) {
      var fraction = Number(
        ("0." + String(stamp[3] || "0").padEnd(3, "0").slice(0, 3))
      );
      timestamps.push(
        Number(stamp[1]) * 60 +
          Number(stamp[2]) +
          (isFinite(fraction) ? fraction : 0)
      );
    }
    if (!timestamps.length) return;

    var text = qdyStripTags(
      line.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ")
    );
    if (!text) return;
    timestamps.forEach(function (time) {
      var adjusted = Math.max(0, time + offset);
      var key = adjusted.toFixed(3);
      if (!grouped[key]) grouped[key] = [];
      if (grouped[key].indexOf(text) < 0) grouped[key].push(text);
    });
  });

  return Object.keys(grouped)
    .map(function (key) {
      return {
        start: Number(key),
        text: grouped[key].join("\n")
      };
    })
    .filter(function (line) {
      return line.text && line.start >= 0;
    })
    .sort(function (left, right) {
      return left.start - right.start;
    })
    .slice(0, 800);
}

function qdyKuwoLRC(data) {
  var rows =
    (data && data.data && data.data.lrclist) ||
    (data && data.lrclist) ||
    [];
  return rows
    .map(function (row) {
      var time = Number(row.time || row.timeStart || 0);
      var lyric = qdyText(row.lineLyric || row.lyric || row.text);
      return lyric ? "[" + qdyLRCTime(time) + "]" + lyric : "";
    })
    .filter(Boolean)
    .join("\n");
}

function qdyVTTTime(seconds) {
  var totalMillis = Math.round(Math.max(0, Number(seconds || 0)) * 1000);
  var hours = Math.floor(totalMillis / 3600000);
  var minutes = Math.floor((totalMillis % 3600000) / 60000);
  var whole = Math.floor((totalMillis % 60000) / 1000);
  var millis = totalMillis % 1000;
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(whole).padStart(2, "0") +
    "." +
    String(millis).padStart(3, "0")
  );
}

function qdyVTTText(value) {
  return qdyText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .replace(/-->/g, "→");
}

function qdyLRCRollingText(lines, index) {
  var current = qdyVTTText(lines[index].text);
  if (qdyRuntime.lyricStyle !== "scroll") return current;
  return [-2, -1, 0, 1, 2]
    .map(function (offset) {
      var target = lines[index + offset];
      if (offset === 0) return current;
      return target ? qdyVTTText(target.text) : "\u00A0";
    })
    .join("\n");
}

function qdyLyricCueEnd(lines, index, duration) {
  var start = Number(lines[index].start || 0);
  var next = lines[index + 1];
  if (next && Number(next.start) > start) return Number(next.start);
  var trackEnd = Number(duration || 0);
  if (isFinite(trackEnd) && trackEnd > start) return trackEnd;
  return start + 3600;
}

function qdyLRCToVTT(lines, duration) {
  if (!Array.isArray(lines) || !lines.length) return "";
  var cues = [];
  lines.forEach(function (line, index) {
    var start = Number(line.start || 0);
    var end = qdyLyricCueEnd(lines, index, duration);
    if (end - start < 0.35) end = start + 0.35;
    var text = qdyLRCRollingText(lines, index);
    if (!text) return;
    cues.push(
      qdyVTTTime(start) +
        " --> " +
        qdyVTTTime(end) +
        " align:center position:50% line:" +
        qdyRuntime.lyricLine +
        "% size:88%\n" +
        text
    );
  });
  if (!cues.length) return "";
  return "WEBVTT\n\nNOTE 全豆要音源动态歌词\n\n" + cues.join("\n\n") + "\n";
}

function qdyASSTime(seconds) {
  var value = Math.max(0, Number(seconds || 0));
  var hours = Math.floor(value / 3600);
  var minutes = Math.floor((value % 3600) / 60);
  var whole = Math.floor(value % 60);
  var centis = Math.floor((value - Math.floor(value)) * 100);
  return (
    hours +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(whole).padStart(2, "0") +
    "." +
    String(centis).padStart(2, "0")
  );
}

function qdyASSText(value) {
  return qdyText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "（")
    .replace(/\}/g, "）")
    .replace(/\n/g, "\\N");
}

function qdyLRCToASS(lines, duration) {
  if (!Array.isArray(lines) || !lines.length) return "";
  var centerY = Math.round(
    1080 * Math.max(35, Math.min(72, qdyRuntime.lyricLine)) / 100
  );
  var scrollMode = qdyRuntime.lyricStyle === "scroll";
  var rowOffset = 88;
  var header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1920",
    "PlayResY: 1080",
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 0",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: LyricPrev2,PingFang SC,38,&H00A8B0B8,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,5,160,160,0,1",
    "Style: LyricPrev1,PingFang SC,50,&H00C9D0D8,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,1,5,140,140,0,1",
    "Style: LyricCurrent,PingFang SC,68,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,3,1,5,120,120,0,1",
    "Style: LyricNext1,PingFang SC,50,&H00C9D0D8,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,1,5,140,140,0,1",
    "Style: LyricNext2,PingFang SC,38,&H00A8B0B8,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,5,160,160,0,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ];
  var events = [];
  lines.forEach(function (line, index) {
    var start = Number(line.start || 0);
    var end = qdyLyricCueEnd(lines, index, duration);
    if (end - start < 0.35) end = start + 0.35;
    var previous2Text =
      index > 1 ? qdyASSText(lines[index - 2].text) : "";
    var previous1Text =
      index > 0 ? qdyASSText(lines[index - 1].text) : "";
    var currentText = qdyASSText(line.text);
    var next1Text =
      index + 1 < lines.length ? qdyASSText(lines[index + 1].text) : "";
    var next2Text =
      index + 2 < lines.length ? qdyASSText(lines[index + 2].text) : "";
    var rows = scrollMode
      ? [
          {
            style: "LyricPrev2",
            fromY: centerY - rowOffset,
            toY: centerY - rowOffset * 2,
            text: previous2Text
          },
          {
            style: "LyricPrev1",
            fromY: centerY,
            toY: centerY - rowOffset,
            text: previous1Text
          },
          {
            style: "LyricCurrent",
            fromY: centerY + rowOffset,
            toY: centerY,
            text: currentText
          },
          {
            style: "LyricNext1",
            fromY: centerY + rowOffset * 2,
            toY: centerY + rowOffset,
            text: next1Text
          },
          {
            style: "LyricNext2",
            fromY: centerY + rowOffset * 3,
            toY: centerY + rowOffset * 2,
            text: next2Text
          }
        ]
      : [
          {
            style: "LyricCurrent",
            fromY: centerY,
            toY: centerY,
            text: currentText
          }
        ];
    rows.forEach(function (row) {
      if (!row.text) return;
      var position =
        row.fromY === row.toY
          ? "\\an5\\pos(960," + row.toY + ")"
          : "\\an5\\move(960," +
            row.fromY +
            ",960," +
            row.toY +
            ",0,300)";
      events.push(
        "Dialogue: 0," +
          qdyASSTime(start) +
          "," +
          qdyASSTime(end) +
          "," +
          row.style +
          ",,0,0,0,,{" +
          position +
          "}" +
          row.text
      );
    });
  });
  return header.concat(events).join("\n") + "\n";
}

function qdyTextFromNeteaseLyric(data) {
  return qdyText(
    (data && data.lrc && data.lrc.lyric) ||
      (data && data.lyric) ||
      ""
  );
}

async function qdyNeteaseLyric(id) {
  if (!id) return "";
  var url =
    QDY_NETEASE_WEB +
    "/song/lyric?" +
    qdyQuery({
      id: id,
      lv: -1,
      kv: -1,
      tv: -1
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://music.163.com/"
  });
  return qdyTextFromNeteaseLyric(data);
}

async function qdyQQLyric(songmid) {
  if (!songmid) return "";
  var url =
    "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?" +
    qdyQuery({
      songmid: songmid,
      format: "json",
      nobase64: 1,
      g_tk: 5381
    });
  var data = await qdyGetJSON(url, {
    Referer: "https://y.qq.com/"
  });
  return qdyText(data.lyric || (data.data && data.data.lyric));
}

async function qdyKuwoLyric(id) {
  var musicId = qdyKuwoID(id);
  if (!musicId) return "";
  var url =
    "https://m.kuwo.cn/newh5/singles/songinfoandlrc?" +
    qdyQuery({ musicId: musicId });
  var data = await qdyGetJSON(url, {
    Referer: "https://www.kuwo.cn/"
  });
  return qdyKuwoLRC(data);
}

async function qdyMiguLyric(url) {
  if (!/^https?:\/\//i.test(qdyText(url))) return "";
  return qdyText(
    await qdyRequest("GET", qdyText(url), null, {
      Referer: "https://music.migu.cn/"
    })
  );
}

async function qdyQishuiLyric(id) {
  if (!id) return "";
  var url =
    QDY_QISHUI_API +
    "?" +
    qdyQuery({
      act: "lyric",
      id: id
    });
  var data = await qdyGetJSON(url);
  return qdyText(
    data.lyric ||
      (data.data && (data.data.lyric || data.data.lrc)) ||
      ""
  );
}

function qdyLyricCandidateScore(candidate, track) {
  if (!candidate || !candidate.title || !track.title) return -1;
  var titleA = qdyNormalizeSong(candidate.title);
  var titleB = qdyNormalizeSong(track.title);
  if (!titleA || !titleB) return -1;
  if (titleA !== titleB && titleA.indexOf(titleB) < 0 && titleB.indexOf(titleA) < 0) {
    return -1;
  }
  var score = titleA === titleB ? 12 : 7;
  var artistA = qdyNormalizeSong(candidate.artist);
  var artistB = qdyNormalizeSong(track.artist);
  if (artistA && artistB) {
    if (artistA === artistB) score += 6;
    else if (artistA.indexOf(artistB) >= 0 || artistB.indexOf(artistA) >= 0) score += 4;
    else score -= 3;
  }
  var albumA = qdyNormalizeSong(candidate.album);
  var albumB = qdyNormalizeSong(track.album);
  if (albumA && albumB && (albumA === albumB || albumA.indexOf(albumB) >= 0 || albumB.indexOf(albumA) >= 0)) {
    score += 2;
  }
  if (track.duration && candidate.duration) {
    var difference = Math.abs(Number(track.duration) - Number(candidate.duration));
    if (difference <= 3) score += 3;
    else if (difference <= 8) score += 1;
    else if (difference > 20) score -= 2;
  }
  return score;
}

function qdyBestLyricCandidate(candidates, track) {
  var best = null;
  var bestScore = -1;
  (candidates || []).forEach(function (candidate) {
    var score = qdyLyricCandidateScore(candidate, track);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  });
  return bestScore >= 4 ? best : null;
}

async function qdyDirectLyric(track) {
  if (track.source === "netease" && track.id) {
    return {
      text: await qdyNeteaseLyric(track.id),
      provider: "网易云音乐"
    };
  }
  if (track.source === "qq" && (track.qqMid || track.id)) {
    return {
      text: await qdyQQLyric(track.qqMid || track.id),
      provider: "QQ 音乐"
    };
  }
  if (track.source === "kuwo" && track.id) {
    return {
      text: await qdyKuwoLyric(track.id),
      provider: "酷我音乐"
    };
  }
  if (track.source === "migu" && track.lyricUrl) {
    return {
      text: await qdyMiguLyric(track.lyricUrl),
      provider: "咪咕音乐"
    };
  }
  if (track.source === "qishui" && track.id) {
    return {
      text: await qdyQishuiLyric(track.id),
      provider: "汽水音乐"
    };
  }
  return { text: "", provider: "" };
}

async function qdyNeteaseLyricFallback(track) {
  if (!track.title) return "";
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchNetease(keyword, 1, 12);
  var matched = qdyBestLyricCandidate(songs, track);
  return matched ? qdyNeteaseLyric(matched.id) : "";
}

async function qdyQQLyricFallback(track) {
  if (!track.title) return "";
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchQQ(keyword, 1, 12);
  var matched = qdyBestLyricCandidate(songs, track);
  return matched ? qdyQQLyric(matched.qqMid || matched.id) : "";
}

async function qdyKuwoLyricFallback(track) {
  if (!track.title) return "";
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchKuwo(keyword, 1, 12);
  var matched = qdyBestLyricCandidate(songs, track);
  return matched ? qdyKuwoLyric(matched.id) : "";
}

async function qdyFetchLyric(track) {
  var key = qdyLyricCacheKey(track);
  if (qdyLyricCache[key]) return qdyLyricCache[key];

  var attempts = [
    function () {
      return qdyDirectLyric(track);
    },
    function () {
      return qdyNeteaseLyricFallback(track).then(function (text) {
        return { text: text, provider: "网易云匹配歌词" };
      });
    },
    function () {
      return qdyQQLyricFallback(track).then(function (text) {
        return { text: text, provider: "QQ 音乐匹配歌词" };
      });
    },
    function () {
      return qdyKuwoLyricFallback(track).then(function (text) {
        return { text: text, provider: "酷我匹配歌词" };
      });
    }
  ];

  var errors = [];
  for (var index = 0; index < attempts.length; index += 1) {
    try {
      var result = await attempts[index]();
      var lines = qdyParseLRC(result && result.text);
      if (lines.length >= 2) {
        var value = {
          lines: lines,
          text: result.text,
          provider: result.provider,
          vtt: qdyLRCToVTT(lines, track.duration),
          ass: qdyLRCToASS(lines, track.duration)
        };
        qdyLyricCache[key] = value;
        return value;
      }
    } catch (error) {
      errors.push(qdySafeError(error));
    }
  }
  if (errors.length) {
    console.log("[forward.quandouya] 歌词读取失败:", errors.join("; "));
  }
  return null;
}

function qdySubtitleServiceURL() {
  var value = qdyText(qdyRuntime.subtitleService).replace(/\/+$/, "");
  return /^https?:\/\/[^/\s]+/i.test(value) ? value : "";
}

function qdySubtitleResponseURL(response, providerLabel) {
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error(providerLabel + " HTTP " + status);
  }
  var body = qdyResponseData(response);
  var parsed = body;
  if (typeof body === "string") {
    try {
      parsed = qdyParseJSON(body);
    } catch (error) {
      parsed = body;
    }
  }
  var hosted =
    parsed && typeof parsed === "object"
      ? qdyFirstText(parsed.url, parsed.fileUrl, parsed.sourceUrl)
      : qdyText(parsed);
  hosted = qdyText(hosted).split(/\s+/)[0];
  if (!/^https?:\/\/\S+$/i.test(hosted)) {
    throw new Error(providerLabel + " 未返回 HTTP(S) 地址");
  }
  return hosted;
}

function qdySubtitleContentType(assMode) {
  return assMode
    ? "text/x-ssa; charset=utf-8"
    : "text/vtt; charset=utf-8";
}

async function qdyValidateSubtitleURL(url, assMode) {
  var response = await Widget.http.get(url, {
    headers: {
      Accept: "text/plain,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_TIMEOUT
  });
  var status = qdyResponseStatus(response);
  if (status && (status < 200 || status >= 300)) {
    throw new Error("字幕回读 HTTP " + status);
  }
  var data = qdyResponseData(response);
  var content = typeof data === "string" ? data : JSON.stringify(data || "");
  var marker = assMode ? "[Script Info]" : "WEBVTT";
  if (!content || content.indexOf(marker) < 0) {
    throw new Error("字幕回读内容无效");
  }
  return url;
}

async function qdyCnetSubtitleText(subtitleText, assMode) {
  var response = await Widget.http.post(QDY_CNET_SUBTITLE, subtitleText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Accept: "text/plain,application/json,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "paste.c-net.org"),
    assMode
  );
}

function qdyUguuMultipartBody(subtitleText, assMode, boundary) {
  var fileName = assMode
    ? "quandouya-lyrics.ass"
    : "quandouya-lyrics.vtt";
  return (
    "--" +
    boundary +
    "\r\n" +
    'Content-Disposition: form-data; name="files[]"; filename="' +
    fileName +
    '"\r\n' +
    "Content-Type: " +
    qdySubtitleContentType(assMode) +
    "\r\n\r\n" +
    subtitleText +
    "\r\n--" +
    boundary +
    "--\r\n"
  );
}

async function qdyUguuSubtitleText(subtitleText, assMode) {
  var boundary = "----QuandouyaSubtitleBoundary20261110";
  var body = qdyUguuMultipartBody(subtitleText, assMode, boundary);
  var response = await Widget.http.post(QDY_UGUU_SUBTITLE, body, {
    headers: {
      "Content-Type": "multipart/form-data; boundary=" + boundary,
      Accept: "text/plain,application/json,*/*",
      "User-Agent": QDY_USER_AGENT
    },
    timeout: QDY_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "uguu.se"),
    assMode
  );
}

async function qdyCustomSubtitleText(subtitleText, assMode, identifier) {
  var serviceURL = qdySubtitleServiceURL();
  if (!serviceURL) {
    throw new Error("未配置自建歌词字幕服务");
  }
  var headers = {
    "Content-Type": qdySubtitleContentType(assMode),
    Accept: "application/json,text/plain,*/*",
    "X-Subtitle-ID": encodeURIComponent(identifier),
    "X-Subtitle-Format": assMode ? "ass" : "vtt"
  };
  if (qdyRuntime.subtitleToken) {
    headers["X-Upload-Token"] = qdyRuntime.subtitleToken;
  }
  var response = await Widget.http.post(serviceURL, subtitleText, {
    headers: headers,
    timeout: QDY_TIMEOUT
  });
  return qdyValidateSubtitleURL(
    qdySubtitleResponseURL(response, "自建字幕服务"),
    assMode
  );
}

function qdyLoadSubtitleProviderBlocks() {
  if (qdySubtitleProviderBlocksLoaded) return;
  qdySubtitleProviderBlocksLoaded = true;
  try {
    var stored = Widget.storage.get("subtitleProviderBlocksV1");
    var parsed = qdyParseJSON(stored);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      qdySubtitleProviderBlockedUntil = parsed;
    }
  } catch (error) {
    qdySubtitleProviderBlockedUntil = {};
  }
}

function qdySubtitleProviderBlocked(provider) {
  qdyLoadSubtitleProviderBlocks();
  return Number(qdySubtitleProviderBlockedUntil[provider] || 0) > Date.now();
}

function qdyBlockSubtitleProvider(provider) {
  if (provider === "paste.c-net.org") {
    qdySubtitleProviderBlockedUntil[provider] = Date.now() + 24 * 60 * 60 * 1000;
  } else {
    qdySubtitleProviderBlockedUntil[provider] = Date.now() + 10 * 60 * 1000;
  }
  try {
    Widget.storage.set(
      "subtitleProviderBlocksV1",
      JSON.stringify(qdySubtitleProviderBlockedUntil)
    );
  } catch (error) {}
}

async function qdyHostSubtitleText(identifier, subtitleText, assMode) {
  var providers = [
    {
      name: "paste.c-net.org",
      upload: function () {
        return qdyCnetSubtitleText(subtitleText, assMode);
      }
    },
    {
      name: "uguu.se",
      upload: function () {
        return qdyUguuSubtitleText(subtitleText, assMode);
      }
    }
  ];
  if (qdySubtitleServiceURL()) {
    providers.push({
      name: "自建字幕服务",
      upload: function () {
        return qdyCustomSubtitleText(subtitleText, assMode, identifier);
      }
    });
  }

  var errors = [];
  for (var index = 0; index < providers.length; index += 1) {
    if (qdySubtitleProviderBlocked(providers[index].name)) {
      errors.push(providers[index].name + ": 限流冷却中");
      continue;
    }
    try {
      var url = await providers[index].upload();
      if (index > 0) {
        console.log(
          "[forward.quandouya] 字幕托管已切换至:",
          providers[index].name
        );
      }
      return {
        url: url,
        provider: providers[index].name
      };
    } catch (error) {
      errors.push(providers[index].name + ": " + qdySafeError(error));
      qdyBlockSubtitleProvider(providers[index].name);
    }
  }
  throw new Error(errors.join("; "));
}

function qdySubtitleHostTTL(provider) {
  if (provider === "uguu.se") return 2.5 * 60 * 60 * 1000;
  if (provider === "paste.c-net.org") return 24 * 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function qdyCachedSubtitleHost(identifier) {
  var entry = qdySubtitleHostCache[identifier];
  if (!entry) return null;
  if (typeof entry === "string") {
    return { url: entry, provider: "缓存" };
  }
  if (
    !entry.url ||
    (entry.expiresAt && entry.expiresAt <= Date.now() + 5 * 60 * 1000)
  ) {
    delete qdySubtitleHostCache[identifier];
    return null;
  }
  return entry;
}

function qdyCacheSubtitleHost(identifier, hosted) {
  qdySubtitleHostCache[identifier] = {
    url: hosted.url,
    provider: hosted.provider,
    expiresAt: Date.now() + qdySubtitleHostTTL(hosted.provider)
  };
}

async function qdySubtitleTrack(track, lyric) {
  if (!lyric || (!lyric.ass && !lyric.vtt)) return null;
  var assMode = Boolean(lyric.ass);
  var subtitleText = assMode ? lyric.ass : lyric.vtt;
  var identifier = [
    "quandouya-lyrics",
    assMode ? "ass" : "vtt",
    qdyRuntime.lyricStyle,
    qdyRuntime.lyricLine,
    qdyText(track.source),
    qdyText(track.id || track.qqMid || track.kugouHash),
    qdyNormalizeSong(track.title)
  ]
    .filter(Boolean)
    .join("-");
  var hosted = qdyCachedSubtitleHost(identifier);
  if (!hosted) {
    try {
      hosted = await qdyHostSubtitleText(
        identifier,
        subtitleText,
        assMode
      );
      qdyCacheSubtitleHost(identifier, hosted);
    } catch (error) {
      console.log(
        "[forward.quandouya] 动态歌词托管失败，已停止生成无效字幕:",
        qdySafeError(error)
      );
      return null;
    }
  }
  var fileURL = hosted && hosted.url;
  if (!/^https?:\/\/\S+$/i.test(fileURL)) return null;
  return {
    id: identifier,
    name: "动态歌词",
    title: "动态歌词",
    label: "动态歌词",
    file: fileURL,
    fileName: assMode ? "quandouya-lyrics.ass" : "quandouya-lyrics.vtt",
    lang: "zh-Hans",
    language: "zh-Hans",
    languageIdentifier: "zh-Hans",
    format: assMode ? "ass" : "vtt",
    mimeType: assMode ? "text/x-ssa" : "text/vtt",
    isDefault: true,
    default: true,
    selected: true,
    url: fileURL,
    sourceUrl: fileURL,
    type: assMode ? "ass" : "vtt",
    data: subtitleText,
    content: subtitleText,
    provider: [lyric.provider || "", hosted.provider || ""]
      .filter(Boolean)
      .join(" · ")
  };
}

async function qdyResolvePrimary(track, quality) {
  if (track.source === "netease") return qdyResolveNetease(track, quality);
  if (track.source === "qq") return qdyResolveQQ(track, quality);
  if (track.source === "kuwo") return qdyResolveKuwo(track, quality);
  if (track.source === "kugou") return qdyResolveKugou(track, quality);
  if (track.source === "migu") return qdyResolveMigu(track, quality);
  if (track.source === "qishui") return qdyResolveQishui(track, quality);
  throw new Error("无法识别歌曲平台");
}

async function qdyResolveKuwoFallback(track, quality) {
  if (!track.title) throw new Error("缺少歌曲名，无法执行回退");
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchKuwo(keyword, 1, 10);
  var matched = songs.find(function (song) {
    return qdySongMatch(song.title, track.title);
  });
  if (!matched) throw new Error("备用酷我线路没有找到匹配歌曲");
  return qdyResolveKuwo(matched, quality);
}

async function qdyResolveNeteaseFallback(track, quality) {
  if (!track.title) throw new Error("缺少歌曲名，无法执行回退");
  var keyword = [track.title, track.artist].filter(Boolean).join(" ");
  var songs = await qdySearchNetease(keyword, 1, 10);
  var matched = songs.find(function (song) {
    return qdySongMatch(song.title, track.title);
  });
  if (!matched) throw new Error("备用网易云线路没有找到匹配歌曲");
  return qdyResolveNetease(matched, quality);
}

async function qdyResolveWithFallback(track, quality) {
  var errors = [];
  try {
    return await qdyResolvePrimary(track, quality);
  } catch (error) {
    errors.push(qdySafeError(error));
  }
  if (!qdyRuntime.fallback) {
    throw new Error("播放失败: " + errors.join("; "));
  }

  if (track.source !== "kuwo") {
    try {
      var kuwo = await qdyResolveKuwoFallback(track, quality);
      kuwo.fallback = true;
      return kuwo;
    } catch (error) {
      errors.push("酷我回退: " + qdySafeError(error));
    }
  }
  if (track.source !== "netease") {
    try {
      var netease = await qdyResolveNeteaseFallback(track, quality);
      netease.fallback = true;
      return netease;
    } catch (error) {
      errors.push("网易云回退: " + qdySafeError(error));
    }
  }
  throw new Error("所有播放线路均失败: " + errors.join("; "));
}

async function loadResource(params) {
  params = qdyApplySettings(params || {});
  var track = qdyTrackFromParams(params);
  var queueLink = qdyFirstText(
    typeof params.link === "string" ? params.link : "",
    typeof params.url === "string" &&
      params.url.indexOf("quandouya:") === 0
      ? params.url
      : "",
    track.link
  );
  var queueParsed = qdyParseLink(queueLink);
  if (queueParsed.key && qdyPlaylists[queueParsed.key]) {
    var episodeParts = qdyText(queueParsed.ep)
      .split("|")
      .map(function (part) {
        return parseInt(part, 10);
      })
      .filter(function (part) {
        return isFinite(part) && part > 0;
      });
    var requestedEpisode = parseInt(
      qdyFirstText(
        params.episode,
        params.episodeNumber,
        params.number
      ),
      10
    );
    var queueEpisode =
      isFinite(requestedEpisode) && requestedEpisode > 0
        ? requestedEpisode
        : episodeParts.length
          ? episodeParts[episodeParts.length - 1]
          : 1;
    try {
      var queueTracks = await qdyCategoryTracks(params, queueParsed.key);
      var queuedTrack = queueTracks[queueEpisode - 1];
      if (queuedTrack) {
        track = qdyTrackFromParams({
          link: qdyTrackLink(
            queuedTrack,
            queueParsed.key,
            queueEpisode
          )
        });
      }
    } catch (error) {
      console.log(
        "[forward.quandouya] 播放队列定位失败:",
        qdySafeError(error)
      );
    }
  }
  var directURL = qdyFirstText(params.url, params.playUrl, params.audioUrl);
  if (/^https?:\/\/\S+\.(?:mp3|m4a|flac|aac|ogg)(?:[?#]|$)/i.test(directURL)) {
    var directLyric =
      qdyRuntime.lyrics && (track.source || track.title)
        ? await qdyFetchLyric(track)
        : null;
    var directSubtitle = await qdySubtitleTrack(track, directLyric);
    var directStream = {
      name: qdyFirstText(params.title, params.name, "全豆要音频"),
      description:
        "来源：全豆要音源\n线路：已解析音频直链" +
        (directSubtitle
          ? "\n歌词：" + directLyric.provider + " · 播放器内动态同步"
          : directLyric
            ? "\n歌词：已读取，但字幕服务未返回可播放地址"
          : ""),
      url: directURL,
      playerType: qdyRuntime.playerType,
      source: "全豆要音源"
    };
    if (directSubtitle) {
      directStream.subtitles = [directSubtitle];
      directStream.externalSubtitles = [directSubtitle];
      directStream.subtitleTracks = [directSubtitle];
    }
    return [directStream];
  }

  if (!track.source) {
    throw new Error("无法识别当前歌曲的平台，请从全豆要音源列表重新选择");
  }
  if (!track.id && !track.kugouHash && !track.qqMid) {
    throw new Error("当前歌曲缺少平台 ID");
  }
  var quality = qdyQuality(params.quality || qdyRuntime.quality);
  var lyricPromise = qdyRuntime.lyrics
    ? qdyFetchLyric(track).catch(function (error) {
        console.log("[forward.quandouya] 歌词读取失败:", qdySafeError(error));
        return null;
      })
    : Promise.resolve(null);
  var resolved = await qdyResolveWithFallback(track, quality);
  var lyric = await qdyWithTimeout(lyricPromise, 8000);
  var subtitle = await qdySubtitleTrack(track, lyric);
  var title = qdyFirstText(track.title, params.title, params.name, "全豆要音频");
  var artist = qdyFirstText(track.artist, params.artist, params.singer);
  var displayName = [title, artist].filter(Boolean).join(" - ");
  var descriptionParts = [
    "来源：全豆要聚合音源",
    "播放平台：" + resolved.provider,
    "解析线路：" + resolved.line,
    "音质：" + resolved.quality
  ];
  if (qdyRuntime.lyrics) {
    descriptionParts.push(
      subtitle
        ? "歌词：" + lyric.provider + " · 播放器内动态同步"
        : lyric
          ? "歌词：已读取，但字幕服务未返回可播放地址"
          : "歌词：暂无可用时间轴歌词"
    );
  }
  descriptionParts.push(
    resolved.fallback
      ? "当前平台受限，已自动切换备用线路"
      : "原平台线路"
  );
  var description = descriptionParts.join("\n");

  var stream = {
    name: displayName || "全豆要音频",
    description: description,
    url: resolved.url,
    playerType: qdyRuntime.playerType,
    source: "全豆要音源",
    musicSource: resolved.source,
    quality: resolved.quality,
    fallback: Boolean(resolved.fallback)
  };
  if (subtitle) {
    stream.subtitles = [subtitle];
    stream.externalSubtitles = [subtitle];
    stream.subtitleTracks = [subtitle];
  }
  return [stream];
}
