import axios from "axios";
import fs from "fs"
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const api_key = process.env.IPFS_API_KEY!;


const image_path = path.join(__dirname,"..", "image/plane.png");

var data = JSON.stringify({
  name: "test free",
  symbol: "testf",
  description: "This is test bro",
  file: `data:image/png;base64,${fs.readFileSync(image_path, "base64")}`,
  twitter: "www.google.com/profile",
  telegram: "www.google.com/profile",
  website: "www.google.com/profile",
});

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
