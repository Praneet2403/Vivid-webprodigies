import { client } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const onAuthenticateUser = async () => {
    try {
        // Simulate an authentication process
        const user = await currentUser()
        if (!user) {
            return {status: 403}
        }

        const userExist = await client.user.findUnique({
            where: {
                clerkId: user.id
            },
            include: {
                PurchasedProjects: {
                    select: {
                        id: true,
                    }
                }
            }
        });

        if(userExist) {
            return {status: 200, user: userExist};
        }

        // If user does not exist, create a new user
        const newUser = await client.user.create({
            data: {
                clerkId: user.id,
                email: user.emailAddresses[0].emailAddress,
                name: user.firstName + " " + user.lastName,
                profileImage: user.imageUrl,
               
            }
        });

        if (newUser) {
            return {status: 201, user: newUser};
        }

        return {status: 400};

    }
    catch (error) {
        console.error('🔴 ERROR', error);
        return {status: 500};
    }
}