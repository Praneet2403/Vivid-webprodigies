'use server'
import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const onAuthenticateUser = async () => {
    try {
        const user = await currentUser();
        if (!user) {
            return { status: 403, user: null };
        }

        // 1. Try to find by clerkId
        let userExist = await client.user.findUnique({
            where: { clerkId: user.id },
            include: { PurchasedProjects: { select: { id: true } } }
        });

        if (userExist) {
            return { status: 200, user: userExist };
        }

        // 2. Try to find by email
        const email = user.emailAddresses[0].emailAddress;
        userExist = await client.user.findUnique({
            where: { email },
            include: { PurchasedProjects: { select: { id: true } } }
        });

        if (userExist) {
            // Optionally, update clerkId if missing or different
            if (userExist.clerkId !== user.id) {
                await client.user.update({
                    where: { email },
                    data: { clerkId: user.id }
                });
            }
            return { status: 200, user: userExist };
        }

        // 3. Create new user
        const newUser = await client.user.create({
            data: {
                clerkId: user.id,
                email,
                name: user.firstName + " " + user.lastName,
                profileImage: user.imageUrl,
            }
        });

        if (newUser) {
            return { status: 201, user: newUser };
        }

        return { status: 400, user: null };

    } catch (error) {
        console.error('🔴 ERROR', error);
        return { status: 500, error: 'Internal server error', user: null };
    }
}