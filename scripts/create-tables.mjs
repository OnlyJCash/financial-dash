import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region: REGION });

const tables = [
  {
    TableName: "financial_accounts",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: "financial_movements",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "accountId", AttributeType: "S" }
    ],
    // Adding a Global Secondary Index on accountId to easily query movements for an account
    GlobalSecondaryIndexes: [
      {
        IndexName: "AccountIdIndex",
        KeySchema: [{ AttributeName: "accountId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: "financial_reminders",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "accountId", AttributeType: "S" }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "AccountIdIndex",
        KeySchema: [{ AttributeName: "accountId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: "financial_labels",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
];

async function createTables() {
  console.log(`Creating DynamoDB tables in region ${REGION}...`);
  for (const table of tables) {
    try {
      const command = new CreateTableCommand(table);
      const response = await client.send(command);
      console.log(`Table ${table.TableName} created successfully. Status: ${response.TableDescription?.TableStatus}`);
    } catch (err) {
      if (err.name === "ResourceInUseException") {
        console.log(`Table ${table.TableName} already exists.`);
      } else {
        console.error(`Error creating table ${table.TableName}:`, err.message);
      }
    }
  }
}

createTables();
