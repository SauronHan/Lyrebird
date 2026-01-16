# 🎙️ Lyrebird: 次世代 AI 播客工作室

<p align="center">
  <img src="https://img.shields.io/badge/Model-CosyVoice--3.0-purple?style=for-the-badge&logo=ai" alt="Model">
  <img src="https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

**Lyrebird**（琴鸟）是一款专为内容创作者打造的播客级 AI 语音合成平台。它深度集成了阿里 **CosyVoice 3.0** 模型，让您能够通过简单的文字输入或文档上传，生成具有极高还原度、丰富情感表现力的多角色对话音频。

---

## ✨ 核心优势

*   🚀 **最强引擎支持**：深度适配 CosyVoice 3.0，支持 Flash 推理，音质细腻，响应极快。
*   🪄 **零样本音色克隆**：只需 3-10 秒参考音频，即可实现极高相似度的声纹复刻，完美捕捉每一个语调细节。
*   🎭 **智能多角色对话**：内置 LLM（如 Gemini/GPT-4）脚本生成引擎，一键生成深度博弈、自然流动的播客对话脚本。
*   🏗️ **精细化情感控制**：支持通过 XML 标签（如 `<happy>`, `<whisper>`, `<serious>`）精准控制每一句话的情感起伏。
*   🎨 **极致交互体验**：现代、极简的 Web UI 界面，支持深色模式、实时波形显示及可视化的语音库管理。

---

## 🏗️ 代码结构

项目的核心逻辑位于 `backend` 目录下，下表详细说明了各部分的功能：

```text
Lyrebird-studio/
├── backend/ # 后端核心目录
│   ├── app/
│   │   ├── api/ # API 路由定义 (FastAPI)
│   │   │   ├── routes.py # 核心业务逻辑分发
│   │   │   └── __init__.py
│   │   ├── services/ # 核心服务层
│   │   │   ├── voice_service.py # 语音生成业务逻辑封装
│   │   │   ├── voice_engine_service.py # CosyVoice 3.0 推理接口实现
│   │   │   ├── audio_service.py # 音频处理与存储服务
│   │   │   └── llm_service.py # 播客脚本生成与情感优化服务
│   │   ├── config.py # 全局配置管理 (路径、模型设置)
│   │   └── models.py # Pydantic 数据模型
│   ├── CosyVoice/ # CosyVoice 官方 SDK 源码 (核心推理依赖)
│   ├── pretrained_models/ # 预训练模型存储目录
│   │   └── Fun-CosyVoice3-0.5B/ # 核心 3.0 模型文件
│   ├── voices/ # 用户录制或上传的音色文件
│   ├── outputs/ # 生成的播客音频及元数据
│   └── main.py # 程序入口
└── lyrebird-web/ # 前端 UI 项目目录 (Next.js/React)
```

---

## 🚀 快速开始

### 1. 环境准备
*   操作系统：Mac (M1/M2/M3) 或 NVIDIA GPU (Linux/Windows)
*   Python 环境：推荐使用 Python 3.10+
*   依赖库：需安装 `ffmpeg` (处理音频)

### 2. 安装依赖
```bash
# 1. 克隆项目
git clone https://github.com/your-username/Lyrebird.git
cd Lyrebird

# 2. 创建并激活虚拟环境 (推荐 Conda)
conda create -n Lyrebird python=3.10
conda activate Lyrebird

# 3. 安装后端依赖
cd backend
pip install -r requirements.txt
```

### 3. 模型下载
请将 CosyVoice 3.0 模型文件放置于 `backend/pretrained_models/Fun-CosyVoice3-0.5B` 目录下。

### 4. 环境变量配置
复制 `.env.example` 并重命名为 `.env`，填入您的 API Key 及路径配置：
```env
OPENAI_API_KEY=your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
# 本地模型路径
MODEL_DIR=./pretrained_models/Fun-CosyVoice3-0.5B
```

### 5. 启动服务
```bash
# 后端启动 (默认端口 8000)
python -m app.main

# 前端启动 (另开窗口)
cd ../lyrebird-web
npm install
npm run dev
```

---

## 🗺️ 路线图 (Roadmap)

- [x] CosyVoice 3.0 深度集成
- [x] 多角色播客脚本自动生成
- [x] 精细化标签管理 (XML 标签控制)
- [ ] 导出 SRT 字幕文件
- [ ] 接入多模态模型自动生成视频封面

---

## 🤝 贡献与反馈

欢迎提交 Issue 或 Pull Request。如果有商务合作或定制化需求，请通过以下方式联系：

*   **Email**: your-email@example.com
*   **WeChat**: [Your_ID]

---

## 📄 免责声明

本工具仅用于学术研究及个人学习。请确保在使用生成的音频时符合当地法律法规，严禁将克隆音色用于任何违法违规的欺诈或误导性活动。
