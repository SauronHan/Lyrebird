import os
import re
from pathlib import Path

def rename_project_to_lyrebird():
    base_dir = Path(__file__).parent.absolute()
    
    # 1. 定义需要排除的目录（极其重要，避免破坏第三方库和模型）
    exclude_dirs = {
        'CosyVoice',        # 第三方代码库
        'node_modules',     # 前端依赖
        '.venv', 'venv',    # 虚拟环境
        '.git', '.next',    # 缓存与版本控制
        'pretrained_models' # 模型权重文件
    }

    # 2. 定义文本替换规则 (大小写敏感，按顺序执行)
    replacements = [
        # 品牌词替换
       #  (re.compile(r'Aliyun', re.IGNORECASE), 'Lyrebird'),
        (re.compile(r'CosyVoice', re.IGNORECASE), 'Lyrebird'),
        (re.compile(r'VibeVoice', re.IGNORECASE), 'Lyrebird'),
        # 特定配置项/类名替换
        (re.compile(r'local_cosyvoice_service'), 'voice_engine_service'),
        (re.compile(r'LocalCosyVoiceService'), 'LyrebirdVoiceService'),
        (re.compile(r'COSYVOICE_'), 'LYREBIRD_'),
    ]

    print(f"🚀 开始将项目重命名为 Lyrebird...")

    # 3. 遍历并修改文件内容
    for root, dirs, files in os.walk(base_dir, topdown=True):
        # 排除目录
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            file_path = Path(root) / file
            
            # 排除二进制文件和特定后缀
            if file_path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.pt', '.onnx', '.pth', '.wav', '.mp3', '.pyc'}:
                continue
            
            # 排除脚本自身
            if file == 'rename_to_lyrebird.py':
                continue

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for pattern, replacement in replacements:
                    new_content = pattern.sub(replacement, new_content)
                
                if new_content != content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"✅ 更新内容: {file_path.relative_to(base_dir)}")
            except Exception as e:
                print(f"❌ 跳过文件 (读取失败): {file_path} - {e}")

    # 4. 文件/目录重命名逻辑
    # 注意：需要从深到浅重命名，以免父目录名字变了找不到子文件
    rename_list = [
        ('backend/app/services/local_cosyvoice_service.py', 'backend/app/services/voice_engine_service.py'),
        ('cosyvoice-web', 'lyrebird-web'),
    ]

    for old, new in rename_list:
        old_path = base_dir / old
        new_path = base_dir / new
        if old_path.exists():
            old_path.rename(new_path)
            print(f"📂 重命名目录/文件: {old} -> {new}")

    print("\n✨ 项目清理完成！")
    print("⚠️  注意：'backend/CosyVoice' 目录及其内部内容已完整保留以确保模型正常运行。")
    print("⚠️  接下来请手动执行一次 `npm install` (在 lyrebird-web 目录) 并检查 `.env` 文件。")

if __name__ == "__main__":
    rename_project_to_lyrebird()
