import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      {...props}
    />
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" />
    </BaseIcon>
  );
}

export function CommandIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 8a3 3 0 1 1-3-3h2a3 3 0 0 1 3 3v8a3 3 0 1 1-3 3H5a3 3 0 1 1 0-6h8a3 3 0 1 1 3-3V8a3 3 0 1 1 3-3h-2a3 3 0 0 0-3 3v8a3 3 0 1 0 3 3h2a3 3 0 1 0 0-6H11" />
    </BaseIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3c2.8 2.1 5.6 3.1 8 3v6c0 5.3-3.2 8.7-8 10-4.8-1.3-8-4.7-8-10V6c2.4.1 5.2-.9 8-3Z" />
      <path d="m9.5 12 1.8 1.8 3.4-3.8" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </BaseIcon>
  );
}

export function StackIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 9 4.5-9 4.5L3 7.5 12 3Z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
      <path d="m3 17.5 9 4.5 9-4.5" />
    </BaseIcon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v5" />
      <path d="M12 16v5" />
      <path d="M4.9 6.9 8.4 10.4" />
      <path d="m15.6 15.6 3.5 3.5" />
      <path d="M3 12h5" />
      <path d="M16 12h5" />
      <path d="m4.9 17.1 3.5-3.5" />
      <path d="m15.6 8.4 3.5-3.5" />
      <circle cx="12" cy="12" r="2.5" />
    </BaseIcon>
  );
}
