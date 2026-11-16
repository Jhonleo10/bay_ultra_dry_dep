import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Record<string, unknown>;
        const {
            fullName,
            emailId,
            phoneNumber,
            service,
            requiredDate,
            requiredTime,
            address,
            message,
            confirmed,
        } = body;

        const normalizedFullName = typeof fullName === "string" ? fullName.trim() : "";
        const normalizedEmail = typeof emailId === "string" ? emailId.trim() : "";
        const normalizedPhone = typeof phoneNumber === "string" ? phoneNumber.trim() : "";
        const normalizedService = typeof service === "string" ? service : "";
        const normalizedRequiredDate = typeof requiredDate === "string" ? requiredDate : "";
        const normalizedAddress = typeof address === "string" ? address.trim() : "";
        const normalizedMessage = typeof message === "string" ? message.trim() : "";
        const normalizedTime = typeof requiredTime === "string" ? requiredTime.trim() : "";
        const normalizedConfirmed = confirmed === true;

        // Basic validation
        if (!normalizedFullName || !normalizedEmail || !normalizedPhone || !normalizedService || !normalizedRequiredDate || !normalizedAddress || !normalizedConfirmed) {
            return NextResponse.json(
                { error: "Missing required fields or confirmation" },
                { status: 400 }
            );
        }

        // For multi-tenancy, we need to associate this enquiry with a tenant.
        const tenantSlug = request.headers.get("x-tenant-slug") || "bay-ultra-dry";

        let tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        // If tenant doesn't exist, create it (for initial setup/seeding)
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: "Bay Ultra Dry",
                    slug: tenantSlug,
                },
            });
        }

        const enquiry = await prisma.enquiry.create({
            data: {
                tenantId: tenant.id,
                fullName: normalizedFullName,
                emailId: normalizedEmail,
                phoneNumber: normalizedPhone,
                service: normalizedService as "CARPET_CLEANING" | "UPHOLSTERY_CLEANING" | "FLOOD_RESTORATION" | "COMMERCIAL_CLEANING",
                requiredDate: new Date(normalizedRequiredDate),
                requiredTime: normalizedTime || undefined,
                address: normalizedAddress,
                message: normalizedMessage,
                confirmed: normalizedConfirmed,
            },
        });

        return NextResponse.json(
            { message: "Enquiry submitted successfully", id: enquiry.id },
            { status: 201 }
        );
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error submitting enquiry:", error);
        return NextResponse.json(
            { error: "Failed to submit enquiry. Please try again later.", details: errorMessage },
            { status: 500 }
        );
    }
}
