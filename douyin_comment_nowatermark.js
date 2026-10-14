/*
 * 抖音评论区 Live 实况图去水印保存 - Shadowrocket / Surge / Loon response script
 *
 * 原理: 抖音评论接口返回的每张评论图自带两个地址
 *   - origin_url   : 原图,无水印(app 展示用的就是这个)
 *   - download_url : 长按"保存图片"下载用的,带水印
 * 本脚本把响应体里的 download_url 整体替换为 origin_url,
 * 之后在 app 里长按保存评论图(含实况图),拿到的就是无水印原图。
 * Live Photo 的视频部分 live_video.url_list 本来就是直接可用的。
 *
 * 匹配的接口:
 *   /aweme/v2/comment/list/  (评论列表,POST)
 *   /aweme/v1/comment/list/reply/  (楼中楼回复,POST)
 */

// Shadowrocket / Surge / Loon 均可用 ($response / $done 通用)

function swapUrls(imageList) {
  if (!Array.isArray(imageList)) return 0;
  let n = 0;
  for (const img of imageList) {
    if (img && img.origin_url && img.download_url) {
      // 深拷贝 origin_url 覆盖 download_url
      img.download_url = JSON.parse(JSON.stringify(img.origin_url));
      n++;
    }
  }
  return n;
}

function fixComments(comments) {
  if (!Array.isArray(comments)) return 0;
  let n = 0;
  for (const c of comments) {
    n += swapUrls(c.image_list);
    // 楼中楼回复
    if (Array.isArray(c.reply_comment)) n += fixComments(c.reply_comment);
    else if (c.reply_comment) n += fixComments([c.reply_comment]);
  }
  return n;
}

(function main() {
  try {
    const obj = JSON.parse($response.body);
    let n = fixComments(obj.comments);
    // 有些接口把评论放在 data.comments
    if (obj.data) n += fixComments(obj.data.comments);
    console.log(`[douyin-nowatermark] swapped download_url -> origin_url for ${n} image(s)`);
    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    console.log('[douyin-nowatermark] parse error: ' + e);
    $done({});
  }
})();
