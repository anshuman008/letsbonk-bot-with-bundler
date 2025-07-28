import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const api_key = process.env.IPFS_API_KEY!;

export const uploadToIPFS = async (data: string): Promise<string> => {
  var config = {
    method: "post",
    url: process.env.IPFS_SERVER_ENDPOINT as string,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": api_key,
    },
    data: data,
  };

  try {
    const response = await axios(config);
    console.log("response is here", response.data.metadataUri);
    return response.data.metadataUri;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to upload metadata to IPFS");
  }
};
