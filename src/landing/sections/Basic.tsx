import type { ButtonProps, HeadingProps, ImageProps, SpacerProps, TextProps } from '../types';

const alignClass = (a?: string) => (a === 'left' ? 'text-left' : a === 'right' ? 'text-right' : 'text-center');

export function HeadingSection({ props }: { props: HeadingProps }) {
  const Tag = props.level ?? 'h2';
  const size =
    props.level === 'h1' ? 'text-4xl sm:text-5xl' : props.level === 'h3' ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl';
  return (
    <div className={`px-5 py-8 sm:px-8 ${alignClass(props.align)}`}>
      <Tag className={`font-bold leading-tight text-neutral-900 ${size}`}>{props.text}</Tag>
    </div>
  );
}

export function TextSection({ props }: { props: TextProps }) {
  return (
    <div
      className={`prose prose-neutral mx-auto max-w-3xl px-5 py-6 sm:px-8 ${alignClass(props.align)}`}
      // Reuses the same trust model Page.content already gets — TipTap's
      // own output is trusted as-is (no client-supplied raw-HTML path
      // outside the vendor's own authenticated builder), same "confirm
      // and match Page.content's approach" note landing-page-sections.md
      // §1.2 leaves for this exact field.
      dangerouslySetInnerHTML={{ __html: props.html || '' }}
    />
  );
}

export function ImageSection({ props }: { props: ImageProps }) {
  if (!props.imageUrl) return null;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary vendor-supplied Cloudinary URL, not a static/known asset
    <img
      src={props.imageUrl}
      alt={props.alt || ''}
      className={`w-full ${props.fit === 'contain' ? 'object-contain' : 'object-cover'} max-h-[600px]`}
    />
  );
  return (
    <div className="py-2">
      {props.link ? (
        <a href={props.link} target={props.link.startsWith('#') ? undefined : '_blank'} rel="noreferrer">
          {img}
        </a>
      ) : (
        img
      )}
    </div>
  );
}

export function SpacerSection({ props }: { props: SpacerProps }) {
  return (
    <div className="flex items-center px-5 sm:px-8" style={{ height: props.heightPx ?? 40 }}>
      {props.showLine && (
        <div className="w-full border-t border-neutral-200" style={{ borderStyle: props.lineStyle ?? 'solid' }} />
      )}
    </div>
  );
}

const buttonVariantClass = (variant: ButtonProps['variant']) =>
  variant === 'outline'
    ? 'border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
    : variant === 'secondary'
      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
      : 'bg-orange-600 text-white hover:bg-orange-700';

export function ButtonSection({ props }: { props: ButtonProps }) {
  if (!props.label) return null;
  return (
    <div className={`px-5 py-4 sm:px-8 ${alignClass(props.align)}`}>
      <a
        href={props.link || '#'}
        target={props.openInNewTab ? '_blank' : undefined}
        rel={props.openInNewTab ? 'noreferrer' : undefined}
        className={`inline-block rounded-lg px-8 py-3 text-sm font-semibold transition-colors ${buttonVariantClass(props.variant)}`}
      >
        {props.label}
      </a>
    </div>
  );
}
