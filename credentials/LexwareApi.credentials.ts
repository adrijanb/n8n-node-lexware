import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class LexwareApi implements ICredentialType {
  name = "lexwareApi";
  displayName = "Lexware API";
  documentationUrl = "https://developers.lexware.io/docs/";
  properties: INodeProperties[] = [
    {
      displayName: "Access Token",
      name: "accessToken",
      type: "string",
      typeOptions: {
        password: true,
      },
      default: "",
      required: true,
      description: "Personal access token for Lexware API",
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://api.lexware.io",
      required: true,
      description: "Base URL of the Lexware API",
    },
  ];

  authenticate = {
    type: "generic",
    properties: {
      headers: {
        Authorization: '={{"Bearer " + $credentials.accessToken}}',
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  } as IAuthenticateGeneric;
}
