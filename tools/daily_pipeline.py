"""
每日一键数据管道：采集 → 分析 → 导入

用法：
  python daily_pipeline.py                  # 采集+分析+导入（首次请加 --no-headless 扫码登录）
  python daily_pipeline.py --no-headless    # 可见浏览器模式（首次使用/需要重新登录时）
  python daily_pipeline.py --headless       # 无头模式（已登录过，日常自动化推荐）
  python daily_pipeline.py --no-crawl       # 仅分析已有数据+导入
  python daily_pipeline.py --no-upload      # 采集+分析，不导入

首次使用：
  1. python daily_pipeline.py --no-headless
  2. 浏览器打开后，在抖音首页扫码登录（手机抖音App扫码）
  3. 看到 "Douyin Crawler finished" 即完成
  4. 后续日常运行：python daily_pipeline.py --headless

日常配置：12 个核心关键词，每个 30 视频，约 30 分钟
"""
import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).parent
MEDIACRAWLER_DIR = PROJECT_DIR / "MediaCrawler"
DATA_PIPELINE_DIR = PROJECT_DIR / "data_pipeline"
CONFIG_FILE = MEDIACRAWLER_DIR / "config" / "base_config.py"
CSV_DIR = MEDIACRAWLER_DIR / "data" / "douyin" / "csv"
CDP_USER_DATA_DIR = MEDIACRAWLER_DIR / "browser_data" / "cdp_dy_user_data_dir"

# 日常核心关键词（12个，覆盖 S 级 + A 级方向）
DAILY_KEYWORDS = (
    "深圳房产,刚需上车,深圳买房,"
    "深圳租房攻略,深圳租房避雷,深圳租房中介费,"
    "深圳福田买房,深圳南山租房,深圳宝安买房,"
    "深圳整租一居室,深圳房价走势,深圳公租房申请条件"
)

DAILY_MAX_NOTES = 30        # 日常采样量
DAILY_MAX_COMMENTS = 10     # 日常评论量


def has_login_state():
    """检查 CDP 模式下是否已有登录态"""
    if not CDP_USER_DATA_DIR.exists():
        return False
    # 检查 Chrome 用户数据目录是否有内容
    return any(CDP_USER_DATA_DIR.iterdir())


def update_config(headless=False):
    """临时修改配置为日常参数"""
    content = CONFIG_FILE.read_text(encoding="utf-8")

    # 替换 KEYWORDS
    import re
    content = re.sub(
        r'KEYWORDS = \([\s\S]*?\)',
        f'KEYWORDS = "{DAILY_KEYWORDS}"',
        content
    )
    # 替换采样量
    content = re.sub(
        r'CRAWLER_MAX_NOTES_COUNT = \d+',
        f'CRAWLER_MAX_NOTES_COUNT = {DAILY_MAX_NOTES}',
        content
    )
    content = re.sub(
        r'CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES = \d+',
        f'CRAWLER_MAX_COMMENTS_COUNT_SINGLENOTES = {DAILY_MAX_COMMENTS}',
        content
    )
    # 启用 CDP 模式（使用真实 Chrome 浏览器，反检测能力更强）
    content = re.sub(r'ENABLE_CDP_MODE = False', 'ENABLE_CDP_MODE = True', content)
    content = re.sub(r'ENABLE_CDP_MODE = True', 'ENABLE_CDP_MODE = True', content)  # no-op 兜底
    # 自动启动 Chrome 实例（而非连接已有浏览器）
    content = re.sub(r'CDP_CONNECT_EXISTING = True', 'CDP_CONNECT_EXISTING = False', content)
    # Headless 模式
    if headless:
        content = re.sub(r'HEADLESS = False', 'HEADLESS = True', content)
        content = re.sub(r'CDP_HEADLESS = False', 'CDP_HEADLESS = True', content)
        print(f"[OK] 配置已更新（CDP无头模式）：{len(DAILY_KEYWORDS.split(','))} 个关键词，每词 {DAILY_MAX_NOTES} 视频")
    else:
        content = re.sub(r'HEADLESS = True', 'HEADLESS = False', content)
        content = re.sub(r'CDP_HEADLESS = True', 'CDP_HEADLESS = False', content)
        print(f"[OK] 配置已更新（CDP可见模式，请扫码登录）：{len(DAILY_KEYWORDS.split(','))} 个关键词")

    CONFIG_FILE.write_text(content, encoding="utf-8")


def run_crawl():
    """运行 MediaCrawler 采集"""
    print("\n[CRAWL] 开始采集...")
    result = subprocess.run(
        ["python", "main.py"],
        cwd=MEDIACRAWLER_DIR,
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    if result.returncode != 0:
        print("[FAIL] 采集失败")
        return False
    print("[OK] 采集完成")
    return True


def run_analysis(date_str):
    """运行数据分析"""
    print("\n[ANALYZE] 分析数据...")
    result = subprocess.run(
        ["python", str(DATA_PIPELINE_DIR / "process_data.py"), "--date", date_str],
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    if result.returncode != 0:
        print("[FAIL] 分析失败")
        return None
    print("[OK] 分析完成")

    report_file = DATA_PIPELINE_DIR / "output" / f"daily_report_{date_str}.json"
    with open(report_file, "r", encoding="utf-8") as f:
        return json.load(f)


def run_upload(report):
    """上传到云数据库（优先 HTTP 自动导入，失败则保存文件手动导入）"""
    print("\n[UPLOAD] 上传到云数据库...")
    report["status"] = 1
    report["create_time"] = f"{report['date']}T00:00:00.000Z"
    report["update_time"] = f"{report['date']}T00:00:00.000Z"

    # 尝试 HTTP 自动导入（通过 import-report 云函数的 HTTP 触发器）
    env_id = os.environ.get("TCB_ENV_ID", "cloud1-d7g17h93r50c9cd1f")
    url = f"https://{env_id}.service.tcloudbase.com/import-report"

    try:
        import requests
        resp = requests.post(url, json={"report": report}, timeout=15)
        if resp.status_code == 200:
            result = resp.json()
            if result.get("code") == 0:
                print(f"   [OK] HTTP 自动导入成功! ID: {result['data']['id']}")
                return True
            else:
                print(f"   [WARN] HTTP 返回错误: {result.get('message')}")
        else:
            print(f"   [WARN] HTTP {resp.status_code}: {resp.text[:100]}")
    except Exception as e:
        print(f"   [WARN] HTTP 调用失败: {e}")

    # 回退：保存文件手动导入
    params_file = DATA_PIPELINE_DIR / "output" / f"import_params_{report['date']}.json"
    params = json.dumps({"report": report}, ensure_ascii=False)
    params_file.write_text(params, encoding="utf-8")
    print(f"   [FILE] 已保存: {params_file}")
    print(f"   [NOTE] 如需手动导入：微信 IDE -> import-report 右键 -> 云函数测试 -> 粘贴文件内容")
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="每日数据管道")
    parser.add_argument("--no-crawl", action="store_true", help="跳过采集")
    parser.add_argument("--no-upload", action="store_true", help="跳过上传")
    parser.add_argument("--headless", action="store_true", default=None, help="无头模式（日常自动化）")
    parser.add_argument("--no-headless", action="store_false", dest="headless", help="可见浏览器模式（首次扫码登录）")
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    args = parser.parse_args()

    # 智能判断：首次运行自动用可见模式
    if args.headless is None:
        if has_login_state():
            args.headless = True
            print("[INFO] 检测到已有登录态，使用无头模式")
        else:
            args.headless = False
            print("[INFO] 首次运行，使用可见浏览器模式（需要扫码登录）")
            print("       后续运行将自动切换为无头模式")

    date_str = args.date
    print(f"[START] 每日数据管道启动 - {date_str}")
    print(f"   关键词: {len(DAILY_KEYWORDS.split(','))} 个")
    print(f"   采样量: {DAILY_MAX_NOTES} 视频/词")
    print(f"   模式: {'无头' if args.headless else '可见浏览器'}\n")

    if not args.no_crawl:
        update_config(headless=args.headless)
        if not run_crawl():
            sys.exit(1)
    else:
        print("[SKIP] 跳过采集（--no-crawl）")

    report = run_analysis(date_str)
    if not report:
        sys.exit(1)

    # 打印摘要
    s = report.get("s_opportunity", {})
    a = report.get("a_opportunity", {})
    areas = report.get("area_rank", [])[:3]
    print(f"\n[SUMMARY] 今日摘要:")
    print(f"   S级: {s.get('title', 'N/A')} (增速 {s.get('demand_growth', 0):+.1f}%)")
    print(f"   A级: {a.get('title', 'N/A')}")
    hot_str = ', '.join(r['name'] + ' ' + str(r['level']) + '★' for r in areas)
    print(f"   热区: {hot_str}")

    if not args.no_upload:
        run_upload(report)

    print(f"\n[OK] 管道完成!")


if __name__ == "__main__":
    main()
