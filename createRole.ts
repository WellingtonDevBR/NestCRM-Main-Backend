// create-ec2-role.ts
import {
    IAMClient,
    CreateRoleCommand,
    AttachRolePolicyCommand,
    CreateInstanceProfileCommand,
    AddRoleToInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import dotenv from "dotenv";
dotenv.config();

const region = "us-east-2";
const roleName = "TenantEC2Role";

const iam = new IAMClient({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

async function createEC2Role() {
    try {
        // 1. Create IAM Role
        await iam.send(
            new CreateRoleCommand({
                RoleName: roleName,
                AssumeRolePolicyDocument: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: { Service: "ec2.amazonaws.com" },
                            Action: "sts:AssumeRole",
                        },
                    ],
                }),
            })
        );
        console.log("✅ IAM Role created");

        // 2. Attach required policies
        const policies = [
            "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
            "arn:aws:iam::aws:policy/SecretsManagerReadWrite",
        ];

        for (const policyArn of policies) {
            await iam.send(
                new AttachRolePolicyCommand({
                    RoleName: roleName,
                    PolicyArn: policyArn,
                })
            );
        }
        console.log("✅ Policies attached");

        // 3. Create Instance Profile
        await iam.send(
            new CreateInstanceProfileCommand({
                InstanceProfileName: roleName,
            })
        );

        // 4. Add role to the instance profile
        await iam.send(
            new AddRoleToInstanceProfileCommand({
                InstanceProfileName: roleName,
                RoleName: roleName,
            })
        );

        console.log(`✅ Instance Profile "${roleName}" created and role attached`);
    } catch (err: any) {
        if (err.name === "EntityAlreadyExists") {
            console.log("ℹ️ Role or profile already exists — skipping");
        } else {
            console.error("❌ Failed to create IAM role:", err);
        }
    }
}

createEC2Role();
