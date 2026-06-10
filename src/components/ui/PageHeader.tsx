type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-1 w-full min-w-0 pr-24 sm:pr-28 lg:pr-0">
      <h1 className="portal-page-title text-lg font-bold tracking-tight text-slate-50 sm:text-2xl">
        {title}
      </h1>
      <p className="portal-page-desc mt-1 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}
