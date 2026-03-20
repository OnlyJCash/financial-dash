import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Instantiate a DynamoDB client using credentials from the environment.
// For local development, it will look for AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the environment or ~/.aws/credentials.
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Create the DocumentClient, which provides a simplified way to interact with DynamoDB items.
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Automatically convert empty strings, blobs, and sets to `null`
    convertEmptyValues: true,
    // Remove undefined values while marshalling
    removeUndefinedValues: true,
    // Convert Javascript types to DynamoDB types
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false,
  },
});
