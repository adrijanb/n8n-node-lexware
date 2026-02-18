import { IExecuteFunctions } from "n8n-core";
import {
  IDataObject,
  INodeExecutionData,
  NodeOperationError,
} from "n8n-workflow";
import { lexwareApiDownload, lexwareApiUpload } from "../GenericFunctions";

export async function executeFiles(
  this: IExecuteFunctions,
  i: number,
  operation: string
): Promise<INodeExecutionData[]> {
  let responseData: any;

  switch (operation) {
    case "upload": {
      const binaryPropertyName = this.getNodeParameter(
        "binaryPropertyName",
        i
      ) as string;
      const typeRaw = this.getNodeParameter("type", i, "voucher") as string;
      const type = typeRaw.trim().toLowerCase();

      const item = this.getInputData()[i];
      if (!item.binary || !item.binary[binaryPropertyName]) {
        throw new NodeOperationError(
          this.getNode(),
          `Binary property ${binaryPropertyName} is missing on input item`
        );
      }
      const binaryData = await this.helpers.getBinaryDataBuffer(
        i,
        binaryPropertyName
      );
      const metadata = item.binary[binaryPropertyName];
      const formData: IDataObject = {
        type,
        file: {
          value: binaryData,
          options: {
            filename: metadata.fileName || "upload.bin",
            contentType: metadata.mimeType || "application/octet-stream",
          },
        },
      } as unknown as IDataObject;

      responseData = await lexwareApiUpload.call(this, "/v1/files", formData);
      break;
    }
    case "download": {
      const fileId = this.getNodeParameter("fileId", i) as string;
      const binaryPropertyName = this.getNodeParameter(
        "downloadBinaryPropertyName",
        i,
        "data"
      ) as string;

      const res: any = await lexwareApiDownload.call(
        this,
        `/v1/files/${fileId}`
      );
      const buffer: Buffer = res.body as Buffer;
      const headers = res.headers || {};
      const contentType =
        (headers["content-type"] as string) || "application/octet-stream";
      let fileName = "download";
      const cd = headers["content-disposition"] as string | undefined;
      if (cd) {
        const match = cd.match(
          /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i
        );
        fileName = decodeURIComponent(match?.[1] || match?.[2] || fileName);
      }

      const binary = await this.helpers.prepareBinaryData(
        buffer,
        fileName,
        contentType
      );
      const newItem: INodeExecutionData = {
        json: {},
        binary: { [binaryPropertyName]: binary },
      };
      return [newItem];
    }
    default:
      throw new NodeOperationError(
        this.getNode(),
        `Unsupported operation: ${operation}`
      );
  }

  const items = Array.isArray(responseData) ? responseData : [responseData];
  return items.map((data) => ({ json: data }));
}
