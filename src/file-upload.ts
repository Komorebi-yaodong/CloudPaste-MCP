import { constants, createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { lookup } from "mime-types";

export interface LocalUploadFile {
  absolutePath: string;
  filename: string;
  size: number;
  contentType: string;
  stream: ReadableStream<Uint8Array>;
}

export async function openLocalUploadFile(filePath: string): Promise<LocalUploadFile> {
  const absolutePath = path.resolve(filePath);
  const stats = await fs.stat(absolutePath);

  if (!stats.isFile()) {
    throw new Error("file_path 必须指向普通文件，不能是目录或设备文件");
  }

  if (stats.size <= 0) {
    throw new Error("不支持上传空文件");
  }

  await fs.access(absolutePath, constants.R_OK);

  const filename = path.basename(absolutePath);
  if (!filename || filename === "." || filename === path.sep) {
    throw new Error("无法从 file_path 解析文件名");
  }

  const contentType = lookup(filename) || "application/octet-stream";
  const nodeStream = createReadStream(absolutePath);

  return {
    absolutePath,
    filename,
    size: stats.size,
    contentType,
    stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
  };
}
