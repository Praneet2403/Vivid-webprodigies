'use server'

import { client } from "@/lib/prisma";
import { onAuthenticateUser } from "./user";

export const getAllProjects = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if(checkUser.status !== 200|| !checkUser.user) {
            return{status:403, error: 'Unauthorized access'};
        }


        const projects = await client.project.findMany({
            where: {
                userId: checkUser.user.id,
                isDeleted: false,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });


        if(projects.length === 0) {
            return { status: 404, error: 'No projects found' };
        }

        return {status: 200, data: projects };
    } catch (error) {
        console.error('🔴 ERROR', error);
        return{status: 500, error: 'Internal server error'};
    } 
}


export const getRecentProjects = async () => {
    try {
        const checkUser = await onAuthenticateUser();
        if(checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: 'Unauthorized access' };
        }
        const projects = await client.project.findMany({
            where: {
                userId: checkUser.user.id,
                isDeleted: false,
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 5, // Limit to 5 recent projects
        });
        if(projects.length === 0) {
            return { status: 404, error: 'No recent projects found' };
        }
        return { status: 200, data: projects };
    }
    catch (error) {
        console.error('🔴 ERROR', error)
        return { status: 500, error: 'Internal server error' }
        }
    }    ;


export const recoverProject = async (projectId: string) => {
    try {
        const checkUser = await onAuthenticateUser();
        if(checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: 'Unauthorized access' };
        }
        const updatedProject = await client.project.update({
            where: {
                id: projectId,
            },
            data: {
                isDeleted: false,
            },
        });
        if(!updatedProject) {
            return { status: 500, error: 'Failed to recover Project' };
        }
        return { status: 200, data: updatedProject };
    } catch (error)  {
        console.error('🔴 ERROR', error)
        return { status: 500, error: 'Internal server error' }
        };
}

export const deleteProject = async (projectId: string) => {
    try {
        const checkUser = await onAuthenticateUser();
        if(checkUser.status !== 200 || !checkUser.user) {
            return { status: 403, error: 'Unauthorized access' };
        }
        const updatedProject = await client.project.update({
            where: {
                id: projectId,
            },
            data: {
                isDeleted: true,
            },
        });
        if(!updatedProject) {
            return { status: 500, error: 'Failed to delete project' };
        }
        return { status: 200, data: updatedProject };
    } catch (error) {
        console.error('🔴 ERROR', error);
        return { status: 500, error: 'Internal server error' };
    }
}