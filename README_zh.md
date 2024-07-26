# SP-404 MK2 采样转换器

这是一个 Electron 应用程序，用于将 WAV 文件转换为 SP-404 MK2 采样器所支持的 16 位、48kHz 格式。

## 语言

- [English](README.md)
- [中文](README_zh.md)

## 支持的平台

SP-404 MK2 采样转换器支持**macOS**和**Windows**。其他操作系统的支持正在开发中。

## 概述

如果您在将采样和循环导入 SP-404 MK2 时遇到 `Unsupported File` 错误，那么这个应用程序将是您的救星！

很多采样包和循环可能不符合 SP-404 MK2 所需的格式（16 位、48kHz），需要转换。这个 Electron 应用程序能自动帮您将 WAV 文件转换为正确的格式，省去手动转换的烦恼。

这个项目基于 [SP404WavConvertor](https://github.com/pkMinhas/SP404WavConvertor) 存储库，非常感谢 **pkMinhas** 的出色工作！

## 特性

- 将 WAV 文件转换为 16 位、48kHz 格式，完全符合 SP-404 MK2 的要求。
- 支持递归目录处理：自动处理所选目录及其子目录中的所有 WAV 文件。
- 提供简单易用的图形用户界面（GUI）。

## 安装

### 从源代码构建

1. **克隆存储库：**

   ```bash
   git clone https://github.com/haoranzhang929/sp404-sample-converter.git
   ```

2. **进入项目目录：**

   ```bash
   cd sp404-sample-converter
   ```

3. **安装依赖：**

   确保您已经安装了 Node.js 和 npm。然后运行：

   ```bash
   npm install
   ```

4. **启动应用程序：**

   ```bash
   npm start
   ```

### 预构建版本

如果您不想从源代码构建，也可以直接下载预构建的版本，前往 [Releases](https://github.com/haoranzhang929/sp404-sample-converter/releases) 页面即可。

- **macOS 用户注意：**

  下载并打开应用程序后，您可能需要运行以下命令来移除 macOS 为应用程序添加的扩展属性：

  ```bash
  xattr -cr /Applications/sp404-sample-converter.app
  ```

## 使用方法

1. **启动应用程序：**

   您可以通过运行 `npm start` 启动应用程序，或者直接双击下载的应用程序图标。

2. **选择目录：**

   点击“选择目录”按钮，挑选包含您要转换的 WAV 文件的文件夹。

3. **开始处理：**

   点击“开始处理”按钮，应用程序将自动开始转换过程，将所选目录及其子目录中的 WAV 文件转换为 16 位、48kHz 格式。

4. **查看进度：**

   应用程序的输出区域会显示处理进度和遇到的任何错误信息。

## 支持的格式

- **输入格式：** WAV 文件
- **输出格式：** 16 位、48kHz 的 WAV 文件

## 常见问题

- **"Unsupported File" 错误：**

  确保 WAV 文件的格式为 16 位、48kHz。如果 SP-404 MK2 仍显示错误，使用 `ffprobe` 等工具检查文件的采样率和位深度，确保它们与要求匹配。

- **应用程序崩溃或出错：**

  查看控制台中的详细错误信息，确保您已安装所有必要的依赖，并且应用程序有足够的权限进行文件读写操作。

## 归属

这个项目基于 [SP404WavConvertor](https://github.com/pkMinhas/SP404WavConvertor) 存储库，感谢 [pkMinhas](https://github.com/pkMinhas) 对社区的贡献。

## 贡献

如果您发现了问题或者想为项目贡献代码，欢迎分叉存储库并提交拉取请求。我们非常欢迎您的参与！

## 许可证

本项目采用 MIT 许可证。详细信息请查看 [LICENSE](LICENSE) 文件。
