import { Home } from "lucide-react";
import { TrashIcon } from "lucide-react";
import { BookTemplateIcon } from "lucide-react";
import { SettingsIcon } from "lucide-react";

export const data = {
    user : {
        name : 'John Doe',
        email : 'john.doe@example.com',
        avatar : 'avatar.png',
        
    },

    navMain : [
        {
            title : 'Home',
            url : '/dashboard',
            icon : Home,
        },
        {
            title : 'Templates',
            url : '/dashboard',
            icon : TrashIcon,
        },
        {
            title : 'Trash',
            url : '/dashboard',
            icon : TrashIcon,
        },
        {
            title : 'Settings',
            url : '/dashboard',
            icon : SettingsIcon,
        },
    ]
}