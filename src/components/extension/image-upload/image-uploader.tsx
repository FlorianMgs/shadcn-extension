"use client";

import Image from "next/image";
import {
  Dispatch,
  SetStateAction,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDropzone, type FileRejection, type Accept } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronRightIcon, X as RemoveIcon } from "lucide-react";
import { FilePreview } from "./model";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@radix-ui/react-icons";

interface FileUploadProps extends React.HTMLAttributes<HTMLInputElement> {
  accept?: Accept;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
  images: File[] | null;
  setImages: Dispatch<SetStateAction<File[] | null>>;
  preview: FilePreview[] | null;
  setPreview: Dispatch<SetStateAction<FilePreview[] | null>>;
  options?: EmblaOptionsType;
}

export const UploadImageForm = ({
  images,
  setImages,
  preview,
  setPreview,
  accept = {
    "image/*": [".jpeg", ".png"],
  },
  maxSize = 1024 * 1024 * 8,
  multiple = true,
  options,
  maxFiles = 1,
}: FileUploadProps) => {
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(options);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>(false);
  const [canScrollNext, setCanScrollNext] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isFileTooBig, setIsFileTooBig] = useState<boolean>(false);

  const handleBannerImageChange = (file: File) => {
    const fileWithPreview = {
      file,
      preview: URL.createObjectURL(file),
    };
    setPreview((prev) => [
      ...(prev && maxFiles > 1 ? prev : []),
      fileWithPreview,
    ]);
    setImages((files) => [...(files && maxFiles > 1 ? files : []), file]);
  };

  const removeImageFromPreview = useCallback(
    (index: number) => {
      if (!emblaMainApi) return;
      setPreview((prev) => {
        if (!prev) return null;
        const newPreview = [...prev];
        newPreview.splice(index, 1);
        return newPreview;
      });
      setImages((files) => {
        if (!files) return null;
        const newFiles = [...files];
        newFiles.splice(index, 1);
        return newFiles;
      });
      if (index === activeIndex) {
        emblaMainApi.scrollTo(emblaMainApi.scrollSnapList().length);
      }
    },
    [emblaMainApi, setImages, setPreview, activeIndex]
  );

  const checkFileSize = (file: File) => {
    if (file.size > maxSize) {
      setIsFileTooBig(true);
      toast.error("File too big , Max size is 8MB");
      return;
    }
    setIsFileTooBig(false);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const files = acceptedFiles;
      setPreview([]);
      setImages([]);
      if (!files) {
        toast.error("file error , probably too big");
        return;
      }

      files.forEach((file) => {
        checkFileSize(file);
        handleBannerImageChange(file);
      });

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ errors }) => {
          if (errors[0]?.code === "file-too-large") {
            toast.error(
              `File is too large. Max size is ${maxSize / 1024 / 1024}MB`
            );
            return;
          }
          errors[0]?.message && toast.error(errors[0].message);
        });
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!emblaMainApi) return;
      if (event.key === "ArrowLeft") {
        emblaMainApi.scrollPrev();
      } else if (event.key === "ArrowRight") {
        emblaMainApi.scrollNext();
      }
    },
    [emblaMainApi]
  );

  const ScrollNext = useCallback(() => {
    if (!emblaMainApi) return;
    emblaMainApi.scrollNext();
  }, [emblaMainApi]);

  const ScrollPrev = useCallback(() => {
    if (!emblaMainApi) return;
    emblaMainApi.scrollPrev();
  }, [emblaMainApi]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    const selected = emblaMainApi.selectedScrollSnap();
    setActiveIndex(selected);
    emblaThumbsApi.scrollTo(selected);
    setCanScrollPrev(emblaMainApi.canScrollPrev());
    setCanScrollNext(emblaMainApi.canScrollNext());
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect);
    emblaMainApi.on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      maxSize,
      accept,
      maxFiles,
      multiple,
      onDropRejected: () => setIsFileTooBig(true),
      onDropAccepted: () => setIsFileTooBig(false),
    });
  return preview && preview.length > 0 ? (
    <div className="grid gap-2 w-full relative">
      {maxFiles > 1 && (
        <>
          {" "}
          <CarouselPrevious
            className="-left-2 z-[100] top-[40%] -translate-y-1/2 h-6 w-6"
            onClick={ScrollPrev}
            disabled={!canScrollPrev}
          />
          <CarouselNext
            className="-right-2 z-[100] top-[40%] -translate-y-1/2 h-6 w-6"
            onClick={ScrollNext}
            disabled={!canScrollNext}
          />
        </>
      )}
      <div
        ref={emblaMainRef}
        tabIndex={0}
        className="w-full space-y-1 focus:outline-none overflow-hidden "
        onKeyDownCapture={handleKeyDown}
      >
        <div className="flex items-center w-full ">
          {preview.map((imageSrc, i) => (
            <div
              key={i}
              className={`px-1 flex min-w-0 shrink-0 grow-0 basis-full`}
            >
              <AspectRatio ratio={4 / 3} className="w-full">
                <Image
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className=" rounded-lg object-cover"
                  quality={100}
                  src={imageSrc.preview}
                  alt={`uploaded image ${activeIndex}`}
                />
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>
      {maxFiles > 1 ? (
        <div ref={emblaThumbsRef} className="overflow-hidden">
          <div className="flex items-center w-full mt-1 ">
            {preview.map((imageSrc, i) => (
              <div
                key={i}
                className={`basis-1/3 px-1 min-w-0 shrink-0 grow-0 `}
                onClick={() => onThumbClick(i)}
              >
                <div
                  className={`relative aspect-square h-20 w-full   opacity-40 rounded-md transition-opacity ${
                    i === activeIndex ? "!opacity-100" : ""
                  }`}
                >
                  <button
                    aria-label={`remove-slide-${i}`}
                    type="button"
                    className="absolute -right-2 -top-1 z-[100] opacity-70 h-6 w-6 focus:outline-none group "
                    onClick={() => removeImageFromPreview(i)}
                  >
                    {" "}
                    <RemoveIcon className="h-4 w-4 group-hover:stroke-red-600" />
                  </button>
                  <Image
                    src={imageSrc.preview}
                    alt="uploaded image"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className=" rounded-lg object-cover"
                    quality={100}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        {...getRootProps()}
        className="disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={preview.length >= maxFiles}
      >
        Choose another image
      </Button>
    </div>
  ) : (
    <div
      className={`w-full border border-muted-foreground border-dashed rounded-lg cursor-pointer duration-300 ease-in-out
      ${
        isDragAccept
          ? "border-green-500"
          : isDragReject || isFileTooBig
          ? "border-red-500"
          : "border-gray-300 "
      }`}
      {...getRootProps()}
    >
      <div className="flex items-center justify-center flex-col pt-5 pb-6">
        <svg
          className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 16"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
          />
        </svg>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Click to upload</span>
          &nbsp; or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          SVG, PNG, JPG or GIF
        </p>
      </div>
      <Input {...getInputProps()} />
    </div>
  );
};

const CarouselPrevious = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", className)}
      {...props}
    >
      <ChevronRightIcon className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";
