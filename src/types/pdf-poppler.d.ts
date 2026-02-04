declare module 'pdf-poppler' {
  export interface ConvertOptions {
    format?: 'png' | 'jpeg' | 'jpg' | 'tiff' | 'ps' | 'eps' | 'svg'
    out_dir?: string
    out_prefix?: string
    page?: number | string
    scale?: number
    size?: number | string
  }

  export function convert(
    file: string | Buffer,
    options?: ConvertOptions
  ): Promise<void>

  export function info(file: string | Buffer): Promise<any>
}
