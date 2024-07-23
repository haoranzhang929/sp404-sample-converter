# SP-404 MK2 Sample Converter

An Electron app to convert WAV files to 16-bit, 48kHz format – the format supported by the SP-404 MK2 sampler.

## Language

- [English](README.md)
- [中文](README_zh.md)

## Overview

If you've encountered `Unsupported File` errors when importing loops and samples into your SP-404 MK2, this app is here to help.

Many sample packs and loops might not be in the required format (16-bit, 48kHz) and need conversion. This Electron app automates the process of converting your WAV files to the correct format, saving you time and effort.

This project is based on the [SP404WavConvertor](https://github.com/pkMinhas/SP404WavConvertor) repository, which provided the foundation for this app. Thank you to **pkMinhas** for the excellent work!

## Features

- Converts WAV files to 16-bit, 48kHz format.
- Recursive directory processing: Automatically processes all WAV files within selected directories.
- User-friendly GUI built with Electron.

## Installation

### Build from Source Code

1. **Clone the repository:**

   ```bash
   git clone https://github.com/haoranzhang929/sp404-sample-converter.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd sp404-sample-converter
   ```

3. **Install dependencies:**

   Ensure you have Node.js and npm installed. Then, run:

   ```bash
   npm install
   ```

4. **Run the application:**

   ```bash
   npm start
   ```

### Pre-built Releases

You can also download a pre-built release from the [Releases](https://github.com/haoranzhang929/sp404-sample-converter/releases) tab on GitHub.

- **For macOS Users:**

  After downloading and opening the app, you may need to run the following command to remove extended attributes applied by macOS:

  ```bash
  xattr -cr /Applications/sp404-sample-converter.app
  ```

## Usage

1. **Launch the Application:**

   Open the application by running `npm start` from your project directory, or by double-clicking the downloaded app.

2. **Select Directory:**

   Click the "Select Directory" button to choose the folder containing the WAV files you want to convert.

3. **Start Processing:**

   Click the "Start Processing" button to begin the conversion process. The app will process all WAV files in the selected directory and its subdirectories, converting them to 16-bit, 48kHz format.

4. **Monitor Progress:**

   The output area will display messages about the progress and any errors encountered during processing.

## Supported Formats

- **Input Format:** WAV files
- **Output Format:** 16-bit, 48kHz WAV files

## Troubleshooting

- **"Unsupported File" Error:**

  Ensure that the WAV files are in a supported format (16-bit, 48kHz). If the SP-404 MK2 still shows an error, verify the sample rate and bit depth using a tool like `ffprobe` to ensure they match the required format.

- **Application Crashes or Errors:**

  Check the console for detailed error messages. Ensure that you have all necessary dependencies installed and that the application has the required permissions to read and write files.

## Attribution

This project is based on the [SP404WavConvertor](https://github.com/pkMinhas/SP404WavConvertor) repository by [pkMinhas](https://github.com/pkMinhas).

## Contributing

If you find any issues or want to contribute to the project, feel free to fork the repository and submit a pull request. Your contributions are welcome!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
