import { useState, useRef, type ImgHTMLAttributes } from "react";
import cx, { type ClassValue } from "clsx";
import { BsFileEarmarkMusicFill } from "react-icons/bs";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "className"> {
  src: string;
  alt: string;
  className?: ClassValue;
}

export function LazyImage({ src, alt, className, ...rest }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  return (
    <div className={cx(className, `relative overflow-hidden`)}>
      {!isLoaded && (
        <div className="size-full p-6">
          <BsFileEarmarkMusicFill size="100%" className="text-inherit" />
        </div>
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } w-full h-full object-cover`}
        {...rest}
      />
    </div>
  );
}
