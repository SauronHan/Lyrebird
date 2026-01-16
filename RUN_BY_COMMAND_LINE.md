# 如何通过命令行运行 Lyrebird Studio

本指南将指导您如何通过命令行安装、配置并运行 Lyrebird Studio 项目。

## 📋 前提条件

在开始之前，请确保您的系统已安装以下软件：
- **Python 3.9 或更高版本**
- **FFmpeg**（用于音频处理）
- **CUDA 显卡**（推荐，用于加速推理；Mac 用户可使用 MPS，或者使用 CPU）

---

## 🚀 运行步骤

### 1. 克隆项目

首先，将项目克隆到本地机器：

```bash
git clone https://github.com/shamspias/Lyrebird-studio.git
cd Lyrebird-studio
```

### 2. 创建并激活虚拟环境

建议使用虚拟环境以避免依赖冲突：

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. 安装 Lyrebird 核心库

Lyrebird 需要安装特定的核心组件。请在 `Lyrebird-studio` 目录下执行：

```bash
# 确保在 backend 目录下或项目根目录下
cd backend
git clone https://github.com/shamspias/Lyrebird
cd Lyrebird
pip install -e .
cd ..
```

### 4. 安装项目依赖

安装后端运行所需的 Python 包：

```bash
pip install -r requirements.txt
```

### 5. 配置环境变量

项目使用 `.env` 文件进行配置。您可以从示例文件创建：

```bash
cp .env.example .env
```

**编辑 `.env` 文件（可选）：**
- `DEVICE`: 根据您的硬件修改为 `cuda` (NVIDIA GPU), `mps` (Apple Silicon), 或 `cpu`。
- `MODEL_PATH`: 默认为 `microsoft/Lyrebird-1.5B`。

### 6. 运行后端服务

在 `backend` 目录下，直接运行主程序：

```bash
python -m app.main
```

uvicorn app.main:app --reload

如果启动成功，命令行会显示：
`INFO: Starting Lyrebird Studio v1.0.0`
`INFO: Server running on http://0.0.0.0:8000`

---

## 🌐 访问应用

由于本项目是前后端分离的结构：

1. **后端 API**: 运行在 `http://localhost:8000`
2. **前端界面**: 
   - 您可以直接在浏览器中打开项目的 `web/index.html` 文件。
   - 或者，如果您想通过服务器访问，可以使用 Python 自带的简易服务器在另一个终端中运行前端：

```bash
# 在项目根目录下，新开一个终端
cd web
python3 -m http.server 8080
```
然后访问 `http://localhost:8080`。


cd Lyrebird-web
npm run dev
Open http://localhost:3000 in your browser.

---

## 🛠️ 常见命令行任务

### 检查服务状态
```bash
curl http://localhost:8000/api/health
```

### 清理缓存文件
生成的音频文件存储在 `backend/outputs` 目录下，语音模型存储在 `backend/voices`。
```bash
rm -rf backend/outputs/*.wav
rm -rf backend/outputs/*.json
```

---

## 💡 注意事项
- **GPU 内存**: Lyrebird 模型较大，建议至少拥有 8GB 显存。
- **首次运行**: 首次生成语音时，程序会自动从 HuggingFace 下载预训练模型（约几个 GB），请确保网络连接稳定。
- **FFmpeg**: 如果遇到音频转换错误，请确保 `ffmpeg` 命令在您的系统 PATH 中。
