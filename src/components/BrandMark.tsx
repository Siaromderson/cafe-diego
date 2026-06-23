export function BrandMark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "lg" ? "h-20" : size === "sm" ? "h-10" : "h-12";
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Café do Feirante MS"
        className={`${h} w-auto select-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]`}
        draggable={false}
      />
    </span>
  );
}
