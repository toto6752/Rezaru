import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";

export type ArtifactMetadata = {
  key: string;
  contentType: string;
  size: number;
  checksum?: string;
};

export interface ArtifactStore {
  put(key: string, value: Uint8Array, contentType: string): Promise<ArtifactMetadata>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

function safeKey(key: string): string {
  const normalized = normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..")) throw new Error("Invalid artifact key");
  return normalized;
}

export class LocalArtifactStore implements ArtifactStore {
  constructor(private readonly root: string) {}
  async put(key: string, value: Uint8Array, contentType: string): Promise<ArtifactMetadata> {
    const file = join(this.root, safeKey(key));
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, value);
    return { key, contentType, size: value.byteLength };
  }
  async get(key: string): Promise<Uint8Array> {
    return readFile(join(this.root, safeKey(key)));
  }
  async delete(key: string): Promise<void> {
    await rm(join(this.root, safeKey(key)), { force: true });
  }
}

export interface S3Transport {
  putObject(input: { bucket: string; key: string; body: Uint8Array; contentType: string }): Promise<void>;
  getObject(input: { bucket: string; key: string }): Promise<Uint8Array>;
  deleteObject(input: { bucket: string; key: string }): Promise<void>;
}

export class S3CompatibleArtifactStore implements ArtifactStore {
  constructor(private readonly bucket: string, private readonly transport: S3Transport) {}
  async put(key: string, value: Uint8Array, contentType: string): Promise<ArtifactMetadata> {
    const validatedKey = safeKey(key);
    await this.transport.putObject({ bucket: this.bucket, key: validatedKey, body: value, contentType });
    return { key: validatedKey, contentType, size: value.byteLength };
  }
  async get(key: string): Promise<Uint8Array> {
    return this.transport.getObject({ bucket: this.bucket, key: safeKey(key) });
  }
  async delete(key: string): Promise<void> {
    await this.transport.deleteObject({ bucket: this.bucket, key: safeKey(key) });
  }
}

export interface CodeSandbox {
  execute(source: string, input: unknown): Promise<unknown>;
}

export class DisabledCodeSandbox implements CodeSandbox {
  async execute(): Promise<never> {
    throw Object.assign(new Error("Custom code execution is disabled until a secure isolation provider is configured."), {
      code: "SANDBOX_DISABLED"
    });
  }
}
