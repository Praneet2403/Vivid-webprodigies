'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import UploadImage from './UploadImage';
import { ImageIcon } from 'lucide-react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  isPreview?: boolean;
  contentId: string;
  onContentChange: (
    contentId: string,
    newContent: string | string[] | string[][]
  ) => void;
  isEditable?: boolean;
};

const CustomImage = ( {src, alt, className, isPreview, contentId, onContentChange, isEditable}: Props) => {
    // Remember which src failed, so a new src (e.g. after an upload) gets a fresh attempt
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    const showPlaceholder = !src || failedSrc === src;

    return (
        <div className={`relative group w-full h-full rounded-lg`}>
          {showPlaceholder ? (
            <div
              className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}
            >
              <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
              {!isPreview && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditable ? 'Hover to upload an image' : 'No image'}
                </p>
              )}
            </div>
          ) : (
            <Image
              src={src}
              width={isPreview ? 48 : 800}
              height={isPreview ? 48 : 800}
              alt={alt}
              className={`object-cover w-full h-full rounded-lg ${className}`}
              onError={() => setFailedSrc(src)}
              unoptimized
            />
          )}
      
          {!isPreview && isEditable && (
            <div
              // The upload dialog renders inside this wrapper, so keep it shown while the dialog is open
              // Top-right, so it doesn't sit under the slide options button in the slide's top-left corner
              className="absolute top-2 right-2 z-10 hidden
              group-hover:block has-[dialog[open]]:block"
            >
                <UploadImage 
                contentId={contentId}
                onContentChange={onContentChange}
                />
            </div>
          )}
        </div>
      );
};

export default CustomImage;