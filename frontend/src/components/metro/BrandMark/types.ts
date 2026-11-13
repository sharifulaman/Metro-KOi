export interface BrandMarkProps {
  /** `tile`: white pin on a green tile (header). `pin`: green pin with a train, for the splash screen. */
  variant?: 'tile' | 'pin';
  size?: number;
  /** read out by screen readers */
  label?: string;
}
