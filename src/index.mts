import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import type { MessageAttributeValue } from "@aws-sdk/client-sns";
import { SNS } from "@aws-sdk/client-sns";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { Webhooks } from "@octokit/webhooks";

// https://docs.github.com/en/webhooks/webhook-events-and-payloads
const gitHubWebhookHeaders = [
  "X-GitHub-Hook-ID",
  "X-GitHub-Event",
  "X-GitHub-Delivery",
  // omit the signatures - they have done their job
  // omit user-agent - not useful to us
  "X-GitHub-Hook-Installation-Target-Type",
  "X-GitHub-Hook-Installation-Target-ID",
] as const;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (topicArn === undefined)
    return {
      statusCode: 500,
      body: "No destination topic configured\n",
    };

  const secretId = process.env.GITHUB_SIGNING_SECRET_ID;
  if (secretId === undefined)
    return {
      statusCode: 500,
      body: "No secret configured\n",
    };

  const body = event.body;
  if (body === undefined)
    return {
      statusCode: 400,
      body: "No body\n",
    };

  if (event.requestContext.http.method.toLocaleLowerCase() !== "post")
    return {
      statusCode: 400,
      body: "Not a POST\n",
    };

  const signatureHeader = event.headers["x-hub-signature-256"];
  if (signatureHeader === undefined)
    return {
      statusCode: 400,
      body: "No signature\n",
    };

  const secretsClient = new SecretsManager();

  const secret = await secretsClient
    .getSecretValue({ SecretId: secretId })
    .then((r) => r.SecretString);

  if (secret === undefined) {
    return {
      statusCode: 500,
      body: "Could not read secret\n",
    };
  }

  const webhooks = new Webhooks({ secret });

  if (!(await webhooks.verify(body, signatureHeader))) {
    return { statusCode: 401 };
  }

  const messageAttributes: Record<string, MessageAttributeValue> = {};

  for (const key of gitHubWebhookHeaders) {
    const value = event.headers[key.toLocaleLowerCase()] ?? "";
    messageAttributes[key] = { DataType: "String", StringValue: value };
  }

  const snsClient = new SNS();
  const msg = await snsClient.publish({
    TopicArn: topicArn,
    Message: body,
    MessageAttributes: messageAttributes,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId: msg.MessageId }),
  };
};
