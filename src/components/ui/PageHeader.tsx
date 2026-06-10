type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-2 w-full">
      <h1 className="portal-page-title text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
        {title}
      </h1>
      <p className="portal-page-desc mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}
