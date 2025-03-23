import { TenantRepositoryImpl } from "../../infrastructure/database/TenantRepositoryImpl";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { ProvisionEC2 } from "../../cli/ProvisionEC2";
import { CreateTargetGroupAndListenerRule } from "../../cli/CreateTargetGroupAndListenerRule";
import { CleanupResources } from "../../cli/CleanupResources";
import jwt from "jsonwebtoken";

const tenantRepo = new TenantRepositoryImpl();

export class TenantUseCase {

    static async login({ email, password }: { email: string; password: string }) {
        if (!email || !password) throw new Error("Missing email or password");

        const tenant = await tenantRepo.findByEmail(email);
        if (!tenant) throw new Error("Tenant not found");

        const passwordMatch = await bcrypt.compare(password, tenant.Password);
        if (!passwordMatch) throw new Error("Invalid credentials");

        const token = jwt.sign(
            {
                tenantId: tenant.ID,
                subdomain: tenant.Subdomain,
                email: tenant.Email
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );

        console.log("🔐 Login successful, JWT generated");

        return {
            message: "Login successful",
            token,
            tenant: {
                company: tenant.CompanyName,
                subdomain: tenant.Subdomain,
                domain: tenant.Domain
            }
        };
    }

    static async signUp({ companyName, email, password }: { companyName: string; email: string; password: string }) {
        console.log("🟢 Received Sign-Up Request:", { companyName, email, password });

        if (!companyName || !email || !password) {
            throw new Error("❌ Missing required fields");
        }

        const existingTenant = await tenantRepo.findByEmail(email);
        if (existingTenant) throw new Error("❌ Tenant with this email already exists.");

        console.log("✅ Email is available, proceeding with registration...");

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("🔐 Password hashed successfully");

        const subdomain = companyName.toLowerCase().replace(/\s+/g, "");
        const domain = `${subdomain}.nestcrm.com.au`;
        console.log("🌍 Generated Subdomain:", subdomain);
        console.log("🌍 Generated Domain:", domain);

        const tenantId = uuidv4();
        let instanceId: string | null = null;
        let targetGroupArn: string | null = null;
        let listenerRuleArn: string | null = null;

        try {
            const newTenant = {
                ID: tenantId,
                CompanyName: companyName,
                Email: email,
                Password: hashedPassword,
                Subdomain: subdomain,
                Domain: domain,
                Status: "active",
                CreatedAt: new Date().toISOString(),
            };

            console.log("📝 Creating Tenant in DB:", newTenant);
            await tenantRepo.create(newTenant);
            console.log("✅ Tenant created successfully!");

            console.log(`🚀 Provisioning EC2 instance for ${companyName}...`);
            const ec2Instance = await ProvisionEC2.launchInstance(subdomain);
            instanceId = ec2Instance.instanceId;
            console.log(`✅ EC2 Instance Launched: ${instanceId}, IP: ${ec2Instance.publicIp}`);

            const listenerResources = await CreateTargetGroupAndListenerRule.setup(subdomain, instanceId);
            targetGroupArn = listenerResources.targetGroupArn;
            listenerRuleArn = listenerResources.listenerRuleArn;

            console.log(`🌍 CloudFront will route ${domain} through ALB`);

            // ✅ Generate JWT token
            const token = jwt.sign(
                {
                    tenantId,
                    subdomain,
                    email,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1d" }
            );

            return {
                message: "Tenant created successfully",
                token,
                instanceId,
                tenant: {
                    company: companyName,
                    subdomain,
                    domain,
                }
            };

        } catch (error) {
            console.error("❌ Provisioning failed. Starting cleanup...");

            if (instanceId) await CleanupResources.terminateEC2(instanceId);
            if (targetGroupArn) await CleanupResources.deleteTargetGroup(targetGroupArn);
            if (listenerRuleArn) await CleanupResources.deleteListenerRule(listenerRuleArn);
            await CleanupResources.deleteDNSRecord(subdomain);
            await CleanupResources.deleteTenantRecord(tenantId);

            throw new Error("❌ Tenant provisioning failed and cleanup was triggered.");
        }
    }
}
