import { middyfy } from "@libs/lambda";
import { Handler } from "aws-lambda";
import * as AWS from "aws-sdk";

const lexRuntime = new AWS.LexRuntime();
const kendra = new AWS.Kendra();

interface LexEvent {
  botName: string;
  botAlias: string;
  inputTranscript: string;
}

const handler: Handler<LexEvent> = async (event, context) => {
  try {
    const { botName, botAlias, inputTranscript } = event;

    const lexResponse = await lexRuntime
      .postText({
        botName,
        botAlias,
        userId: context.awsRequestId,
        inputText: inputTranscript,
      })
      .promise();

    const lexMessage = lexResponse.message || "";

    const kendraResponse = await kendra
      .query({
        IndexId: "f891dc96-65a0-4fcf-a4b3-ce8888843085",
        QueryText: lexMessage,
      })
      .promise();

    const finalResponse = {
      lexResponse,
      kendraResponse,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(finalResponse),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

export const main = middyfy(handler)